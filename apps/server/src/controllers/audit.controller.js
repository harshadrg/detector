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

import writeXlsxFile from 'write-excel-file/node';
import PDFDocument from 'pdfkit';
import { exportAuditSchema } from '../schemas/audit.schema.js';

export async function exportAuditEvents(req, res) {
  try {
    const parseResult = exportAuditSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid audit export parameters.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { format, ...filters } = parseResult.data;

    const canViewGlobal = authorizationService.hasPermission(req.user, 'CORE.AUDIT.VIEW_GLOBAL');
    const canViewBpms = authorizationService.hasPermission(req.user, 'BPMS.AUDIT.VIEW');

    if (!canViewGlobal && !canViewBpms) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN_AUDIT_ACCESS', message: 'You lack permission to export platform audit ledgers.', details: [] },
      });
    }

    const allowedModules = canViewGlobal ? null : ['BPMS'];
    
    // Fetch all records for export (limit to 5000 max for safety)
    const { events } = await auditService.queryEvents({
      ...filters,
      page: 1,
      pageSize: 5000,
      allowedModules,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-export-${timestamp}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      const headers = ['Event ID', 'Timestamp', 'Module', 'Entity Type', 'Entity ID', 'Action', 'Performed By', 'Context', 'Remarks'];
      res.write(headers.join(',') + '\n');
      
      for (const e of events) {
        const row = [
          e.event_id,
          new Date(e.created_at).toISOString(),
          e.module_code,
          e.entity_type,
          e.entity_id,
          e.action,
          e.performed_by,
          e.acting_context || 'SELF',
          (e.remarks || '').replace(/,/g, ';') // Simple escape
        ];
        res.write(row.map(c => `"${c}"`).join(',') + '\n');
      }
      return res.end();
    } 
    
    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      
      const schema = [
        { column: 'Event ID', type: Number, value: e => e.event_id },
        { column: 'Timestamp', type: Date, format: 'yyyy-mm-dd hh:mm:ss', value: e => new Date(e.created_at) },
        { column: 'Module', type: String, value: e => e.module_code },
        { column: 'Entity Type', type: String, value: e => e.entity_type },
        { column: 'Entity ID', type: String, value: e => String(e.entity_id) },
        { column: 'Action', type: String, value: e => e.action },
        { column: 'Performed By', type: String, value: e => String(e.performed_by) },
        { column: 'Context', type: String, value: e => e.acting_context || 'SELF' },
        { column: 'Remarks', type: String, value: e => e.remarks || '' }
      ];
      
      const buffer = await writeXlsxFile(events, { schema });
      return res.send(buffer);
    }
    
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      doc.pipe(res);
      
      doc.fontSize(16).text('Detector Platform Audit Ledger', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Exported at: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();
      
      for (const e of events) {
        doc.fontSize(10).font('Helvetica-Bold').text(`[${e.module_code}] ${e.action} on ${e.entity_type} (${e.entity_id})`);
        doc.font('Helvetica').text(`By: ${e.performed_by} | Time: ${new Date(e.created_at).toLocaleString()}`);
        if (e.remarks) doc.text(`Remarks: ${e.remarks}`);
        doc.moveDown(0.5);
      }
      
      doc.end();
      return;
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'AUDIT_EXPORT_FAILED', message: 'Failed to export audit events.', details: [err.message] },
    });
  }
}

