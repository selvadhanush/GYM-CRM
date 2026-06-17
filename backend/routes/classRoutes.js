const express = require('express');
const router = express.Router();
const { getClasses, createClass, deleteClass, getClassBookings, adminBookClass, adminCancelBooking } = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'trainer', 'receptionist'), getClasses)
    .post(protect, authorize('admin', 'trainer'), createClass);

router.delete('/:id', protect, authorize('admin'), deleteClass);
router.get('/:id/bookings', protect, authorize('admin', 'trainer', 'receptionist'), getClassBookings);
router.post('/:id/book', protect, authorize('admin', 'trainer', 'receptionist'), adminBookClass);
router.delete('/:id/bookings/:memberId', protect, authorize('admin', 'trainer', 'receptionist'), adminCancelBooking);

module.exports = router;
