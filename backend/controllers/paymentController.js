const Payment = require('../models/Payment');
const Member = require('../models/Member');

// @desc    Add a new payment
// @route   POST /api/payments
// @access  Private/Admin
const addPayment = async (req, res) => {
    const { memberId, amount, method, date } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
        res.status(404);
        throw new Error('Member not found');
    }

    const payment = await Payment.create({
        memberId,
        amount: Number(amount),
        method,
        date: date ? new Date(date) : new Date(),
        gymId: req.user.gymId
    });

    if (payment) {
        // Update member's paidAmount
        member.paidAmount += Number(amount);
        await member.save();
        res.status(201).json(payment);
    } else {
        res.status(400);
        throw new Error('Invalid payment data');
    }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ gymId: req.user.gymId })
            .populate('memberId', 'name phone')
            .sort({ createdAt: -1 })
            .lean();
        res.json(payments);
    } catch (error) {
        console.error('Get Payments Error:', error);
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
};

// @desc    Get payment history for a specific member
// @route   GET /api/payments/member/:memberId
// @access  Private/Admin
const getMemberPayments = async (req, res) => {
    const payments = await Payment.find({
        memberId: req.params.memberId,
        gymId: req.user.gymId
    })
        .sort({ createdAt: -1 })
        .lean();
    res.json(payments);
};

module.exports = {
    addPayment,
    getPayments,
    getMemberPayments,
};
