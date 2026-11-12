const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  const formatted = result.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));
  return sendError(res, {
    statusCode: 400,
    message: 'Validation failed',
    errors: formatted,
  });
}

module.exports = validate;

