import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, sql } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');

/**
 * Splits a T-SQL migration script into individual batches by GO statements.
 * @param {string} sqlContent
 * @returns {string[]}
 */
function splitSqlBatches(sqlContent) {
  return sqlContent
    .split(/^\s*GO\s*$/gmi)
    .map((batch) => batch.trim())
    .filter((batch) => batch.length > 0);
}

/**
 * Ensures the internal schema migrations tracking table exists.
 * @param {sql.ConnectionPool} pool
 */
async function ensureMigrationsTable(pool) {
  const checkTableSql = `
    IF OBJECT_ID('dbo._Schema_Migrations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo._Schema_Migrations (
            migration_name VARCHAR(255) NOT NULL,
            executed_at DATETIME2 NOT NULL CONSTRAINT DF_SchemaMigrations_executed_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_SchemaMigrations PRIMARY KEY CLUSTERED (migration_name)
        );
    END;
  `;
  const request = pool.request();
  await request.batch(checkTableSql);
}

/**
 * Retrieves already executed migrations.
 * @param {sql.ConnectionPool} pool
 * @returns {Promise<Set<string>>}
 */
async function getExecutedMigrations(pool) {
  const request = pool.request();
  const result = await request.query('SELECT migration_name FROM dbo._Schema_Migrations');
  return new Set(result.recordset.map((row) => row.migration_name));
}

/**
 * Runs pending database migrations.
 */
export async function runMigrations() {
  console.log('[MIGRATE] Connecting to Microsoft SQL Server...');
  const pool = await getPool();
  console.log('[MIGRATE] Connected successfully.');

  await ensureMigrationsTable(pool);
  const executed = await getExecutedMigrations(pool);

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql') && f !== 'init.sql')
    .sort();

  console.log(`[MIGRATE] Found ${files.length} migration file(s) in ${MIGRATIONS_DIR}.`);

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`[MIGRATE] - ${file} (already executed, skipping)`);
      continue;
    }

    console.log(`[MIGRATE] > Running migration: ${file}...`);
    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const batches = splitSqlBatches(content);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const req = pool.request();
        await req.batch(batch);
      } catch (err) {
        console.error(`[MIGRATE] Error executing batch ${i + 1} of ${file}:`, err.message);
        throw err;
      }
    }

    // Record completed migration
    const recordReq = pool.request();
    recordReq.input('migration_name', sql.VarChar(255), file);
    await recordReq.query('INSERT INTO dbo._Schema_Migrations (migration_name) VALUES (@migration_name)');

    console.log(`[MIGRATE] [OK] Migration ${file} applied successfully.`);
  }

  console.log('[MIGRATE] All pending migrations executed cleanly.');
}

// Allow direct execution via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[MIGRATE] Migration runner completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATE] Migration runner failed:', err);
      process.exit(1);
    });
}
