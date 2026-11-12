const userService = require('../services/userService');
const { sendSuccess } = require('../utils/apiResponse');

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    return sendSuccess(res, {
      message: 'Profile fetched successfully.',
      data: { user },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, {
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    await userService.changePassword(req.user.id, req.body);
    return sendSuccess(res, {
      message: 'Password changed successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const dashboard = await userService.getUserDashboard(req.user.id);
    return sendSuccess(res, {
      message: 'Dashboard data fetched successfully.',
      data: dashboard,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getDashboard,
};

