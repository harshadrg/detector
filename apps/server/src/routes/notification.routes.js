import { Router } from 'express';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Retrieve notifications feed
router.get(
  '/',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.NOTIFICATION.VIEW'),
  listNotifications
);

// Mark individual notification as read
router.patch(
  '/:id/read',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.NOTIFICATION.VIEW'),
  markNotificationRead
);

// Mark all notifications as read
router.post(
  '/mark-all-read',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.NOTIFICATION.VIEW'),
  markAllNotificationsRead
);

export default router;
