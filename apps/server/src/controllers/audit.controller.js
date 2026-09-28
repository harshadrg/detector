import { queryAuditSchema } from '../schemas/audit.schema.js';
import { auditService } from '../services/audit.service.js';
import { authorizationService } from '../services/authorization.service.js';

export async function getAuditEvents(req, res) {
  try {
    const parseResult = queryAuditSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid audit query parameters.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    // Determine module scope based on granular permissions
    const canViewGlobal = authorizationService.hasPermission(
      req.user,
      'CORE.AUDIT.VIEW_GLOBAL'
    );
    const canViewBpms = authorizationService.hasPermission(
      req.user,
      'BPMS.AUDIT.VIEW'
    );

    if (!canViewGlobal && !canViewBpms) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN_AUDIT_ACCESS',
          message: 'You lack permission to inspect platform audit ledgers.',
          details: [],
        },
      });
    }

    // If caller lacks global audit permission, restrict strictly to BPMS module records
    const allowedModules = canViewGlobal ? null : ['BPMS'];

    const { events, meta } = await auditService.queryEvents({
      ...parseResult.data,
      allowedModules,
    });

    return res.status(200).json({
      success: true,
      data: { events },
      meta,
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'AUDIT_QUERY_FAILED',
        message: 'Failed to retrieve platform audit ledger events.',
        details: [err.message],
      },
    });
  }
}
