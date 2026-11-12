const { body, param } = require('express-validator');

const idParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid resource ID'),
];

const updateUserStatusValidator = [
  ...idParamValidator,
  body('account_status')
    .trim()
    .notEmpty()
    .withMessage('Account status is required')
    .toUpperCase()
    .isIn(['ACTIVE', 'SUSPENDED'])
    .withMessage('Account status must be ACTIVE or SUSPENDED'),
];

const rejectItemValidator = [
  ...idParamValidator,
  body('rejection_reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

const reviewClaimValidator = [
  ...idParamValidator,
  body('admin_notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters'),
];

const categoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Category name must be between 2 and 80 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
];

const updateSettingsValidator = [
  body('settings')
    .isObject()
    .withMessage('Settings payload must be an object'),
];

const announcementValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Announcement title is required')
    .isLength({ min: 3, max: 180 })
    .withMessage('Title must be between 3 and 180 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Announcement message is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Message must be between 5 and 2000 characters'),
];

module.exports = {
  idParamValidator,
  updateUserStatusValidator,
  rejectItemValidator,
  reviewClaimValidator,
  categoryValidator,
  updateSettingsValidator,
  announcementValidator,
};

