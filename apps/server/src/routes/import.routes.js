import { Router } from 'express';
import multer from 'multer';
import {
  stageExcelUpload,
  listBatches,
  getBatchDetails,
  getStagedRows,
  commitBatch,
} from '../controllers/import.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  contextSwitchMiddleware,
  requirePermission,
  requireAnyPermission,
} from '../middleware/authorize.middleware.js';

const router = Router();

// Memory storage for multer (secure in-memory processing, zero file residue)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const isExcel =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.match(/\.(xlsx|xls)$/i);

    if (isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel spreadsheet files (.xlsx, .xls) are allowed.'), false);
    }
  },
});

// Stage uploaded Excel file for validation
router.post(
  '/stage',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.IMPORT.STAGE'),
  upload.single('file'),
  stageExcelUpload
);

// List import batches
router.get(
  '/batches',
  authenticate,
  contextSwitchMiddleware,
  requireAnyPermission(['BPMS.IMPORT.STAGE', 'BPMS.PROCESS.VIEW']),
  listBatches
);

// Get specific batch details
router.get(
  '/:batchId',
  authenticate,
  contextSwitchMiddleware,
  requireAnyPermission(['BPMS.IMPORT.STAGE', 'BPMS.PROCESS.VIEW']),
  getBatchDetails
);

// Get staged rows with pagination and filters
router.get(
  '/:batchId/rows',
  authenticate,
  contextSwitchMiddleware,
  requireAnyPermission(['BPMS.IMPORT.STAGE', 'BPMS.PROCESS.VIEW']),
  getStagedRows
);

// Atomically commit batch into live Process_Registry
router.post(
  '/:batchId/commit',
  authenticate,
  contextSwitchMiddleware,
  requirePermission('BPMS.IMPORT.COMMIT'),
  commitBatch
);

export default router;
