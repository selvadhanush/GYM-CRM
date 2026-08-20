const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { logAudit } = require('../utils/auditLogger');

// @desc    Add a new payment
// @route   POST /api/payments
// @access  Private/Admin
const addPayment = catchAsync(async (req, res, next) => {
    const { memberId, amount, method, date } = req.body;

    // Tenant isolation: the member must belong to the caller's gym.
    const memberQuery = { _id: memberId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
    if (req.user.branchId) {
        memberQuery.branchId = req.user.branchId;
    }
    const member = await Member.findOne(memberQuery);
    if (!member) {
        res.status(404);
        throw new Error('Member not found');
    }

    const payment = await Payment.create({
        memberId,
        amount: Number(amount),
        method,
        date: date ? new Date(date) : new Date(),
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        branchId: req.user.branchId || member.branchId || null
    });

    if (payment) {
        // Update member's paidAmount
        member.paidAmount += Number(amount);
        await member.save();
        await logAudit(req, 'PAYMENT_ADDED', 'Payment', payment._id,
            `Recorded ${method} payment of ${amount} from ${member.name}`, member.name);
        res.status(201).json(payment);
    } else {
        res.status(400);
        throw new Error('Invalid payment data');
    }
});

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = catchAsync(async (req, res, next) => {
    try {
        const query = { ...req.tenantFilter };
        // This table only grows over a gym's lifetime and has no date filter
        // on this route — cap it as a safety net against an unbounded scan/
        // response once a gym has years of payment history.
        const payments = await Payment.find(query)
            .populate('memberId', 'name phone')
            .sort({ createdAt: -1 })
            .limit(2000)
            .lean();
        res.json(payments);
    } catch (error) { next(error); }
});

// @desc    Get payment history for a specific member
// @route   GET /api/payments/member/:memberId
// @access  Private/Admin
const getMemberPayments = catchAsync(async (req, res, next) => {
    // IDOR Protection: Verify member belongs to authorized tenant scope
    const memberQuery = { _id: req.params.memberId, ...req.tenantFilter };
    const member = await Member.findOne(memberQuery);
    if (!member) {
        return res.status(404).json({ message: 'Member not found' });
    }

    const query = {
        memberId: req.params.memberId,
        ...req.tenantFilter
    };
    const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
    res.json(payments);
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/razorpay/order
// @access  Private
const createRazorpayOrder = catchAsync(async (req, res, next) => {
    try {
        const { amount, currency = 'INR', memberId } = req.body;
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        const isRealKey = keyId && keySecret && 
                          keyId !== 'your_razorpay_key_id' &&
                          keyId !== 'null' && keyId !== 'undefined' && keyId.trim() !== '' &&
                          !keyId.includes('your_') && !keySecret.includes('your_');
        const allowMock = process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_PAYMENTS === 'true';

        if (isRealKey) {
            const Razorpay = require('razorpay');
            const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
            const order = await instance.orders.create({
                amount: Math.round(Number(amount) * 100),
                currency,
                receipt: `rcpt_${Date.now()}`
            });
            return res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId });
        }

        if (!allowMock) {
            return res.status(503).json({
                success: false,
                message: 'Payment gateway configuration missing or invalid. Online payment unavailable.',
                error: 'RAZORPAY_KEYS_MISSING'
            });
        }

        // Mock mode when explicitly allowed in dev/test environment
        const crypto = require('crypto');
        const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
        res.json({
            success: true,
            orderId: mockOrderId,
            amount: Math.round(Number(amount) * 100),
            currency,
            keyId: keyId || 'rzp_test_placeholder',
            isMock: true
        });
    } catch (err) { next(err); }
});

// @desc    Verify Razorpay Payment Signature and Record Payment
// @route   POST /api/payments/razorpay/verify
// @access  Private
const verifyRazorpayPayment = catchAsync(async (req, res, next) => {
    try {
        const { memberId, amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const isMock = razorpayOrderId && razorpayOrderId.startsWith('order_mock_');
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const hasKeySecret = keySecret && keySecret !== 'null' && keySecret !== 'undefined' && keySecret.trim() !== '' && !keySecret.includes('your_');
        const allowMock = process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_PAYMENTS === 'true';

        if (isMock) {
            if (!allowMock) {
                return res.status(400).json({ success: false, message: 'Mock payments are disabled in production mode' });
            }
        } else {
            if (!hasKeySecret) {
                return res.status(503).json({ success: false, message: 'Payment verification failed: key secret missing' });
            }
            const crypto = require('crypto');
            const body = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(body.toString())
                .digest('hex');
            if (expectedSignature !== razorpaySignature) {
                return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
            }
        }

        const payment = await Payment.create({
            memberId: member._id,
            amount: Number(amount),
            method: 'Razorpay / Online',
            date: new Date(),
            transactionId: razorpayPaymentId || `pay_${Date.now()}`,
            gymId: member.gymId,
            branchId: member.branchId || null
        });

        member.paidAmount = (member.paidAmount || 0) + Number(amount);
        await member.save();

        await logAudit(req, 'PAYMENT_ADDED', 'Payment', payment._id, `Recorded online Razorpay payment of ₹${amount} for ${member.name}`, member.name);

        res.json({ success: true, payment });
    } catch (err) { next(err); }
});

module.exports = {
    addPayment,
    getPayments,
    getMemberPayments,
    createRazorpayOrder,
    verifyRazorpayPayment
};

