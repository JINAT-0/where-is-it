const { body, param } = require('express-validator');

const itemIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
];

const createItemValidator = [
  body('item_name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Item name must be between 2 and 150 characters'),
  body('category_id')
    .notEmpty()
    .withMessage('Category is required')
    .isInt({ min: 1 })
    .withMessage('Valid category is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 3000 })
    .withMessage('Description must be between 10 and 3000 characters'),
  body('report_type')
    .trim()
    .notEmpty()
    .withMessage('Report type is required')
    .toUpperCase()
    .isIn(['LOST', 'FOUND'])
    .withMessage('Report type must be LOST or FOUND'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 180 })
    .withMessage('Location must be between 2 and 180 characters'),
  body('event_date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601({ strict: true })
    .withMessage('Please enter a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const today = new Date().toISOString().slice(0, 10);
      if (value > today) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
  body('approximate_time')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Approximate time cannot exceed 50 characters'),
  body('contact_info')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 180 })
    .withMessage('Contact information cannot exceed 180 characters'),
];

const updateItemValidator = [
  ...itemIdParamValidator,
  body('item_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Item name must be between 2 and 150 characters'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid category is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 3000 })
    .withMessage('Description must be between 10 and 3000 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 180 })
    .withMessage('Location must be between 2 and 180 characters'),
  body('event_date')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('Please enter a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const today = new Date().toISOString().slice(0, 10);
      if (value > today) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
  body('approximate_time')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Approximate time cannot exceed 50 characters'),
  body('contact_info')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 180 })
    .withMessage('Contact information cannot exceed 180 characters'),
];

module.exports = {
  itemIdParamValidator,
  createItemValidator,
  updateItemValidator,
};

