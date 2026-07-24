const express = require('express');
const router = express.Router();
const {
    addPayment,
    getPayments,
    getMemberPayments,
    createRazorpayOrder,
    verifyRazorpayPayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'h4_admin'), getPayments)
    .post(protect, authorize('admin', 'receptionist', 'h4_admin'), addPayment);

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

router.get('/member/:memberId', protect, authorize('admin', 'receptionist', 'h4_admin'), getMemberPayments);

module.exports = router;

