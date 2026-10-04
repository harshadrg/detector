import { processService } from '../services/process.service.js';

import { listProcessesQuerySchema, createProcessSchema } from '../schemas/process.schema.js';

export async function listProcesses(req, res) {
  try {
    const parseResult = listProcessesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { page, pageSize, search, vertical_id, sbu_id, status, client_type, sortField, sortDirection } = parseResult.data;

    const result = await processService.listProcesses(req.user, {
      page,
      pageSize,
      search,
      vertical_id,
      sbu_id,
      status,
      client_type,
      sortField,
      sortDirection,
    });

    return res.status(200).json({
      success: true,
      data: { processes: result.processes },
      meta: result.meta,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LIST_PROCESSES_FAILED',
        message: 'Failed to retrieve processes from registry.',
        details: [error.message],
      },
    });
  }
}

export async function getProcessById(req, res) {
  try {
    const registryId = parseInt(req.params.id, 10);
    if (isNaN(registryId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_REGISTRY_ID',
          message: 'Process ID must be an integer.',
          details: [],
        },
      });
    }

    const process = await processService.getProcessById(req.user, registryId);
    if (!process) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message: `Process with ID ${registryId} was not found or access is unauthorized.`,
          details: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: { process },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'GET_PROCESS_FAILED',
        message: 'Failed to retrieve process details.',
        details: [error.message],
      },
    });
  }
}

export async function createProcess(req, res) {
  try {
    const parseResult = createProcessSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid process creation payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const {
      vertical_id,
      sbu_id,
      wps_code,
      process_name,
      client_id,
      client_type,
      location_id,
      status,
      status_reason,
      started_on,
      ended_on,
      ops_head_ecode,
      cbo_ecode,
      sbu_head_ecode,
      account_head_ecode,
      pm_ecode,
    } = parseResult.data;

    const actingContext = req.user.acting_context || null;

    const newProcess = await processService.createProcess(
      req.user,
      {
        vertical_id: parseInt(vertical_id, 10),
        sbu_id: sbu_id ? parseInt(sbu_id, 10) : null,
        wps_code,
        process_name,
        client_id: client_id ? parseInt(client_id, 10) : null,
        client_type,
        location_id: location_id ? parseInt(location_id, 10) : null,
        status: status || 'TRANSITION',
        status_reason,
        started_on,
        ended_on,
        ops_head_ecode,
        cbo_ecode,
        sbu_head_ecode,
        account_head_ecode,
        pm_ecode,
      },
      actingContext
    );

    return res.status(201).json({
      success: true,
      data: { process: newProcess },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'CREATE_PROCESS_FAILED',
        message: error.message || 'Failed to create process in registry.',
        details: [error.message],
      },
    });
  }
}

export async function getOwnershipHistory(req, res) {
  try {
    const registryId = parseInt(req.params.id, 10);
    if (isNaN(registryId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_REGISTRY_ID',
          message: 'Process ID must be an integer.',
          details: [],
        },
      });
    }

    // First ensure they have access to the process (auth scope checked in getProcessById)
    const process = await processService.getProcessById(req.user, registryId);
    if (!process) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message: `Process with ID ${registryId} was not found or access is unauthorized.`,
          details: [],
        },
      });
    }

    const history = await processService.getOwnershipHistory(req.user, registryId);

    return res.status(200).json({
      success: true,
      data: { history },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'GET_OWNERSHIP_HISTORY_FAILED',
        message: 'Failed to retrieve process ownership history.',
        details: [error.message],
      },
    });
  }
}


