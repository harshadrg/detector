import { query, sql } from '../db/connection.js';

export class NotificationService {
  /**
   * Dispatches a single notification to a recipient employee.
   *
   * @param {Object} params
   * @param {string} params.recipient_ecode
   * @param {string|null} [params.sender_ecode=null] - Null for SYSTEM notifications
   * @param {string} [params.notification_type='INFO'] - INFO | WARNING | APPROVAL_REQUIRED | SECURITY | STATUS_CHANGE
   * @param {string} params.entity_type - PROCESS | CHANGE_REQUEST | HANDOVER | EMPLOYEE | ROLE
   * @param {string} params.entity_id
   * @param {string} params.message - Up to 500 chars
   * @param {string|null} [params.action_url=null]
   * @param {sql.Transaction|null} [transaction=null]
   * @returns {Promise<number>} Inserted notification_id
   */
  async dispatch(
    {
      recipient_ecode,
      sender_ecode = null,
      notification_type = 'INFO',
      entity_type,
      entity_id,
      message,
      action_url = null,
    },
    transaction = null
  ) {
    if (!recipient_ecode || !entity_type || !entity_id || !message) {
      throw new Error(
        'NotificationService.dispatch requires recipient_ecode, entity_type, entity_id, and message.'
      );
    }

    const insertSql = `
      INSERT INTO dbo.Notifications (
        recipient_ecode,
        sender_ecode,
        notification_type,
        entity_type,
        entity_id,
        message,
        action_url,
        is_read,
        created_at
      )
      OUTPUT INSERTED.notification_id
      VALUES (
        @recipient_ecode,
        @sender_ecode,
        @notification_type,
        @entity_type,
        @entity_id,
        @message,
        @action_url,
        0,
        SYSUTCDATETIME()
      )
    `;

    if (transaction) {
      const request = new sql.Request(transaction);
      request.input('recipient_ecode', sql.VarChar(20), recipient_ecode);
      request.input('sender_ecode', sql.VarChar(20), sender_ecode);
      request.input('notification_type', sql.VarChar(50), notification_type);
      request.input('entity_type', sql.VarChar(50), entity_type);
      request.input('entity_id', sql.VarChar(50), String(entity_id));
      request.input('message', sql.NVarChar(500), message);
      request.input('action_url', sql.VarChar(255), action_url);

      const result = await request.query(insertSql);
      return result.recordset?.[0]?.notification_id;
    }

    const result = await query(insertSql, {
      recipient_ecode: { type: sql.VarChar(20), value: recipient_ecode },
      sender_ecode: { type: sql.VarChar(20), value: sender_ecode },
      notification_type: { type: sql.VarChar(50), value: notification_type },
      entity_type: { type: sql.VarChar(50), value: entity_type },
      entity_id: { type: sql.VarChar(50), value: String(entity_id) },
      message: { type: sql.NVarChar(500), value: message },
      action_url: { type: sql.VarChar(255), value: action_url },
    });

    return result.recordset?.[0]?.notification_id;
  }

  /**
   * Dispatches notifications to multiple recipients.
   *
   * @param {Array<Object>} notificationsList
   * @param {sql.Transaction|null} [transaction=null]
   * @returns {Promise<number[]>} Array of inserted notification_ids
   */
  async dispatchBatch(notificationsList, transaction = null) {
    if (!Array.isArray(notificationsList) || notificationsList.length === 0) {
      return [];
    }

    const ids = [];
    for (const item of notificationsList) {
      const id = await this.dispatch(item, transaction);
      ids.push(id);
    }
    return ids;
  }

  /**
   * Retrieves paginated notifications for an employee along with the current unread count.
   *
   * @param {string} ecode
   * @param {Object} options
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @param {boolean} [options.unreadOnly=false]
   * @returns {Promise<{ notifications: any[], unreadCount: number, meta: { page: number, pageSize: number, totalCount: number, totalPages: number } }>}
   */
  async getUserNotifications(ecode, { page = 1, pageSize = 20, unreadOnly = false } = {}) {
    const offset = (page - 1) * pageSize;

    const whereClauses = ['n.recipient_ecode = @ecode'];
    const params = {
      ecode: { type: sql.VarChar(20), value: ecode },
      offset: { type: sql.Int, value: offset },
      pageSize: { type: sql.Int, value: pageSize },
    };

    if (unreadOnly) {
      whereClauses.push('n.is_read = 0');
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // Total filtered notifications count
    const countSql = `
      SELECT COUNT(*) AS total
      FROM dbo.Notifications n
      ${whereSql}
    `;
    const countResult = await query(countSql, params);
    const totalCount = countResult.recordset?.[0]?.total || 0;

    // Total unread notifications count (independent of filter)
    const unreadSql = `
      SELECT COUNT(*) AS unread
      FROM dbo.Notifications
      WHERE recipient_ecode = @ecode AND is_read = 0
    `;
    const unreadResult = await query(unreadSql, {
      ecode: { type: sql.VarChar(20), value: ecode },
    });
    const unreadCount = unreadResult.recordset?.[0]?.unread || 0;

    // Fetch paginated rows with sender details
    const listSql = `
      SELECT 
        n.notification_id,
        n.recipient_ecode,
        n.sender_ecode,
        s.name AS sender_name,
        n.notification_type,
        n.entity_type,
        n.entity_id,
        n.message,
        n.action_url,
        n.is_read,
        n.read_at,
        n.created_at
      FROM dbo.Notifications n
      LEFT JOIN dbo.Employees s ON s.ecode = n.sender_ecode
      ${whereSql}
      ORDER BY n.created_at DESC, n.notification_id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const listResult = await query(listSql, params);
    const notifications = listResult.recordset || [];

    return {
      notifications,
      unreadCount,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Marks a notification as read, ensuring ownership by recipient_ecode.
   *
   * @param {number|string} notificationId
   * @param {string} ecode
   * @returns {Promise<boolean>}
   */
  async markAsRead(notificationId, ecode) {
    const updateSql = `
      UPDATE dbo.Notifications
      SET is_read = 1, read_at = SYSUTCDATETIME()
      WHERE notification_id = @notificationId AND recipient_ecode = @ecode
    `;

    const result = await query(updateSql, {
      notificationId: { type: sql.BigInt, value: notificationId },
      ecode: { type: sql.VarChar(20), value: ecode },
    });

    return (result.rowsAffected?.[0] || 0) > 0;
  }

  /**
   * Marks all unread notifications as read for an employee.
   *
   * @param {string} ecode
   * @returns {Promise<number>} Number of marked rows
   */
  async markAllAsRead(ecode) {
    const updateSql = `
      UPDATE dbo.Notifications
      SET is_read = 1, read_at = SYSUTCDATETIME()
      WHERE recipient_ecode = @ecode AND is_read = 0
    `;

    const result = await query(updateSql, {
      ecode: { type: sql.VarChar(20), value: ecode },
    });

    return result.rowsAffected?.[0] || 0;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
