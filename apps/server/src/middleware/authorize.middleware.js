import { authorizationService } from '../services/authorization.service.js';

/**
 * Middleware that intercepts the X-UI-Context-Role header.
 * If user has CORE.CONTEXT.SWITCH, simulates the requested role by scoping effective permissions.
 */
export async function contextSwitchMiddleware(req, _res, next) {
  try {
    const contextRole = req.headers['x-ui-context-role'];
    if (contextRole && req.user) {
      const switchResult = await authorizationService.applyContextSwitch(
        req.user,
        contextRole
      );
      if (switchResult.actingContext) {
        req.user.acting_context = switchResult.actingContext;
        req.user.active_role = switchResult.activeRole;
        req.user.permissions = switchResult.permissions;
      }
    }
    next();
  } catch (error) {
    console.error('Error applying context switch:', error);
    next();
  }
}

/**
 * Enforces that the authenticated user possesses a specific permission code.
 * @param {string} permissionCode
 */
export function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before authorization verification.',
          details: [],
        },
      });
    }

    const hasPermission = authorizationService.hasPermission(
      req.user,
      permissionCode
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Operation requires permission: ${permissionCode}`,
          details: [],
        },
      });
    }

    next();
  };
}

/**
 * Enforces that the authenticated user possesses at least one of the provided permission codes.
 * @param {string[]} permissionCodes
 */
export function requireAnyPermission(permissionCodes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before authorization verification.',
          details: [],
        },
      });
    }

    const hasAny = authorizationService.hasAnyPermission(req.user, permissionCodes);

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Operation requires one of: ${permissionCodes.join(', ')}`,
          details: [],
        },
      });
    }

    next();
  };
}

/**
 * Enforces custom ABAC resource-level evaluation logic.
 * @param {(req: import('express').Request) => Promise<boolean> | boolean} scopeEvaluator
 */
export function requireScope(scopeEvaluator) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
            details: [],
          },
        });
      }

      const isAllowed = await scopeEvaluator(req);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN_SCOPE',
            message: 'Access denied. You do not hold ownership access for this resource scope.',
            details: [],
          },
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'SCOPE_EVALUATION_ERROR',
          message: 'An error occurred during resource scope authorization check.',
          details: [err.message],
        },
      });
    }
  };
}
