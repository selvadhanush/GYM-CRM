const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getMemberAttendance,
    getTodayAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'trainer', 'h4_admin'), markAttendance);

router.get('/today', protect, authorize('admin', 'trainer', 'h4_admin'), getTodayAttendance);
router.get('/member/:memberId', protect, authorize('admin', 'trainer', 'h4_admin'), getMemberAttendance);

module.exports = router;
