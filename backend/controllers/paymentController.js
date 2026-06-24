const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { logAudit } = require('../utils/auditLogger');

// @desc    Add a new payment
// @route   POST /api/payments
// @access  Private/Admin
const addPayment = async (req, res) => {
    const { memberId, amount, method, date } = req.body;

    // Tenant isolation: the member must belong to the caller's gym. Previously
    // this looked up by id alone, allowing a partner to post payments against
    // another gym's member.
    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
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
        await logAudit(req, 'PAYMENT_ADDED', 'Payment', payment._id,
            `Recorded ${method} payment of ${amount} from ${member.name}`, member.name);
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
