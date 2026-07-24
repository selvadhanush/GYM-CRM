const express = require('express');
const router = express.Router();
const { getDashboardStats, getHistory } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin', 'superadmin', 'fitpass_admin', 'h4_admin'), getDashboardStats);
router.get('/history', protect, authorize('admin', 'superadmin', 'fitpass_admin', 'h4_admin'), getHistory);

module.exports = router;
