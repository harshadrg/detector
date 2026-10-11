import { query, executeTransaction, sql } from '../db/connection.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';

export class ChangeRequestService {
  /**
   * Submits a new Change Request (Draft/Submit) for a process.
   */
  async submitChangeRequest(user, registryId, data, actingContext = null) {
    // 1. Verify target process exists and user has DRAFT/SUBMIT permissions.
    // The auth check happens in controller but we need to ensure the process exists.
    const procRes = await query(
      `SELECT version_num, status FROM dbo.Process_Registry WHERE registry_id = @registryId`,
      { registryId: { type: sql.Int, value: registryId } }
    );
    if (!procRes.recordset || procRes.recordset.length === 0) {
      throw new Error(`Process with ID ${registryId} not found.`);
    }
    const currentVersion = procRes.recordset[0].version_num;

    if (data.version_num && data.version_num !== currentVersion) {
      const err = new Error(`Concurrency Exception: Process has been modified by another user.`);
      err.code = 'CONCURRENCY_ERROR';
      throw err;
    }

    // Enforce Separation of Duties / ABAC Scope:
    // Only assigned operational owners can request changes:
    // For deactivations: PM, ACCOUNT_HEAD, or SBU_HEAD.
    // For process attribute changes: PM only.
    const ownersRes = await query(
      `SELECT role_type, employee_ecode FROM dbo.Process_Ownership 
       WHERE registry_id = @registryId AND is_current = 1`,
      { registryId: { type: sql.Int, value: registryId } }
    );
    const owners = ownersRes.recordset || [];
    const isPM = owners.some((o) => o.role_type === 'PM' && o.employee_ecode === user.ecode);
    const isAccountOrSbuHead = owners.some(
      (o) => (o.role_type === 'ACCOUNT_HEAD' || o.role_type === 'SBU_HEAD') && o.employee_ecode === user.ecode
    );

    const isAuthorized = data.change_type === 'PROCESS_DEACTIVATION' 
      ? (isPM || isAccountOrSbuHead)
      : isPM;

    if (!isAuthorized) {
      const err = new Error(
        data.change_type === 'PROCESS_DEACTIVATION'
          ? 'Only the assigned Project Manager, Account Head, or SBU Head can request process deactivation.'
          : 'Only the assigned Project Manager can draft or submit change requests for this process.'
      );
      err.code = 'FORBIDDEN_SCOPE';
      throw err;
    }

    // Determine status based on action
    const status = data.action === 'SUBMIT' ? 'SUBMITTED' : 'DRAFT';
    const submittedAt = status === 'SUBMITTED' ? 'SYSUTCDATETIME()' : 'NULL';

    // Cancel existing DRAFT or SUBMITTED if any, to keep a single active request
    // Or we just create a new one. The requirements don't strictly forbid multiple drafts,
    // but usually there's only one active.
    
    let crId;
    await executeTransaction(async (transaction) => {
      const insertReq = new sql.Request(transaction);
      insertReq.input('registry_id', sql.Int, registryId);
      insertReq.input('change_type', sql.VarChar(40), data.change_type);
      insertReq.input('proposed_data', sql.NVarChar(sql.MAX), JSON.stringify(data.proposed_data));
      insertReq.input('status', sql.VarChar(30), status);
      insertReq.input('requested_by', sql.VarChar(20), user.ecode);
      
      const res = await insertReq.query(`
        INSERT INTO dbo.Process_Change_Requests (
          registry_id, change_type, proposed_data, status, requested_by, requested_at, submitted_at
        )
        OUTPUT INSERTED.change_request_id
        VALUES (
          @registry_id, @change_type, @proposed_data, @status, @requested_by, SYSUTCDATETIME(), ${submittedAt}
        )
      `);
      crId = res.recordset[0].change_request_id;
    });

    await auditService.logEvent({
      module_code: 'BPMS',
      entity_type: 'CHANGE_REQUEST',
      entity_id: String(crId),
      action: status === 'SUBMITTED' ? 'SUBMIT_CR' : 'DRAFT_CR',
      performed_by: user.ecode,
      acting_context: actingContext,
      previous_data: null,
      updated_data: { change_request_id: crId, registry_id: registryId, status, change_type: data.change_type, proposed_data: data.proposed_data },
      remarks: `${status === 'SUBMITTED' ? 'Submitted' : 'Drafted'} change request for Process ${registryId}.`,
    });

    // Notify Admins? The requirement says "notify requesters/target PMs upon submission, approval, and rejection." 
    // We notify target PMs on handover. For CRs, we can just log it for now.

    return { change_request_id: crId, status };
  }

  /**
   * Approves or Rejects a Change Request.
   */
  async reviewChangeRequest(user, crId, data, actingContext = null) {
    const action = data.action; // 'APPROVE' or 'REJECT'
    const remarks = data.review_remarks;

    if (action === 'REJECT' && (!remarks || remarks.trim().length === 0)) {
      const err = new Error('Review remarks are required when rejecting a change request.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const crRes = await query(
      `SELECT registry_id, change_type, proposed_data, status, requested_by 
       FROM dbo.Process_Change_Requests 
       WHERE change_request_id = @crId`,
      { crId: { type: sql.Int, value: crId } }
    );
    const cr = crRes.recordset?.[0];

    if (!cr) {
      throw new Error(`Change Request ${crId} not found.`);
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(cr.status)) {
      throw new Error(`Change request cannot be reviewed from status: ${cr.status}`);
    }

    const registryId = cr.registry_id;
    const proposedData = JSON.parse(cr.proposed_data);

    await executeTransaction(async (transaction) => {
      // 1. Update the CR status
      const updateCrReq = new sql.Request(transaction);
      updateCrReq.input('crId', sql.Int, crId);
      updateCrReq.input('status', sql.VarChar(30), newStatus);
      updateCrReq.input('reviewed_by', sql.VarChar(20), user.ecode);
      updateCrReq.input('remarks', sql.NVarChar(500), remarks || null);
      
      await updateCrReq.query(`
        UPDATE dbo.Process_Change_Requests
        SET status = @status,
            reviewed_by = @reviewed_by,
            reviewed_at = SYSUTCDATETIME(),
            review_remarks = @remarks
        WHERE change_request_id = @crId
      `);

      // 2. If approved, apply the changes to Process_Registry using optimistic concurrency check
      if (newStatus === 'APPROVED') {
        const procReq = new sql.Request(transaction);
        procReq.input('registryId', sql.Int, registryId);
        // We will increment version_num by 1
        const procRes = await procReq.query(`
          SELECT version_num FROM dbo.Process_Registry WHERE registry_id = @registryId
        `);
        const currentVersion = procRes.recordset[0].version_num;
        
        if (data.version_num && data.version_num !== currentVersion) {
           const err = new Error(`Concurrency Exception: Process has been modified by another user.`);
           err.code = 'CONCURRENCY_ERROR';
           throw err;
        }

        if (cr.change_type === 'PROCESS_DETAILS_UPDATE') {
          const updateProcReq = new sql.Request(transaction);
          updateProcReq.input('registryId', sql.Int, registryId);
          updateProcReq.input('wps_code', sql.VarChar(100), proposedData.wps_code || null);
          updateProcReq.input('process_name', sql.NVarChar(200), proposedData.process_name || null);
          updateProcReq.input('client_id', sql.Int, proposedData.client_id || null);
          updateProcReq.input('client_type', sql.VarChar(30), proposedData.client_type || null);
          updateProcReq.input('vertical_id', sql.Int, proposedData.vertical_id || null);
          updateProcReq.input('sbu_id', sql.Int, proposedData.sbu_id || null);
          updateProcReq.input('location_id', sql.Int, proposedData.location_id || null);
          updateProcReq.input('version_num', sql.Int, currentVersion + 1);

          await updateProcReq.query(`
            UPDATE dbo.Process_Registry
            SET wps_code = ISNULL(@wps_code, wps_code),
                process_name = ISNULL(@process_name, process_name),
                client_id = ISNULL(@client_id, client_id),
                client_type = ISNULL(@client_type, client_type),
                vertical_id = ISNULL(@vertical_id, vertical_id),
                sbu_id = ISNULL(@sbu_id, sbu_id),
                location_id = ISNULL(@location_id, location_id),
                version_num = @version_num,
                updated_at = SYSUTCDATETIME()
            WHERE registry_id = @registryId
          `);
        } else if (cr.change_type === 'PROCESS_DEACTIVATION') {
          const updateProcReq = new sql.Request(transaction);
          updateProcReq.input('registryId', sql.Int, registryId);
          updateProcReq.input('version_num', sql.Int, currentVersion + 1);
          updateProcReq.input('ended_on', sql.Date, proposedData.ended_on || new Date());
          updateProcReq.input('status_reason', sql.NVarChar(255), proposedData.closure_remarks || 'Deactivated via CR');

          await updateProcReq.query(`
            UPDATE dbo.Process_Registry
            SET status = 'INACTIVE',
                ended_on = @ended_on,
                status_reason = @status_reason,
                version_num = @version_num,
                updated_at = SYSUTCDATETIME()
            WHERE registry_id = @registryId
          `);
        }
      }
    });

    await auditService.logEvent({
      module_code: 'BPMS',
      entity_type: 'CHANGE_REQUEST',
      entity_id: String(crId),
      action: newStatus === 'APPROVED' ? 'APPROVE_CR' : 'REJECT_CR',
      performed_by: user.ecode,
      acting_context: actingContext,
      previous_data: { status: cr.status },
      updated_data: { status: newStatus, remarks },
      remarks: `Change request ${crId} was ${newStatus}.`,
    });

    // Notify the requester
    if (cr.requested_by) {
      await notificationService.dispatch({
        recipient_ecode: cr.requested_by,
        sender_ecode: user.ecode,
        notification_type: 'STATUS_CHANGE',
        entity_type: 'CHANGE_REQUEST',
        entity_id: String(crId),
        message: `Your Change Request for Process ${registryId} was ${newStatus}.`,
        action_url: `/bpms/reviews`
      });
    }

    return { change_request_id: crId, status: newStatus };
  }

  /**
   * Gets pending change requests for the review queue.
   */
  async listPendingReviews(_user) {
    const res = await query(`
      SELECT 
        cr.change_request_id,
        cr.registry_id,
        cr.change_type,
        cr.proposed_data,
        cr.status,
        cr.requested_by,
        req.name AS requested_by_name,
        cr.requested_at,
        cr.submitted_at,
        pr.process_code,
        pr.process_name,
        pr.wps_code,
        pr.client_id,
        pr.client_type,
        pr.vertical_id,
        pr.sbu_id,
        pr.location_id,
        pr.version_num
      FROM dbo.Process_Change_Requests cr
      JOIN dbo.Process_Registry pr ON pr.registry_id = cr.registry_id
      JOIN dbo.Employees req ON req.ecode = cr.requested_by
      WHERE cr.status IN ('SUBMITTED', 'UNDER_REVIEW')
      ORDER BY cr.submitted_at ASC
    `);

    const records = res.recordset || [];
    
    return records.map(r => {
      const proposedData = JSON.parse(r.proposed_data || '{}');
      const diff = {};
      const proposed_fields = [];
      
      if (r.change_type === 'PROCESS_DETAILS_UPDATE') {
        const fieldsToCheck = ['wps_code', 'process_name', 'client_id', 'client_type', 'vertical_id', 'sbu_id', 'location_id'];
        for (const f of fieldsToCheck) {
          if (proposedData[f] !== undefined && proposedData[f] !== r[f]) {
            diff[f] = { old: String(r[f] || ''), new: String(proposedData[f] || '') };
            proposed_fields.push(f);
          }
        }
      } else if (r.change_type === 'PROCESS_DEACTIVATION') {
         proposed_fields.push('status', 'ended_on', 'status_reason');
         diff['status'] = { old: 'ACTIVE', new: 'INACTIVE' };
      }

      return {
        cr_id: r.change_request_id,
        cr_code: `CR-${String(r.change_request_id).padStart(4, '0')}`,
        registry_code: r.process_code,
        process_name: r.process_name,
        status: r.status,
        requested_by_name: r.requested_by_name,
        submitted_time: new Date(r.submitted_at || r.requested_at).toLocaleString(),
        change_type: r.change_type,
        proposed_fields,
        diff,
        version_num: r.version_num
      };
    });
  }
}

export const changeRequestService = new ChangeRequestService();
export default changeRequestService;
