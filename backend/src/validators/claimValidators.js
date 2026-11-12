const { body, param } = require('express-validator');

const claimIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid claim ID'),
];

const createClaimValidator = [
  body('item_id')
    .notEmpty()
    .withMessage('Item ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid item ID'),
  body('explanation')
    .trim()
    .notEmpty()
    .withMessage('Explanation of ownership is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Explanation must be between 10 and 2000 characters'),
  body('identifying_details')
    .trim()
    .notEmpty()
    .withMessage('Identifying details are required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Identifying details must be between 5 and 2000 characters'),
];

module.exports = {
  claimIdParamValidator,
  createClaimValidator,
};

