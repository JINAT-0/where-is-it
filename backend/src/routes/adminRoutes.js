const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  idParamValidator,
  updateUserStatusValidator,
  rejectItemValidator,
  reviewClaimValidator,
  categoryValidator,
  updateSettingsValidator,
  announcementValidator,
} = require('../validators/adminValidators');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', adminController.getDashboard);

// User Management
router.get('/users', adminController.listUsers);
router.patch(
  '/users/:id/status',
  updateUserStatusValidator,
  validate,
  adminController.updateUserStatus
);

// Item Report Management
router.get('/items', adminController.listItems);
router.patch('/items/:id/approve', idParamValidator, validate, adminController.approveItem);
router.patch('/items/:id/reject', rejectItemValidator, validate, adminController.rejectItem);
router.patch('/items/:id/return', idParamValidator, validate, adminController.markItemReturned);
router.delete('/items/:id', idParamValidator, validate, adminController.deleteItem);

// Claim Management
router.get('/claims', adminController.listClaims);
router.patch('/claims/:id/approve', reviewClaimValidator, validate, adminController.approveClaim);
router.patch('/claims/:id/reject', reviewClaimValidator, validate, adminController.rejectClaim);
router.patch(
  '/claims/:id/complete',
  reviewClaimValidator,
  validate,
  adminController.completeClaimReturn
);

// Category Management
router.get('/categories', adminController.listCategories);
router.post('/categories', categoryValidator, validate, adminController.createCategory);
router.put(
  '/categories/:id',
  [...idParamValidator, ...categoryValidator],
  validate,
  adminController.updateCategory
);
router.delete('/categories/:id', idParamValidator, validate, adminController.deleteCategory);

// Activity Logs & Settings & Announcements
router.get('/activity-logs', adminController.listActivityLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', updateSettingsValidator, validate, adminController.updateSettings);
router.post(
  '/announcements',
  announcementValidator,
  validate,
  adminController.broadcastAnnouncement
);

module.exports = router;

