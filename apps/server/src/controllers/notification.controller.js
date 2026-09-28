import {
  queryNotificationsSchema,
  markNotificationReadParamsSchema,
} from '../schemas/notification.schema.js';
import { notificationService } from '../services/notification.service.js';

export async function listNotifications(req, res) {
  try {
    const parseResult = queryNotificationsSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid notification query parameters.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const { page, pageSize, unreadOnly } = parseResult.data;
    const { notifications, unreadCount, meta } =
      await notificationService.getUserNotifications(req.user.ecode, {
        page,
        pageSize,
        unreadOnly,
      });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
      meta,
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'NOTIFICATIONS_FETCH_FAILED',
        message: 'Failed to retrieve notifications.',
        details: [err.message],
      },
    });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const parseResult = markNotificationReadParamsSchema.safeParse(req.params);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid notification identifier.',
          details: parseResult.error.errors.map((e) => e.message),
        },
      });
    }

    const notificationId = parseResult.data.id;
    const updated = await notificationService.markAsRead(
      notificationId,
      req.user.ecode
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found or access denied.',
          details: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        notification_id: notificationId,
        is_read: true,
      },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'MARK_READ_FAILED',
        message: 'Failed to update notification read status.',
        details: [err.message],
      },
    });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const updatedCount = await notificationService.markAllAsRead(req.user.ecode);

    return res.status(200).json({
      success: true,
      data: {
        updatedCount,
      },
      error: null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'MARK_ALL_READ_FAILED',
        message: 'Failed to mark all notifications as read.',
        details: [err.message],
      },
    });
  }
}
