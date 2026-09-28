import { Router } from 'express';
import { login, logout, getMe, getContextRoles } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Public Authentication
router.post('/login', login);

// Authenticated Session Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, contextSwitchMiddleware, getMe);

// UI Context Switching Roles (Requires CORE.CONTEXT.SWITCH)
router.get(
  '/context-roles',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('CORE.CONTEXT.SWITCH'),
  getContextRoles
);

export default router;
