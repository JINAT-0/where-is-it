const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { AppError } = require('../utils/apiResponse');

const SALT_ROUNDS = 10;

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    university_id: row.university_id,
    department: row.department,
    role: row.role,
    account_status: row.account_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function register({ full_name, email, university_id, department, role, password }) {
  const normalizedRole = ['STUDENT', 'FACULTY', 'STAFF'].includes(role) ? role : 'STUDENT';

  const existingEmail = await query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  if (existingEmail.length > 0) {
    throw new AppError('An account with this university email already exists.', 409);
  }

  const existingUniId = await query(`SELECT id FROM users WHERE university_id = ? LIMIT 1`, [
    university_id,
  ]);
  if (existingUniId.length > 0) {
    throw new AppError('An account with this University ID already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO users (full_name, email, university_id, department, role, password_hash, account_status)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [full_name, email, university_id, department, normalizedRole, passwordHash]
  );

  const created = await query(
    `SELECT id, full_name, email, university_id, department, role, account_status, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [result.insertId]
  );

  return sanitizeUser(created[0]);
}

async function login({ email, password }) {
  const rows = await query(
    `SELECT id, full_name, email, university_id, department, role, password_hash, account_status, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = rows[0];
  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.account_status === 'SUSPENDED') {
    throw new AppError(
      'Your account has been suspended. Please contact the campus administrator.',
      403
    );
  }

  return sanitizeUser(user);
}

module.exports = {
  sanitizeUser,
  register,
  login,
};

