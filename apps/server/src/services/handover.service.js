import { query, executeTransaction, sql } from '../db/connection.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';

export class HandoverService {
  /**
   * Submits a handover request.
   */
  async requestHandover(user, registryId, data, actingContext = null) {
    const { from_pm_ecode, to_pm_ecode, scenario, effective_date, reason } = data;

    // Verify target process exists
    const procRes = await query(
      `SELECT status FROM dbo.Process_Registry WHERE registry_id = @registryId`,
      { registryId: { type: sql.Int, value: registryId } }
    );
    if (!procRes.recordset || procRes.recordset.length === 0) {
      throw new Error(`Process with ID ${registryId} not found.`);
    }

    // Enforce Separation of Duties / ABAC Scope:
    // Only assigned PM, ACCOUNT_HEAD, or SBU_HEAD can request handovers
    const ownersRes = await query(
      `SELECT role_type, employee_ecode FROM dbo.Process_Ownership 
       WHERE registry_id = @registryId AND is_current = 1`,
      { registryId: { type: sql.Int, value: registryId } }
    );
    const owners = ownersRes.recordset || [];
    const isAuthorized = owners.some(
      (o) => (o.role_type === 'PM' || o.role_type === 'ACCOUNT_HEAD' || o.role_type === 'SBU_HEAD') && o.employee_ecode === user.ecode
    );
    if (!isAuthorized) {
      const err = new Error('Only the assigned Project Manager, Account Head, or SBU Head can request handovers for this process.');
      err.code = 'FORBIDDEN_SCOPE';
      throw err;
    }

    let handoverId;
    await executeTransaction(async (transaction) => {
      const insertReq = new sql.Request(transaction);
      insertReq.input('registry_id', sql.Int, registryId);
      insertReq.input('from_pm_ecode', sql.VarChar(20), from_pm_ecode || null);
      insertReq.input('to_pm_ecode', sql.VarChar(20), to_pm_ecode);
      insertReq.input('scenario', sql.VarChar(50), scenario);
      insertReq.input('effective_date', sql.Date, effective_date);
      insertReq.input('reason', sql.NVarChar(500), reason);
      insertReq.input('requested_by', sql.VarChar(20), user.ecode);

      const res = await insertReq.query(`
        INSERT INTO dbo.Process_Handover_Requests (
          registry_id, from_pm_ecode, to_pm_ecode, scenario, effective_date, reason, status, requested_by
        )
        OUTPUT INSERTED.handover_id
        VALUES (
          @registry_id, @from_pm_ecode, @to_pm_ecode, @scenario, @effective_date, @reason, 'SUBMITTED', @requested_by
        )
      `);
      handoverId = res.recordset[0].handover_id;
    });

    await auditService.logEvent({
      module_code: 'BPMS',
      entity_type: 'HANDOVER_REQUEST',
      entity_id: String(handoverId),
      action: 'REQUEST_HANDOVER',
      performed_by: user.ecode,
      acting_context: actingContext,
      previous_data: null,
      updated_data: { handover_id: handoverId, registry_id: registryId, to_pm_ecode, scenario },
      remarks: `Handover requested for process ${registryId} to PM ${to_pm_ecode} (${scenario}).`,
    });

    // Notify target PM
    await notificationService.dispatch({
      recipient_ecode: to_pm_ecode,
      sender_ecode: user.ecode,
      notification_type: 'APPROVAL_REQUIRED',
      entity_type: 'HANDOVER',
      entity_id: String(handoverId),
      message: `A PM handover request has been submitted for you to take over Process ${registryId}.`,
      action_url: `/bpms/reviews`
    });

    // Auto-execute if requested by an Admin
    const isAdmin = user.roles && (user.roles.includes('SUPER_ADMIN') || user.roles.includes('BPMS_ADMIN'));
    if (isAdmin) {
      return this.reviewHandover(user, handoverId, {
        action: 'APPROVE',
        review_remarks: 'Auto-approved by Administrator.'
      }, actingContext);
    }

    return { handover_id: handoverId, status: 'SUBMITTED' };
  }

  /**
   * Approves or rejects a handover request.
   */
  async reviewHandover(user, handoverId, data, actingContext = null) {
    const { action, review_remarks } = data; // 'APPROVE' or 'REJECT'

    if (action === 'REJECT' && (!review_remarks || review_remarks.trim().length === 0)) {
      const err = new Error('Review remarks are required when rejecting a handover.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const hrRes = await query(
      `SELECT registry_id, from_pm_ecode, to_pm_ecode, status, effective_date, requested_by 
       FROM dbo.Process_Handover_Requests 
       WHERE handover_id = @handoverId`,
      { handoverId: { type: sql.Int, value: handoverId } }
    );
    const hr = hrRes.recordset?.[0];

    if (!hr) {
      throw new Error(`Handover Request ${handoverId} not found.`);
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(hr.status)) {
      throw new Error(`Handover request cannot be reviewed from status: ${hr.status}`);
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await executeTransaction(async (transaction) => {
      // 1. Update Handover Request status
      const updateReq = new sql.Request(transaction);
      updateReq.input('handoverId', sql.Int, handoverId);
      updateReq.input('status', sql.VarChar(30), newStatus);
      updateReq.input('reviewed_by', sql.VarChar(20), user.ecode);
      updateReq.input('remarks', sql.NVarChar(500), review_remarks || null);

      await updateReq.query(`
        UPDATE dbo.Process_Handover_Requests
        SET status = @status,
            reviewed_by = @reviewed_by,
            reviewed_at = SYSUTCDATETIME(),
            review_remarks = @remarks
        WHERE handover_id = @handoverId
      `);

      if (newStatus === 'APPROVED') {
        const { registry_id, from_pm_ecode, to_pm_ecode } = hr;

        // 2. Atomic Handover Execution (Update Process_Ownership)
        // Close current PM ownership
        if (from_pm_ecode) {
          const closeReq = new sql.Request(transaction);
          closeReq.input('registry_id', sql.Int, registry_id);
          closeReq.input('from_pm_ecode', sql.VarChar(20), from_pm_ecode);
          closeReq.input('effective_to', sql.Date, new Date());
          
          await closeReq.query(`
            UPDATE dbo.Process_Ownership
            SET is_current = 0,
                effective_to = @effective_to
            WHERE registry_id = @registry_id 
              AND employee_ecode = @from_pm_ecode 
              AND role_type = 'PM'
              AND is_current = 1
          `);
        }

        // Open new PM ownership
        const openReq = new sql.Request(transaction);
        openReq.input('registry_id', sql.Int, registry_id);
        openReq.input('to_pm_ecode', sql.VarChar(20), to_pm_ecode);
        openReq.input('effective_from', sql.Date, new Date());
        openReq.input('assigned_by', sql.VarChar(20), user.ecode);
        
        await openReq.query(`
          INSERT INTO dbo.Process_Ownership (
            registry_id, role_type, employee_ecode, effective_from, is_current, assigned_by, source_type
          )
          VALUES (
            @registry_id, 'PM', @to_pm_ecode, @effective_from, 1, @assigned_by, 'HANDOVER'
          )
        `);

        // 3. Mark the handover as EXECUTED immediately since we just executed it
        const execReq = new sql.Request(transaction);
        execReq.input('handoverId', sql.Int, handoverId);
        await execReq.query(`
          UPDATE dbo.Process_Handover_Requests
          SET status = 'EXECUTED'
          WHERE handover_id = @handoverId
        `);

        // 4. Zero Standing Privileges Check
        if (from_pm_ecode) {
          const countReq = new sql.Request(transaction);
          countReq.input('from_pm_ecode', sql.VarChar(20), from_pm_ecode);
          
          const countRes = await countReq.query(`
            SELECT COUNT(*) AS active_count
            FROM dbo.Process_Ownership
            WHERE employee_ecode = @from_pm_ecode
              AND role_type = 'PM'
              AND is_current = 1
          `);
          
          if (countRes.recordset[0].active_count === 0) {
            // Revoke PM role from from_pm_ecode in Employee_Role_Mapping
            const roleReq = new sql.Request(transaction);
            roleReq.input('ecode', sql.VarChar(20), from_pm_ecode);
            
            await roleReq.query(`
              DELETE erm
              FROM dbo.Employee_Role_Mapping erm
              JOIN dbo.Roles r ON r.role_id = erm.role_id
              WHERE erm.ecode = @ecode AND r.role_code = 'PM'
            `);

            await auditService.logEvent({
              module_code: 'CORE',
              entity_type: 'EMPLOYEE_ROLE',
              entity_id: from_pm_ecode,
              action: 'REVOKE_ROLE_AUTO',
              performed_by: 'SYSTEM', // It's an automated revocation based on action by `user.ecode`
              acting_context: actingContext,
              previous_data: { role_code: 'PM' },
              updated_data: null,
              remarks: `Zero Standing Privileges: Automatically revoked PM role from ${from_pm_ecode} due to 0 active ownerships.`,
            }, transaction);
          }
        }
      }
    });

    await auditService.logEvent({
      module_code: 'BPMS',
      entity_type: 'HANDOVER_REQUEST',
      entity_id: String(handoverId),
      action: newStatus === 'APPROVED' ? 'APPROVE_HANDOVER' : 'REJECT_HANDOVER',
      performed_by: user.ecode,
      acting_context: actingContext,
      previous_data: { status: hr.status },
      updated_data: { status: newStatus === 'APPROVED' ? 'EXECUTED' : 'REJECTED', review_remarks },
      remarks: `Handover request ${handoverId} was ${newStatus}.`,
    });

    // Notify the requester
    if (hr.requested_by) {
      await notificationService.dispatch({
        recipient_ecode: hr.requested_by,
        sender_ecode: user.ecode,
        notification_type: 'STATUS_CHANGE',
        entity_type: 'HANDOVER',
        entity_id: String(handoverId),
        message: `Your handover request for Process ${hr.registry_id} was ${newStatus === 'APPROVED' ? 'EXECUTED' : 'REJECTED'}.`,
        action_url: `/bpms/handovers/${handoverId}`
      });
    }

    return { handover_id: handoverId, status: newStatus === 'APPROVED' ? 'EXECUTED' : 'REJECTED' };
  }

  /**
   * Lists pending handover requests for the review queue.
   */
  async listPendingHandovers() {
    const res = await query(`
      SELECT 
        hr.handover_id,
        hr.registry_id,
        hr.from_pm_ecode,
        f_emp.name AS from_pm_name,
        hr.to_pm_ecode,
        t_emp.name AS to_pm_name,
        hr.scenario,
        hr.effective_date,
        hr.reason,
        hr.status,
        hr.requested_by,
        req.name AS requested_by_name,
        hr.created_at,
        pr.process_code,
        pr.process_name
      FROM dbo.Process_Handover_Requests hr
      JOIN dbo.Process_Registry pr ON pr.registry_id = hr.registry_id
      JOIN dbo.Employees req ON req.ecode = hr.requested_by
      LEFT JOIN dbo.Employees f_emp ON f_emp.ecode = hr.from_pm_ecode
      JOIN dbo.Employees t_emp ON t_emp.ecode = hr.to_pm_ecode
      WHERE hr.status IN ('SUBMITTED', 'UNDER_REVIEW')
      ORDER BY hr.created_at ASC
    `);

    return res.recordset || [];
  }
}

export const handoverService = new HandoverService();
export default handoverService;
