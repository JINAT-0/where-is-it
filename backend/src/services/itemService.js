const fs = require('fs');
const { query, withTransaction } = require('../config/db');
const { AppError } = require('../utils/apiResponse');
const { PUBLIC_ITEMS_DIR, safeResolveUploadPath } = require('../middleware/upload');
const notificationService = require('./notificationService');

function removePublicImageIfExists(imagePath) {
  if (!imagePath) return;
  const filename = imagePath.replace(/^\/uploads\/items\//, '');
  const fullPath = safeResolveUploadPath(PUBLIC_ITEMS_DIR, filename);
  if (fullPath && fs.existsSync(fullPath)) {
    fs.unlink(fullPath, () => {});
  }
}

async function listPublicItems({
  search = '',
  type = '',
  category = '',
  location = '',
  date = '',
  status = '',
  sort = 'newest',
  page = 1,
  limit = 12,
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [`i.moderation_status = 'APPROVED'`];
  const params = [];

  if (type && ['LOST', 'FOUND'].includes(String(type).toUpperCase())) {
    conditions.push(`i.report_type = ?`);
    params.push(String(type).toUpperCase());
  }

  if (category && parseInt(category, 10) > 0) {
    conditions.push(`i.category_id = ?`);
    params.push(parseInt(category, 10));
  }

  if (location && String(location).trim()) {
    conditions.push(`i.location LIKE ?`);
    params.push(`%${String(location).trim()}%`);
  }

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
    conditions.push(`i.event_date = ?`);
    params.push(String(date).trim());
  }

  if (status && ['OPEN', 'MATCHED', 'CLAIMED', 'RETURNED', 'CLOSED'].includes(String(status).toUpperCase())) {
    conditions.push(`i.resolution_status = ?`);
    params.push(String(status).toUpperCase());
  }

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    conditions.push(`(i.item_name LIKE ? OR i.description LIKE ? OR i.location LIKE ?)`);
    params.push(term, term, term);
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`;
  const orderSQL =
    String(sort).toLowerCase() === 'oldest'
      ? 'ORDER BY i.event_date ASC, i.created_at ASC'
      : 'ORDER BY i.created_at DESC, i.id DESC';

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM items i ${whereSQL}`,
    params
  );

  const items = await query(
    `SELECT
       i.id, i.category_id, c.name AS category_name,
       i.item_name, i.description, i.report_type, i.location,
       DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.approximate_time, i.image_path,
       i.moderation_status, i.resolution_status, i.created_at, i.updated_at,
       u.full_name AS reporter_name, u.department AS reporter_department, u.role AS reporter_role
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = i.user_id
     ${whereSQL}
     ${orderSQL}
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);
  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function listMyItems(userId, { type = '', status = '', page = 1, limit = 10 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (safePage - 1) * safeLimit;

  const conditions = ['i.user_id = ?'];
  const params = [userId];

  if (type && ['LOST', 'FOUND'].includes(String(type).toUpperCase())) {
    conditions.push('i.report_type = ?');
    params.push(String(type).toUpperCase());
  }

  if (status && ['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(String(status).toUpperCase())) {
    conditions.push('i.moderation_status = ?');
    params.push(String(status).toUpperCase());
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`;
  const countRows = await query(`SELECT COUNT(*) AS total FROM items i ${whereSQL}`, params);

  const items = await query(
    `SELECT
       i.id, i.user_id, i.category_id, c.name AS category_name,
       i.item_name, i.description, i.report_type, i.location,
       DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.approximate_time, i.contact_info, i.image_path,
       i.moderation_status, i.resolution_status, i.rejection_reason,
       i.created_at, i.updated_at
     FROM items i
     JOIN categories c ON c.id = i.category_id
     ${whereSQL}
     ORDER BY i.created_at DESC, i.id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);
  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getItemById(itemId, currentUser = null) {
  const rows = await query(
    `SELECT
       i.id, i.user_id, i.category_id, c.name AS category_name,
       i.item_name, i.description, i.report_type, i.location,
       DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.approximate_time, i.contact_info, i.image_path,
       i.moderation_status, i.resolution_status, i.rejection_reason,
       i.created_at, i.updated_at,
       u.full_name AS reporter_name, u.department AS reporter_department, u.role AS reporter_role
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = i.user_id
     WHERE i.id = ?
     LIMIT 1`,
    [itemId]
  );

  if (rows.length === 0) {
    throw new AppError('Item report not found.', 404);
  }

  const item = rows[0];
  const isOwner = currentUser && currentUser.id === item.user_id;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  if (item.moderation_status !== 'APPROVED' && !isOwner && !isAdmin) {
    throw new AppError('Item report not found or awaiting moderation.', 404);
  }

  // Protect private contact info from anonymous visitors; only show safe contact guidance
  // or full contact_info to owner, admin, or authenticated campus users on LOST reports.
  const canSeeContact = isOwner || isAdmin || (Boolean(currentUser) && item.report_type === 'LOST');

  let userClaim = null;
  if (currentUser) {
    const claimRows = await query(
      `SELECT id, status, created_at FROM claims
       WHERE item_id = ? AND claimant_id = ? AND status != 'WITHDRAWN'
       ORDER BY created_at DESC LIMIT 1`,
      [itemId, currentUser.id]
    );
    if (claimRows.length > 0) {
      userClaim = claimRows[0];
    }
  }

  return {
    id: item.id,
    user_id: isOwner || isAdmin ? item.user_id : undefined,
    is_owner: Boolean(isOwner),
    category_id: item.category_id,
    category_name: item.category_name,
    item_name: item.item_name,
    description: item.description,
    report_type: item.report_type,
    location: item.location,
    event_date: item.event_date,
    approximate_time: item.approximate_time,
    contact_info: canSeeContact ? item.contact_info : null,
    image_path: item.image_path,
    moderation_status: item.moderation_status,
    resolution_status: item.resolution_status,
    rejection_reason: isOwner || isAdmin ? item.rejection_reason : null,
    reporter_name: item.reporter_name,
    reporter_department: item.reporter_department,
    reporter_role: item.reporter_role,
    user_claim: userClaim,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

async function createItem(userId, data, imageFilename = null) {
  const catRows = await query(`SELECT id FROM categories WHERE id = ? LIMIT 1`, [data.category_id]);
  if (catRows.length === 0) {
    if (imageFilename) removePublicImageIfExists(`/uploads/items/${imageFilename}`);
    throw new AppError('Selected category does not exist.', 400);
  }

  const imagePath = imageFilename ? `/uploads/items/${imageFilename}` : null;

  const itemId = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO items
         (user_id, category_id, item_name, description, report_type, location, event_date, approximate_time, contact_info, image_path, moderation_status, resolution_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW', 'OPEN')`,
      [
        userId,
        data.category_id,
        data.item_name,
        data.description,
        data.report_type,
        data.location,
        data.event_date,
        data.approximate_time || null,
        data.contact_info || null,
        imagePath,
      ]
    );

    const insertedId = result.insertId;

    await notificationService.createNotification(conn, {
      userId,
      title: 'Report Submitted for Review',
      message: `Your ${data.report_type.toLowerCase()} item report "${data.item_name}" has been submitted and is pending administrator review.`,
      type: 'REPORT_SUBMITTED',
      relatedItemId: insertedId,
    });

    await notificationService.notifyAdmins(conn, {
      title: `New ${data.report_type === 'LOST' ? 'Lost' : 'Found'} Report Submitted`,
      message: `A new report "${data.item_name}" at ${data.location} is awaiting moderation review.`,
      type: 'NEW_REPORT_ADMIN',
      relatedItemId: insertedId,
    });

    return insertedId;
  });

  return getItemById(itemId, { id: userId, role: 'STUDENT' });
}

async function updateItem(itemId, currentUser, data, newImageFilename = null) {
  const rows = await query(`SELECT * FROM items WHERE id = ? LIMIT 1`, [itemId]);
  if (rows.length === 0) {
    if (newImageFilename) removePublicImageIfExists(`/uploads/items/${newImageFilename}`);
    throw new AppError('Item report not found.', 404);
  }

  const existing = rows[0];
  const isOwner = existing.user_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    if (newImageFilename) removePublicImageIfExists(`/uploads/items/${newImageFilename}`);
    throw new AppError('You are not authorized to edit this report.', 403);
  }

  if (!isAdmin && ['CLAIMED', 'RETURNED', 'CLOSED'].includes(existing.resolution_status)) {
    if (newImageFilename) removePublicImageIfExists(`/uploads/items/${newImageFilename}`);
    throw new AppError('Reports that are already claimed, returned, or closed cannot be edited.', 400);
  }

  if (data.category_id) {
    const catRows = await query(`SELECT id FROM categories WHERE id = ? LIMIT 1`, [data.category_id]);
    if (catRows.length === 0) {
      if (newImageFilename) removePublicImageIfExists(`/uploads/items/${newImageFilename}`);
      throw new AppError('Selected category does not exist.', 400);
    }
  }

  const nextImagePath = newImageFilename ? `/uploads/items/${newImageFilename}` : existing.image_path;
  // If a regular user edits an already-reviewed report, send it back to PENDING_REVIEW
  const nextModerationStatus = isAdmin ? existing.moderation_status : 'PENDING_REVIEW';
  const nextRejectionReason = isAdmin ? existing.rejection_reason : null;

  await query(
    `UPDATE items
     SET category_id = ?, item_name = ?, description = ?, location = ?, event_date = ?,
         approximate_time = ?, contact_info = ?, image_path = ?,
         moderation_status = ?, rejection_reason = ?
     WHERE id = ?`,
    [
      data.category_id ?? existing.category_id,
      data.item_name ?? existing.item_name,
      data.description ?? existing.description,
      data.location ?? existing.location,
      data.event_date ?? existing.event_date,
      data.approximate_time !== undefined ? data.approximate_time || null : existing.approximate_time,
      data.contact_info !== undefined ? data.contact_info || null : existing.contact_info,
      nextImagePath,
      nextModerationStatus,
      nextRejectionReason,
      itemId,
    ]
  );

  if (newImageFilename && existing.image_path) {
    removePublicImageIfExists(existing.image_path);
  }

  return getItemById(itemId, currentUser);
}

async function deleteItem(itemId, currentUser) {
  const rows = await query(`SELECT * FROM items WHERE id = ? LIMIT 1`, [itemId]);
  if (rows.length === 0) {
    throw new AppError('Item report not found.', 404);
  }

  const existing = rows[0];
  const isOwner = existing.user_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AppError('You are not authorized to delete this report.', 403);
  }

  if (!isAdmin && ['CLAIMED', 'RETURNED'].includes(existing.resolution_status)) {
    throw new AppError('Claimed or returned items cannot be deleted.', 400);
  }

  await query(`DELETE FROM items WHERE id = ?`, [itemId]);
  if (existing.image_path) {
    removePublicImageIfExists(existing.image_path);
  }
  return true;
}

module.exports = {
  listPublicItems,
  listMyItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  removePublicImageIfExists,
};

