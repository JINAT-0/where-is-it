const notificationService = require('../services/notificationService');
const { sendSuccess, AppError } = require('../utils/apiResponse');

async function listNotifications(req, res, next) {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, {
      page: req.query.page,
      limit: req.query.limit,
      unreadOnly: req.query.unread === 'true',
    });
    return sendSuccess(res, {
      message: 'Notifications fetched successfully.',
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const updated = await notificationService.markAsRead(
      req.user.id,
      parseInt(req.params.id, 10)
    );
    if (!updated) {
      throw new AppError('Notification not found.', 404);
    }
    return sendSuccess(res, { message: 'Notification marked as read.' });
  } catch (err) {
    return next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return sendSuccess(res, { message: 'All notifications marked as read.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
};

