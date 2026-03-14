const Member = require('../models/Member');
const Plan = require('../models/Plan');
const User = require('../models/User');

// @desc    Create a new member
// @route   POST /api/members
// @access  Private/Admin
const createMember = async (req, res) => {
    const { name, phone, email, planId, joinDate, branchId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }

    const startDate = joinDate ? new Date(joinDate) : new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(startDate.getDate() + plan.duration);

    const status = expiryDate < new Date() ? 'Expired' : 'Active';

    const member = await Member.create({
        name,
        phone,
        email,
        planId,
        joinDate: startDate,
        expiryDate,
        status,
        planPrice: plan.price,
        paidAmount: 0,
        gymId: req.user.gymId,
        branchId: branchId || null
    });

    if (member) {
        // Create a User record for the member to allow login
        // Default password is their phone number
        await User.create({
            name: member.name,
            email: member.email || `${member.phone}@gym.com`,
            password: member.phone,
            role: 'member',
            gymId: req.user.gymId,
            memberId: member._id
        });

        res.status(201).json(member);
    } else {
        res.status(400);
        throw new Error('Invalid member data');
    }
};

// @desc    Get all members with pagination and filters
// @route   GET /api/members
// @access  Private/Admin
const getMembers = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search = '' } = req.query;

        const query = { gymId: req.user.gymId };

        // Auto-update status for members whose expiry date has passed
        const now = new Date();
        await Member.updateMany(
            { gymId: req.user.gymId, status: 'Active', expiryDate: { $lt: now } },
            { status: 'Expired' }
        );

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const total = await Member.countDocuments(query);
        const members = await Member.find(query)
            .populate('planId', 'name price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        res.json({
            members,
            page: Number(page),
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Get Members Error:', error);
        res.status(500).json({ message: 'Error fetching members', error: error.message });
    }
};

// @desc    Get members expiring soon (within 7 days)
// @route   GET /api/members/expiring-soon
// @access  Private/Admin
const getExpiringSoonMembers = async (req, res) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const members = await Member.find({
        gymId: req.user.gymId,
        status: 'Active',
        expiryDate: { $gte: today, $lte: nextWeek }
    }).populate('planId', 'name price').lean();

    res.json(members);
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private/Admin
const getMemberById = async (req, res) => {
    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId })
        .populate('planId', 'name price')
        .lean();

    if (member) {
        res.json(member);
    } else {
        res.status(404);
        throw new Error('Member not found');
    }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private/Admin
const updateMember = async (req, res) => {
    const { name, phone, email, planId, status, joinDate, branchId } = req.body;

    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId });

    if (member) {
        if (planId && planId !== member.planId.toString()) {
            const plan = await Plan.findOne({ _id: planId, gymId: req.user.gymId });
            if (!plan) {
                res.status(404);
                throw new Error('Plan not found');
            }
            member.planId = planId;
            // Recalculate expiry if plan changes
            const startDate = joinDate ? new Date(joinDate) : new Date(member.joinDate);
            const expiryDate = new Date(startDate);
            expiryDate.setDate(startDate.getDate() + plan.duration);
            member.expiryDate = expiryDate;
            member.status = expiryDate < new Date() ? 'Expired' : 'Active';
        }

        member.name = name || member.name;
        member.phone = phone || member.phone;
        member.email = email || member.email;
        if (status) member.status = status;
        // Allow explicitly setting branchId (null to unassign, id to assign)
        if (branchId !== undefined) member.branchId = branchId || null;

        const updatedMember = await member.save();
        res.json(updatedMember);
    } else {
        res.status(404);
        throw new Error('Member not found');
    }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private/Admin
const deleteMember = async (req, res) => {
    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId });

    if (member) {
        await member.deleteOne();
        res.json({ message: 'Member removed' });
    } else {
        res.status(404);
        throw new Error('Member not found');
    }
};

const { jsonToCsv } = require('../utils/csvUtils');

// @desc    Export members as CSV
// @route   GET /api/members/export/csv
// @access  Private/Admin
const exportMembersCSV = async (req, res) => {
    const members = await Member.find({ gymId: req.user.gymId }).populate('planId', 'name').lean();

    const formattedData = members.map(m => ({
        Name: m.name,
        Phone: m.phone,
        Email: m.email || '',
        Plan: m.planId?.name || '',
        Expiry: m.expiryDate.toISOString().split('T')[0],
        Status: m.status
    }));

    const csv = jsonToCsv(formattedData, ['Name', 'Phone', 'Email', 'Plan', 'Expiry', 'Status']);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
    res.status(200).send(csv);
};

module.exports = {
    createMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember,
    getExpiringSoonMembers,
    exportMembersCSV,
};
