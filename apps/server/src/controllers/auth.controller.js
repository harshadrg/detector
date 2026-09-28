import { query, sql } from '../db/connection.js';
import { verifyPassword, generateRandomToken } from '../utils/crypto.js';
import { generateAccessToken, cookieConfig } from '../utils/token.js';
import { loginSchema } from '../schemas/auth.schema.js';

export async function login(req, res) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login request payload.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { ecode, password } = parseResult.data;

    // Query employee credentials & status
    const empResult = await query(
      `SELECT 
         e.ecode, e.name, e.email, e.status,
         ei.password_hash, ei.token_version
       FROM dbo.Employees e
       JOIN dbo.Employee_Identities ei ON ei.ecode = e.ecode
       WHERE e.ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: ecode } }
    );

    const employee = empResult.recordset?.[0];

    // Generic error message to prevent account enumeration
    if (!employee) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid employee code or password.',
          details: [],
        },
      });
    }

    // Verify cryptographic scrypt password hash
    const isPasswordValid = await verifyPassword(password, employee.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid employee code or password.',
          details: [],
        },
      });
    }

    // Enforce Active Status Invariant
    if (employee.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Employee account is deactivated. Please contact your administrator.',
          details: [],
        },
      });
    }

    // Update last_login_at timestamp
    await query(
      `UPDATE dbo.Employee_Identities 
       SET last_login_at = SYSUTCDATETIME() 
       WHERE ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: employee.ecode } }
    );

    // Fetch assigned active roles
    const rolesResult = await query(
      `SELECT r.role_code, r.role_name, r.role_category
       FROM dbo.Employee_Role_Mapping erm
       JOIN dbo.Roles r ON r.role_id = erm.role_id
       WHERE erm.ecode = @ecode AND r.is_active = 1`,
      { ecode: { type: sql.VarChar(20), value: employee.ecode } }
    );

    // Fetch effective permissions across all assigned active roles
    const permResult = await query(
      `SELECT DISTINCT p.permission_code
       FROM dbo.Employee_Role_Mapping erm
       JOIN dbo.Role_Permissions rp ON rp.role_id = erm.role_id
       JOIN dbo.Permissions p ON p.permission_id = rp.permission_id
       JOIN dbo.Roles r ON r.role_id = erm.role_id
       WHERE erm.ecode = @ecode AND r.is_active = 1`,
      { ecode: { type: sql.VarChar(20), value: employee.ecode } }
    );

    const roles = rolesResult.recordset || [];
    const permissions = (permResult.recordset || []).map((row) => row.permission_code);

    // Generate JWT & CSRF tokens
    const accessToken = generateAccessToken({
      ecode: employee.ecode,
      token_version: employee.token_version,
    });
    const csrfToken = generateRandomToken(32);

    // Set secure cookies
    res.cookie('access_token', accessToken, cookieConfig.accessToken);
    res.cookie('csrf_token', csrfToken, cookieConfig.csrfToken);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          ecode: employee.ecode,
          name: employee.name,
          email: employee.email,
          roles,
          permissions,
        },
        csrfToken,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LOGIN_FAILED',
        message: 'An internal error occurred during authentication.',
        details: [error.message],
      },
    });
  }
}

export async function logout(req, res) {
  try {
    const ecode = req.user?.ecode;

    if (ecode) {
      // Invalidate current token_version in database
      await query(
        `UPDATE dbo.Employee_Identities 
         SET token_version = token_version + 1 
         WHERE ecode = @ecode`,
        { ecode: { type: sql.VarChar(20), value: ecode } }
      );
    }

    // Clear session cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('csrf_token', { path: '/' });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully.',
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'An internal error occurred during logout.',
        details: [error.message],
      },
    });
  }
}

export async function getMe(req, res) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'GET_ME_FAILED',
        message: 'Failed to retrieve current user session profile.',
        details: [error.message],
      },
    });
  }
}
