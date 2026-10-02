import express from 'express';
import {
  reviewChangeRequest,
  listPendingReviews
} from '../controllers/change-request.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  requirePermission,
  contextSwitchMiddleware,
} from '../middleware/rbac.middleware.js';

const router = express.Router();

// List pending change requests for review queue
router.get(
  '/reviews',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.CHANGE_REQUEST.APPROVE'),
  listPendingReviews
);

// Approve or reject a specific change request
router.post(
  '/:crId/review',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.CHANGE_REQUEST.APPROVE'),
  reviewChangeRequest
);

export default router;
