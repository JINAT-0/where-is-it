const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const { generateToken } = require('../middleware/csrf');

function setSessionUser(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenErr) => {
      if (regenErr) return reject(regenErr);
      req.session.userId = userId;
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        return resolve();
      });
    });
  });
}

async function getCsrfToken(req, res, next) {
  try {
    const token = generateToken(req, res, true);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'CSRF token generated',
      data: { csrfToken: token },
    });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    await setSessionUser(req, user.id);
    const csrfToken = generateToken(req, res, true);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Account registered successfully.',
      data: { user, csrfToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.login(req.body);
    await setSessionUser(req, user.id);
    const csrfToken = generateToken(req, res, true);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Logged in successfully.',
      data: { user, csrfToken },
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (!req.session) {
      const csrfToken = generateToken(req, res, true);
      return sendSuccess(res, {
        message: 'Logged out successfully.',
        data: { csrfToken },
      });
    }
    req.session.destroy((err) => {
      if (err) return next(err);
      req.session = null;
      res.clearCookie('where_is_it.sid', { path: '/' });
      const csrfToken = generateToken(req, res, true);
      return sendSuccess(res, {
        message: 'Logged out successfully.',
        data: { csrfToken },
      });
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Current user fetched.',
    data: { user: req.user },
  });
}

module.exports = {
  getCsrfToken,
  register,
  login,
  logout,
  me,
};
