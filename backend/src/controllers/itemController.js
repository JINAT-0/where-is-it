const itemService = require('../services/itemService');
const { sendSuccess } = require('../utils/apiResponse');

async function listPublicItems(req, res, next) {
  try {
    const result = await itemService.listPublicItems(req.query);
    return sendSuccess(res, {
      message: 'Items fetched successfully.',
      data: { items: result.items },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function listMyItems(req, res, next) {
  try {
    const result = await itemService.listMyItems(req.user.id, req.query);
    return sendSuccess(res, {
      message: 'Your reports fetched successfully.',
      data: { items: result.items },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function getItemById(req, res, next) {
  try {
    const item = await itemService.getItemById(parseInt(req.params.id, 10), req.user || null);
    return sendSuccess(res, {
      message: 'Item fetched successfully.',
      data: { item },
    });
  } catch (err) {
    return next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const imageFilename = req.file ? req.file.filename : null;
    const item = await itemService.createItem(req.user.id, req.body, imageFilename);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Report submitted successfully and is pending admin review.',
      data: { item },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const newImageFilename = req.file ? req.file.filename : null;
    const item = await itemService.updateItem(
      parseInt(req.params.id, 10),
      req.user,
      req.body,
      newImageFilename
    );
    return sendSuccess(res, {
      message: 'Report updated successfully.',
      data: { item },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    await itemService.deleteItem(parseInt(req.params.id, 10), req.user);
    return sendSuccess(res, {
      message: 'Report deleted successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listPublicItems,
  listMyItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};

