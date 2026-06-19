const express = require('express');
const router = express.Router();
const {
    checkInTrainer,
    checkOutTrainer,
    getTrainerAttendance
} = require('../controllers/trainerAttendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer'), getTrainerAttendance);

router.post('/checkin', protect, checkInTrainer);
router.post('/checkout', protect, checkOutTrainer);

module.exports = router;
