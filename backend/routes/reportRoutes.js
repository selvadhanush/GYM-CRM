const express = require('express');
const router = express.Router();
const { getRevenueReport, getExpenseReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'h4_admin'));

router.get('/revenue', getRevenueReport);
router.get('/expenses', getExpenseReport);

module.exports = router;
