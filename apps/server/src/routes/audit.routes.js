import { Router } from 'express';
import { getAuditEvents } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requireAnyPermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Platform Immutable Audit Ledger inspection
router.get(
  '/',
  authenticate,
  contextSwitchMiddleware,
  requireAnyPermission(['CORE.AUDIT.VIEW_GLOBAL', 'BPMS.AUDIT.VIEW']),
  getAuditEvents
);

export default router;
