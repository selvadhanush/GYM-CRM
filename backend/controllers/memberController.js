const Member = require('../models/Member');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { jsonToCsv } = require('../utils/csvUtils');
const { logAudit } = require('../utils/auditLogger');

// Helper to dynamically build member query based on role restrictions
const buildMemberQuery = async (req, memberId) => {
    const query = {};
    if (memberId) {
        query._id = memberId;
    }

    if (req.user.role === 'superadmin') {
        return query;
    }

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
    return query;
};

// @desc    Create a new member
// @route   POST /api/members
// @access  Private/Admin
const createMember = async (req, res) => {
    try {
        const { name, phone, email, planId, joinDate, branchId, gymId } = req.body;

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

        const targetGymId = (req.user.role === 'superadmin' || req.user.role === 'fitpass_admin') 
            ? (gymId || req.user.gymId || 'public')
            : req.user.gymId;

        const targetBranchId = req.user.branchId || branchId || null;

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
            gymId: targetGymId,
            branchId: targetBranchId
        });

        if (member) {
            // Create a User record for the member to allow login
            // Default password is their phone number
            await User.create({
                name: member.name,
                email: emailCheck,
                password: member.phone,
                role: 'member',
                gymId: targetGymId,
                branchId: targetBranchId,
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
            if (req.user.gymId && req.user.gymId !== 'SYSTEM') {
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

        const query = await buildMemberQuery(req);
        query.status = 'Active';
        query.expiryDate = { $gte: today, $lte: nextWeek };

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
const getPlanById = async (req, res) => {
    // Legacy placeholder
};
const getMemberById = async (req, res) => {
    try {
        const query = await buildMemberQuery(req, req.params.id);
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
        const { name, phone, email, planId, status, joinDate, branchId, gymId, password } = req.body;

        const query = await buildMemberQuery(req, req.params.id);
        const member = await Member.findOne(query);

        if (member) {
            const oldPhone = member.phone;
            const originalGymId = member.gymId ? member.gymId.toString() : '';

            if (planId && planId !== member.planId.toString()) {
                const planQuery = { _id: planId };
                if (req.user.role !== 'superadmin' && req.user.role !== 'fitpass_admin') {
                    planQuery.gymId = req.user.gymId;
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
            
            let divisionSwitched = false;
            let oldDivision = '';
            let newDivision = '';

            if ((req.user.role === 'superadmin' || req.user.role === 'fitpass_admin') && gymId && gymId !== originalGymId) {
                const Gym = require('../models/Gym');
                const h4Gym = await Gym.findOne({ name: 'H4' });
                const h4GymId = h4Gym ? h4Gym._id.toString() : '05a08fdf-7427-48a5-8b25-e18d5a5668cd';

                const wasH4 = originalGymId === h4GymId;
                const isH4 = gymId === h4GymId;
                
                if (wasH4 !== isH4) {
                    divisionSwitched = true;
                    oldDivision = wasH4 ? 'H4 Gym Member' : 'FitPass Member';
                    newDivision = isH4 ? 'H4 Gym Member' : 'FitPass Member';
                }
            }

            if (req.user.role === 'superadmin' || req.user.role === 'fitpass_admin') {
                if (gymId !== undefined) member.gymId = gymId;
            }
            if (branchId !== undefined) {
                member.branchId = req.user.branchId || branchId || null;
            }

            const updatedMember = await member.save();

            // Also update the associated User record to keep credentials and details in sync
            const user = await User.findOne({ memberId: member._id });
            if (user) {
                user.name = member.name;
                user.phone = member.phone;
                if (member.email) {
                    user.email = member.email.trim().toLowerCase();
                } else if (member.phone && user.email === `${oldPhone}@gym.com`) {
                    user.email = `${member.phone}@gym.com`;
                }
                if (password) {
                    user.password = password;
                }
                if (req.user.role === 'superadmin' || req.user.role === 'fitpass_admin') {
                    if (gymId !== undefined) user.gymId = gymId;
                }
                if (branchId !== undefined) {
                    user.branchId = req.user.branchId || branchId || null;
                }
                await user.save();
            }

            if (divisionSwitched) {
                await logAudit(req, 'MEMBER_DIVISION_SWITCHED', 'Member', member._id, `Switched division from ${oldDivision} to ${newDivision}`, member.name);
            } else {
                await logAudit(req, 'MEMBER_UPDATED', 'Member', member._id, `Updated member: ${updatedMember.name}`, updatedMember.name);
            }
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
        const query = await buildMemberQuery(req, req.params.id);
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
        const query = await buildMemberQuery(req);
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

// @desc    Get complete audit trail for a member (financial status, plans, division switches)
// @route   GET /api/members/:id/audit
// @access  Private (Super Admin only)
const getMemberAuditTrail = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id).populate('planId', 'name price');
        if (!member) {
            res.status(404);
            throw new Error('Member not found');
        }

        // Get all payments for this member
        const Payment = require('../models/Payment');
        const payments = await Payment.find({ memberId: member._id.toString() }).sort({ date: -1 }).lean();

        // Get all audit logs relating to this member
        const AuditLog = require('../models/AuditLog');
        const auditLogs = await AuditLog.find({
            $or: [
                { entityId: member._id.toString() },
                { entityName: member.name }
            ]
        }).sort({ createdAt: -1 }).lean();

        // Calculate pending payments
        const planPrice = member.planPrice || (member.planId ? member.planId.price : 0);
        const pendingAmount = Math.max(0, planPrice - member.paidAmount);

        // Fetch gym name
        const Gym = require('../models/Gym');
        const gym = await Gym.findById(member.gymId);
        const gymName = gym ? gym.name : 'Unknown Gym';

        // Check when division switches happened from audit logs
        const divisionSwitches = auditLogs
            .filter(log => log.action === 'MEMBER_DIVISION_SWITCHED')
            .map(log => ({
                details: log.details,
                timestamp: log.createdAt,
                performedBy: log.userName
            }));

        res.json({
            member: {
                id: member._id,
                name: member.name,
                email: member.email,
                phone: member.phone,
                joinDate: member.joinDate,
                joinMonth: new Date(member.joinDate).toLocaleString('default', { month: 'long', year: 'numeric' }),
                status: member.status,
                gymId: member.gymId,
                gymName: gymName,
                branchId: member.branchId,
                currentPlan: member.planId ? {
                    id: member.planId._id,
                    name: member.planId.name,
                    price: planPrice
                } : null,
                financials: {
                    planPrice: planPrice,
                    paidAmount: member.paidAmount,
                    pendingAmount: pendingAmount,
                    totalPaymentsCount: payments.length
                }
            },
            payments,
            divisionSwitches,
            auditLogs
        });
    } catch (error) {
        console.error("GET MEMBER AUDIT TRAIL ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Renew a member's plan
// @route   POST /api/members/:id/renew
// @access  Private/Admin
const renewMember = async (req, res) => {
    try {
        const { planId, paidAmount = 0, method = 'Cash' } = req.body;
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const plan = await Plan.findById(planId || member.planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const now = new Date();
        const baseDate = member.expiryDate && new Date(member.expiryDate) > now ? new Date(member.expiryDate) : now;
        const newExpiry = new Date(baseDate);
        if (plan.duration) {
            newExpiry.setDate(newExpiry.getDate() + plan.duration);
        } else {
            newExpiry.setDate(newExpiry.getDate() + 30);
        }

        member.planId = plan._id;
        member.expiryDate = newExpiry;
        member.status = 'Active';
        member.planPrice = plan.price;

        if (plan.sessions) {
            member.sessionsRemaining = (member.sessionsRemaining || 0) + plan.sessions;
            member.sessionsTotal = (member.sessionsTotal || 0) + plan.sessions;
        }

        const numericPaid = Number(paidAmount) || 0;
        if (numericPaid > 0) {
            member.paidAmount = (member.paidAmount || 0) + numericPaid;
            const Payment = require('../models/Payment');
            await Payment.create({
                memberId: member._id,
                amount: numericPaid,
                method,
                date: now,
                gymId: member.gymId,
                branchId: member.branchId || null
            });
        }

        await member.save();
        await logAudit(req, 'MEMBER_RENEWED', 'Member', member._id, `Renewed plan '${plan.name}' for ${member.name}`, member.name);

        res.json({ success: true, member });
    } catch (error) {
        console.error("RENEW MEMBER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Transfer member to a different branch
// @route   PUT /api/members/:id/transfer
// @access  Private/Admin
const transferMember = async (req, res) => {
    try {
        const { targetBranchId } = req.body;
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        member.branchId = targetBranchId || null;
        await member.save();

        // Also update linked user account if exists
        await User.updateMany({ memberId: member._id }, { branchId: targetBranchId || null });

        await logAudit(req, 'MEMBER_TRANSFERRED', 'Member', member._id, `Transferred ${member.name} to branch ID ${targetBranchId}`, member.name);

        res.json({ success: true, member });
    } catch (error) {
        console.error("TRANSFER MEMBER ERROR:", error);
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
    getMemberAuditTrail,
    renewMember,
    transferMember,
};

