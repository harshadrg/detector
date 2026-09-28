import { query, executeTransaction, sql } from '../db/connection.js';
import { hashPassword } from '../utils/crypto.js';
import { authorizationService } from '../services/authorization.service.js';
import { auditService } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';
import {
  createEmployeeSchema,
  updateStatusSchema,
  assignRoleSchema,
  listEmployeesQuerySchema,
} from '../schemas/employee.schema.js';

/**
 * List employees with search, status filtering, role aggregation,
 * and active process ownership counts.
 */
export async function listEmployees(req, res) {
  try {
    const parseResult = listEmployeesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { page, pageSize, status, search } = parseResult.data;
    const offset = (page - 1) * pageSize;

    // Build WHERE clause dynamically with parameters
    const whereClauses = [];
    const params = {
      offset: { type: sql.Int, value: offset },
      pageSize: { type: sql.Int, value: pageSize },
    };

    if (status !== 'ALL') {
      whereClauses.push('e.status = @status');
      params.status = { type: sql.VarChar(20), value: status };
    }

    if (search && search.length > 0) {
      whereClauses.push('(e.ecode LIKE @searchPattern OR e.name LIKE @searchPattern OR e.email LIKE @searchPattern)');
      params.searchPattern = { type: sql.NVarChar(150), value: `%${search}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total Matching Rows
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM dbo.Employees e ${whereSql}`,
      params
    );
    const totalCount = countResult.recordset?.[0]?.total || 0;

    // Fetch Paginated Employees
    const empResult = await query(
      `SELECT 
         e.ecode, e.name, e.email, e.status, e.created_at, e.updated_at
       FROM dbo.Employees e
       ${whereSql}
       ORDER BY e.created_at DESC, e.ecode ASC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      params
    );

    const employees = empResult.recordset || [];

    if (employees.length === 0) {
      return res.status(200).json({
        success: true,
        data: { employees: [] },
        meta: { page, pageSize, totalCount, totalPages: 0 },
        error: null,
      });
    }

    const ecodes = employees.map((e) => e.ecode);
    const ecodeParams = {};
    const ecodePlaceholders = ecodes
      .map((ecode, index) => {
        const paramName = `ecode_${index}`;
        ecodeParams[paramName] = { type: sql.VarChar(20), value: ecode };
        return `@${paramName}`;
      })
      .join(', ');

    // Aggregate Assigned Roles
    const rolesResult = await query(
      `SELECT 
         erm.ecode, r.role_id, r.role_code, r.role_name, r.role_category
       FROM dbo.Employee_Role_Mapping erm
       JOIN dbo.Roles r ON r.role_id = erm.role_id
       WHERE erm.ecode IN (${ecodePlaceholders}) AND r.is_active = 1`,
      ecodeParams
    );

    // Aggregate Active Process Ownership Counts (for offboarding / guard indicators)
    const procResult = await query(
      `SELECT 
         po.employee_ecode, COUNT(DISTINCT po.registry_id) AS active_process_count
       FROM dbo.Process_Ownership po
       JOIN dbo.Process_Registry pr ON pr.registry_id = po.registry_id
       WHERE po.employee_ecode IN (${ecodePlaceholders})
         AND po.is_current = 1
         AND pr.status IN ('ACTIVE', 'TRANSITION')
       GROUP BY po.employee_ecode`,
      ecodeParams
    );

    const roleMap = new Map();
    for (const r of rolesResult.recordset || []) {
      if (!roleMap.has(r.ecode)) roleMap.set(r.ecode, []);
      roleMap.get(r.ecode).push({
        role_id: r.role_id,
        role_code: r.role_code,
        role_name: r.role_name,
        role_category: r.role_category,
      });
    }

    const processCountMap = new Map();
    for (const p of procResult.recordset || []) {
      processCountMap.set(p.employee_ecode, p.active_process_count);
    }

    const enrichedEmployees = employees.map((emp) => ({
      ...emp,
      roles: roleMap.get(emp.ecode) || [],
      activeProcessCount: processCountMap.get(emp.ecode) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: { employees: enrichedEmployees },
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LIST_EMPLOYEES_FAILED',
        message: 'Failed to retrieve employee directory.',
        details: [error.message],
      },
    });
  }
}

/**
 * Creates a new employee record, sets up identity, and assigns initial roles.
 */
export async function createEmployee(req, res) {
  try {
    const parseResult = createEmployeeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid employee creation data.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { ecode, name, email, password, role_codes } = parseResult.data;

    // Check duplicate ecode or email
    const duplicateCheck = await query(
      `SELECT ecode, email FROM dbo.Employees WHERE ecode = @ecode OR email = @email`,
      {
        ecode: { type: sql.VarChar(20), value: ecode },
        email: { type: sql.VarChar(150), value: email },
      }
    );

    if (duplicateCheck.recordset?.length > 0) {
      const match = duplicateCheck.recordset[0];
      const field = match.ecode === ecode ? 'Employee code' : 'Email address';
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          code: 'DUPLICATE_EMPLOYEE',
          message: `${field} is already registered in the platform.`,
          details: [],
        },
      });
    }

    // Role Category boundary check for initial role assignments
    let validatedRoles = [];
    if (role_codes && role_codes.length > 0) {
      const rolesQuery = await query(
        `SELECT role_id, role_code, role_category 
         FROM dbo.Roles 
         WHERE role_code IN (${role_codes.map((_, i) => `@r_${i}`).join(', ')}) AND is_active = 1`,
        role_codes.reduce((acc, code, i) => {
          acc[`r_${i}`] = { type: sql.VarChar(50), value: code };
          return acc;
        }, {})
      );
      validatedRoles = rolesQuery.recordset || [];

      const hasPlatformAdminPermission = authorizationService.hasPermission(
        req.user,
        'CORE.ROLE.ASSIGN_ADMIN'
      );

      for (const r of validatedRoles) {
        if (
          (r.role_category === 'PLATFORM_ADMIN' || r.role_category === 'MODULE_ADMIN') &&
          !hasPlatformAdminPermission
        ) {
          return res.status(403).json({
            success: false,
            data: null,
            error: {
              code: 'FORBIDDEN_ROLE_CATEGORY',
              message: `You do not have permission to assign administrative role: ${r.role_code}`,
              details: [],
            },
          });
        }
      }
    }

    // Hash initial password using native scrypt
    const passwordHash = await hashPassword(password);

    // Atomically create Employee, Identity, and Role mappings inside a transaction
    await executeTransaction(async (transaction) => {
      // 1. Insert Employee
      const empReq = new sql.Request(transaction);
      empReq.input('ecode', sql.VarChar(20), ecode);
      empReq.input('name', sql.NVarChar(100), name);
      empReq.input('email', sql.VarChar(150), email);
      await empReq.query(
        `INSERT INTO dbo.Employees (ecode, name, email, status)
         VALUES (@ecode, @name, @email, 'ACTIVE')`
      );

      // 2. Insert Identity
      const idReq = new sql.Request(transaction);
      idReq.input('ecode', sql.VarChar(20), ecode);
      idReq.input('password_hash', sql.VarChar(255), passwordHash);
      await idReq.query(
        `INSERT INTO dbo.Employee_Identities (ecode, password_hash, token_version)
         VALUES (@ecode, @password_hash, 1)`
      );

      // 3. Insert Initial Roles
      for (const role of validatedRoles) {
        const roleReq = new sql.Request(transaction);
        roleReq.input('ecode', sql.VarChar(20), ecode);
        roleReq.input('role_id', sql.Int, role.role_id);
        roleReq.input('assigned_by', sql.VarChar(20), req.user.ecode);
        await roleReq.query(
          `INSERT INTO dbo.Employee_Role_Mapping (ecode, role_id, assigned_by)
           VALUES (@ecode, @role_id, @assigned_by)`
        );
      }
    });

    // Emit Audit Event & Dispatch Welcome Notification
    await auditService.log({
      module_code: 'CORE',
      entity_type: 'EMPLOYEE',
      entity_id: ecode,
      action: 'CREATE_EMPLOYEE',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: null,
      updated_data: {
        ecode,
        name,
        email,
        status: 'ACTIVE',
        roles: validatedRoles.map((r) => r.role_code),
      },
      remarks: `Created employee profile for ${name} (${ecode}).`,
    });

    await notificationService.dispatch({
      recipient_ecode: ecode,
      sender_ecode: req.user.ecode,
      notification_type: 'INFO',
      entity_type: 'EMPLOYEE',
      entity_id: ecode,
      message: `Welcome to Detector Enterprise Platform. Your profile has been initialized with ${validatedRoles.length} assigned role(s).`,
      action_url: null,
    });

    return res.status(201).json({
      success: true,
      data: {
        employee: {
          ecode,
          name,
          email,
          status: 'ACTIVE',
          roles: validatedRoles.map((r) => ({
            role_id: r.role_id,
            role_code: r.role_code,
            role_category: r.role_category,
          })),
        },
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'CREATE_EMPLOYEE_FAILED',
        message: 'An internal error occurred while creating the employee.',
        details: [error.message],
      },
    });
  }
}

/**
 * Toggles employee active/inactive status with active process offboarding safeguard.
 */
export async function updateEmployeeStatus(req, res) {
  try {
    const { ecode } = req.params;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { status } = parseResult.data;

    // Self-deactivation safeguard
    if (req.user.ecode === ecode && status === 'INACTIVE') {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'CANNOT_DEACTIVATE_SELF',
          message: 'You cannot deactivate your own administrative account.',
          details: [],
        },
      });
    }

    // Verify employee exists
    const empCheck = await query(
      `SELECT ecode, name, email, status FROM dbo.Employees WHERE ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: ecode } }
    );
    const employee = empCheck.recordset?.[0];

    if (!employee) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'EMPLOYEE_NOT_FOUND',
          message: `Employee with code ${ecode} was not found.`,
          details: [],
        },
      });
    }

    let activeAssignments = [];

    // Offboarding Safeguard: Check active process assignments when deactivating
    if (status === 'INACTIVE') {
      const activeProcCheck = await query(
        `SELECT 
           po.ownership_id, po.registry_id, po.role_type,
           pr.process_code, pr.process_name, pr.status AS process_status
         FROM dbo.Process_Ownership po
         JOIN dbo.Process_Registry pr ON pr.registry_id = po.registry_id
         WHERE po.employee_ecode = @ecode 
           AND po.is_current = 1 
           AND pr.status IN ('ACTIVE', 'TRANSITION')`,
        { ecode: { type: sql.VarChar(20), value: ecode } }
      );
      activeAssignments = activeProcCheck.recordset || [];
    }

    // Execute status transition and session invalidation
    await executeTransaction(async (transaction) => {
      const updateReq = new sql.Request(transaction);
      updateReq.input('ecode', sql.VarChar(20), ecode);
      updateReq.input('status', sql.VarChar(20), status);
      await updateReq.query(
        `UPDATE dbo.Employees 
         SET status = @status, updated_at = SYSUTCDATETIME() 
         WHERE ecode = @ecode`
      );

      // Invalidate sessions immediately upon deactivation
      if (status === 'INACTIVE') {
        const idReq = new sql.Request(transaction);
        idReq.input('ecode', sql.VarChar(20), ecode);
        await idReq.query(
          `UPDATE dbo.Employee_Identities 
           SET token_version = token_version + 1 
           WHERE ecode = @ecode`
        );
      }
    });

    // Emit Audit Event & Dispatch Status Notification
    await auditService.log({
      module_code: 'CORE',
      entity_type: 'EMPLOYEE',
      entity_id: ecode,
      action: 'UPDATE_EMPLOYEE_STATUS',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: { status: employee.status },
      updated_data: { status },
      remarks:
        status === 'INACTIVE'
          ? `Employee account deactivated. Active process assignments count: ${activeAssignments.length}.`
          : 'Employee account reactivated.',
    });

    await notificationService.dispatch({
      recipient_ecode: ecode,
      sender_ecode: req.user.ecode,
      notification_type: status === 'INACTIVE' ? 'SECURITY' : 'INFO',
      entity_type: 'EMPLOYEE',
      entity_id: ecode,
      message:
        status === 'INACTIVE'
          ? `Your account status was set to INACTIVE by administrator ${req.user.ecode}. Active sessions have been revoked.`
          : `Your account status was reactivated by administrator ${req.user.ecode}.`,
      action_url: null,
    });

    return res.status(200).json({
      success: true,
      data: {
        ecode,
        status,
        sessionRevoked: status === 'INACTIVE',
        activeAssignmentsCount: activeAssignments.length,
        activeAssignments,
        message:
          status === 'INACTIVE' && activeAssignments.length > 0
            ? `Employee deactivated. Warning: ${activeAssignments.length} active process ownership assignment(s) require handover.`
            : `Employee status successfully set to ${status}.`,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'UPDATE_STATUS_FAILED',
        message: 'Failed to update employee status.',
        details: [error.message],
      },
    });
  }
}

/**
 * Assigns or revokes a role for an employee, strictly enforcing role category boundaries.
 */
export async function assignRole(req, res) {
  try {
    const parseResult = assignRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role assignment payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { ecode, role_code, action } = parseResult.data;

    // Verify employee exists
    const empCheck = await query(
      `SELECT ecode, status FROM dbo.Employees WHERE ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: ecode } }
    );
    if (!empCheck.recordset?.[0]) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'EMPLOYEE_NOT_FOUND',
          message: `Employee ${ecode} not found.`,
          details: [],
        },
      });
    }

    // Verify target role exists
    const roleCheck = await query(
      `SELECT role_id, role_code, role_name, role_category 
       FROM dbo.Roles 
       WHERE role_code = @roleCode AND is_active = 1`,
      { roleCode: { type: sql.VarChar(50), value: role_code } }
    );
    const role = roleCheck.recordset?.[0];
    if (!role) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: `Role ${role_code} does not exist or is inactive.`,
          details: [],
        },
      });
    }

    // Enforce Category Boundaries:
    // Administrative roles (PLATFORM_ADMIN, MODULE_ADMIN) require CORE.ROLE.ASSIGN_ADMIN
    const hasPlatformAdminPermission = authorizationService.hasPermission(
      req.user,
      'CORE.ROLE.ASSIGN_ADMIN'
    );

    if (
      (role.role_category === 'PLATFORM_ADMIN' || role.role_category === 'MODULE_ADMIN') &&
      !hasPlatformAdminPermission
    ) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN_ROLE_CATEGORY',
          message:
            'Access denied. Only platform administrators can assign or revoke administrative roles.',
          details: [],
        },
      });
    }

    // Safeguard against removing the last active SUPER_ADMIN
    if (role_code === 'SUPER_ADMIN' && action === 'REVOKE') {
      const adminCountResult = await query(
        `SELECT COUNT(*) AS count
         FROM dbo.Employee_Role_Mapping erm
         JOIN dbo.Employees e ON e.ecode = erm.ecode
         JOIN dbo.Roles r ON r.role_id = erm.role_id
         WHERE r.role_code = 'SUPER_ADMIN' AND e.status = 'ACTIVE'`
      );
      const activeSuperAdmins = adminCountResult.recordset?.[0]?.count || 0;
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'CANNOT_REMOVE_LAST_ADMIN',
            message: 'Cannot revoke SUPER_ADMIN role from the last active platform administrator.',
            details: [],
          },
        });
      }
    }

    // Execute Assignment or Revocation
    if (action === 'ASSIGN') {
      await query(
        `IF NOT EXISTS (
           SELECT 1 FROM dbo.Employee_Role_Mapping 
           WHERE ecode = @ecode AND role_id = @roleId
         )
         BEGIN
           INSERT INTO dbo.Employee_Role_Mapping (ecode, role_id, assigned_by)
           VALUES (@ecode, @roleId, @assignedBy)
         END`,
        {
          ecode: { type: sql.VarChar(20), value: ecode },
          roleId: { type: sql.Int, value: role.role_id },
          assignedBy: { type: sql.VarChar(20), value: req.user.ecode },
        }
      );
    } else {
      await query(
        `DELETE FROM dbo.Employee_Role_Mapping 
         WHERE ecode = @ecode AND role_id = @roleId`,
        {
          ecode: { type: sql.VarChar(20), value: ecode },
          roleId: { type: sql.Int, value: role.role_id },
        }
      );
    }

    // Invalidate target employee's session so permissions refresh immediately
    await query(
      `UPDATE dbo.Employee_Identities 
       SET token_version = token_version + 1 
       WHERE ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: ecode } }
    );

    // Fetch updated roles list
    const updatedRolesResult = await query(
      `SELECT r.role_id, r.role_code, r.role_name, r.role_category
       FROM dbo.Employee_Role_Mapping erm
       JOIN dbo.Roles r ON r.role_id = erm.role_id
       WHERE erm.ecode = @ecode AND r.is_active = 1`,
      { ecode: { type: sql.VarChar(20), value: ecode } }
    );

    // Emit Audit Event & Dispatch Role Notification
    await auditService.log({
      module_code: 'CORE',
      entity_type: 'EMPLOYEE_ROLE',
      entity_id: ecode,
      action: action === 'ASSIGN' ? 'ASSIGN_ROLE' : 'REVOKE_ROLE',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: null,
      updated_data: { ecode, role_code, action },
      remarks: `${action === 'ASSIGN' ? 'Assigned' : 'Revoked'} role ${role_code} ${
        action === 'ASSIGN' ? 'to' : 'from'
      } ${ecode}.`,
    });

    await notificationService.dispatch({
      recipient_ecode: ecode,
      sender_ecode: req.user.ecode,
      notification_type: 'STATUS_CHANGE',
      entity_type: 'ROLE',
      entity_id: role_code,
      message: `Role ${role_code} was ${
        action === 'ASSIGN' ? 'assigned to' : 'revoked from'
      } your account by administrator ${req.user.ecode}.`,
      action_url: null,
    });

    return res.status(200).json({
      success: true,
      data: {
        ecode,
        action,
        role_code,
        roles: updatedRolesResult.recordset || [],
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'ASSIGN_ROLE_FAILED',
        message: 'Failed to assign or revoke employee role.',
        details: [error.message],
      },
    });
  }
}
