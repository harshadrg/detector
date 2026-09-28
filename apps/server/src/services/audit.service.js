import { randomUUID } from 'node:crypto';
import { query, sql } from '../db/connection.js';

export class AuditService {
  /**
   * Appends an immutable audit event record to dbo.Audit_Events.
   *
   * @param {Object} params
   * @param {string} [params.module_code='CORE']
   * @param {string} params.entity_type
   * @param {string} params.entity_id
   * @param {string} params.action
   * @param {string} params.performed_by - Authenticated employee ecode
   * @param {string|null} [params.acting_context=null] - Role simulated if context switched
   * @param {any} [params.previous_data=null] - Object or JSON string
   * @param {any} [params.updated_data=null] - Object or JSON string
   * @param {string|null} [params.remarks=null]
   * @param {string|null} [params.correlation_id=null]
   * @param {sql.Transaction|null} [transaction=null]
   * @returns {Promise<number>} Inserted event_id
   */
  async log(
    {
      module_code = 'CORE',
      entity_type,
      entity_id,
      action,
      performed_by,
      acting_context = null,
      previous_data = null,
      updated_data = null,
      remarks = null,
      correlation_id = null,
    },
    transaction = null
  ) {
    if (!entity_type || !entity_id || !action || !performed_by) {
      throw new Error(
        'AuditService.log requires entity_type, entity_id, action, and performed_by.'
      );
    }

    const prevJson =
      previous_data !== null && typeof previous_data === 'object'
        ? JSON.stringify(previous_data)
        : previous_data;

    const nextJson =
      updated_data !== null && typeof updated_data === 'object'
        ? JSON.stringify(updated_data)
        : updated_data;

    const corrId = correlation_id || randomUUID();

    const insertSql = `
      INSERT INTO dbo.Audit_Events (
        module_code,
        entity_type,
        entity_id,
        action,
        performed_by,
        acting_context,
        previous_data,
        updated_data,
        remarks,
        correlation_id
      )
      OUTPUT INSERTED.event_id
      VALUES (
        @module_code,
        @entity_type,
        @entity_id,
        @action,
        @performed_by,
        @acting_context,
        @previous_data,
        @updated_data,
        @remarks,
        @correlation_id
      )
    `;

    if (transaction) {
      const request = new sql.Request(transaction);
      request.input('module_code', sql.VarChar(30), module_code);
      request.input('entity_type', sql.VarChar(50), entity_type);
      request.input('entity_id', sql.VarChar(50), String(entity_id));
      request.input('action', sql.VarChar(100), action);
      request.input('performed_by', sql.VarChar(20), performed_by);
      request.input('acting_context', sql.VarChar(50), acting_context);
      request.input('previous_data', sql.NVarChar(sql.MAX), prevJson);
      request.input('updated_data', sql.NVarChar(sql.MAX), nextJson);
      request.input('remarks', sql.NVarChar(500), remarks);
      request.input('correlation_id', sql.VarChar(64), corrId);

      const result = await request.query(insertSql);
      return result.recordset?.[0]?.event_id;
    }

    const result = await query(insertSql, {
      module_code: { type: sql.VarChar(30), value: module_code },
      entity_type: { type: sql.VarChar(50), value: entity_type },
      entity_id: { type: sql.VarChar(50), value: String(entity_id) },
      action: { type: sql.VarChar(100), value: action },
      performed_by: { type: sql.VarChar(20), value: performed_by },
      acting_context: { type: sql.VarChar(50), value: acting_context },
      previous_data: { type: sql.NVarChar(sql.MAX), value: prevJson },
      updated_data: { type: sql.NVarChar(sql.MAX), value: nextJson },
      remarks: { type: sql.NVarChar(500), value: remarks },
      correlation_id: { type: sql.VarChar(64), value: corrId },
    });

    return result.recordset?.[0]?.event_id;
  }

  /**
   * Queries audit events with pagination, filtering, search, and actor details.
   *
   * @param {Object} options
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @param {string|null} [options.module_code=null]
   * @param {string|null} [options.entity_type=null]
   * @param {string|null} [options.entity_id=null]
   * @param {string|null} [options.action=null]
   * @param {string|null} [options.performed_by=null]
   * @param {string|null} [options.acting_context=null]
   * @param {string|null} [options.search=null]
   * @param {string[]|null} [options.allowedModules=null] - Enforced by ABAC/RBAC
   * @returns {Promise<{ events: any[], meta: { page: number, pageSize: number, totalCount: number, totalPages: number } }>}
   */
  async queryEvents({
    page = 1,
    pageSize = 20,
    module_code = null,
    entity_type = null,
    entity_id = null,
    action = null,
    performed_by = null,
    acting_context = null,
    search = null,
    allowedModules = null,
  } = {}) {
    const offset = (page - 1) * pageSize;
    const whereClauses = [];
    const params = {
      offset: { type: sql.Int, value: offset },
      pageSize: { type: sql.Int, value: pageSize },
    };

    // ABAC module restriction
    if (allowedModules && allowedModules.length > 0) {
      const placeholders = allowedModules
        .map((mod, i) => {
          const key = `allowedMod_${i}`;
          params[key] = { type: sql.VarChar(30), value: mod };
          return `@${key}`;
        })
        .join(', ');
      whereClauses.push(`a.module_code IN (${placeholders})`);
    }

    if (module_code && module_code !== 'ALL') {
      whereClauses.push('a.module_code = @module_code');
      params.module_code = { type: sql.VarChar(30), value: module_code };
    }

    if (entity_type && entity_type !== 'ALL') {
      whereClauses.push('a.entity_type = @entity_type');
      params.entity_type = { type: sql.VarChar(50), value: entity_type };
    }

    if (entity_id) {
      whereClauses.push('a.entity_id = @entity_id');
      params.entity_id = { type: sql.VarChar(50), value: entity_id };
    }

    if (action) {
      whereClauses.push('a.action = @action');
      params.action = { type: sql.VarChar(100), value: action };
    }

    if (performed_by) {
      whereClauses.push('a.performed_by = @performed_by');
      params.performed_by = { type: sql.VarChar(20), value: performed_by };
    }

    if (acting_context) {
      whereClauses.push('a.acting_context = @acting_context');
      params.acting_context = { type: sql.VarChar(50), value: acting_context };
    }

    if (search && search.trim().length > 0) {
      whereClauses.push(`(
        a.entity_id LIKE @searchPattern OR
        a.action LIKE @searchPattern OR
        a.performed_by LIKE @searchPattern OR
        e.name LIKE @searchPattern OR
        a.remarks LIKE @searchPattern OR
        a.correlation_id LIKE @searchPattern
      )`);
      params.searchPattern = { type: sql.NVarChar(150), value: `%${search.trim()}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total Matching Rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM dbo.Audit_Events a
      LEFT JOIN dbo.Employees e ON e.ecode = a.performed_by
      ${whereSql}
    `;
    const countResult = await query(countSql, params);
    const totalCount = countResult.recordset?.[0]?.total || 0;

    // Fetch Paginated Events
    const querySql = `
      SELECT 
        a.event_id,
        a.module_code,
        a.entity_type,
        a.entity_id,
        a.action,
        a.performed_by,
        e.name AS performer_name,
        e.email AS performer_email,
        a.acting_context,
        a.previous_data,
        a.updated_data,
        a.remarks,
        a.correlation_id,
        a.created_at
      FROM dbo.Audit_Events a
      LEFT JOIN dbo.Employees e ON e.ecode = a.performed_by
      ${whereSql}
      ORDER BY a.created_at DESC, a.event_id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const eventsResult = await query(querySql, params);
    const events = (eventsResult.recordset || []).map((row) => {
      let prevObj = null;
      let nextObj = null;
      try {
        if (row.previous_data) prevObj = JSON.parse(row.previous_data);
      } catch {
        prevObj = row.previous_data;
      }
      try {
        if (row.updated_data) nextObj = JSON.parse(row.updated_data);
      } catch {
        nextObj = row.updated_data;
      }

      return {
        ...row,
        previous_data_parsed: prevObj,
        updated_data_parsed: nextObj,
      };
    });

    return {
      events,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}

export const auditService = new AuditService();
export default auditService;
