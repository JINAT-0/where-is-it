const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { AppError } = require('../utils/apiResponse');
const { sanitizeUser } = require('./authService');

const SALT_ROUNDS = 10;

async function getProfile(userId) {
  const rows = await query(
    `SELECT id, full_name, email, university_id, department, role, account_status, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) {
    throw new AppError('User not found.', 404);
  }
  return sanitizeUser(rows[0]);
}

async function updateProfile(userId, { full_name, department, university_id }) {
  const duplicateUni = await query(
    `SELECT id FROM users WHERE university_id = ? AND id != ? LIMIT 1`,
    [university_id, userId]
  );
  if (duplicateUni.length > 0) {
    throw new AppError('That University ID is already registered to another user.', 409);
  }

  await query(
    `UPDATE users SET full_name = ?, department = ?, university_id = ? WHERE id = ?`,
    [full_name, department, university_id, userId]
  );

  return getProfile(userId);
}

async function changePassword(userId, { current_password, new_password }) {
  const rows = await query(`SELECT id, password_hash FROM users WHERE id = ? LIMIT 1`, [userId]);
  if (rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const valid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!valid) {
    throw new AppError('Current password is incorrect.', 400);
  }

  const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, userId]);
  return true;
}

async function getUserDashboard(userId) {
  const [itemStats] = await query(
    `SELECT
       COUNT(*) AS total_reports,
       SUM(CASE WHEN report_type = 'LOST' THEN 1 ELSE 0 END) AS lost_reports,
       SUM(CASE WHEN report_type = 'FOUND' THEN 1 ELSE 0 END) AS found_reports,
       SUM(CASE WHEN moderation_status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) AS pending_review_reports,
       SUM(CASE WHEN resolution_status = 'RETURNED' THEN 1 ELSE 0 END) AS returned_reports
     FROM items
     WHERE user_id = ?`,
    [userId]
  );

  const [claimStats] = await query(
    `SELECT
       COUNT(*) AS total_claims,
       SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_claims,
       SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_claims,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_claims
     FROM claims
     WHERE claimant_id = ?`,
    [userId]
  );

  const [notifStats] = await query(
    `SELECT COUNT(*) AS unread_notifications FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );

  const recentItems = await query(
    `SELECT i.id, i.item_name, i.report_type, i.location, i.event_date, i.moderation_status, i.resolution_status, i.created_at,
            c.name AS category_name
     FROM items i
     JOIN categories c ON c.id = i.category_id
     WHERE i.user_id = ?
     ORDER BY i.created_at DESC
     LIMIT 5`,
    [userId]
  );

  const recentClaims = await query(
    `SELECT cl.id, cl.item_id, cl.status, cl.created_at, i.item_name, i.location
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     WHERE cl.claimant_id = ?
     ORDER BY cl.created_at DESC
     LIMIT 5`,
    [userId]
  );

  return {
    stats: {
      total_reports: Number(itemStats?.total_reports || 0),
      lost_reports: Number(itemStats?.lost_reports || 0),
      found_reports: Number(itemStats?.found_reports || 0),
      pending_review_reports: Number(itemStats?.pending_review_reports || 0),
      returned_reports: Number(itemStats?.returned_reports || 0),
      total_claims: Number(claimStats?.total_claims || 0),
      pending_claims: Number(claimStats?.pending_claims || 0),
      approved_claims: Number(claimStats?.approved_claims || 0),
      completed_claims: Number(claimStats?.completed_claims || 0),
      unread_notifications: Number(notifStats?.unread_notifications || 0),
    },
    recentItems,
    recentClaims,
  };
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserDashboard,
};

