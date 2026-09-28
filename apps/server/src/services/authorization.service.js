import { query, sql } from '../db/connection.js';

/**
 * Core Platform Authorization & Capability Resolution Engine.
 * Evaluates RBAC permissions, ABAC ownership scopes, and row-level resource capabilities.
 */
class AuthorizationService {
  /**
   * Evaluates if a user possesses a specific permission code.
   * @param {{ permissions: string[] }} user
   * @param {string} permissionCode
   * @returns {boolean}
   */
  hasPermission(user, permissionCode) {
    if (!user || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(permissionCode);
  }

  /**
   * Evaluates if a user possesses at least one of the given permission codes.
   * @param {{ permissions: string[] }} user
   * @param {string[]} permissionCodes
   * @returns {boolean}
   */
  hasAnyPermission(user, permissionCodes) {
    if (!user || !Array.isArray(user.permissions)) return false;
    return permissionCodes.some((code) => user.permissions.includes(code));
  }

  /**
   * Determines the user's ABAC scope for a permission code.
   * Scopes order of precedence: GLOBAL > OWN_HIERARCHY > OWN_PROCESS > SELF.
   *
   * @param {{ roles: Array<{ role_code: string, role_category: string }> }} user
   * @param {string} permissionCode
   * @returns {'GLOBAL' | 'OWN_HIERARCHY' | 'OWN_PROCESS' | 'SELF' | 'NONE'}
   */
  resolveScope(user, permissionCode) {
    if (!user || !Array.isArray(user.roles)) return 'NONE';

    const roleCodes = user.roles.map((r) => r.role_code);

    if (roleCodes.includes('SUPER_ADMIN')) {
      return 'GLOBAL';
    }

    if (roleCodes.includes('BPMS_ADMIN') && permissionCode.startsWith('BPMS.')) {
      return 'GLOBAL';
    }

    if (permissionCode.startsWith('CORE.NOTIFICATION.')) {
      return 'SELF';
    }

    const hierarchyRoles = ['OPS_QUALITY_HEAD', 'CBO', 'SBU_HEAD', 'ACCOUNT_HEAD'];
    const hasHierarchyRole = roleCodes.some((r) => hierarchyRoles.includes(r));
    const hasPMRole = roleCodes.includes('PROJECT_MANAGER');

    if (permissionCode === 'BPMS.PROCESS.VIEW' || permissionCode === 'BPMS.AUDIT.VIEW') {
      if (hasHierarchyRole) return 'OWN_HIERARCHY';
      if (hasPMRole) return 'OWN_PROCESS';
    }

    if (
      permissionCode === 'BPMS.CHANGE_REQUEST.DRAFT' ||
      permissionCode === 'BPMS.CHANGE_REQUEST.SUBMIT'
    ) {
      if (hasPMRole) return 'OWN_PROCESS';
    }

    if (
      permissionCode === 'BPMS.HANDOVER.REQUEST' ||
      permissionCode === 'BPMS.PROCESS.DEACTIVATE_REQUEST'
    ) {
      if (roleCodes.includes('SBU_HEAD') || roleCodes.includes('ACCOUNT_HEAD')) {
        return 'OWN_HIERARCHY';
      }
      if (hasPMRole) return 'OWN_PROCESS';
    }

    return 'NONE';
  }

  /**
   * Computes granular row-level capabilities for a process record.
   * Returned array is consumed by React UI to render action triggers without role checks.
   *
   * @param {{ ecode: string, permissions: string[], roles: Array<{ role_code: string }> }} user
   * @param {{ registry_id: number, status: string, owners?: Array<{ role_type: string, employee_ecode: string }> }} process
   * @returns {string[]} Array of authorized capability tokens
   */
  resolveProcessCapabilities(user, process) {
    if (!user || !process) return [];

    const capabilities = [];
    const isPlatformAdmin = user.roles?.some((r) => r.role_code === 'SUPER_ADMIN');
    const isModuleAdmin = user.roles?.some((r) => r.role_code === 'BPMS_ADMIN');
    const isGlobal = isPlatformAdmin || isModuleAdmin;

    const owners = process.owners || [];
    const isPM = owners.some((o) => o.role_type === 'PM' && o.employee_ecode === user.ecode);
    const isHierarchyOwner = owners.some((o) => o.employee_ecode === user.ecode);
    const isAccountOrSbuHead = owners.some(
      (o) =>
        (o.role_type === 'ACCOUNT_HEAD' || o.role_type === 'SBU_HEAD') &&
        o.employee_ecode === user.ecode
    );

    // 1. View Capability
    if (this.hasPermission(user, 'BPMS.PROCESS.VIEW')) {
      if (isGlobal || isHierarchyOwner || isPM) {
        capabilities.push('BPMS.PROCESS.VIEW');
      }
    }

    // 2. Change Request Draft / Submit (Active or Transition processes)
    if (['ACTIVE', 'TRANSITION', 'DRAFT'].includes(process.status)) {
      if (this.hasPermission(user, 'BPMS.CHANGE_REQUEST.DRAFT')) {
        if (isGlobal || isPM) capabilities.push('BPMS.CHANGE_REQUEST.DRAFT');
      }
      if (this.hasPermission(user, 'BPMS.CHANGE_REQUEST.SUBMIT')) {
        if (isGlobal || isPM) capabilities.push('BPMS.CHANGE_REQUEST.SUBMIT');
      }
    }

    // 3. Change Request Approval / Rejection (Admin only)
    if (this.hasPermission(user, 'BPMS.CHANGE_REQUEST.APPROVE') && isGlobal) {
      capabilities.push('BPMS.CHANGE_REQUEST.APPROVE');
    }
    if (this.hasPermission(user, 'BPMS.CHANGE_REQUEST.REJECT') && isGlobal) {
      capabilities.push('BPMS.CHANGE_REQUEST.REJECT');
    }

    // 4. Handover Requests
    if (this.hasPermission(user, 'BPMS.HANDOVER.REQUEST')) {
      if (isGlobal || isPM || isAccountOrSbuHead) {
        capabilities.push('BPMS.HANDOVER.REQUEST');
      }
    }
    if (this.hasPermission(user, 'BPMS.HANDOVER.APPROVE') && isGlobal) {
      capabilities.push('BPMS.HANDOVER.APPROVE');
    }

    // 5. Deactivation Requests
    if (process.status !== 'INACTIVE' && process.status !== 'ARCHIVED') {
      if (this.hasPermission(user, 'BPMS.PROCESS.DEACTIVATE_REQUEST')) {
        if (isGlobal || isPM || isAccountOrSbuHead) {
          capabilities.push('BPMS.PROCESS.DEACTIVATE_REQUEST');
        }
      }
      if (this.hasPermission(user, 'BPMS.PROCESS.DEACTIVATE_APPROVE') && isGlobal) {
        capabilities.push('BPMS.PROCESS.DEACTIVATE_APPROVE');
      }
    }

    // 6. Audit Trail Viewing
    if (this.hasPermission(user, 'BPMS.AUDIT.VIEW')) {
      if (isGlobal || isHierarchyOwner || isPM) {
        capabilities.push('BPMS.AUDIT.VIEW');
      }
    }

    return capabilities;
  }

  /**
   * Applies Safe UI Context Switching if authorized.
   * Verifies the caller has CORE.CONTEXT.SWITCH permission before granting simulated view.
   *
   * @param {{ ecode: string, permissions: string[], roles: Array<{ role_code: string }> }} user
   * @param {string|null} requestedRoleCode
   * @returns {Promise<{ activeRole: string|null, permissions: string[], actingContext: string|null }>}
   */
  async applyContextSwitch(user, requestedRoleCode) {
    // If no context switch requested, preserve actual authenticated permissions
    if (!requestedRoleCode) {
      return {
        activeRole: null,
        actingContext: null,
        permissions: user.permissions,
      };
    }

    // Verify user has explicit permission to simulate other roles
    const canSwitch = this.hasPermission(user, 'CORE.CONTEXT.SWITCH');
    if (!canSwitch) {
      return {
        activeRole: null,
        actingContext: null,
        permissions: user.permissions,
      };
    }

    // Fetch permissions granted to the simulated role
    const rolePermResult = await query(
      `SELECT DISTINCT p.permission_code
       FROM dbo.Roles r
       JOIN dbo.Role_Permissions rp ON rp.role_id = r.role_id
       JOIN dbo.Permissions p ON p.permission_id = rp.permission_id
       WHERE r.role_code = @roleCode AND r.is_active = 1`,
      { roleCode: { type: sql.VarChar(50), value: requestedRoleCode } }
    );

    const simulatedRolePermissions = (rolePermResult.recordset || []).map(
      (r) => r.permission_code
    );

    // In simulated mode, always include CORE.CONTEXT.SWITCH so the user can switch back!
    if (!simulatedRolePermissions.includes('CORE.CONTEXT.SWITCH')) {
      simulatedRolePermissions.push('CORE.CONTEXT.SWITCH');
    }

    return {
      activeRole: requestedRoleCode,
      actingContext: requestedRoleCode,
      permissions: simulatedRolePermissions,
    };
  }

  /**
   * Returns list of active roles available for context simulation.
   * @returns {Promise<Array<{ role_code: string, role_name: string, role_category: string }>>}
   */
  async getSimulatableRoles() {
    const result = await query(
      `SELECT role_code, role_name, role_category
       FROM dbo.Roles
       WHERE is_active = 1
       ORDER BY role_category, role_name`
    );
    return result.recordset || [];
  }
}

export const authorizationService = new AuthorizationService();
export default authorizationService;
