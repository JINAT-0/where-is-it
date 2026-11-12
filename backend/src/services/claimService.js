const fs = require('fs');
const { query, withTransaction } = require('../config/db');
const { AppError } = require('../utils/apiResponse');
const { PRIVATE_EVIDENCE_DIR, safeResolveUploadPath } = require('../middleware/upload');
const notificationService = require('./notificationService');

function removePrivateEvidenceIfExists(filename) {
  if (!filename) return;
  const fullPath = safeResolveUploadPath(PRIVATE_EVIDENCE_DIR, filename);
  if (fullPath && fs.existsSync(fullPath)) {
    fs.unlink(fullPath, () => {});
  }
}

async function createClaim(
  userId,
  { item_id, explanation, identifying_details },
  evidenceFilename = null
) {
  const itemRows = await query(
    `SELECT id, user_id, item_name, report_type, moderation_status, resolution_status
     FROM items WHERE id = ? LIMIT 1`,
    [item_id]
  );

  if (itemRows.length === 0) {
    removePrivateEvidenceIfExists(evidenceFilename);
    throw new AppError('Item report not found.', 404);
  }

  const item = itemRows[0];

  if (item.moderation_status !== 'APPROVED') {
    removePrivateEvidenceIfExists(evidenceFilename);
    throw new AppError('Claims can only be submitted for approved reports.', 400);
  }

  if (item.report_type !== 'FOUND') {
    removePrivateEvidenceIfExists(evidenceFilename);
    throw new AppError('Ownership claims can only be submitted for FOUND item reports.', 400);
  }

  if (!['OPEN', 'MATCHED'].includes(item.resolution_status)) {
    removePrivateEvidenceIfExists(evidenceFilename);
    throw new AppError('This item is no longer open for ownership claims.', 400);
  }

  if (item.user_id === userId) {
    removePrivateEvidenceIfExists(evidenceFilename);
    throw new AppError('You cannot submit an ownership claim on your own report.', 400);
  }

  const duplicateRows = await query(
    `SELECT id, status FROM claims
     WHERE item_id = ? AND claimant_id = ? AND status IN ('PENDING', 'APPROVED')
     LIMIT 1`,
    [item_id, userId]
  );

  if (duplicateRows.length > 0) {
    removePrivateEvidenceIfExists(evidenceFilename);
    throw new AppError('You already have an active ownership claim for this item.', 409);
  }

  const claimId = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO claims (item_id, claimant_id, explanation, identifying_details, evidence_path, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [item_id, userId, explanation, identifying_details, evidenceFilename]
    );

    const insertedId = result.insertId;

    await notificationService.createNotification(conn, {
      userId,
      title: 'Ownership Claim Submitted',
      message: `Your ownership claim for "${item.item_name}" has been submitted and is awaiting administrator verification.`,
      type: 'CLAIM_SUBMITTED',
      relatedItemId: item.id,
      relatedClaimId: insertedId,
    });

    await notificationService.createNotification(conn, {
      userId: item.user_id,
      title: 'New Claim on Your Found Report',
      message: `Someone has submitted an ownership claim for "${item.item_name}". An administrator is reviewing the verification details.`,
      type: 'CLAIM_RECEIVED',
      relatedItemId: item.id,
      relatedClaimId: insertedId,
    });

    await notificationService.notifyAdmins(conn, {
      title: 'New Ownership Claim Pending Review',
      message: `A new ownership claim was submitted for found item "${item.item_name}".`,
      type: 'NEW_CLAIM_ADMIN',
      relatedItemId: item.id,
      relatedClaimId: insertedId,
    });

    return insertedId;
  });

  return getClaimById(claimId, { id: userId, role: 'STUDENT' });
}

async function listMyClaims(userId, { status = '', page = 1, limit = 10 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (safePage - 1) * safeLimit;

  const conditions = ['cl.claimant_id = ?'];
  const params = [userId];

  if (
    status &&
    ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'COMPLETED'].includes(
      String(status).toUpperCase()
    )
  ) {
    conditions.push('cl.status = ?');
    params.push(String(status).toUpperCase());
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`;
  const countRows = await query(`SELECT COUNT(*) AS total FROM claims cl ${whereSQL}`, params);

  const claims = await query(
    `SELECT
       cl.id, cl.item_id, cl.claimant_id, cl.explanation, cl.identifying_details,
       CASE WHEN cl.evidence_path IS NOT NULL THEN 1 ELSE 0 END AS has_evidence,
       cl.status, cl.admin_notes, cl.reviewed_at, cl.created_at, cl.updated_at,
       i.item_name, i.location, DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.image_path, i.resolution_status, c.name AS category_name
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     JOIN categories c ON c.id = i.category_id
     ${whereSQL}
     ORDER BY cl.created_at DESC, cl.id DESC
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

async function getClaimById(claimId, currentUser) {
  const rows = await query(
    `SELECT
       cl.id, cl.item_id, cl.claimant_id, cl.explanation, cl.identifying_details,
       cl.evidence_path, cl.status, cl.admin_notes, cl.reviewed_by, cl.reviewed_at,
       cl.created_at, cl.updated_at,
       i.item_name, i.location, DATE_FORMAT(i.event_date, '%Y-%m-%d') AS event_date,
       i.image_path, i.resolution_status, i.report_type,
       c.name AS category_name,
       u.full_name AS claimant_name, u.department AS claimant_department, u.role AS claimant_role
     FROM claims cl
     JOIN items i ON i.id = cl.item_id
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = cl.claimant_id
     WHERE cl.id = ?
     LIMIT 1`,
    [claimId]
  );

  if (rows.length === 0) {
    throw new AppError('Claim not found.', 404);
  }

  const claim = rows[0];
  const isClaimant = claim.claimant_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isClaimant && !isAdmin) {
    throw new AppError('You are not authorized to view private claim details.', 403);
  }

  return {
    id: claim.id,
    item_id: claim.item_id,
    claimant_id: claim.claimant_id,
    claimant_name: claim.claimant_name,
    claimant_department: claim.claimant_department,
    claimant_role: claim.claimant_role,
    explanation: claim.explanation,
    identifying_details: claim.identifying_details,
    has_evidence: Boolean(claim.evidence_path),
    evidence_url: claim.evidence_path ? `/api/v1/claims/${claim.id}/evidence` : null,
    status: claim.status,
    admin_notes: claim.admin_notes,
    reviewed_by: claim.reviewed_by,
    reviewed_at: claim.reviewed_at,
    item_name: claim.item_name,
    location: claim.location,
    event_date: claim.event_date,
    image_path: claim.image_path,
    resolution_status: claim.resolution_status,
    category_name: claim.category_name,
    created_at: claim.created_at,
    updated_at: claim.updated_at,
  };
}

async function getClaimEvidenceFile(claimId, currentUser) {
  const rows = await query(
    `SELECT id, claimant_id, evidence_path FROM claims WHERE id = ? LIMIT 1`,
    [claimId]
  );
  if (rows.length === 0) {
    throw new AppError('Claim not found.', 404);
  }
  const claim = rows[0];
  if (claim.claimant_id !== currentUser.id && currentUser.role !== 'ADMIN') {
    throw new AppError('Forbidden. Only the claimant or an administrator can access private evidence.', 403);
  }
  if (!claim.evidence_path) {
    throw new AppError('No evidence file was attached to this claim.', 404);
  }
  const resolved = safeResolveUploadPath(PRIVATE_EVIDENCE_DIR, claim.evidence_path);
  if (!resolved || !fs.existsSync(resolved)) {
    throw new AppError('Evidence file is no longer available on disk.', 404);
  }
  return resolved;
}

async function withdrawClaim(claimId, userId) {
  const rows = await query(`SELECT * FROM claims WHERE id = ? LIMIT 1`, [claimId]);
  if (rows.length === 0) {
    throw new AppError('Claim not found.', 404);
  }
  const claim = rows[0];
  if (claim.claimant_id !== userId) {
    throw new AppError('You are not authorized to withdraw this claim.', 403);
  }
  if (claim.status !== 'PENDING') {
    throw new AppError('Only pending claims can be withdrawn.', 400);
  }

  await query(`UPDATE claims SET status = 'WITHDRAWN' WHERE id = ?`, [claimId]);
  return getClaimById(claimId, { id: userId, role: 'STUDENT' });
}

module.exports = {
  createClaim,
  listMyClaims,
  getClaimById,
  getClaimEvidenceFile,
  withdrawClaim,
};

