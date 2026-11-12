const { query } = require('../config/db');
const { sendSuccess } = require('../utils/apiResponse');

async function listCategories(req, res, next) {
  try {
    const categories = await query(
      `SELECT id, name, description, created_at FROM categories ORDER BY name ASC`
    );
    return sendSuccess(res, {
      message: 'Categories fetched successfully.',
      data: { categories },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCategories,
};

