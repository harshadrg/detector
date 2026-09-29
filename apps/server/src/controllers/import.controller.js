import { importService } from '../services/import.service.js';

export async function stageExcelUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'FILE_REQUIRED',
          message: 'An Excel spreadsheet file (.xlsx or .xls) is required.',
          details: [],
        },
      });
    }

    const uploadedBy = req.user.ecode;
    const fileName = req.file.originalname || 'upload.xlsx';

    const result = await importService.stageExcelUpload(
      req.file.buffer,
      fileName,
      uploadedBy
    );

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
        code: 'STAGE_EXCEL_FAILED',
        message: error.message || 'Failed to parse and stage spreadsheet.',
        details: [error.message],
      },
    });
  }
}

export async function listBatches(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const data = await importService.listBatches({ page, pageSize });

    return res.status(200).json({
      success: true,
      data: { batches: data.batches },
      meta: data.meta,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LIST_BATCHES_FAILED',
        message: 'Failed to retrieve import batches.',
        details: [error.message],
      },
    });
  }
}

export async function getBatchDetails(req, res) {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_BATCH_ID',
          message: 'Batch ID must be an integer.',
          details: [],
        },
      });
    }

    const batch = await importService.getBatchById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'BATCH_NOT_FOUND',
          message: `Import batch ${batchId} was not found.`,
          details: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: { batch },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'GET_BATCH_FAILED',
        message: 'Failed to retrieve batch details.',
        details: [error.message],
      },
    });
  }
}

export async function getStagedRows(req, res) {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_BATCH_ID',
          message: 'Batch ID must be an integer.',
          details: [],
        },
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const filter = (req.query.filter || 'ALL').toUpperCase();

    const data = await importService.getStagedRows(batchId, { page, pageSize, filter });

    return res.status(200).json({
      success: true,
      data: { rows: data.rows },
      meta: data.meta,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'GET_STAGED_ROWS_FAILED',
        message: 'Failed to retrieve staged rows.',
        details: [error.message],
      },
    });
  }
}

export async function commitBatch(req, res) {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_BATCH_ID',
          message: 'Batch ID must be an integer.',
          details: [],
        },
      });
    }

    const committedBy = req.user.ecode;
    const actingContext = req.user.acting_context || null;

    const result = await importService.commitBatch(batchId, committedBy, actingContext);

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'COMMIT_BATCH_FAILED',
        message: error.message || 'Failed to commit import batch.',
        details: [error.message],
      },
    });
  }
}
