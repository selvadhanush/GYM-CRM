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
        let paymentAmount = req.body ? Number(req.body.amount) : NaN;
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

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const hasRazorpayKeys = keyId && keySecret && 
                                keyId !== 'null' && keyId !== 'undefined' && keyId.trim() !== '' &&
                                keySecret !== 'null' && keySecret !== 'undefined' && keySecret.trim() !== '';

        if (!hasRazorpayKeys) {
            console.log('Razorpay keys missing or invalid in .env. Returning a mock order for testing.');
            const mockOrder = {
                id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
                amount: amountInPaise,
                currency: "INR",
                receipt: `rcpt_${(member._id || member.id).toString().slice(-6)}_${Date.now()}`,
                status: "created",
                is_mock: true
            };
            return res.status(201).json(mockOrder);
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${(member._id || member.id).toString().slice(-6)}_${Date.now()}`,
            notes: { paymentAmount: paymentAmount, memberId: (member._id || member.id).toString() },
        };

        console.log('Razorpay Order Options:', options);

        const order = await instance.orders.create(options);
        console.log('Razorpay Order created:', order.id);
        res.status(201).json(order);
    } catch (error) {
        console.error('RAZORPAY CREATE-ORDER ERROR:', error);
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
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_paid } = req.body || {};

        if (!req.user?.memberId) {
            return res.status(403).json({ message: 'Not authorized as a member' });
        }

        const member = await Member.findById(req.user.memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
        let isAuthentic = false;

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const hasKeySecret = keySecret && keySecret !== 'null' && keySecret !== 'undefined' && keySecret.trim() !== '';

        if (isMock || !hasKeySecret) {
            isAuthentic = true;
        } else {
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(body.toString())
                .digest('hex');
            isAuthentic = expectedSignature === razorpay_signature;
        }

        if (isAuthentic) {
            // Use the actual amount paid (partial or full)
            const amountPaid = Number(amount_paid) || ((member.planPrice || 0) - (member.paidAmount || 0));

            // Create Payment record
            await Payment.create({
                memberId: member._id || member.id,
                gymId: member.gymId,
                amount: amountPaid,
                method: 'Online (Razorpay)',
                date: new Date(),
                transactionId: razorpay_payment_id || `txn_${crypto.randomBytes(8).toString('hex')}`
            });

            // Increment paidAmount by the partial amount paid
            member.paidAmount = Math.min((member.paidAmount || 0) + amountPaid, member.planPrice || 0);
            // Mark active only if fully paid
            if (member.paidAmount >= (member.planPrice || 0)) {
                member.status = 'Active';
            }
            await member.save();

            res.status(200).json({
                success: true,
                message: 'Payment verified and recorded successfully',
                amountPaid,
                remainingDue: (member.planPrice || 0) - member.paidAmount
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('PAYMENT VERIFICATION ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
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
