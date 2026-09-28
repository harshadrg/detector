import sql from 'mssql';

const dbConfig = {
  user: process.env.DB_USER || 'detector_user',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'detector_db',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

/**
 * Returns or initializes the shared MSSQL connection pool.
 * @returns {Promise<sql.ConnectionPool>}
 */
export async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

/**
 * Executes a raw, parameterized T-SQL query using mssql request.input().
 *
 * @param {string} text - T-SQL query text
 * @param {Record<string, { type: sql.ISqlType, value: any } | any>} [params] - Key-value parameter map
 * @returns {Promise<sql.IResult<any>>}
 */
export async function query(text, params = {}) {
  const currentPool = await getPool();
  const request = currentPool.request();

  for (const [key, param] of Object.entries(params)) {
    if (param && typeof param === 'object' && 'type' in param && 'value' in param) {
      request.input(key, param.type, param.value);
    } else {
      request.input(key, param);
    }
  }

  return request.query(text);
}

/**
 * Executes a database operation within an explicit SQL transaction.
 *
 * @param {(transaction: sql.Transaction) => Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function executeTransaction(callback) {
  const currentPool = await getPool();
  const transaction = new sql.Transaction(currentPool);

  await transaction.begin();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Verifies database connectivity.
 * @returns {Promise<boolean>}
 */
export async function checkDbHealth() {
  try {
    const res = await query('SELECT 1 AS healthy');
    return res.recordset?.[0]?.healthy === 1;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

export { sql };
export default { getPool, query, executeTransaction, checkDbHealth, sql };
