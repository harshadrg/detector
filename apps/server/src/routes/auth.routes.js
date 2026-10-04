import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, getMe, getContextRoles } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later.',
      details: [],
    }
  }
});

// Public Authentication
router.post('/login', loginLimiter, login);

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

