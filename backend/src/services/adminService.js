const { query, withTransaction } = require('../config/db');
const { AppError } = require('../utils/apiResponse');
const notificationService = require('./notificationService');
const { removePublicImageIfExists } = require('./itemService');

async function recordAdminAction(conn, { adminId, action, targetType, targetId = null, details = null }) {
  await conn.execute(
    `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [adminId, action, targetType, targetId, details]
  );
}

async function getDashboardStats() {
  const [userCounts] = await query(
    `SELECT
       COUNT(*) AS total_users,
       SUM(CASE WHEN account_status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_users,
       SUM(CASE WHEN account_status = 'SUSPENDED' THEN 1 ELSE 0 END) AS suspended_users
     FROM users`
  );

  const [itemCounts] = await query(
    `SELECT
       SUM(CASE WHEN report_type = 'LOST' THEN 1 ELSE 0 END) AS total_lost_reports,
       SUM(CASE WHEN report_type = 'FOUND' THEN 1 ELSE 0 END) AS total_found_reports,
       SUM(CASE WHEN moderation_status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) AS pending_reports,
       SUM(CASE WHEN moderation_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_reports,
       SUM(CASE WHEN moderation_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_reports,
       SUM(CASE WHEN resolution_status = 'RETURNED' THEN 1 ELSE 0 END) AS returned_items
     FROM items`
  );

  const [claimCounts] = await query(
    `SELECT
       COUNT(*) AS total_claims,
       SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_claims,
       SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_claims,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_claims
     FROM claims`
  );

  const recentLogs = await query(
    `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at, u.full_name AS admin_name
     FROM admin_activity_logs l
     JOIN users u ON u.id = l.admin_id
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT 8`
  );

  const pendingItems = await query(
    `SELECT i.id, i.item_name, i.report_type, i.location, DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
            i.created_at, c.name AS category_name, u.full_name AS reporter_name
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = i.user_id
     WHERE i.moderation_status = 'PENDING_REVIEW'
     ORDER BY i.created_at ASC
     LIMIT 5`
  );

  const pendingClaims = await query(
    `SELECT cl.id, cl.item_id, cl.created_at, i.item_name, u.full_name AS claimant_name
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     JOIN users u ON u.id = cl.claimant_id
     WHERE cl.status = 'PENDING'
     ORDER BY cl.created_at ASC
     LIMIT 5`
  );

  return {
    stats: {
      total_users: Number(userCounts?.total_users || 0),
      active_users: Number(userCounts?.active_users || 0),
      suspended_users: Number(userCounts?.suspended_users || 0),
      total_lost_reports: Number(itemCounts?.total_lost_reports || 0),
      total_found_reports: Number(itemCounts?.total_found_reports || 0),
      pending_reports: Number(itemCounts?.pending_reports || 0),
      approved_reports: Number(itemCounts?.approved_reports || 0),
      rejected_reports: Number(itemCounts?.rejected_reports || 0),
      returned_items: Number(itemCounts?.returned_items || 0),
      total_claims: Number(claimCounts?.total_claims || 0),
      pending_claims: Number(claimCounts?.pending_claims || 0),
      approved_claims: Number(claimCounts?.approved_claims || 0),
      completed_claims: Number(claimCounts?.completed_claims || 0),
    },
    recentLogs,
    pendingItems,
    pendingClaims,
  };
}

async function listUsers({ search = '', role = '', status = '', page = 1, limit = 15 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    conditions.push(`(full_name LIKE ? OR email LIKE ? OR university_id LIKE ? OR department LIKE ?)`);
    params.push(term, term, term, term);
  }
  if (role && ['STUDENT', 'FACULTY', 'STAFF', 'ADMIN'].includes(String(role).toUpperCase())) {
    conditions.push(`role = ?`);
    params.push(String(role).toUpperCase());
  }
  if (status && ['ACTIVE', 'SUSPENDED'].includes(String(status).toUpperCase())) {
    conditions.push(`account_status = ?`);
    params.push(String(status).toUpperCase());
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRows = await query(`SELECT COUNT(*) AS total FROM users ${whereSQL}`, params);

  const users = await query(
    `SELECT id, full_name, email, university_id, department, role, account_status, created_at, updated_at
     FROM users
     ${whereSQL}
     ORDER BY created_at DESC, id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);
  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function updateUserStatus(adminId, targetUserId, accountStatus) {
  if (Number(adminId) === Number(targetUserId)) {
    throw new AppError('You cannot suspend or alter your own active administrator account.', 400);
  }

  const rows = await query(
    `SELECT id, full_name, email, role, account_status FROM users WHERE id = ? LIMIT 1`,
    [targetUserId]
  );
  if (rows.length === 0) {
    throw new AppError('User not found.', 404);
  }
  const target = rows[0];

  if (target.role === 'ADMIN' && accountStatus === 'SUSPENDED') {
    const [adminCount] = await query(
      `SELECT COUNT(*) AS active_admins FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`
    );
    if (Number(adminCount?.active_admins || 0) <= 1) {
      throw new AppError('Cannot suspend the last active administrator account.', 400);
    }
  }

  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE users SET account_status = ? WHERE id = ?`, [
      accountStatus,
      targetUserId,
    ]);

    await recordAdminAction(conn, {
      adminId,
      action: accountStatus === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      targetType: 'USER',
      targetId: targetUserId,
      details: `${accountStatus === 'SUSPENDED' ? 'Suspended' : 'Reactivated'} user ${target.email}`,
    });

    if (accountStatus === 'ACTIVE') {
      await notificationService.createNotification(conn, {
        userId: targetUserId,
        title: 'Account Reactivated',
        message: 'Your Where Is It? campus account has been reactivated by an administrator.',
        type: 'ACCOUNT_STATUS',
      });
    }
  });

  const updated = await query(
    `SELECT id, full_name, email, university_id, department, role, account_status, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [targetUserId]
  );
  return updated[0];
}

async function listAllItems({
  search = '',
  type = '',
  moderation_status = '',
  resolution_status = '',
  category = '',
  page = 1,
  limit = 15,
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    conditions.push(`(i.item_name LIKE ? OR i.description LIKE ? OR i.location LIKE ? OR u.full_name LIKE ?)`);
    params.push(term, term, term, term);
  }
  if (type && ['LOST', 'FOUND'].includes(String(type).toUpperCase())) {
    conditions.push(`i.report_type = ?`);
    params.push(String(type).toUpperCase());
  }
  if (
    moderation_status &&
    ['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(String(moderation_status).toUpperCase())
  ) {
    conditions.push(`i.moderation_status = ?`);
    params.push(String(moderation_status).toUpperCase());
  }
  if (
    resolution_status &&
    ['OPEN', 'MATCHED', 'CLAIMED', 'RETURNED', 'CLOSED'].includes(
      String(resolution_status).toUpperCase()
    )
  ) {
    conditions.push(`i.resolution_status = ?`);
    params.push(String(resolution_status).toUpperCase());
  }
  if (category && parseInt(category, 10) > 0) {
    conditions.push(`i.category_id = ?`);
    params.push(parseInt(category, 10));
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM items i JOIN users u ON u.id = i.user_id ${whereSQL}`,
    params
  );

  const items = await query(
    `SELECT
       i.id, i.user_id, i.category_id, c.name AS category_name,
       i.item_name, i.description, i.report_type, i.location,
       DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.approximate_time, i.contact_info, i.image_path,
       i.moderation_status, i.resolution_status, i.rejection_reason,
       i.created_at, i.updated_at,
       u.full_name AS reporter_name, u.email AS reporter_email, u.university_id AS reporter_uni_id, u.role AS reporter_role
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = i.user_id
     ${whereSQL}
     ORDER BY CASE WHEN i.moderation_status = 'PENDING_REVIEW' THEN 0 ELSE 1 END, i.created_at DESC
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

async function approveItem(adminId, itemId) {
  const rows = await query(`SELECT * FROM items WHERE id = ? LIMIT 1`, [itemId]);
  if (rows.length === 0) {
    throw new AppError('Item report not found.', 404);
  }
  const item = rows[0];

  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE items SET moderation_status = 'APPROVED', rejection_reason = NULL WHERE id = ?`,
      [itemId]
    );

    await notificationService.createNotification(conn, {
      userId: item.user_id,
      title: 'Report Approved',
      message: `Your ${item.report_type.toLowerCase()} item report "${item.item_name}" has been approved and is now publicly visible.`,
      type: 'REPORT_APPROVED',
      relatedItemId: item.id,
    });

    await recordAdminAction(conn, {
      adminId,
      action: 'ITEM_APPROVED',
      targetType: 'ITEM',
      targetId: item.id,
      details: `Approved ${item.report_type} report "${item.item_name}"`,
    });
  });

  const [updated] = await query(`SELECT * FROM items WHERE id = ?`, [itemId]);
  return updated;
}

async function rejectItem(adminId, itemId, rejectionReason) {
  const rows = await query(`SELECT * FROM items WHERE id = ? LIMIT 1`, [itemId]);
  if (rows.length === 0) {
    throw new AppError('Item report not found.', 404);
  }
  const item = rows[0];

  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE items SET moderation_status = 'REJECTED', rejection_reason = ? WHERE id = ?`,
      [rejectionReason, itemId]
    );

    await notificationService.createNotification(conn, {
      userId: item.user_id,
      title: 'Report Rejected',
      message: `Your ${item.report_type.toLowerCase()} item report "${item.item_name}" was rejected. Reason: ${rejectionReason}`,
      type: 'REPORT_REJECTED',
      relatedItemId: item.id,
    });

    await recordAdminAction(conn, {
      adminId,
      action: 'ITEM_REJECTED',
      targetType: 'ITEM',
      targetId: item.id,
      details: `Rejected report "${item.item_name}": ${rejectionReason}`,
    });
  });

  const [updated] = await query(`SELECT * FROM items WHERE id = ?`, [itemId]);
  return updated;
}

async function markItemReturned(adminId, itemId) {
  const rows = await query(`SELECT * FROM items WHERE id = ? LIMIT 1`, [itemId]);
  if (rows.length === 0) {
    throw new AppError('Item report not found.', 404);
  }
  const item = rows[0];

  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE items SET resolution_status = 'RETURNED' WHERE id = ?`, [itemId]);

    const [approvedClaims] = await conn.execute(
      `SELECT id, claimant_id FROM claims WHERE item_id = ? AND status = 'APPROVED'`,
      [itemId]
    );

    for (const cl of approvedClaims) {
      await conn.execute(
        `UPDATE claims SET status = 'COMPLETED', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
        [adminId, cl.id]
      );
      await notificationService.createNotification(conn, {
        userId: cl.claimant_id,
        title: 'Item Return Confirmed',
        message: `The return of "${item.item_name}" has been confirmed as completed. Thank you for using Where Is It?!`,
        type: 'ITEM_RETURNED',
        relatedItemId: item.id,
        relatedClaimId: cl.id,
      });
    }

    await notificationService.createNotification(conn, {
      userId: item.user_id,
      title: 'Item Marked as Returned',
      message: `Your reported item "${item.item_name}" has been marked as RETURNED.`,
      type: 'ITEM_RETURNED',
      relatedItemId: item.id,
    });

    await recordAdminAction(conn, {
      adminId,
      action: 'ITEM_MARKED_RETURNED',
      targetType: 'ITEM',
      targetId: item.id,
      details: `Confirmed return for item "${item.item_name}"`,
    });
  });

  const [updated] = await query(`SELECT * FROM items WHERE id = ?`, [itemId]);
  return updated;
}

async function deleteItemAsAdmin(adminId, itemId) {
  const rows = await query(`SELECT * FROM items WHERE id = ? LIMIT 1`, [itemId]);
  if (rows.length === 0) {
    throw new AppError('Item report not found.', 404);
  }
  const item = rows[0];

  await withTransaction(async (conn) => {
    await conn.execute(`DELETE FROM items WHERE id = ?`, [itemId]);
    await recordAdminAction(conn, {
      adminId,
      action: 'ITEM_DELETED',
      targetType: 'ITEM',
      targetId: item.id,
      details: `Deleted report "${item.item_name}"`,
    });
  });

  if (item.image_path) {
    removePublicImageIfExists(item.image_path);
  }
  return true;
}

async function listAllClaims({ search = '', status = '', page = 1, limit = 15 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    conditions.push(`(i.item_name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR cl.explanation LIKE ?)`);
    params.push(term, term, term, term);
  }

  if (
    status &&
    ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'COMPLETED'].includes(
      String(status).toUpperCase()
    )
  ) {
    conditions.push(`cl.status = ?`);
    params.push(String(status).toUpperCase());
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRows = await query(
    `SELECT COUNT(*) AS total
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     JOIN users u ON u.id = cl.claimant_id
     ${whereSQL}`,
    params
  );

  const claims = await query(
    `SELECT
       cl.id, cl.item_id, cl.claimant_id, cl.explanation, cl.identifying_details,
       CASE WHEN cl.evidence_path IS NOT NULL THEN 1 ELSE 0 END AS has_evidence,
       cl.status, cl.admin_notes, cl.reviewed_by, cl.reviewed_at, cl.created_at,
       i.item_name, i.location, DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.image_path, i.resolution_status, c.name AS category_name,
       u.full_name AS claimant_name, u.email AS claimant_email, u.university_id AS claimant_uni_id,
       u.department AS claimant_department, u.role AS claimant_role,
       f.full_name AS finder_name
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = cl.claimant_id
     JOIN users f ON f.id = i.user_id
     ${whereSQL}
     ORDER BY CASE WHEN cl.status = 'PENDING' THEN 0 ELSE 1 END, cl.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);
  return {
    claims,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function approveClaim(adminId, claimId, adminNotes = '') {
  const rows = await query(
    `SELECT cl.*, i.item_name, i.user_id AS item_owner_id, i.resolution_status
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     WHERE cl.id = ? LIMIT 1`,
    [claimId]
  );

  if (rows.length === 0) {
    throw new AppError('Claim not found.', 404);
  }
  const claim = rows[0];

  if (claim.status !== 'PENDING') {
    throw new AppError('Only PENDING claims can be approved.', 400);
  }
  if (['CLAIMED', 'RETURNED', 'CLOSED'].includes(claim.resolution_status)) {
    throw new AppError('This item already has an approved claim or has been returned.', 400);
  }

  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE claims
       SET status = 'APPROVED', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [adminNotes || 'Ownership verified. Proceed to campus Lost & Found desk for pickup.', adminId, claimId]
    );

    await conn.execute(`UPDATE items SET resolution_status = 'CLAIMED' WHERE id = ?`, [
      claim.item_id,
    ]);

    // Auto-reject competing pending claims on the same item
    const [otherPending] = await conn.execute(
      `SELECT id, claimant_id FROM claims WHERE item_id = ? AND id != ? AND status = 'PENDING'`,
      [claim.item_id, claimId]
    );
    for (const other of otherPending) {
      await conn.execute(
        `UPDATE claims
         SET status = 'REJECTED', admin_notes = 'Another ownership claim for this item was verified and approved.', reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
        [adminId, other.id]
      );
      await notificationService.createNotification(conn, {
        userId: other.claimant_id,
        title: 'Claim Not Approved',
        message: `Your claim for "${claim.item_name}" was not approved because another claim was verified by the administrator.`,
        type: 'CLAIM_REJECTED',
        relatedItemId: claim.item_id,
        relatedClaimId: other.id,
      });
    }

    await notificationService.createNotification(conn, {
      userId: claim.claimant_id,
      title: 'Ownership Claim Approved',
      message: `Your ownership claim for "${claim.item_name}" has been approved! Please coordinate pickup at the Campus Lost & Found Desk with your University ID.`,
      type: 'CLAIM_APPROVED',
      relatedItemId: claim.item_id,
      relatedClaimId: claim.id,
    });

    await notificationService.createNotification(conn, {
      userId: claim.item_owner_id,
      title: 'Claim Approved for Your Found Item',
      message: `An ownership claim for "${claim.item_name}" has been verified by an administrator for safe return.`,
      type: 'CLAIM_APPROVED',
      relatedItemId: claim.item_id,
      relatedClaimId: claim.id,
    });

    await recordAdminAction(conn, {
      adminId,
      action: 'CLAIM_APPROVED',
      targetType: 'CLAIM',
      targetId: claim.id,
      details: `Approved claim #${claim.id} for "${claim.item_name}"`,
    });
  });

  const [updated] = await query(`SELECT * FROM claims WHERE id = ?`, [claimId]);
  return updated;
}

async function rejectClaim(adminId, claimId, adminNotes = '') {
  const rows = await query(
    `SELECT cl.*, i.item_name FROM claims cl JOIN items i ON i.id = cl.item_id WHERE cl.id = ? LIMIT 1`,
    [claimId]
  );

  if (rows.length === 0) {
    throw new AppError('Claim not found.', 404);
  }
  const claim = rows[0];

  if (claim.status !== 'PENDING') {
    throw new AppError('Only PENDING claims can be rejected.', 400);
  }

  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE claims
       SET status = 'REJECTED', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [adminNotes || 'Insufficient ownership proof provided.', adminId, claimId]
    );

    await notificationService.createNotification(conn, {
      userId: claim.claimant_id,
      title: 'Ownership Claim Rejected',
      message: `Your ownership claim for "${claim.item_name}" was rejected. ${adminNotes ? `Notes: ${adminNotes}` : ''}`,
      type: 'CLAIM_REJECTED',
      relatedItemId: claim.item_id,
      relatedClaimId: claim.id,
    });

    await recordAdminAction(conn, {
      adminId,
      action: 'CLAIM_REJECTED',
      targetType: 'CLAIM',
      targetId: claim.id,
      details: `Rejected claim #${claim.id} for "${claim.item_name}"`,
    });
  });

  const [updated] = await query(`SELECT * FROM claims WHERE id = ?`, [claimId]);
  return updated;
}

async function completeClaimReturn(adminId, claimId, adminNotes = '') {
  const rows = await query(
    `SELECT cl.*, i.item_name, i.user_id AS item_owner_id
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     WHERE cl.id = ? LIMIT 1`,
    [claimId]
  );

  if (rows.length === 0) {
    throw new AppError('Claim not found.', 404);
  }
  const claim = rows[0];

  if (claim.status !== 'APPROVED') {
    throw new AppError('Only APPROVED claims can be marked as returned/completed.', 400);
  }

  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE claims
       SET status = 'COMPLETED', admin_notes = COALESCE(NULLIF(?, ''), admin_notes), reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [adminNotes || '', adminId, claimId]
    );

    await conn.execute(`UPDATE items SET resolution_status = 'RETURNED' WHERE id = ?`, [
      claim.item_id,
    ]);

    await notificationService.createNotification(conn, {
      userId: claim.claimant_id,
      title: 'Item Returned Successfully',
      message: `Handover for "${claim.item_name}" is complete and the item status is now RETURNED.`,
      type: 'ITEM_RETURNED',
      relatedItemId: claim.item_id,
      relatedClaimId: claim.id,
    });

    await notificationService.createNotification(conn, {
      userId: claim.item_owner_id,
      title: 'Found Item Returned to Owner',
      message: `Your reported found item "${claim.item_name}" has been safely returned to its verified owner.`,
      type: 'ITEM_RETURNED',
      relatedItemId: claim.item_id,
      relatedClaimId: claim.id,
    });

    await recordAdminAction(conn, {
      adminId,
      action: 'CLAIM_RETURN_COMPLETED',
      targetType: 'CLAIM',
      targetId: claim.id,
      details: `Confirmed safe return for claim #${claim.id} ("${claim.item_name}")`,
    });
  });

  const [updated] = await query(`SELECT * FROM claims WHERE id = ?`, [claimId]);
  return updated;
}

async function listCategories() {
  return query(
    `SELECT c.id, c.name, c.description, c.created_at, COUNT(i.id) AS item_count
     FROM categories c
     LEFT JOIN items i ON i.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`
  );
}

async function createCategory(adminId, { name, description }) {
  const existing = await query(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`, [
    name,
  ]);
  if (existing.length > 0) {
    throw new AppError('A category with this name already exists.', 409);
  }

  const categoryId = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO categories (name, description) VALUES (?, ?)`,
      [name, description || null]
    );
    await recordAdminAction(conn, {
      adminId,
      action: 'CATEGORY_CREATED',
      targetType: 'CATEGORY',
      targetId: result.insertId,
      details: `Created category "${name}"`,
    });
    return result.insertId;
  });

  const rows = await query(`SELECT * FROM categories WHERE id = ?`, [categoryId]);
  return rows[0];
}

async function updateCategory(adminId, categoryId, { name, description }) {
  const rows = await query(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [categoryId]);
  if (rows.length === 0) {
    throw new AppError('Category not found.', 404);
  }

  const duplicate = await query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1`,
    [name, categoryId]
  );
  if (duplicate.length > 0) {
    throw new AppError('Another category with this name already exists.', 409);
  }

  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE categories SET name = ?, description = ? WHERE id = ?`, [
      name,
      description || null,
      categoryId,
    ]);
    await recordAdminAction(conn, {
      adminId,
      action: 'CATEGORY_UPDATED',
      targetType: 'CATEGORY',
      targetId: categoryId,
      details: `Updated category #${categoryId} to "${name}"`,
    });
  });

  const updated = await query(`SELECT * FROM categories WHERE id = ?`, [categoryId]);
  return updated[0];
}

async function deleteCategory(adminId, categoryId) {
  const rows = await query(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [categoryId]);
  if (rows.length === 0) {
    throw new AppError('Category not found.', 404);
  }

  const inUse = await query(`SELECT COUNT(*) AS count FROM items WHERE category_id = ?`, [
    categoryId,
  ]);
  if (Number(inUse[0]?.count || 0) > 0) {
    throw new AppError(
      'Cannot delete a category that has existing item reports. Reassign or remove those reports first.',
      409
    );
  }

  await withTransaction(async (conn) => {
    await conn.execute(`DELETE FROM categories WHERE id = ?`, [categoryId]);
    await recordAdminAction(conn, {
      adminId,
      action: 'CATEGORY_DELETED',
      targetType: 'CATEGORY',
      targetId: categoryId,
      details: `Deleted category "${rows[0].name}"`,
    });
  });

  return true;
}

async function listActivityLogs({ action = '', target_type = '', page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const params = [];

  if (action && String(action).trim()) {
    conditions.push(`l.action LIKE ?`);
    params.push(`%${String(action).trim()}%`);
  }
  if (target_type && String(target_type).trim()) {
    conditions.push(`l.target_type = ?`);
    params.push(String(target_type).trim().toUpperCase());
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM admin_activity_logs l ${whereSQL}`,
    params
  );

  const logs = await query(
    `SELECT l.id, l.admin_id, l.action, l.target_type, l.target_id, l.details, l.created_at,
            u.full_name AS admin_name, u.email AS admin_email
     FROM admin_activity_logs l
     JOIN users u ON u.id = l.admin_id
     ${whereSQL}
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);
  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getSettings() {
  const rows = await query(
    `SELECT setting_key, setting_value, description, updated_at FROM system_settings ORDER BY setting_key ASC`
  );
  const settingsMap = {};
  for (const row of rows) {
    settingsMap[row.setting_key] = {
      value: row.setting_value,
      description: row.description,
      updated_at: row.updated_at,
    };
  }
  return settingsMap;
}

async function updateSettings(adminId, settingsPayload) {
  const allowedKeys = [
    'campus_name',
    'lost_found_desk_location',
    'desk_office_hours',
    'support_email',
    'require_moderation_approval',
    'allow_new_registrations',
    'claim_hold_days',
  ];

  await withTransaction(async (conn) => {
    for (const [key, val] of Object.entries(settingsPayload)) {
      if (!allowedKeys.includes(key)) continue;
      const strVal = String(val ?? '').slice(0, 500);
      await conn.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
        [key, strVal, adminId]
      );
    }

    await recordAdminAction(conn, {
      adminId,
      action: 'SETTINGS_UPDATED',
      targetType: 'SYSTEM',
      targetId: null,
      details: `Updated system settings: ${Object.keys(settingsPayload)
        .filter((k) => allowedKeys.includes(k))
        .join(', ')}`,
    });
  });

  return getSettings();
}

async function sendAnnouncement(adminId, { title, message }) {
  const activeUsers = await query(`SELECT id FROM users WHERE account_status = 'ACTIVE'`);
  await withTransaction(async (conn) => {
    for (const u of activeUsers) {
      await notificationService.createNotification(conn, {
        userId: u.id,
        title,
        message,
        type: 'ANNOUNCEMENT',
      });
    }
    await recordAdminAction(conn, {
      adminId,
      action: 'ANNOUNCEMENT_BROADCAST',
      targetType: 'SYSTEM',
      targetId: null,
      details: `Broadcast announcement "${title}" to ${activeUsers.length} active users`,
    });
  });
  return { recipientCount: activeUsers.length };
}

module.exports = {
  getDashboardStats,
  listUsers,
  updateUserStatus,
  listAllItems,
  approveItem,
  rejectItem,
  markItemReturned,
  deleteItemAsAdmin,
  listAllClaims,
  approveClaim,
  rejectClaim,
  completeClaimReturn,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listActivityLogs,
  getSettings,
  updateSettings,
  sendAnnouncement,
};

