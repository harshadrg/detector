import { Router } from 'express';
import {
  listProcesses,
  getProcessById,
  createProcess,
} from '../controllers/process.controller.js';
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

export default router;
