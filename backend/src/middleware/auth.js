const { query } = require('../config/db');
const { sendError } = require('../utils/apiResponse');

async function loadCurrentUser(req) {
  if (!req.session || !req.session.userId) {
    return null;
  }
  const rows = await query(
    `SELECT id, full_name, email, university_id, department, role, account_status, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [req.session.userId]
  );
  if (!rows || rows.length === 0) {
    return null;
  }
  return rows[0];
}

async function optionalAuth(req, res, next) {
  try {
    const user = await loadCurrentUser(req);
    if (user && user.account_status === 'ACTIVE') {
      req.user = user;
    } else if (user && user.account_status === 'SUSPENDED') {
      req.session.destroy(() => { });
      req.user = null;
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

async function requireAuth(req, res, next) {
  try {
    const user = await loadCurrentUser(req);
    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required. Please log in.',
      });
    }
    if (user.account_status === 'SUSPENDED') {
      req.session.destroy(() => { });
      res.clearCookie('where_is_it.sid', { path: '/' });
      return sendError(res, {
        statusCode: 403,
        message: 'Your account has been suspended. Please contact the campus administrator.',
      });
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required.',
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: 'Forbidden. You do not have permission to perform this action.',
      });
    }
    return next();
  };
}

const requireAdmin = requireRole('ADMIN');

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole,
  requireAdmin,
};