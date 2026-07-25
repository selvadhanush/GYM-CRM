const express = require('express');
const router = express.Router();
const {
    checkInTrainer,
    checkOutTrainer,
    getTrainerAttendance
} = require('../controllers/trainerAttendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantFilter = require('../middleware/tenantFilter');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'h4_admin'), tenantFilter, getTrainerAttendance);

router.post('/checkin', protect, checkInTrainer);
router.post('/checkout', protect, checkOutTrainer);

module.exports = router;
