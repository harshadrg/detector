import { changeRequestService } from '../services/change-request.service.js';
import { submitChangeRequestSchema } from '../schemas/change-request.schema.js';
import { verifyPassword } from '../utils/crypto.js';
import { query, sql } from '../db/connection.js';

export async function submitChangeRequest(req, res) {
  try {
    const registryId = parseInt(req.params.id, 10);
    if (isNaN(registryId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_REGISTRY_ID', message: 'Process ID must be an integer.', details: [] },
      });
    }

    const parseResult = submitChangeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid change request payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }
    const data = parseResult.data;

    const actingContext = req.header('X-UI-Context-Role') || null;
    const result = await changeRequestService.submitChangeRequest(req.user, registryId, data, actingContext);

    return res.status(201).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    const statusCode = error.code === 'CONCURRENCY_ERROR' ? 409 : (error.code === 'FORBIDDEN_SCOPE' ? 403 : 500);
    return res.status(statusCode).json({
      success: false,
      data: null,
      error: {
        code: error.code || 'SUBMIT_CR_FAILED',
        message: error.message || 'Failed to submit change request.',
        details: [error.message],
      },
    });
  }
}

export async function reviewChangeRequest(req, res) {
  try {
    const crId = parseInt(req.params.crId, 10);
    if (isNaN(crId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_CR_ID', message: 'Change Request ID must be an integer.', details: [] },
      });
    }

    const data = req.body;
    if (!data.action || !['APPROVE', 'REJECT'].includes(data.action)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'action must be APPROVE or REJECT.', details: [] },
      });
    }

    if (!data.password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'PASSWORD_REQUIRED', message: 'Password confirmation is required to approve or reject a change request.', details: [] },
      });
    }

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
    const result = await changeRequestService.reviewChangeRequest(req.user, crId, data, actingContext);

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    return res.status(error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'CONCURRENCY_ERROR' ? 409 : 500).json({
      success: false,
      data: null,
      error: {
        code: error.code || 'REVIEW_CR_FAILED',
        message: error.message || 'Failed to review change request.',
        details: [error.message],
      },
    });
  }
}

export async function listPendingReviews(req, res) {
  try {
    const reviews = await changeRequestService.listPendingReviews(req.user);
    
    return res.status(200).json({
      success: true,
      data: { reviews },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LIST_REVIEWS_FAILED',
        message: 'Failed to retrieve pending reviews.',
        details: [error.message],
      },
    });
  }
}

