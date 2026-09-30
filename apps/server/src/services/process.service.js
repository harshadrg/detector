import { query, executeTransaction, sql } from '../db/connection.js';
import { authorizationService } from './authorization.service.js';
import { auditService } from './audit.service.js';

export class ProcessService {
  /**
   * Retrieves a paginated, filtered, and ABAC-scoped list of processes
   * enriched with 5-tier ownership hierarchy and computed row capabilities.
   *
   * @param {{ ecode: string, permissions: string[], roles: Array<{ role_code: string }> }} user
   * @param {Object} options
   * @returns {Promise<{ processes: any[], meta: { page: number, pageSize: number, totalCount: number, totalPages: number } }>}
   */
  async listProcesses(user, {
    page = 1,
    pageSize = 20,
    search = '',
    vertical_id = null,
    sbu_id = null,
    status = 'ALL',
    client_type = null,
    sortField = 'process_code',
    sortDirection = 'ASC',
  } = {}) {
    // 1. Evaluate ABAC Scope for BPMS.PROCESS.VIEW
    const scope = authorizationService.resolveScope(user, 'BPMS.PROCESS.VIEW');
    if (scope === 'NONE') {
      return {
        processes: [],
        meta: { page, pageSize, totalCount: 0, totalPages: 0 },
      };
    }

    const offset = (page - 1) * pageSize;
    const whereClauses = [];
    const params = {
      offset: { type: sql.Int, value: offset },
      pageSize: { type: sql.Int, value: pageSize },
      userEcode: { type: sql.VarChar(20), value: user.ecode },
    };

    // ABAC Scope Predicates
    if (scope === 'OWN_HIERARCHY') {
      whereClauses.push(`
        pr.registry_id IN (
          SELECT po.registry_id
          FROM dbo.Process_Ownership po
          WHERE po.employee_ecode = @userEcode AND po.is_current = 1
        )
      `);
    } else if (scope === 'OWN_PROCESS') {
      whereClauses.push(`
        pr.registry_id IN (
          SELECT po.registry_id
          FROM dbo.Process_Ownership po
          WHERE po.employee_ecode = @userEcode AND po.role_type = 'PM' AND po.is_current = 1
        )
      `);
    }

    // Business Filters
    if (status && status !== 'ALL') {
      whereClauses.push('pr.status = @status');
      params.status = { type: sql.VarChar(30), value: status.toUpperCase() };
    }

    if (vertical_id) {
      whereClauses.push('pr.vertical_id = @verticalId');
      params.verticalId = { type: sql.Int, value: parseInt(vertical_id, 10) };
    }

    if (sbu_id) {
      whereClauses.push('pr.sbu_id = @sbuId');
      params.sbuId = { type: sql.Int, value: parseInt(sbu_id, 10) };
    }

    if (client_type && client_type !== 'ALL') {
      whereClauses.push('pr.client_type = @clientType');
      params.clientType = { type: sql.VarChar(30), value: client_type.toUpperCase() };
    }

    if (search && search.trim().length > 0) {
      whereClauses.push(`(
        pr.process_code LIKE @search OR
        pr.wps_code LIKE @search OR
        pr.process_name LIKE @search OR
        c.client_name LIKE @search OR
        v.vertical_code LIKE @search OR
        s.sbu_code LIKE @search
      )`);
      params.search = { type: sql.NVarChar(150), value: `%${search.trim()}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Safe Sort Field Map
    const validSortFields = {
      process_code: 'pr.process_code',
      process_name: 'pr.process_name',
      status: 'pr.status',
      vertical_name: 'v.vertical_name',
      sbu_name: 's.sbu_name',
      client_name: 'c.client_name',
      created_at: 'pr.created_at',
      updated_at: 'pr.updated_at',
    };
    const orderColumn = validSortFields[sortField] || 'pr.process_code';
    const orderDir = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // 2. Count Total Matching Rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM dbo.Process_Registry pr
      LEFT JOIN dbo.Verticals v ON v.vertical_id = pr.vertical_id
      LEFT JOIN dbo.SBUs s ON s.sbu_id = pr.sbu_id
      LEFT JOIN dbo.Clients c ON c.client_id = pr.client_id
      LEFT JOIN dbo.Locations l ON l.location_id = pr.location_id
      ${whereSql}
    `;
    const countResult = await query(countSql, params);
    const totalCount = countResult.recordset?.[0]?.total || 0;

    if (totalCount === 0) {
      return {
        processes: [],
        meta: { page, pageSize, totalCount: 0, totalPages: 0 },
      };
    }

    // 3. Query Paginated Process Rows
    const listSql = `
      SELECT 
        pr.registry_id,
        pr.process_code,
        pr.wps_code,
        pr.process_name,
        pr.client_id,
        c.client_name,
        pr.client_type,
        pr.vertical_id,
        v.vertical_code,
        v.vertical_name,
        pr.sbu_id,
        s.sbu_code,
        s.sbu_name,
        pr.location_id,
        l.state AS location_state,
        l.city AS location_city,
        l.facility_name AS location_facility,
        pr.status,
        pr.status_reason,
        pr.started_on,
        pr.ended_on,
        pr.version_num,
        pr.created_by,
        pr.created_at,
        pr.updated_at
      FROM dbo.Process_Registry pr
      LEFT JOIN dbo.Verticals v ON v.vertical_id = pr.vertical_id
      LEFT JOIN dbo.SBUs s ON s.sbu_id = pr.sbu_id
      LEFT JOIN dbo.Clients c ON c.client_id = pr.client_id
      LEFT JOIN dbo.Locations l ON l.location_id = pr.location_id
      ${whereSql}
      ORDER BY ${orderColumn} ${orderDir}, pr.registry_id ASC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const listResult = await query(listSql, params);
    const rawProcesses = listResult.recordset || [];

    if (rawProcesses.length === 0) {
      return {
        processes: [],
        meta: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      };
    }

    // 4. Enrich with Current 5-Tier Ownership Hierarchy
    const registryIds = rawProcesses.map((p) => p.registry_id);
    const idParams = {};
    const idPlaceholders = registryIds
      .map((id, index) => {
        const paramName = `regId_${index}`;
        idParams[paramName] = { type: sql.Int, value: id };
        return `@${paramName}`;
      })
      .join(', ');

    const ownershipResult = await query(
      `SELECT 
         po.registry_id,
         po.role_type,
         po.employee_ecode,
         e.name AS employee_name,
         e.email AS employee_email
       FROM dbo.Process_Ownership po
       JOIN dbo.Employees e ON e.ecode = po.employee_ecode
       WHERE po.registry_id IN (${idPlaceholders}) AND po.is_current = 1`,
      idParams
    );

    const ownershipMap = new Map();
    for (const row of ownershipResult.recordset || []) {
      if (!ownershipMap.has(row.registry_id)) {
        ownershipMap.set(row.registry_id, []);
      }
      ownershipMap.get(row.registry_id).push(row);
    }

    // 5. Enrich Each Process with Hierarchy Objects and Computed Row Capabilities
    const enriched = rawProcesses.map((proc) => {
      const owners = ownershipMap.get(proc.registry_id) || [];

      const getOwner = (roleType) => {
        const o = owners.find((item) => item.role_type === roleType);
        return o ? { ecode: o.employee_ecode, name: o.employee_name, email: o.employee_email } : null;
      };

      const hierarchy = {
        ops_head: getOwner('OPS_QUALITY_HEAD'),
        cbo: getOwner('CBO'),
        sbu_head: getOwner('SBU_HEAD'),
        account_head: getOwner('ACCOUNT_HEAD'),
        pm: getOwner('PM'),
      };

      // Compute row capabilities for capability-driven UI
      const capabilities = authorizationService.resolveProcessCapabilities(user, {
        registry_id: proc.registry_id,
        status: proc.status,
        owners,
      });

      return {
        ...proc,
        hierarchy,
        owners,
        capabilities,
      };
    });

    return {
      processes: enriched,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Retrieves full details for a single process with verification of ABAC scope.
   *
   * @param {{ ecode: string, permissions: string[], roles: Array<{ role_code: string }> }} user
   * @param {number} registryId
   * @returns {Promise<any|null>}
   */
  async getProcessById(user, registryId) {
    const res = await query(
      `SELECT 
        pr.registry_id,
        pr.process_code,
        pr.wps_code,
        pr.process_name,
        pr.client_id,
        c.client_name,
        pr.client_type,
        pr.vertical_id,
        v.vertical_code,
        v.vertical_name,
        pr.sbu_id,
        s.sbu_code,
        s.sbu_name,
        pr.location_id,
        l.state AS location_state,
        l.city AS location_city,
        l.facility_name AS location_facility,
        pr.status,
        pr.status_reason,
        pr.started_on,
        pr.ended_on,
        pr.version_num,
        pr.created_by,
        creator.name AS created_by_name,
        pr.created_at,
        pr.updated_at
      FROM dbo.Process_Registry pr
      LEFT JOIN dbo.Verticals v ON v.vertical_id = pr.vertical_id
      LEFT JOIN dbo.SBUs s ON s.sbu_id = pr.sbu_id
      LEFT JOIN dbo.Clients c ON c.client_id = pr.client_id
      LEFT JOIN dbo.Locations l ON l.location_id = pr.location_id
      LEFT JOIN dbo.Employees creator ON creator.ecode = pr.created_by
      WHERE pr.registry_id = @registryId`,
      { registryId: { type: sql.Int, value: registryId } }
    );

    const proc = res.recordset?.[0];
    if (!proc) return null;

    // Fetch current ownership
    const ownersRes = await query(
      `SELECT 
         po.ownership_id,
         po.role_type,
         po.employee_ecode,
         e.name AS employee_name,
         e.email AS employee_email,
         po.effective_from,
         po.source_type
       FROM dbo.Process_Ownership po
       JOIN dbo.Employees e ON e.ecode = po.employee_ecode
       WHERE po.registry_id = @registryId AND po.is_current = 1`,
      { registryId: { type: sql.Int, value: registryId } }
    );
    const owners = ownersRes.recordset || [];

    // Verify ABAC access
    const scope = authorizationService.resolveScope(user, 'BPMS.PROCESS.VIEW');
    if (scope === 'OWN_HIERARCHY') {
      const inHierarchy = owners.some((o) => o.employee_ecode === user.ecode);
      if (!inHierarchy) return null;
    } else if (scope === 'OWN_PROCESS') {
      const isPM = owners.some((o) => o.role_type === 'PM' && o.employee_ecode === user.ecode);
      if (!isPM) return null;
    } else if (scope === 'NONE') {
      return null;
    }

    const getOwner = (roleType) => {
      const o = owners.find((item) => item.role_type === roleType);
      return o ? { ecode: o.employee_ecode, name: o.employee_name, email: o.employee_email } : null;
    };

    const hierarchy = {
      ops_head: getOwner('OPS_QUALITY_HEAD'),
      cbo: getOwner('CBO'),
      sbu_head: getOwner('SBU_HEAD'),
      account_head: getOwner('ACCOUNT_HEAD'),
      pm: getOwner('PM'),
    };

    const capabilities = authorizationService.resolveProcessCapabilities(user, {
      registry_id: proc.registry_id,
      status: proc.status,
      owners,
    });

    return {
      ...proc,
      hierarchy,
      owners,
      capabilities,
    };
  }

  /**
   * Manually creates a new process record with initial ownership.
   *
   * @param {{ ecode: string }} user
   * @param {Object} data
   * @param {string|null} actingContext
   * @returns {Promise<any>}
   */
  async createProcess(user, data, actingContext = null) {
    // Generate next process_code
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
    currentCodeSeq++;
    const processCode = `PRC-${String(currentCodeSeq).padStart(4, '0')}`;

    let createdRegistryId;

    await executeTransaction(async (transaction) => {
      const insertProcReq = new sql.Request(transaction);
      insertProcReq.input('process_code', sql.VarChar(30), processCode);
      insertProcReq.input('wps_code', sql.VarChar(100), data.wps_code || null);
      insertProcReq.input('process_name', sql.NVarChar(200), data.process_name || null);
      insertProcReq.input('client_id', sql.Int, data.client_id || null);
      insertProcReq.input('client_type', sql.VarChar(30), data.client_type || null);
      insertProcReq.input('vertical_id', sql.Int, data.vertical_id);
      insertProcReq.input('sbu_id', sql.Int, data.sbu_id || null);
      insertProcReq.input('location_id', sql.Int, data.location_id || null);
      insertProcReq.input('status', sql.VarChar(30), data.status || 'TRANSITION');
      insertProcReq.input('status_reason', sql.NVarChar(255), data.status_reason || null);
      insertProcReq.input('started_on', sql.Date, data.started_on || null);
      insertProcReq.input('ended_on', sql.Date, data.ended_on || null);
      insertProcReq.input('created_by', sql.VarChar(20), user.ecode);

      const procResult = await insertProcReq.query(`
        INSERT INTO dbo.Process_Registry (
          process_code, wps_code, process_name, client_id, client_type, vertical_id, sbu_id, location_id,
          status, status_reason, started_on, ended_on, version_num, created_by
        )
        OUTPUT INSERTED.registry_id
        VALUES (
          @process_code, @wps_code, @process_name, @client_id, @client_type, @vertical_id, @sbu_id, @location_id,
          @status, @status_reason, @started_on, @ended_on, 1, @created_by
        )
      `);
      createdRegistryId = procResult.recordset[0].registry_id;

      // Assign initial ownership if provided
      const owners = [
        { role: 'OPS_QUALITY_HEAD', ecode: data.ops_head_ecode },
        { role: 'CBO', ecode: data.cbo_ecode },
        { role: 'SBU_HEAD', ecode: data.sbu_head_ecode },
        { role: 'ACCOUNT_HEAD', ecode: data.account_head_ecode },
        { role: 'PM', ecode: data.pm_ecode },
      ];

      for (const o of owners) {
        if (!o.ecode) continue;
        const insertOwnerReq = new sql.Request(transaction);
        insertOwnerReq.input('registry_id', sql.Int, createdRegistryId);
        insertOwnerReq.input('role_type', sql.VarChar(30), o.role);
        insertOwnerReq.input('employee_ecode', sql.VarChar(20), o.ecode);
        insertOwnerReq.input('assigned_by', sql.VarChar(20), user.ecode);

        await insertOwnerReq.query(`
          INSERT INTO dbo.Process_Ownership (
            registry_id, role_type, employee_ecode, effective_from, is_current, assigned_by, source_type, reason
          )
          VALUES (
            @registry_id, @role_type, @employee_ecode, SYSUTCDATETIME(), 1, @assigned_by, 'ADMIN_ASSIGNMENT', 'Manual process creation'
          )
        `);
      }
    });

    // Log to Audit Events
    await auditService.logEvent({
      module_code: 'BPMS',
      entity_type: 'PROCESS',
      entity_id: String(createdRegistryId),
      action: 'CREATE_PROCESS',
      performed_by: user.ecode,
      acting_context: actingContext,
      previous_data: null,
      updated_data: { registry_id: createdRegistryId, process_code: processCode, ...data },
      remarks: `Manually created process ${processCode}.`,
    });

    return this.getProcessById(user, createdRegistryId);
  }
}

export const processService = new ProcessService();
export default processService;
