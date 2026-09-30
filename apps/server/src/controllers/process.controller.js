import { processService } from '../services/process.service.js';

export async function listProcesses(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 100);
    const search = req.query.search || '';
    const vertical_id = req.query.vertical_id || null;
    const sbu_id = req.query.sbu_id || null;
    const status = req.query.status || 'ALL';
    const client_type = req.query.client_type || null;
    const sortField = req.query.sortField || 'process_code';
    const sortDirection = req.query.sortDirection || 'ASC';

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
    } = req.body;

    if (!vertical_id) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VERTICAL_REQUIRED',
          message: 'Vertical ID is required to register a process.',
          details: [],
        },
      });
    }

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
