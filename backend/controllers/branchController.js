const Branch = require('../models/Branch');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all branches for a gym
// @route   GET /api/branches
const getBranches = async (req, res) => {
    try {
        const query = { gymId: req.user.gymId };
        if (req.user.branchId) {
            query._id = req.user.branchId;
        }
        const branches = await Branch.find(query).lean();

        // Attach member/revenue counts per branch
        const enriched = await Promise.all(branches.map(async (b) => {
            const memberCount = await Member.countDocuments({ gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }), branchId: b._id });
            const revenueAgg = await Payment.aggregate([
                { $match: { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }), branchId: b._id } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return { ...b, memberCount, totalRevenue: revenueAgg[0]?.total || 0 };
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching branches', error: err.message });
    }
};

const createBranch = async (req, res) => {
    try {
        if (req.user.branchId) {
            return res.status(403).json({ message: 'Branch administrators cannot create branches' });
        }
        const { name, address, phone, email, managerName, fitPassEnabled } = req.body;
        if (!name) return res.status(400).json({ message: 'Branch name is required' });

        const branch = await Branch.create({
            name,
            address,
            phone,
            email,
            managerName,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            fitPassEnabled: fitPassEnabled !== undefined ? fitPassEnabled : true
        });
        await logAudit(req, 'BRANCH_CREATED', 'Branch', branch._id, `Branch "${name}" created`, name);
        res.status(201).json(branch);
    } catch (err) {
        res.status(500).json({ message: 'Error creating branch', error: err.message });
    }
};

// @desc    Update a branch
// @route   PUT /api/branches/:id
const updateBranch = async (req, res) => {
    try {
        if (req.user.branchId) {
            return res.status(403).json({ message: 'Branch administrators cannot modify branches' });
        }
        const branch = await Branch.findOneAndUpdate(
            { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) },
            req.body,
            { new: true }
        );
        if (!branch) return res.status(404).json({ message: 'Branch not found' });
        await logAudit(req, 'BRANCH_UPDATED', 'Branch', branch._id, `Branch "${branch.name}" updated`, branch.name);
        res.json(branch);
    } catch (err) {
        res.status(500).json({ message: 'Error updating branch', error: err.message });
    }
};

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
const deleteBranch = async (req, res) => {
    try {
        if (req.user.branchId) {
            return res.status(403).json({ message: 'Branch administrators cannot delete branches' });
        }
        const branch = await Branch.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });
        if (!branch) return res.status(404).json({ message: 'Branch not found' });
        await logAudit(req, 'BRANCH_DELETED', 'Branch', branch._id, `Branch "${branch.name}" deleted`, branch.name);
        res.json({ message: 'Branch deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting branch', error: err.message });
    }
};

// @desc    Get members for a specific branch
// @route   GET /api/branches/:id/members
const getBranchMembers = async (req, res) => {
    try {
        if (req.user.branchId && req.user.branchId !== req.params.id) {
            return res.status(403).json({ message: 'Access denied to this branch\'s members' });
        }
        const members = await Member.find({ gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }), branchId: req.params.id })
            .populate('planId', 'name').sort({ createdAt: -1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching branch members', error: err.message });
    }
};

module.exports = { getBranches, createBranch, updateBranch, deleteBranch, getBranchMembers };
