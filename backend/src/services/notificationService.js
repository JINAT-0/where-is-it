const { query } = require('../config/db');

async function createNotification(
  executor,
  { userId, title, message, type, relatedItemId = null, relatedClaimId = null }
) {
  const exec = executor || { execute: (sql, params) => query(sql, params).then((r) => [r]) };
  await exec.execute(
    `INSERT INTO notifications (user_id, title, message, notification_type, related_item_id, related_claim_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, message, type, relatedItemId, relatedClaimId]
  );
}

async function notifyAdmins(
  executor,
  { title, message, type, relatedItemId = null, relatedClaimId = null }
) {
  const exec = executor || { execute: (sql, params) => query(sql, params).then((r) => [r]) };
  const [admins] = await exec.execute(
    `SELECT id FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`
  );
  for (const admin of admins) {
    await createNotification(exec, {
      userId: admin.id,
      title,
      message,
      type,
      relatedItemId,
      relatedClaimId,
    });
  }
}

async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  const whereClause = unreadOnly ? 'WHERE user_id = ? AND is_read = 0' : 'WHERE user_id = ?';

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM notifications ${whereClause}`,
    [userId]
  );
  const unreadRows = await query(
    `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );

  const notifications = await query(
    `SELECT id, title, message, notification_type, related_item_id, related_claim_id, is_read, created_at
     FROM notifications
     ${whereClause}
     ORDER BY created_at DESC, id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    [userId]
  );

  const total = Number(countRows[0]?.total || 0);
  return {
    notifications,
    unreadCount: Number(unreadRows[0]?.unread_count || 0),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function markAsRead(userId, notificationId) {
  const result = await query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

async function markAllAsRead(userId) {
  await query(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
  return true;
}

module.exports = {
  createNotification,
  notifyAdmins,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};

