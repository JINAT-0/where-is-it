const adminService = require('../services/adminService');
const { sendSuccess } = require('../utils/apiResponse');

async function getDashboard(req, res, next) {
  try {
    const data = await adminService.getDashboardStats();
    return sendSuccess(res, {
      message: 'Admin dashboard statistics fetched successfully.',
      data,
    });
  } catch (err) {
    return next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.query);
    return sendSuccess(res, {
      message: 'Users fetched successfully.',
      data: { users: result.users },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await adminService.updateUserStatus(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body.account_status
    );
    return sendSuccess(res, {
      message: `User account ${user.account_status === 'ACTIVE' ? 'reactivated' : 'suspended'} successfully.`,
      data: { user },
    });
  } catch (err) {
    return next(err);
  }
}

async function listItems(req, res, next) {
  try {
    const result = await adminService.listAllItems(req.query);
    return sendSuccess(res, {
      message: 'All reports fetched successfully.',
      data: { items: result.items },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function approveItem(req, res, next) {
  try {
    const item = await adminService.approveItem(req.user.id, parseInt(req.params.id, 10));
    return sendSuccess(res, {
      message: 'Report approved successfully.',
      data: { item },
    });
  } catch (err) {
    return next(err);
  }
}

async function rejectItem(req, res, next) {
  try {
    const item = await adminService.rejectItem(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body.rejection_reason
    );
    return sendSuccess(res, {
      message: 'Report rejected successfully.',
      data: { item },
    });
  } catch (err) {
    return next(err);
  }
}

async function markItemReturned(req, res, next) {
  try {
    const item = await adminService.markItemReturned(req.user.id, parseInt(req.params.id, 10));
    return sendSuccess(res, {
      message: 'Item marked as RETURNED successfully.',
      data: { item },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    await adminService.deleteItemAsAdmin(req.user.id, parseInt(req.params.id, 10));
    return sendSuccess(res, { message: 'Report deleted successfully.' });
  } catch (err) {
    return next(err);
  }
}

async function listClaims(req, res, next) {
  try {
    const result = await adminService.listAllClaims(req.query);
    return sendSuccess(res, {
      message: 'Claims fetched successfully.',
      data: { claims: result.claims },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function approveClaim(req, res, next) {
  try {
    const claim = await adminService.approveClaim(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body.admin_notes
    );
    return sendSuccess(res, {
      message: 'Ownership claim approved successfully.',
      data: { claim },
    });
  } catch (err) {
    return next(err);
  }
}

async function rejectClaim(req, res, next) {
  try {
    const claim = await adminService.rejectClaim(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body.admin_notes
    );
    return sendSuccess(res, {
      message: 'Ownership claim rejected.',
      data: { claim },
    });
  } catch (err) {
    return next(err);
  }
}

async function completeClaimReturn(req, res, next) {
  try {
    const claim = await adminService.completeClaimReturn(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body.admin_notes
    );
    return sendSuccess(res, {
      message: 'Item return confirmed and claim completed.',
      data: { claim },
    });
  } catch (err) {
    return next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await adminService.listCategories();
    return sendSuccess(res, {
      message: 'Categories fetched successfully.',
      data: { categories },
    });
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await adminService.createCategory(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Category created successfully.',
      data: { category },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await adminService.updateCategory(
      req.user.id,
      parseInt(req.params.id, 10),
      req.body
    );
    return sendSuccess(res, {
      message: 'Category updated successfully.',
      data: { category },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await adminService.deleteCategory(req.user.id, parseInt(req.params.id, 10));
    return sendSuccess(res, { message: 'Category deleted successfully.' });
  } catch (err) {
    return next(err);
  }
}

async function listActivityLogs(req, res, next) {
  try {
    const result = await adminService.listActivityLogs(req.query);
    return sendSuccess(res, {
      message: 'Activity logs fetched successfully.',
      data: { logs: result.logs },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await adminService.getSettings();
    return sendSuccess(res, {
      message: 'System settings fetched successfully.',
      data: { settings },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = await adminService.updateSettings(req.user.id, req.body.settings || {});
    return sendSuccess(res, {
      message: 'System settings saved successfully.',
      data: { settings },
    });
  } catch (err) {
    return next(err);
  }
}

async function broadcastAnnouncement(req, res, next) {
  try {
    const result = await adminService.sendAnnouncement(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: `Announcement sent to ${result.recipientCount} active campus users.`,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getDashboard,
  listUsers,
  updateUserStatus,
  listItems,
  approveItem,
  rejectItem,
  markItemReturned,
  deleteItem,
  listClaims,
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
  broadcastAnnouncement,
};

