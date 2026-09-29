import readExcelFile from 'read-excel-file/node';
import { query, executeTransaction, sql } from '../db/connection.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';

// Sentinel values in legacy spreadsheets that denote missing / non-applicable data
const SENTINEL_VALUES = new Set([
  '-',
  '--',
  'NA',
  'N/A',
  'NAN',
  'NULL',
  'BUSINESS_CLOSED',
  'INFORMATION_NOT_GIVEN',
  'PO_NOT_RAISED',
]);

/**
 * Trims whitespace and strips sentinel values, returning null if empty or sentinel.
 * @param {any} val
 * @returns {string|null}
 */
function cleanValue(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str.length === 0) return null;
  if (SENTINEL_VALUES.has(str.toUpperCase())) return null;
  return str;
}

/**
 * Normalizes vertical codes from legacy strings.
 * @param {any} raw
 * @returns {string|null}
 */
function normalizeVertical(raw) {
  const val = cleanValue(raw);
  if (!val) return null;

  const upper = val.toUpperCase();
  if (upper.includes('BFSI') || upper === 'VERTICAL_1_BFSI') return 'BFSI';
  if (upper.includes('MEU') || upper === 'VERTICAL_2_MEU') return 'MEU';
  if (upper.includes('EMERGING') || upper === 'VERTICAL_3_EMERGING') return 'EMERGING';
  if (upper.includes('TECH') || upper === 'TECH&_DIGITAL' || upper === 'TECH&DIGITAL') {
    return 'TECH&DIGITAL';
  }
  return val;
}

/**
 * Normalizes SBU codes from legacy strings.
 * @param {any} raw
 * @param {string|null} fallbackVertical
 * @returns {string|null}
 */
function normalizeSBU(raw, fallbackVertical) {
  const val = cleanValue(raw);
  if (val) {
    const upper = val.toUpperCase();
    if (upper === 'BFSI') return 'BFSI';
    if (upper === 'MEU') return 'MEU';
    if (upper === 'EMERGING') return 'EMERGING';
    if (upper.includes('TECH') || upper === 'TECH&DIGITAL' || upper === 'TECH&_DIGITAL') {
      return 'TECH&DIGITAL';
    }
    return val;
  }
  // Backfill SBU from vertical if SBU is missing (e.g. row 261)
  if (fallbackVertical) {
    return fallbackVertical;
  }
  return null;
}

/**
 * Normalizes process lifecycle status.
 * @param {any} raw
 * @returns {'ACTIVE'|'INACTIVE'|'TRANSITION'}
 */
function normalizeStatus(raw) {
  const val = cleanValue(raw);
  if (!val) return 'TRANSITION';

  const lower = val.toLowerCase();
  if (lower === 'live' || lower === 'active') return 'ACTIVE';
  if (lower === 'closed' || lower === 'inactive') return 'INACTIVE';
  if (lower === 'transition') return 'TRANSITION';
  return 'TRANSITION';
}

/**
 * Normalizes client customer type.
 * @param {any} raw
 * @returns {'DOMESTIC'|'INTERNATIONAL'|null}
 */
function normalizeClientType(raw) {
  const val = cleanValue(raw);
  if (!val) return null;

  const lower = val.toLowerCase();
  if (lower.includes('domestic')) return 'DOMESTIC';
  if (lower.includes('international')) return 'INTERNATIONAL';
  return null;
}

/**
 * Extracts any status reason indicated by legacy sentinels.
 * @param {Object} rawRow
 * @returns {string|null}
 */
function extractStatusReason(rawRow) {
  const reasons = [];
  for (const [key, val] of Object.entries(rawRow)) {
    if (!val) continue;
    const str = String(val).trim().toUpperCase();
    if (str === 'BUSINESS_CLOSED') reasons.push(`${key}: BUSINESS_CLOSED`);
    if (str === 'PO_NOT_RAISED') reasons.push(`${key}: PO_NOT_RAISED`);
    if (str === 'INFORMATION_NOT_GIVEN') reasons.push(`${key}: INFORMATION_NOT_GIVEN`);
  }
  return reasons.length > 0 ? reasons.join('; ') : null;
}

export class ImportService {
  /**
   * Stages an uploaded Excel file, validates all rows against database entities,
   * and saves raw and normalized data into Import_Batches & Import_Staging_Rows.
   *
   * @param {Buffer} fileBuffer
   * @param {string} fileName
   * @param {string} uploadedBy - Employee ECODE
   * @returns {Promise<{ batchId: number, totalRows: number, validRows: number, errorRows: number, status: string }>}
   */
  async stageExcelUpload(fileBuffer, fileName, uploadedBy) {
    // 1. Parse Excel buffer
    const rows = await readExcelFile(fileBuffer);
    if (!rows || rows.length < 2) {
      throw new Error('Spreadsheet contains no data rows or is formatted incorrectly.');
    }

    const headerRow = rows[0].map((h) => (h ? String(h).trim() : ''));
    const dataRows = rows.slice(1);

    // Map column names to index
    const colIndex = {};
    headerRow.forEach((colName, idx) => {
      colIndex[colName] = idx;
    });

    // 2. Fetch Reference Entities from Database for Validation
    const [vertResult, sbuResult, empResult] = await Promise.all([
      query('SELECT vertical_id, vertical_code FROM dbo.Verticals WHERE is_active = 1'),
      query('SELECT sbu_id, sbu_code, vertical_id FROM dbo.SBUs WHERE is_active = 1'),
      query('SELECT ecode, name, status FROM dbo.Employees'),
    ]);

    const verticalMap = new Map(); // vertical_code -> vertical_id
    for (const v of vertResult.recordset || []) {
      verticalMap.set(v.vertical_code.toUpperCase(), v.vertical_id);
    }

    const sbuMap = new Map(); // sbu_code -> { sbu_id, vertical_id }
    for (const s of sbuResult.recordset || []) {
      sbuMap.set(s.sbu_code.toUpperCase(), { sbu_id: s.sbu_id, vertical_id: s.vertical_id });
    }

    const employeeMap = new Map(); // name (upper) -> ecode
    for (const e of empResult.recordset || []) {
      employeeMap.set(e.name.toUpperCase(), e.ecode);
      employeeMap.set(e.ecode.toUpperCase(), e.ecode);
    }

    // 3. Create Import Batch Record in Database
    const batchInsertResult = await query(
      `INSERT INTO dbo.Import_Batches (
        file_name, uploaded_by, status, total_rows, valid_rows, error_rows
      )
      OUTPUT INSERTED.batch_id
      VALUES (
        @file_name, @uploaded_by, 'VALIDATING', @total_rows, 0, 0
      )`,
      {
        file_name: { type: sql.NVarChar(255), value: fileName },
        uploaded_by: { type: sql.VarChar(20), value: uploadedBy },
        total_rows: { type: sql.Int, value: dataRows.length },
      }
    );

    const batchId = batchInsertResult.recordset[0].batch_id;

    // 4. Process, Normalize & Validate each row
    let validCount = 0;
    let errorCount = 0;
    const stagingRecords = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // 1-indexed, accounting for header

      const getCol = (name) => {
        const idx = colIndex[name];
        return idx !== undefined ? row[idx] : null;
      };

      const raw = {
        Ops_Quality_Head: getCol('Ops_Quality_Head'),
        CBO: getCol('CBO'),
        Verticals: getCol('Verticals'),
        SBU_Name: getCol('SBU_Name'),
        SBU_Head: getCol('SBU_Head'),
        Account_Head: getCol('Account_Head'),
        Process_Project_Manager: getCol('Process_Project_Manager'),
        Client_Customer_Name: getCol('Client_Customer_Name'),
        Process_Project_Name: getCol('Process_Project_Name'),
        WPS_Code: getCol('WPS_Code'),
        Process_Status: getCol('Process_Status'),
        Client_Customer_Type: getCol('Client_Customer_Type'),
        Process_Project_Location_State: getCol('Process_Project_Location_State'),
        Process_Project_Location_City: getCol('Process_Project_Location_City'),
        Process_Project_Location: getCol('Process_Project_Location'),
        Project_Started_on: getCol('Project_Started_on'),
        Project_Ended_on: getCol('Project_Ended_on'),
      };

      const errors = [];

      // Normalization
      const normVertical = normalizeVertical(raw.Verticals);
      const normSBU = normalizeSBU(raw.SBU_Name, normVertical);
      const normStatus = normalizeStatus(raw.Process_Status);
      const normClientType = normalizeClientType(raw.Client_Customer_Type);
      const statusReason = extractStatusReason(raw);

      // Cleaned employee names
      const opsHeadName = cleanValue(raw.Ops_Quality_Head);
      const cboName = cleanValue(raw.CBO);
      const sbuHeadName = cleanValue(raw.SBU_Head);
      const accountHeadName = cleanValue(raw.Account_Head);
      const pmName = cleanValue(raw.Process_Project_Manager);

      // Resolve Vertical
      let verticalId = null;
      if (!normVertical) {
        errors.push('Vertical is required and cannot be empty.');
      } else {
        verticalId = verticalMap.get(normVertical.toUpperCase()) || null;
        if (!verticalId) {
          errors.push(`Vertical "${normVertical}" does not exist in master catalog.`);
        }
      }

      // Resolve SBU
      let sbuId = null;
      if (!normSBU) {
        errors.push('SBU Name is required and could not be determined.');
      } else {
        const sbuMeta = sbuMap.get(normSBU.toUpperCase());
        if (!sbuMeta) {
          errors.push(`SBU "${normSBU}" does not exist in master catalog.`);
        } else {
          sbuId = sbuMeta.sbu_id;
          if (verticalId && sbuMeta.vertical_id !== verticalId) {
            errors.push(`SBU "${normSBU}" belongs to a different vertical in master catalog.`);
          }
        }
      }

      // Resolve Hierarchy Employees
      const resolveEmp = (roleLabel, name) => {
        if (!name) return null;
        const ecode = employeeMap.get(name.toUpperCase());
        if (!ecode) {
          errors.push(`${roleLabel} "${name}" is not registered in employee directory.`);
          return null;
        }
        return ecode;
      };

      const opsHeadEcode = resolveEmp('Ops & Quality Head', opsHeadName);
      const cboEcode = resolveEmp('CBO', cboName);
      const sbuHeadEcode = resolveEmp('SBU Head', sbuHeadName);
      const accountHeadEcode = resolveEmp('Account Head', accountHeadName);
      const pmEcode = resolveEmp('Project Manager', pmName);

      // Business Rule: If status is ACTIVE, PM is expected
      if (normStatus === 'ACTIVE' && !pmEcode && !pmName) {
        errors.push('Active process must have an assigned Project Manager.');
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        errorCount++;
      }

      const normalized = {
        vertical_code: normVertical,
        vertical_id: verticalId,
        sbu_code: normSBU,
        sbu_id: sbuId,
        status: normStatus,
        status_reason: statusReason,
        client_type: normClientType,
        wps_code: cleanValue(raw.WPS_Code),
        process_name: cleanValue(raw.Process_Project_Name),
        client_name: cleanValue(raw.Client_Customer_Name),
        ops_head_ecode: opsHeadEcode,
        ops_head_name: opsHeadName,
        cbo_ecode: cboEcode,
        cbo_name: cboName,
        sbu_head_ecode: sbuHeadEcode,
        sbu_head_name: sbuHeadName,
        account_head_ecode: accountHeadEcode,
        account_head_name: accountHeadName,
        pm_ecode: pmEcode,
        pm_name: pmName,
      };

      stagingRecords.push({
        batchId,
        rowNumber,
        rawJson: JSON.stringify(raw),
        normalizedJson: JSON.stringify(normalized),
        validationErrorsJson: errors.length > 0 ? JSON.stringify(errors) : null,
        isValid: isValid ? 1 : 0,
      });
    }

    // 5. Batch Insert Staged Rows in Chunks (T-SQL Parameter limits safe)
    const CHUNK_SIZE = 50;
    for (let c = 0; c < stagingRecords.length; c += CHUNK_SIZE) {
      const chunk = stagingRecords.slice(c, c + CHUNK_SIZE);
      const valuesSql = [];
      const params = { batchId: { type: sql.Int, value: batchId } };

      chunk.forEach((rec, idx) => {
        const rowNumParam = `row_${idx}`;
        const rawParam = `raw_${idx}`;
        const normParam = `norm_${idx}`;
        const errParam = `err_${idx}`;
        const validParam = `valid_${idx}`;

        params[rowNumParam] = { type: sql.Int, value: rec.rowNumber };
        params[rawParam] = { type: sql.NVarChar(sql.MAX), value: rec.rawJson };
        params[normParam] = { type: sql.NVarChar(sql.MAX), value: rec.normalizedJson };
        params[errParam] = { type: sql.NVarChar(sql.MAX), value: rec.validationErrorsJson };
        params[validParam] = { type: sql.Bit, value: rec.isValid };

        valuesSql.push(`(@batchId, @${rowNumParam}, @${rawParam}, @${normParam}, @${errParam}, @${validParam})`);
      });

      await query(
        `INSERT INTO dbo.Import_Staging_Rows (
          batch_id, row_number, raw_json, normalized_json, validation_errors_json, is_valid
        ) VALUES ${valuesSql.join(', ')}`,
        params
      );
    }

    // 6. Update Batch Status
    const finalStatus = errorCount === 0 ? 'READY_TO_COMMIT' : 'VALIDATED_WITH_ERRORS';
    await query(
      `UPDATE dbo.Import_Batches
       SET status = @status,
           valid_rows = @valid_rows,
           error_rows = @error_rows
       WHERE batch_id = @batch_id`,
      {
        status: { type: sql.VarChar(30), value: finalStatus },
        valid_rows: { type: sql.Int, value: validCount },
        error_rows: { type: sql.Int, value: errorCount },
        batch_id: { type: sql.Int, value: batchId },
      }
    );

    return {
      batchId,
      fileName,
      totalRows: dataRows.length,
      validRows: validCount,
      errorRows: errorCount,
      status: finalStatus,
    };
  }

  /**
   * Retrieves paginated import batches.
   * @param {Object} options
   * @returns {Promise<any[]>}
   */
  async listBatches({ page = 1, pageSize = 10 } = {}) {
    const offset = (page - 1) * pageSize;
    const countResult = await query('SELECT COUNT(*) AS total FROM dbo.Import_Batches');
    const totalCount = countResult.recordset?.[0]?.total || 0;

    const listResult = await query(
      `SELECT 
         b.batch_id,
         b.file_name,
         b.uploaded_by,
         u.name AS uploaded_by_name,
         b.status,
         b.total_rows,
         b.valid_rows,
         b.error_rows,
         b.created_at,
         b.committed_at
       FROM dbo.Import_Batches b
       LEFT JOIN dbo.Employees u ON u.ecode = b.uploaded_by
       ORDER BY b.created_at DESC, b.batch_id DESC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      {
        offset: { type: sql.Int, value: offset },
        pageSize: { type: sql.Int, value: pageSize },
      }
    );

    return {
      batches: listResult.recordset || [],
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Retrieves summary details of a specific batch.
   * @param {number} batchId
   * @returns {Promise<any>}
   */
  async getBatchById(batchId) {
    const result = await query(
      `SELECT 
         b.batch_id,
         b.file_name,
         b.uploaded_by,
         u.name AS uploaded_by_name,
         b.status,
         b.total_rows,
         b.valid_rows,
         b.error_rows,
         b.created_at,
         b.committed_at
       FROM dbo.Import_Batches b
       LEFT JOIN dbo.Employees u ON u.ecode = b.uploaded_by
       WHERE b.batch_id = @batchId`,
      { batchId: { type: sql.Int, value: batchId } }
    );
    return result.recordset?.[0] || null;
  }

  /**
   * Retrieves staged rows for preview with filtering (ALL, VALID, ERROR).
   *
   * @param {number} batchId
   * @param {Object} options
   * @returns {Promise<{ rows: any[], meta: any }>}
   */
  async getStagedRows(batchId, { page = 1, pageSize = 20, filter = 'ALL' } = {}) {
    const offset = (page - 1) * pageSize;
    const whereClauses = ['batch_id = @batchId'];
    const params = {
      batchId: { type: sql.Int, value: batchId },
      offset: { type: sql.Int, value: offset },
      pageSize: { type: sql.Int, value: pageSize },
    };

    if (filter === 'VALID') {
      whereClauses.push('is_valid = 1');
    } else if (filter === 'ERROR') {
      whereClauses.push('is_valid = 0');
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM dbo.Import_Staging_Rows ${whereSql}`,
      params
    );
    const totalCount = countResult.recordset?.[0]?.total || 0;

    const rowsResult = await query(
      `SELECT 
         staging_row_id,
         batch_id,
         row_number,
         raw_json,
         normalized_json,
         validation_errors_json,
         is_valid
       FROM dbo.Import_Staging_Rows
       ${whereSql}
       ORDER BY row_number ASC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      params
    );

    const parsedRows = (rowsResult.recordset || []).map((row) => ({
      staging_row_id: row.staging_row_id,
      batch_id: row.batch_id,
      row_number: row.row_number,
      is_valid: Boolean(row.is_valid),
      raw: row.raw_json ? JSON.parse(row.raw_json) : {},
      normalized: row.normalized_json ? JSON.parse(row.normalized_json) : {},
      errors: row.validation_errors_json ? JSON.parse(row.validation_errors_json) : [],
    }));

    return {
      rows: parsedRows,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Atomically commits valid rows from an import batch into the live Process_Registry
   * and Process_Ownership tables within a single database transaction.
   *
   * @param {number} batchId
   * @param {string} committedBy - Employee ECODE
   * @param {string|null} actingContext
   * @returns {Promise<{ committedCount: number, batchId: number }>}
   */
  async commitBatch(batchId, committedBy, actingContext = null) {
    const batch = await this.getBatchById(batchId);
    if (!batch) {
      throw new Error(`Import batch ${batchId} was not found.`);
    }

    if (batch.status === 'COMMITTED') {
      throw new Error(`Import batch ${batchId} has already been committed.`);
    }

    if (batch.valid_rows === 0) {
      throw new Error(`Import batch ${batchId} contains 0 valid rows to commit.`);
    }

    // Retrieve all valid staged rows for this batch
    const validRowsResult = await query(
      `SELECT row_number, normalized_json
       FROM dbo.Import_Staging_Rows
       WHERE batch_id = @batchId AND is_valid = 1
       ORDER BY row_number ASC`,
      { batchId: { type: sql.Int, value: batchId } }
    );

    const validRows = validRowsResult.recordset || [];
    if (validRows.length === 0) {
      throw new Error('No valid staged rows found in this batch.');
    }

    // Query highest current process_code suffix to assign sequential canonical codes
    const maxCodeResult = await query(
      `SELECT TOP 1 process_code 
       FROM dbo.Process_Registry 
       WHERE process_code LIKE 'PRC-%' 
       ORDER BY process_code DESC`
    );
    let currentCodeSeq = 0;
    if (maxCodeResult.recordset?.[0]?.process_code) {
      const parts = maxCodeResult.recordset[0].process_code.split('-');
      currentCodeSeq = parseInt(parts[1], 10) || 0;
    }

    // Execute atomic transactional commit
    const committedProcessCodes = [];

    await executeTransaction(async (transaction) => {
      for (const item of validRows) {
        const norm = JSON.parse(item.normalized_json);

        currentCodeSeq++;
        const processCode = `PRC-${String(currentCodeSeq).padStart(4, '0')}`;

        // 1. Insert Process_Registry record
        const insertProcReq = new sql.Request(transaction);
        insertProcReq.input('process_code', sql.VarChar(30), processCode);
        insertProcReq.input('wps_code', sql.VarChar(100), norm.wps_code || null);
        insertProcReq.input('process_name', sql.NVarChar(200), norm.process_name || null);
        insertProcReq.input('client_type', sql.VarChar(30), norm.client_type || null);
        insertProcReq.input('vertical_id', sql.Int, norm.vertical_id);
        insertProcReq.input('sbu_id', sql.Int, norm.sbu_id || null);
        insertProcReq.input('status', sql.VarChar(30), norm.status || 'TRANSITION');
        insertProcReq.input('status_reason', sql.NVarChar(255), norm.status_reason || null);
        insertProcReq.input('created_by', sql.VarChar(20), committedBy);

        const procResult = await insertProcReq.query(`
          INSERT INTO dbo.Process_Registry (
            process_code, wps_code, process_name, client_type, vertical_id, sbu_id, status, status_reason, version_num, created_by
          )
          OUTPUT INSERTED.registry_id
          VALUES (
            @process_code, @wps_code, @process_name, @client_type, @vertical_id, @sbu_id, @status, @status_reason, 1, @created_by
          )
        `);

        const registryId = procResult.recordset[0].registry_id;
        committedProcessCodes.push(processCode);

        // 2. Insert 5-tier Hierarchy in Process_Ownership
        const ownershipRoles = [
          { role: 'OPS_QUALITY_HEAD', ecode: norm.ops_head_ecode },
          { role: 'CBO', ecode: norm.cbo_ecode },
          { role: 'SBU_HEAD', ecode: norm.sbu_head_ecode },
          { role: 'ACCOUNT_HEAD', ecode: norm.account_head_ecode },
          { role: 'PM', ecode: norm.pm_ecode },
        ];

        for (const owner of ownershipRoles) {
          if (!owner.ecode) continue;

          const insertOwnerReq = new sql.Request(transaction);
          insertOwnerReq.input('registry_id', sql.Int, registryId);
          insertOwnerReq.input('role_type', sql.VarChar(30), owner.role);
          insertOwnerReq.input('employee_ecode', sql.VarChar(20), owner.ecode);
          insertOwnerReq.input('assigned_by', sql.VarChar(20), committedBy);

          await insertOwnerReq.query(`
            INSERT INTO dbo.Process_Ownership (
              registry_id, role_type, employee_ecode, effective_from, is_current, assigned_by, source_type, reason
            )
            VALUES (
              @registry_id, @role_type, @employee_ecode, SYSUTCDATETIME(), 1, @assigned_by, 'INITIAL_MIGRATION', 'Batch spreadsheet initial ingestion'
            )
          `);
        }
      }

      // 3. Mark Batch as COMMITTED
      const updateBatchReq = new sql.Request(transaction);
      updateBatchReq.input('batch_id', sql.Int, batchId);
      await updateBatchReq.query(`
        UPDATE dbo.Import_Batches
        SET status = 'COMMITTED',
            committed_at = SYSUTCDATETIME()
        WHERE batch_id = @batch_id
      `);
    });

    // 4. Log Audit Event
    await auditService.logEvent({
      module_code: 'BPMS',
      entity_type: 'IMPORT_BATCH',
      entity_id: String(batchId),
      action: 'COMMIT_IMPORT_BATCH',
      performed_by: committedBy,
      acting_context: actingContext,
      previous_data: { batch_id: batchId, status: batch.status },
      updated_data: {
        batch_id: batchId,
        status: 'COMMITTED',
        committed_rows: validRows.length,
        created_processes: committedProcessCodes,
      },
      remarks: `Committed ${validRows.length} processes from batch ${batchId} into live registry.`,
    });

    // 5. Dispatch Notification
    await notificationService.dispatch({
      recipient_ecode: committedBy,
      sender_ecode: null,
      notification_type: 'STATUS_CHANGE',
      entity_type: 'IMPORT_BATCH',
      entity_id: String(batchId),
      message: `Batch ${batchId} (${batch.file_name}) successfully committed. ${validRows.length} processes migrated to live registry.`,
      action_url: '/bpms/processes',
    });

    return {
      batchId,
      committedCount: validRows.length,
      sampleProcessCodes: committedProcessCodes.slice(0, 5),
    };
  }
}

export const importService = new ImportService();
export default importService;
