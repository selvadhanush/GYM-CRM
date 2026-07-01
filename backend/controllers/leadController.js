const Lead = require('../models/Lead');
const Member = require('../models/Member');

// @desc    Get all leads for gym
// @route   GET /api/leads
const getLeads = async (req, res) => {
    try {
        const { status, source } = req.query;
        const filter = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) filter.branchId = req.user.branchId;
        if (status) filter.status = status;
        if (source) filter.source = source;

        const leads = await Lead.find(filter).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching leads', error: err.message });
    }
};

// @desc    Create a lead
// @route   POST /api/leads
const createLead = async (req, res) => {
    try {
        const { name, phone, email, source, interestedPlan, notes, followUpDate, assignedTo } = req.body;
        if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });

        const lead = await Lead.create({
            name, phone, email, source, interestedPlan, notes, followUpDate, assignedTo,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            branchId: req.user.branchId || null,
            status: 'New'
        });
        res.status(201).json(lead);
    } catch (err) {
        res.status(500).json({ message: 'Error creating lead', error: err.message });
    }
};

// @desc    Update lead status / details
// @route   PUT /api/leads/:id
const updateLead = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const lead = await Lead.findOne(query);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        const { name, phone, email, source, status, interestedPlan, notes, followUpDate, assignedTo } = req.body;
        if (name) lead.name = name;
        if (phone) lead.phone = phone;
        if (email !== undefined) lead.email = email;
        if (source) lead.source = source;
        if (status) lead.status = status;
        if (interestedPlan !== undefined) lead.interestedPlan = interestedPlan;
        if (notes !== undefined) lead.notes = notes;
        if (followUpDate !== undefined) lead.followUpDate = followUpDate || null;
        if (assignedTo !== undefined) lead.assignedTo = assignedTo;

        await lead.save();
        res.json(lead);
    } catch (err) {
        res.status(500).json({ message: 'Error updating lead', error: err.message });
    }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
const deleteLead = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const lead = await Lead.findOneAndDelete(query);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        res.json({ message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting lead', error: err.message });
    }
};

// @desc    Get lead pipeline summary (counts by status)
// @route   GET /api/leads/summary
const getLeadSummary = async (req, res) => {
    try {
        const matchStage = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) matchStage.branchId = req.user.branchId;

        const statusCounts = await Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const sourceCounts = await Lead.aggregate([
            { $match: matchStage },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        // Follow-up due today or overdue
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const followUpDue = await Lead.countDocuments({
            ...matchStage,
            followUpDate: { $lte: today },
            status: { $nin: ['Converted', 'Lost'] }
        });

        // Conversion rate
        const total = await Lead.countDocuments(matchStage);
        const converted = statusCounts.find(s => s._id === 'Converted')?.count || 0;
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

        res.json({ statusCounts, sourceCounts, followUpDue, total, converted, conversionRate });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching summary', error: err.message });
    }
};

module.exports = { getLeads, createLead, updateLead, deleteLead, getLeadSummary };
