const Member = require('../models/Member');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { jsonToCsv } = require('../utils/csvUtils');
const { logAudit } = require('../utils/auditLogger');

// @desc    Create a new member
// @route   POST /api/members
// @access  Private/Admin
const createMember = async (req, res) => {
    try {
        const { name, phone, email, planId, joinDate, branchId } = req.body;

        if (!name || !phone || !planId) {
            res.status(400);
            return res.json({ success: false, message: 'Name, phone, and plan are required' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404);
            return res.json({ success: false, message: 'Plan not found' });
        }

        // Check if a user with this email or generated email already exists to prevent unique constraint crash
        const emailCheck = email ? email : `${phone}@gym.com`;
        const existingUser = await User.findOne({ email: emailCheck });
        if (existingUser) {
            res.status(400);
            return res.json({ 
                success: false, 
                message: `A user or member with the email or phone number (${emailCheck}) already exists` 
            });
        }

        const startDate = joinDate ? new Date(joinDate) : new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setDate(startDate.getDate() + plan.duration);

        const status = expiryDate < new Date() ? 'Expired' : 'Active';

        const member = await Member.create({
            name,
            phone,
            email: email || null,
            planId,
            joinDate: startDate,
            expiryDate,
            status,
            planPrice: plan.price,
            paidAmount: 0,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            branchId: req.user.branchId || branchId || null
        });

        if (member) {
            // Create a User record for the member to allow login
            // Default password is their phone number
            await User.create({
                name: member.name,
                email: emailCheck,
                password: member.phone,
                role: 'member',
                gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
                branchId: req.user.branchId || branchId || null,
                memberId: member._id
            });

            await logAudit(req, 'MEMBER_CREATED', 'Member', member._id, `Created member: ${member.name}`, member.name);
            res.status(201).json(member);
        } else {
            res.status(400).json({ success: false, message: 'Invalid member data' });
        }
    } catch (error) {
        console.error("CREATE MEMBER ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Get all members with pagination and filters
// @route   GET /api/members
// @access  Private/Admin
const getMembers = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search = '' } = req.query;

        const query = {};
        if (req.user.role === 'fitpass_admin') {
            const Gym = require('../models/Gym');
            const h4Gym = await Gym.findOne({ name: 'H4' });
            const h4GymId = h4Gym ? h4Gym._id.toString() : '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
            if (req.user.gymId && req.user.gymId !== 'SYSTEM') {
                query.gymId = req.user.gymId;
            } else {
                query.gymId = { $ne: h4GymId };
            }
        } else {
            if (req.user.gymId) {
                query.gymId = req.user.gymId;
            }
            if (req.user.branchId) {
                query.branchId = req.user.branchId;
            }
        }

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
    try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const query = {
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            status: 'Active',
            expiryDate: { $gte: today, $lte: nextWeek }
        };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }

        const members = await Member.find(query).populate('planId', 'name price').lean();

        res.json(members);
    } catch (error) {
        console.error("GET EXPIRING SOON MEMBERS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private/Admin
const getPlanById = async (req, res) => { // wait, wait, the original function is getMemberById but there is a typo in target content, let's keep getMemberById
};
const getMemberById = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const member = await Member.findOne(query)
            .populate('planId', 'name price')
            .lean();

        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ success: false, message: 'Member not found' });
        }
    } catch (error) {
        console.error("GET MEMBER BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private/Admin
const updateMember = async (req, res) => {
    try {
        const { name, phone, email, planId, status, joinDate, branchId } = req.body;

        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const member = await Member.findOne(query);

        if (member) {
            if (planId && planId !== member.planId.toString()) {
                const planQuery = { _id: planId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
                if (req.user.branchId) {
                    planQuery.branchId = req.user.branchId;
                }
                const plan = await Plan.findOne(planQuery);
                if (!plan) {
                    return res.status(404).json({ success: false, message: 'Plan not found' });
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
            if (branchId !== undefined) member.branchId = req.user.branchId || branchId || null;

            const updatedMember = await member.save();
            await logAudit(req, 'MEMBER_UPDATED', 'Member', member._id, `Updated member: ${updatedMember.name}`, updatedMember.name);
            res.json(updatedMember);
        } else {
            res.status(404).json({ success: false, message: 'Member not found' });
        }
    } catch (error) {
        console.error("UPDATE MEMBER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private/Admin
const deleteMember = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const member = await Member.findOne(query);

        if (member) {
            // Delete associated User record to prevent unique constraint conflicts
            await User.deleteMany({ memberId: member.id });

            await logAudit(req, 'MEMBER_DELETED', 'Member', member._id, `Deleted member: ${member.name}`, member.name);
            // Delete the member
            await member.deleteOne();
            res.json({ message: 'Member removed' });
        } else {
            res.status(404).json({ success: false, message: 'Member not found' });
        }
    } catch (error) {
        console.error("DELETE MEMBER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Export members as CSV
// @route   GET /api/members/export/csv
// @access  Private/Admin
const exportMembersCSV = async (req, res) => {
    try {
        const query = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const members = await Member.find(query).populate('planId', 'name').lean();

        const formattedData = members.map(m => ({
            Name: m.name,
            Phone: m.phone,
            Email: m.email || '',
            Plan: m.planId?.name || '',
            Expiry: m.expiryDate ? m.expiryDate.toISOString().split('T')[0] : '',
            Status: m.status
        }));

        const csv = jsonToCsv(formattedData, ['Name', 'Phone', 'Email', 'Plan', 'Expiry', 'Status']);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error("EXPORT MEMBERS CSV ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
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
