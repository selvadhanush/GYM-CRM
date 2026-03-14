const express = require('express');
const router = express.Router();
const {
    addPayment,
    getPayments,
    getMemberPayments,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist'), getPayments)
    .post(protect, authorize('admin', 'receptionist'), addPayment);

router.get('/member/:memberId', protect, authorize('admin', 'receptionist'), getMemberPayments);

module.exports = router;
