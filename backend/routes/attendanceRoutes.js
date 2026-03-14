const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getMemberAttendance,
    getTodayAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'trainer'), markAttendance);

router.get('/today', protect, authorize('admin', 'trainer'), getTodayAttendance);
router.get('/member/:memberId', protect, authorize('admin', 'trainer'), getMemberAttendance);

module.exports = router;
