const { body } = require('express-validator');

const registerValidator = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('University email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('university_id')
    .trim()
    .notEmpty()
    .withMessage('University ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('University ID must be between 3 and 50 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('University ID may only contain letters, numbers, hyphens, and underscores'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Department must be between 2 and 120 characters'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .toUpperCase()
    .isIn(['STUDENT', 'FACULTY', 'STAFF'])
    .withMessage('Role must be STUDENT, FACULTY, or STAFF'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage('Password must include at least one letter and one number'),
  body('confirm_password')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  registerValidator,
  loginValidator,
};

