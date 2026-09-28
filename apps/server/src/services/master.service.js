import { query, sql } from '../db/connection.js';

class MasterService {
  constructor() {
    this.cache = null;
    this.cacheExpiry = 0;
    this.TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
  }

  invalidateCache() {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Retrieves all active master data entities bundled for client dropdown lookups.
   * Serviced from an in-memory TTL cache with automatic invalidation on mutations.
   *
   * @returns {Promise<{ verticals: any[], sbus: any[], clients: any[], locations: any[] }>}
   */
  async getAllMasters() {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    const [vertResult, sbuResult, clientResult, locResult] = await Promise.all([
      query(`
        SELECT vertical_id, vertical_code, vertical_name, is_active
        FROM dbo.Verticals
        WHERE is_active = 1
        ORDER BY vertical_name ASC
      `),
      query(`
        SELECT s.sbu_id, s.sbu_code, s.sbu_name, s.vertical_id, v.vertical_code, v.vertical_name, s.is_active
        FROM dbo.SBUs s
        JOIN dbo.Verticals v ON v.vertical_id = s.vertical_id
        WHERE s.is_active = 1 AND v.is_active = 1
        ORDER BY s.sbu_name ASC
      `),
      query(`
        SELECT client_id, client_name, client_type, is_active
        FROM dbo.Clients
        WHERE is_active = 1
        ORDER BY client_name ASC
      `),
      query(`
        SELECT location_id, state, city, facility_name
        FROM dbo.Locations
        ORDER BY state ASC, city ASC, facility_name ASC
      `),
    ]);

    const data = {
      verticals: vertResult.recordset || [],
      sbus: sbuResult.recordset || [],
      clients: clientResult.recordset || [],
      locations: locResult.recordset || [],
    };

    this.cache = data;
    this.cacheExpiry = now + this.TTL_MS;

    return data;
  }

  // ==========================================
  // Verticals CRUD
  // ==========================================

  async listVerticals({ activeOnly = false, search = '' } = {}) {
    const whereClauses = [];
    const params = {};

    if (activeOnly) {
      whereClauses.push('v.is_active = 1');
    }

    if (search && search.trim().length > 0) {
      whereClauses.push('(v.vertical_code LIKE @search OR v.vertical_name LIKE @search)');
      params.search = { type: sql.NVarChar(100), value: `%${search.trim()}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        v.vertical_id,
        v.vertical_code,
        v.vertical_name,
        v.is_active,
        COUNT(s.sbu_id) AS sbu_count
      FROM dbo.Verticals v
      LEFT JOIN dbo.SBUs s ON s.vertical_id = v.vertical_id
      ${whereSql}
      GROUP BY v.vertical_id, v.vertical_code, v.vertical_name, v.is_active
      ORDER BY v.vertical_name ASC
    `;

    const result = await query(sqlQuery, params);
    return result.recordset || [];
  }

  async getVerticalById(id) {
    const result = await query(
      `SELECT vertical_id, vertical_code, vertical_name, is_active FROM dbo.Verticals WHERE vertical_id = @id`,
      { id: { type: sql.Int, value: id } }
    );
    return result.recordset?.[0] || null;
  }

  async createVertical({ vertical_code, vertical_name }) {
    const code = vertical_code.trim().toUpperCase();
    const name = vertical_name.trim();

    // Check duplicate
    const check = await query(
      `SELECT vertical_id FROM dbo.Verticals WHERE vertical_code = @code`,
      { code: { type: sql.VarChar(50), value: code } }
    );
    if (check.recordset?.[0]) {
      throw new Error(`Vertical with code '${code}' already exists.`);
    }

    const insertResult = await query(
      `INSERT INTO dbo.Verticals (vertical_code, vertical_name, is_active)
       OUTPUT INSERTED.vertical_id, INSERTED.vertical_code, INSERTED.vertical_name, INSERTED.is_active
       VALUES (@code, @name, 1)`,
      {
        code: { type: sql.VarChar(50), value: code },
        name: { type: sql.NVarChar(100), value: name },
      }
    );

    this.invalidateCache();
    return insertResult.recordset?.[0];
  }

  async updateVertical(id, { vertical_name, is_active }) {
    const existing = await this.getVerticalById(id);
    if (!existing) {
      throw new Error(`Vertical with ID ${id} was not found.`);
    }

    const name = vertical_name !== undefined ? vertical_name.trim() : existing.vertical_name;
    const active = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    await query(
      `UPDATE dbo.Verticals
       SET vertical_name = @name, is_active = @active
       WHERE vertical_id = @id`,
      {
        id: { type: sql.Int, value: id },
        name: { type: sql.NVarChar(100), value: name },
        active: { type: sql.Bit, value: active },
      }
    );

    this.invalidateCache();
    return { ...existing, vertical_name: name, is_active: active === 1 };
  }

  // ==========================================
  // SBUs CRUD
  // ==========================================

  async listSBUs({ vertical_id = null, activeOnly = false, search = '' } = {}) {
    const whereClauses = [];
    const params = {};

    if (activeOnly) {
      whereClauses.push('s.is_active = 1');
    }

    if (vertical_id) {
      whereClauses.push('s.vertical_id = @vertical_id');
      params.vertical_id = { type: sql.Int, value: Number(vertical_id) };
    }

    if (search && search.trim().length > 0) {
      whereClauses.push(
        '(s.sbu_code LIKE @search OR s.sbu_name LIKE @search OR v.vertical_name LIKE @search)'
      );
      params.search = { type: sql.NVarChar(100), value: `%${search.trim()}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        s.sbu_id,
        s.sbu_code,
        s.sbu_name,
        s.vertical_id,
        v.vertical_code,
        v.vertical_name,
        s.is_active
      FROM dbo.SBUs s
      JOIN dbo.Verticals v ON v.vertical_id = s.vertical_id
      ${whereSql}
      ORDER BY s.sbu_name ASC
    `;

    const result = await query(sqlQuery, params);
    return result.recordset || [];
  }

  async getSBUById(id) {
    const result = await query(
      `SELECT s.sbu_id, s.sbu_code, s.sbu_name, s.vertical_id, v.vertical_code, v.vertical_name, s.is_active
       FROM dbo.SBUs s
       JOIN dbo.Verticals v ON v.vertical_id = s.vertical_id
       WHERE s.sbu_id = @id`,
      { id: { type: sql.Int, value: id } }
    );
    return result.recordset?.[0] || null;
  }

  async createSBU({ sbu_code, sbu_name, vertical_id }) {
    const code = sbu_code.trim().toUpperCase();
    const name = sbu_name.trim();

    // Verify Vertical
    const vert = await this.getVerticalById(vertical_id);
    if (!vert) {
      throw new Error(`Vertical with ID ${vertical_id} does not exist.`);
    }

    // Check duplicate code
    const check = await query(`SELECT sbu_id FROM dbo.SBUs WHERE sbu_code = @code`, {
      code: { type: sql.VarChar(50), value: code },
    });
    if (check.recordset?.[0]) {
      throw new Error(`SBU with code '${code}' already exists.`);
    }

    const insertResult = await query(
      `INSERT INTO dbo.SBUs (sbu_code, sbu_name, vertical_id, is_active)
       OUTPUT INSERTED.sbu_id, INSERTED.sbu_code, INSERTED.sbu_name, INSERTED.vertical_id, INSERTED.is_active
       VALUES (@code, @name, @vertical_id, 1)`,
      {
        code: { type: sql.VarChar(50), value: code },
        name: { type: sql.NVarChar(100), value: name },
        vertical_id: { type: sql.Int, value: Number(vertical_id) },
      }
    );

    this.invalidateCache();
    return {
      ...insertResult.recordset?.[0],
      vertical_code: vert.vertical_code,
      vertical_name: vert.vertical_name,
    };
  }

  async updateSBU(id, { sbu_name, vertical_id, is_active }) {
    const existing = await this.getSBUById(id);
    if (!existing) {
      throw new Error(`SBU with ID ${id} was not found.`);
    }

    let targetVerticalId = existing.vertical_id;
    if (vertical_id !== undefined) {
      const vert = await this.getVerticalById(vertical_id);
      if (!vert) {
        throw new Error(`Vertical with ID ${vertical_id} does not exist.`);
      }
      targetVerticalId = Number(vertical_id);
    }

    const name = sbu_name !== undefined ? sbu_name.trim() : existing.sbu_name;
    const active = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    await query(
      `UPDATE dbo.SBUs
       SET sbu_name = @name, vertical_id = @vertical_id, is_active = @active
       WHERE sbu_id = @id`,
      {
        id: { type: sql.Int, value: id },
        name: { type: sql.NVarChar(100), value: name },
        vertical_id: { type: sql.Int, value: targetVerticalId },
        active: { type: sql.Bit, value: active },
      }
    );

    this.invalidateCache();
    return this.getSBUById(id);
  }

  // ==========================================
  // Clients CRUD
  // ==========================================

  async listClients({ client_type = null, activeOnly = false, search = '' } = {}) {
    const whereClauses = [];
    const params = {};

    if (activeOnly) {
      whereClauses.push('c.is_active = 1');
    }

    if (client_type && client_type !== 'ALL') {
      whereClauses.push('c.client_type = @client_type');
      params.client_type = { type: sql.VarChar(30), value: client_type.toUpperCase() };
    }

    if (search && search.trim().length > 0) {
      whereClauses.push('c.client_name LIKE @search');
      params.search = { type: sql.NVarChar(150), value: `%${search.trim()}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT client_id, client_name, client_type, is_active
      FROM dbo.Clients c
      ${whereSql}
      ORDER BY c.client_name ASC
    `;

    const result = await query(sqlQuery, params);
    return result.recordset || [];
  }

  async getClientById(id) {
    const result = await query(
      `SELECT client_id, client_name, client_type, is_active FROM dbo.Clients WHERE client_id = @id`,
      { id: { type: sql.Int, value: id } }
    );
    return result.recordset?.[0] || null;
  }

  async createClient({ client_name, client_type }) {
    const name = client_name.trim();
    const type = client_type.trim().toUpperCase();

    if (!['DOMESTIC', 'INTERNATIONAL'].includes(type)) {
      throw new Error("Client type must be either 'DOMESTIC' or 'INTERNATIONAL'.");
    }

    // Check duplicate
    const check = await query(`SELECT client_id FROM dbo.Clients WHERE client_name = @name`, {
      name: { type: sql.NVarChar(150), value: name },
    });
    if (check.recordset?.[0]) {
      throw new Error(`Client with name '${name}' already exists.`);
    }

    const insertResult = await query(
      `INSERT INTO dbo.Clients (client_name, client_type, is_active)
       OUTPUT INSERTED.client_id, INSERTED.client_name, INSERTED.client_type, INSERTED.is_active
       VALUES (@name, @type, 1)`,
      {
        name: { type: sql.NVarChar(150), value: name },
        type: { type: sql.VarChar(30), value: type },
      }
    );

    this.invalidateCache();
    return insertResult.recordset?.[0];
  }

  async updateClient(id, { client_name, client_type, is_active }) {
    const existing = await this.getClientById(id);
    if (!existing) {
      throw new Error(`Client with ID ${id} was not found.`);
    }

    const name = client_name !== undefined ? client_name.trim() : existing.client_name;
    let type = existing.client_type;
    if (client_type !== undefined) {
      type = client_type.trim().toUpperCase();
      if (!['DOMESTIC', 'INTERNATIONAL'].includes(type)) {
        throw new Error("Client type must be either 'DOMESTIC' or 'INTERNATIONAL'.");
      }
    }
    const active = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    await query(
      `UPDATE dbo.Clients
       SET client_name = @name, client_type = @type, is_active = @active
       WHERE client_id = @id`,
      {
        id: { type: sql.Int, value: id },
        name: { type: sql.NVarChar(150), value: name },
        type: { type: sql.VarChar(30), value: type },
        active: { type: sql.Bit, value: active },
      }
    );

    this.invalidateCache();
    return { ...existing, client_name: name, client_type: type, is_active: active === 1 };
  }

  // ==========================================
  // Locations CRUD
  // ==========================================

  async listLocations({ state = '', city = '', search = '' } = {}) {
    const whereClauses = [];
    const params = {};

    if (state && state.trim().length > 0) {
      whereClauses.push('l.state = @state');
      params.state = { type: sql.NVarChar(100), value: state.trim() };
    }

    if (city && city.trim().length > 0) {
      whereClauses.push('l.city = @city');
      params.city = { type: sql.NVarChar(100), value: city.trim() };
    }

    if (search && search.trim().length > 0) {
      whereClauses.push('(l.facility_name LIKE @search OR l.city LIKE @search OR l.state LIKE @search)');
      params.search = { type: sql.NVarChar(150), value: `%${search.trim()}%` };
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT location_id, state, city, facility_name
      FROM dbo.Locations l
      ${whereSql}
      ORDER BY l.state ASC, l.city ASC, l.facility_name ASC
    `;

    const result = await query(sqlQuery, params);
    return result.recordset || [];
  }

  async getLocationById(id) {
    const result = await query(
      `SELECT location_id, state, city, facility_name FROM dbo.Locations WHERE location_id = @id`,
      { id: { type: sql.Int, value: id } }
    );
    return result.recordset?.[0] || null;
  }

  async createLocation({ state, city, facility_name }) {
    const st = state.trim();
    const ct = city.trim();
    const facility = facility_name.trim();

    // Check duplicate composite key
    const check = await query(
      `SELECT location_id FROM dbo.Locations WHERE state = @st AND city = @ct AND facility_name = @facility`,
      {
        st: { type: sql.NVarChar(100), value: st },
        ct: { type: sql.NVarChar(100), value: ct },
        facility: { type: sql.NVarChar(150), value: facility },
      }
    );
    if (check.recordset?.[0]) {
      throw new Error(`Location with facility '${facility}' in ${ct}, ${st} already exists.`);
    }

    const insertResult = await query(
      `INSERT INTO dbo.Locations (state, city, facility_name)
       OUTPUT INSERTED.location_id, INSERTED.state, INSERTED.city, INSERTED.facility_name
       VALUES (@st, @ct, @facility)`,
      {
        st: { type: sql.NVarChar(100), value: st },
        ct: { type: sql.NVarChar(100), value: ct },
        facility: { type: sql.NVarChar(150), value: facility },
      }
    );

    this.invalidateCache();
    return insertResult.recordset?.[0];
  }

  async updateLocation(id, { state, city, facility_name }) {
    const existing = await this.getLocationById(id);
    if (!existing) {
      throw new Error(`Location with ID ${id} was not found.`);
    }

    const st = state !== undefined ? state.trim() : existing.state;
    const ct = city !== undefined ? city.trim() : existing.city;
    const facility = facility_name !== undefined ? facility_name.trim() : existing.facility_name;

    await query(
      `UPDATE dbo.Locations
       SET state = @st, city = @ct, facility_name = @facility
       WHERE location_id = @id`,
      {
        id: { type: sql.Int, value: id },
        st: { type: sql.NVarChar(100), value: st },
        ct: { type: sql.NVarChar(100), value: ct },
        facility: { type: sql.NVarChar(150), value: facility },
      }
    );

    this.invalidateCache();
    return { location_id: id, state: st, city: ct, facility_name: facility };
  }
}

export const masterService = new MasterService();
export default masterService;
