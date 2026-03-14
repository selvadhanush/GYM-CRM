const express = require('express');
const router = express.Router();
const { getMyPlan, getMyAttendance, getMyPayments, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/memberPortalController');
const { getMemberClasses, bookClass, cancelBooking } = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/plan', getMyPlan);
router.get('/attendance', getMyAttendance);
router.get('/payments', getMyPayments);

// Razorpay Payment Routes
router.post('/payment/create-order', createRazorpayOrder);
router.post('/payment/verify', verifyRazorpayPayment);

// Class Booking Routes (Member)
router.get('/classes', getMemberClasses);
router.post('/classes/:id/book', bookClass);
router.delete('/classes/:id/book', cancelBooking);

module.exports = router;
