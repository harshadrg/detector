import { masterService } from '../services/master.service.js';
import { auditService } from '../services/audit.service.js';
import {
  createVerticalSchema,
  updateVerticalSchema,
  createSBUSchema,
  updateSBUSchema,
  createClientSchema,
  updateClientSchema,
  createLocationSchema,
  updateLocationSchema,
} from '../schemas/master.schema.js';

/**
 * Returns all active master data entities in a single bundle for dropdown lookups.
 */
export async function getAllMasters(_req, res) {
  try {
    const data = await masterService.getAllMasters();
    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'FETCH_MASTERS_FAILED',
        message: 'Failed to retrieve master data bundle.',
        details: [err.message],
      },
    });
  }
}

// ==========================================
// Verticals Handlers
// ==========================================

export async function listVerticals(req, res) {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const search = req.query.search || '';
    const verticals = await masterService.listVerticals({ activeOnly, search });

    return res.status(200).json({
      success: true,
      data: { verticals },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'FETCH_VERTICALS_FAILED',
        message: 'Failed to retrieve verticals.',
        details: [err.message],
      },
    });
  }
}

export async function createVertical(req, res) {
  try {
    const parseResult = createVerticalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid vertical payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const vertical = await masterService.createVertical(parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'VERTICAL',
      entity_id: String(vertical.vertical_id),
      action: 'CREATE_VERTICAL',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: null,
      updated_data: vertical,
      remarks: `Created vertical ${vertical.vertical_name} (${vertical.vertical_code}).`,
    });

    return res.status(201).json({
      success: true,
      data: { vertical },
      error: null,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'CREATE_VERTICAL_FAILED',
        message: err.message || 'Failed to create vertical.',
        details: [],
      },
    });
  }
}

export async function updateVertical(req, res) {
  try {
    const { id } = req.params;
    const parseResult = updateVerticalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid vertical update payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const existing = await masterService.getVerticalById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'VERTICAL_NOT_FOUND',
          message: `Vertical with ID ${id} not found.`,
          details: [],
        },
      });
    }

    const updated = await masterService.updateVertical(id, parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'VERTICAL',
      entity_id: String(id),
      action: 'UPDATE_VERTICAL',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: existing,
      updated_data: updated,
      remarks: `Updated vertical ${updated.vertical_name}.`,
    });

    return res.status(200).json({
      success: true,
      data: { vertical: updated },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'UPDATE_VERTICAL_FAILED',
        message: err.message || 'Failed to update vertical.',
        details: [],
      },
    });
  }
}

// ==========================================
// SBUs Handlers
// ==========================================

export async function listSBUs(req, res) {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const vertical_id = req.query.vertical_id || null;
    const search = req.query.search || '';
    const sbus = await masterService.listSBUs({ vertical_id, activeOnly, search });

    return res.status(200).json({
      success: true,
      data: { sbus },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'FETCH_SBUS_FAILED',
        message: 'Failed to retrieve SBUs.',
        details: [err.message],
      },
    });
  }
}

export async function createSBU(req, res) {
  try {
    const parseResult = createSBUSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid SBU payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const sbu = await masterService.createSBU(parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'SBU',
      entity_id: String(sbu.sbu_id),
      action: 'CREATE_SBU',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: null,
      updated_data: sbu,
      remarks: `Created SBU ${sbu.sbu_name} (${sbu.sbu_code}) under vertical ${sbu.vertical_code}.`,
    });

    return res.status(201).json({
      success: true,
      data: { sbu },
      error: null,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'CREATE_SBU_FAILED',
        message: err.message || 'Failed to create SBU.',
        details: [],
      },
    });
  }
}

export async function updateSBU(req, res) {
  try {
    const { id } = req.params;
    const parseResult = updateSBUSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid SBU update payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const existing = await masterService.getSBUById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'SBU_NOT_FOUND',
          message: `SBU with ID ${id} not found.`,
          details: [],
        },
      });
    }

    const updated = await masterService.updateSBU(id, parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'SBU',
      entity_id: String(id),
      action: 'UPDATE_SBU',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: existing,
      updated_data: updated,
      remarks: `Updated SBU ${updated.sbu_name}.`,
    });

    return res.status(200).json({
      success: true,
      data: { sbu: updated },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'UPDATE_SBU_FAILED',
        message: err.message || 'Failed to update SBU.',
        details: [],
      },
    });
  }
}

// ==========================================
// Clients Handlers
// ==========================================

export async function listClients(req, res) {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const client_type = req.query.client_type || null;
    const search = req.query.search || '';
    const clients = await masterService.listClients({ client_type, activeOnly, search });

    return res.status(200).json({
      success: true,
      data: { clients },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'FETCH_CLIENTS_FAILED',
        message: 'Failed to retrieve clients.',
        details: [err.message],
      },
    });
  }
}

export async function createClient(req, res) {
  try {
    const parseResult = createClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const client = await masterService.createClient(parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'CLIENT',
      entity_id: String(client.client_id),
      action: 'CREATE_CLIENT',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: null,
      updated_data: client,
      remarks: `Registered client ${client.client_name} (${client.client_type}).`,
    });

    return res.status(201).json({
      success: true,
      data: { client },
      error: null,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'CREATE_CLIENT_FAILED',
        message: err.message || 'Failed to create client.',
        details: [],
      },
    });
  }
}

export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const parseResult = updateClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client update payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const existing = await masterService.getClientById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: `Client with ID ${id} not found.`,
          details: [],
        },
      });
    }

    const updated = await masterService.updateClient(id, parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'CLIENT',
      entity_id: String(id),
      action: 'UPDATE_CLIENT',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: existing,
      updated_data: updated,
      remarks: `Updated client ${updated.client_name}.`,
    });

    return res.status(200).json({
      success: true,
      data: { client: updated },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'UPDATE_CLIENT_FAILED',
        message: err.message || 'Failed to update client.',
        details: [],
      },
    });
  }
}

// ==========================================
// Locations Handlers
// ==========================================

export async function listLocations(req, res) {
  try {
    const state = req.query.state || '';
    const city = req.query.city || '';
    const search = req.query.search || '';
    const locations = await masterService.listLocations({ state, city, search });

    return res.status(200).json({
      success: true,
      data: { locations },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'FETCH_LOCATIONS_FAILED',
        message: 'Failed to retrieve locations.',
        details: [err.message],
      },
    });
  }
}

export async function createLocation(req, res) {
  try {
    const parseResult = createLocationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid location payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const location = await masterService.createLocation(parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'LOCATION',
      entity_id: String(location.location_id),
      action: 'CREATE_LOCATION',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: null,
      updated_data: location,
      remarks: `Created facility location: ${location.facility_name}, ${location.city}, ${location.state}.`,
    });

    return res.status(201).json({
      success: true,
      data: { location },
      error: null,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'CREATE_LOCATION_FAILED',
        message: err.message || 'Failed to create location.',
        details: [],
      },
    });
  }
}

export async function updateLocation(req, res) {
  try {
    const { id } = req.params;
    const parseResult = updateLocationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid location update payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const existing = await masterService.getLocationById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: `Location with ID ${id} not found.`,
          details: [],
        },
      });
    }

    const updated = await masterService.updateLocation(id, parseResult.data);

    // Audit Event
    await auditService.log({
      module_code: 'BPMS',
      entity_type: 'LOCATION',
      entity_id: String(id),
      action: 'UPDATE_LOCATION',
      performed_by: req.user.ecode,
      acting_context: req.actingContext || null,
      previous_data: existing,
      updated_data: updated,
      remarks: `Updated facility location ${updated.facility_name}.`,
    });

    return res.status(200).json({
      success: true,
      data: { location: updated },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'UPDATE_LOCATION_FAILED',
        message: err.message || 'Failed to update location.',
        details: [],
      },
    });
  }
}
