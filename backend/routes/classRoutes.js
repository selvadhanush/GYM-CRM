const express = require('express');
const router = express.Router();
const { getClasses, createClass, deleteClass, getClassBookings, adminBookClass, adminCancelBooking } = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantFilter = require('../middleware/tenantFilter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const createClassSchema = z.object({
    className: z.string().min(1, 'Class name is required').max(100),
    trainerName: z.string().min(1, 'Trainer name is required'),
    scheduleDate: z.string().min(1, 'Schedule date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    maxCapacity: z.number().min(1, 'Capacity must be at least 1')
});

const bookClassSchema = z.object({
    memberId: z.string().min(1, 'Member ID is required')
});

router.route('/')
    .get(protect, authorize('admin', 'trainer', 'receptionist'), tenantFilter, getClasses)
    .post(protect, authorize('admin', 'trainer'), validate({ body: createClassSchema }), createClass);

router.delete('/:id', protect, authorize('admin'), deleteClass);
router.get('/:id/bookings', protect, authorize('admin', 'trainer', 'receptionist'), getClassBookings);
router.post('/:id/book', protect, authorize('admin', 'trainer', 'receptionist'), validate({ body: bookClassSchema }), adminBookClass);
router.delete('/:id/bookings/:memberId', protect, authorize('admin', 'trainer', 'receptionist'), adminCancelBooking);

module.exports = router;
