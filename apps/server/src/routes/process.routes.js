import { Router } from 'express';
import {
  listProcesses,
  getProcessById,
  createProcess,
  getOwnershipHistory,
} from '../controllers/process.controller.js';
import { submitChangeRequest } from '../controllers/change-request.controller.js';
import { requestHandover } from '../controllers/handover.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Server-side paginated, sorted, and filtered process registry (ABAC scoped)
router.get(
  '/',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.PROCESS.VIEW'),
  listProcesses
);

// Process detail by registry ID
router.get(
  '/:id',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.PROCESS.VIEW'),
  getProcessById
);

// Manual process registration
router.post(
  '/',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.PROCESS.CREATE'),
  createProcess
);

// Process ownership history timeline
router.get(
  '/:id/ownership-history',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.PROCESS.VIEW'),
  getOwnershipHistory
);

// Submit or Draft a change request for a specific process
router.post(
  '/:id/change-requests',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.CHANGE_REQUEST.DRAFT'), 
  submitChangeRequest
);

// Submit a handover request for a specific process
router.post(
  '/:id/handovers',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.HANDOVER.REQUEST'),
  requestHandover
);

export default router;
