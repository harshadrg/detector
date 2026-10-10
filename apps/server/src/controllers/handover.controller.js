import { handoverService } from '../services/handover.service.js';
import { requestHandoverSchema, reviewHandoverSchema } from '../schemas/handover.schema.js';
import { verifyPassword } from '../utils/crypto.js';
import { query, sql } from '../db/connection.js';

export async function requestHandover(req, res) {
  try {
    const registryId = parseInt(req.params.id, 10);
    if (isNaN(registryId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_REGISTRY_ID', message: 'Process ID must be an integer.', details: [] },
      });
    }

    const parseResult = requestHandoverSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid handover request payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }
    const data = parseResult.data;

    const actingContext = req.header('X-UI-Context-Role') || null;
    const result = await handoverService.requestHandover(req.user, registryId, data, actingContext);

    return res.status(201).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: error.code || 'REQUEST_HANDOVER_FAILED',
        message: error.message || 'Failed to request handover.',
        details: [error.message],
      },
    });
  }
}

export async function reviewHandover(req, res) {
  try {
    const handoverId = parseInt(req.params.handoverId, 10);
    if (isNaN(handoverId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_HANDOVER_ID', message: 'Handover Request ID must be an integer.', details: [] },
      });
    }

    const parseResult = reviewHandoverSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid handover review payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }
    const data = parseResult.data;

    const adminIdentity = await query(
      `SELECT password_hash FROM dbo.Employee_Identities WHERE ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: req.user.ecode } }
    );
    const storedHash = adminIdentity.recordset?.[0]?.password_hash;
    
    if (!storedHash) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Admin identity not found.', details: [] }
      });
    }

    const isValid = await verifyPassword(data.password, storedHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password. Review aborted.',
          details: [],
        },
      });
    }

    const actingContext = req.header('X-UI-Context-Role') || null;
    const result = await handoverService.reviewHandover(req.user, handoverId, data, actingContext);

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    return res.status(error.code === 'VALIDATION_ERROR' ? 400 : 500).json({
      success: false,
      data: null,
      error: {
        code: error.code || 'REVIEW_HANDOVER_FAILED',
        message: error.message || 'Failed to review handover request.',
        details: [error.message],
      },
    });
  }
}

export async function listPendingHandovers(req, res) {
  try {
    const handovers = await handoverService.listPendingHandovers();
    
    return res.status(200).json({
      success: true,
      data: { handovers },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LIST_HANDOVERS_FAILED',
        message: 'Failed to retrieve pending handovers.',
        details: [error.message],
      },
    });
  }
}

