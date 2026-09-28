import { Router } from 'express';
import {
  listEmployees,
  createEmployee,
  updateEmployeeStatus,
} from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Employee Directory Listing (Requires CORE.USER.VIEW)
router.get(
  '/',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.USER.VIEW'),
  listEmployees
);

// Employee Creation (Requires CORE.USER.MANAGE)
router.post(
  '/',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.USER.MANAGE'),
  createEmployee
);

// Status Toggling & Offboarding Guard (Requires CORE.USER.MANAGE)
router.patch(
  '/:ecode/status',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.USER.MANAGE'),
  updateEmployeeStatus
);

export default router;
