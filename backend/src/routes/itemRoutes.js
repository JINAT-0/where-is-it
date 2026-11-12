const express = require('express');
const itemController = require('../controllers/itemController');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { uploadItemImage } = require('../middleware/upload');
const {
  itemIdParamValidator,
  createItemValidator,
  updateItemValidator,
} = require('../validators/itemValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', itemController.listPublicItems);
router.get('/my', requireAuth, itemController.listMyItems);
router.get('/:id', optionalAuth, itemIdParamValidator, validate, itemController.getItemById);

router.post(
  '/',
  requireAuth,
  uploadItemImage,
  createItemValidator,
  validate,
  itemController.createItem
);

router.put(
  '/:id',
  requireAuth,
  uploadItemImage,
  updateItemValidator,
  validate,
  itemController.updateItem
);

router.delete('/:id', requireAuth, itemIdParamValidator, validate, itemController.deleteItem);

module.exports = router;

