import { Router } from 'express';
import { assignRole } from '../controllers/employee.controller.js';
import { authorizationService } from '../services/authorization.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requireAnyPermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Retrieve all system roles for role assignment governance
router.get(
  '/roles',
  authenticate,
  contextSwitchMiddleware,
  requireAnyPermission(['CORE.ROLE.ASSIGN_ADMIN', 'CORE.ROLE.ASSIGN_ORG']),
  async (_req, res) => {
    try {
      const roles = await authorizationService.getSimulatableRoles();
      return res.status(200).json({
        success: true,
        data: { roles },
        error: null,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'FETCH_ROLES_FAILED',
          message: 'Failed to retrieve platform roles.',
          details: [err.message],
        },
      });
    }
  }
);

// Role Assignment & Revocation with strict category boundary checks
router.post(
  '/assign-role',
  authenticate,
  contextSwitchMiddleware,
  requireAnyPermission(['CORE.ROLE.ASSIGN_ADMIN', 'CORE.ROLE.ASSIGN_ORG']),
  assignRole
);

export default router;
