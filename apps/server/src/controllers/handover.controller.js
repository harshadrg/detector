import { handoverService } from '../services/handover.service.js';

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

    const data = req.body;
    if (!data.to_pm_ecode || !data.scenario || !data.effective_date || !data.reason) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'to_pm_ecode, scenario, effective_date, and reason are required.', details: [] },
      });
    }

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

    const data = req.body;
    if (!data.action || !['APPROVE', 'REJECT'].includes(data.action)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'action must be APPROVE or REJECT.', details: [] },
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
