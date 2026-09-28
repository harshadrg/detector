import { Router } from 'express';
import {
  getAllMasters,
  listVerticals,
  createVertical,
  updateVertical,
  listSBUs,
  createSBU,
  updateSBU,
  listClients,
  createClient,
  updateClient,
  listLocations,
  createLocation,
  updateLocation,
} from '../controllers/master.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
  requireAnyPermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Middleware common to all master routes
router.use(authenticate);
router.use(contextSwitchMiddleware);

// Bundled master data lookup for client forms & filters
router.get(
  '/all',
  requireAnyPermission(['BPMS.MASTER.VIEW', 'BPMS.PROCESS.VIEW']),
  getAllMasters
);

// Verticals
router.get(
  '/verticals',
  requireAnyPermission(['BPMS.MASTER.VIEW', 'BPMS.PROCESS.VIEW']),
  listVerticals
);
router.post(
  '/verticals',
  requirePermission('BPMS.MASTER.MANAGE'),
  createVertical
);
router.patch(
  '/verticals/:id',
  requirePermission('BPMS.MASTER.MANAGE'),
  updateVertical
);

// SBUs
router.get(
  '/sbus',
  requireAnyPermission(['BPMS.MASTER.VIEW', 'BPMS.PROCESS.VIEW']),
  listSBUs
);
router.post(
  '/sbus',
  requirePermission('BPMS.MASTER.MANAGE'),
  createSBU
);
router.patch(
  '/sbus/:id',
  requirePermission('BPMS.MASTER.MANAGE'),
  updateSBU
);

// Clients
router.get(
  '/clients',
  requireAnyPermission(['BPMS.MASTER.VIEW', 'BPMS.PROCESS.VIEW']),
  listClients
);
router.post(
  '/clients',
  requirePermission('BPMS.MASTER.MANAGE'),
  createClient
);
router.patch(
  '/clients/:id',
  requirePermission('BPMS.MASTER.MANAGE'),
  updateClient
);

// Locations
router.get(
  '/locations',
  requireAnyPermission(['BPMS.MASTER.VIEW', 'BPMS.PROCESS.VIEW']),
  listLocations
);
router.post(
  '/locations',
  requirePermission('BPMS.MASTER.MANAGE'),
  createLocation
);
router.patch(
  '/locations/:id',
  requirePermission('BPMS.MASTER.MANAGE'),
  updateLocation
);

export default router;
