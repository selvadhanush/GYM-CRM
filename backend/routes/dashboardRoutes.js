const express = require('express');
const router = express.Router();
const { getDashboardStats, getHistory } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin', 'superadmin', 'partner'), getDashboardStats);
router.get('/history', protect, authorize('admin', 'superadmin', 'partner'), getHistory);

module.exports = router;
