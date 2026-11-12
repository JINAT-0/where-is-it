const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { updateProfileValidator, changePasswordValidator } = require('../validators/userValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', userController.getDashboard);
router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidator, validate, userController.updateProfile);
router.put('/change-password', changePasswordValidator, validate, userController.changePassword);

module.exports = router;

