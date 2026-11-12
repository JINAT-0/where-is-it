const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const itemRoutes = require('./itemRoutes');
const claimRoutes = require('./claimRoutes');
const notificationRoutes = require('./notificationRoutes');
const categoryRoutes = require('./categoryRoutes');
const adminRoutes = require('./adminRoutes');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

router.get('/health', (req, res) => {
  return sendSuccess(res, {
    message: 'Where Is It? API is healthy',
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/claims', claimRoutes);
router.use('/notifications', notificationRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

