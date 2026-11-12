const { body } = require('express-validator');

const updateProfileValidator = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Department must be between 2 and 120 characters'),
  body('university_id')
    .trim()
    .notEmpty()
    .withMessage('University ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('University ID must be between 3 and 50 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('University ID may only contain letters, numbers, hyphens, and underscores'),
];

const changePasswordValidator = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage('New password must include at least one letter and one number')
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  body('confirm_password')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
};

