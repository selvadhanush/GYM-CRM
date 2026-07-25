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
const tenantFilter = require('../middleware/tenantFilter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const addPaymentSchema = z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    amount: z.number().min(0, 'Amount cannot be negative'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    paymentType: z.string().optional(),
    remarks: z.string().optional()
});

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'h4_admin'), tenantFilter, getPayments)
    .post(protect, authorize('admin', 'receptionist', 'h4_admin'), validate({ body: addPaymentSchema }), addPayment);

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

router.get('/member/:memberId', protect, authorize('admin', 'receptionist', 'h4_admin'), getMemberPayments);

module.exports = router;

