import express from 'express';
import {
  reviewHandover,
  listPendingHandovers
} from '../controllers/handover.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  requirePermission,
  contextSwitchMiddleware,
} from '../middleware/authorize.middleware.js';

const router = express.Router();

// List pending handover requests for review queue
router.get(
  '/reviews',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.HANDOVER.APPROVE'),
  listPendingHandovers
);

// Approve or reject a specific handover request
router.post(
  '/:handoverId/review',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.HANDOVER.APPROVE'),
  reviewHandover
);

export default router;
