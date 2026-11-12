const express = require('express');
const { param } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth);

router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch(
  '/:id/read',
  [param('id').isInt({ min: 1 }).withMessage('Invalid notification ID')],
  validate,
  notificationController.markRead
);

module.exports = router;

