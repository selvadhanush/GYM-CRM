const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Get logged in member profile/plan
// @route   GET /api/member-portal/plan
// @access  Private/Member
const getMyPlan = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const member = await Member.findById(req.user.memberId).populate('planId');
    if (!member) {
        res.status(404);
        throw new Error('Member profile not found');
    }

    res.json(member);
};

// @desc    Get logged in member attendance
// @route   GET /api/member-portal/attendance
// @access  Private/Member
const getMyAttendance = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const attendance = await Attendance.find({ memberId: req.user.memberId }).sort({ date: -1 });
    res.json(attendance);
};

// @desc    Get logged in member payments
// @route   GET /api/member-portal/payments
// @access  Private/Member
const getMyPayments = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const payments = await Payment.find({ memberId: req.user.memberId }).sort({ date: -1 });
    res.json(payments);
};

// @desc    Create Razorpay Order
// @route   POST /api/member-portal/payment/create-order
// @access  Private/Member
const createRazorpayOrder = async (req, res) => {
    try {
        console.log('create-order called. req.user:', req.user);

        if (!req.user?.memberId) {
            return res.status(403).json({ message: 'Not authorized as a member (no memberId in token)' });
        }

        const member = await Member.findById(req.user.memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        console.log('Member found:', { id: member._id, planPrice: member.planPrice, paidAmount: member.paidAmount });

        const amountDue = (member.planPrice || 0) - (member.paidAmount || 0);
        console.log('Amount due (INR):', amountDue);

        if (amountDue <= 0) {
            return res.status(400).json({ message: 'No dues pending for this member' });
        }

        // --- PARTIAL PAYMENT: use custom amount from request body ---
        let paymentAmount = Number(req.body.amount);
        if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
            // fallback to full due amount if not provided
            paymentAmount = amountDue;
        }
        if (paymentAmount > amountDue) {
            return res.status(400).json({ message: `Amount ₹${paymentAmount} exceeds total due ₹${amountDue}` });
        }

        const amountInPaise = Math.round(paymentAmount * 100);
        if (amountInPaise < 100) {
            return res.status(400).json({ message: `Amount too small: ₹${paymentAmount}. Minimum is ₹1.` });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${member._id.toString().slice(-6)}_${Date.now()}`,
            notes: { paymentAmount: paymentAmount, memberId: member._id.toString() },
        };

        console.log('Razorpay Order Options:', options);

        const order = await instance.orders.create(options);
        console.log('Razorpay Order created:', order.id);
        res.status(201).json(order);
    } catch (error) {
        console.error('RAZORPAY CREATE-ORDER ERROR:', JSON.stringify(error, null, 2));
        res.status(500).json({
            message: 'Razorpay order creation failed',
            error: error.message || String(error),
            details: error.error?.description || error.description || 'Check server logs for details'
        });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/member-portal/payment/verify
// @access  Private/Member
const verifyRazorpayPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_paid } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        const member = await Member.findById(req.user.memberId);

        // Use the actual amount paid (partial or full)
        const amountPaid = Number(amount_paid) || (member.planPrice - member.paidAmount);

        // Create Payment record
        await Payment.create({
            memberId: member._id,
            gymId: member.gymId,
            amount: amountPaid,
            method: 'Online (Razorpay)',
            date: new Date(),
            transactionId: razorpay_payment_id
        });

        // Increment paidAmount by the partial amount paid
        member.paidAmount = Math.min(member.paidAmount + amountPaid, member.planPrice);
        // Mark active only if fully paid
        if (member.paidAmount >= member.planPrice) {
            member.status = 'Active';
        }
        await member.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified and recorded successfully',
            amountPaid,
            remainingDue: member.planPrice - member.paidAmount
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Payment verification failed'
        });
    }
};

module.exports = {
    getMyPlan,
    getMyAttendance,
    getMyPayments,
    createRazorpayOrder,
    verifyRazorpayPayment
};
