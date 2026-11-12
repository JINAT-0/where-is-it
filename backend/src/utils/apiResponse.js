class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  const payload = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

function sendError(res, { statusCode = 500, message = 'Internal server error', errors = [] } = {}) {
  const payload = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  AppError,
  sendSuccess,
  sendError,
};

