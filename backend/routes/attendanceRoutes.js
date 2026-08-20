const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getMemberAttendance,
    getTodayAttendance,
    markAttendanceByIdentityController,
    lookupIdentityController
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantFilter = require('../middleware/tenantFilter');

router.route('/')
    .post(protect, authorize('admin', 'trainer', 'h4_admin', 'receptionist', 'partner'), tenantFilter, markAttendance);

router.post('/checkin-identity', protect, authorize('admin', 'trainer', 'h4_admin', 'receptionist', 'partner'), tenantFilter, markAttendanceByIdentityController);
router.get('/lookup-identity/:registrationNumber', protect, authorize('admin', 'trainer', 'h4_admin', 'receptionist', 'partner'), tenantFilter, lookupIdentityController);

router.get('/today', protect, authorize('admin', 'trainer', 'h4_admin', 'receptionist', 'partner'), tenantFilter, getTodayAttendance);
router.get('/member/:memberId', protect, authorize('admin', 'trainer', 'h4_admin', 'receptionist', 'partner'), tenantFilter, getMemberAttendance);

module.exports = router;
