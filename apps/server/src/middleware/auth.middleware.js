import { verifyAccessToken } from '../utils/token.js';
import { query, sql } from '../db/connection.js';

/**
 * Authentication & Session Verification Middleware.
 *
 * Enforces:
 * 1. Valid HttpOnly JWT session token or Authorization Bearer header.
 * 2. CSRF header matching on mutating requests.
 * 3. Immediate rejection of INACTIVE employee accounts (regardless of JWT expiry).
 * 4. Immediate rejection if token_version is incremented (logout / session invalidation).
 */
export async function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. No session token provided.',
          details: [],
        },
      });
    }

    // CSRF Protection on mutating requests (POST, PUT, PATCH, DELETE)
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method)) {
      const csrfHeader = req.headers['x-csrf-token'];
      const csrfCookie = req.cookies?.csrf_token;

      // Only enforce CSRF if cookies are in play (browser session)
      if (req.cookies?.access_token) {
        if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
          return res.status(403).json({
            success: false,
            data: null,
            error: {
              code: 'CSRF_INVALID',
              message: 'Invalid or missing CSRF token.',
              details: [],
            },
          });
        }
      }
    }

    // Verify JWT cryptographic signature
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: jwtErr.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
          message: 'Session token is expired or invalid. Please log in again.',
          details: [],
        },
      });
    }

    // Query active state and token_version from database
    const empResult = await query(
      `SELECT 
         e.ecode, e.name, e.email, e.status,
         ei.token_version
       FROM dbo.Employees e
       JOIN dbo.Employee_Identities ei ON ei.ecode = e.ecode
       WHERE e.ecode = @ecode`,
      { ecode: { type: sql.VarChar(20), value: decoded.ecode } }
    );

    const employee = empResult.recordset?.[0];

    if (!employee) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Employee record no longer exists.',
          details: [],
        },
      });
    }

    // Enforce Active Status Invariant (reject INACTIVE immediately)
    if (employee.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Employee account is deactivated. Access denied.',
          details: [],
        },
      });
    }

    // Enforce Token Version Invalidation (Logout / Session Revocation)
    if (employee.token_version !== decoded.token_version) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'SESSION_REVOKED',
          message: 'Session has been invalidated. Please log in again.',
          details: [],
        },
      });
    }

    // Fetch assigned active roles
    const rolesResult = await query(
      `SELECT r.role_code, r.role_name, r.role_category
       FROM dbo.Employee_Role_Mapping erm
       JOIN dbo.Roles r ON r.role_id = erm.role_id
       WHERE erm.ecode = @ecode AND r.is_active = 1`,
      { ecode: { type: sql.VarChar(20), value: decoded.ecode } }
    );

    // Fetch effective permissions across all assigned active roles
    const permResult = await query(
      `SELECT DISTINCT p.permission_code
       FROM dbo.Employee_Role_Mapping erm
       JOIN dbo.Role_Permissions rp ON rp.role_id = erm.role_id
       JOIN dbo.Permissions p ON p.permission_id = rp.permission_id
       JOIN dbo.Roles r ON r.role_id = erm.role_id
       WHERE erm.ecode = @ecode AND r.is_active = 1`,
      { ecode: { type: sql.VarChar(20), value: decoded.ecode } }
    );

    req.user = {
      ecode: employee.ecode,
      name: employee.name,
      email: employee.email,
      status: employee.status,
      roles: rolesResult.recordset || [],
      permissions: (permResult.recordset || []).map((row) => row.permission_code),
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'AUTH_INTERNAL_ERROR',
        message: 'An unexpected error occurred during authentication verification.',
        details: [error.message],
      },
    });
  }
}
