const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs for a gym
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
    try {
        const { action, userId, entity, entityId, entityName, limit = 100, page = 1 } = req.query;
        const filter = {};
        if (req.user.role !== 'superadmin') {
            if (req.user.role === 'fitpass_admin') {
                const Gym = require('../models/Gym');
                const h4Gym = await Gym.findOne({ name: 'H4' });
                const h4GymId = h4Gym ? h4Gym._id.toString() : '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
                filter.gymId = { $ne: h4GymId };
            } else {
                filter.gymId = req.user.gymId;
            }
        }
        if (action) filter.action = action;
        if (userId) filter.userId = userId;
        if (entity) filter.entity = entity;
        if (entityId) filter.entityId = entityId;
        if (entityName) filter.entityName = entityName;


        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            AuditLog.countDocuments(filter)
        ]);

        res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching audit logs', error: err.message });
    }
};

// @desc    Get activity summary (counts by action type)
// @route   GET /api/audit/summary
// @access  Private/Admin
const getAuditSummary = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'superadmin') {
            if (req.user.role === 'fitpass_admin') {
                const Gym = require('../models/Gym');
                const h4Gym = await Gym.findOne({ name: 'H4' });
                const h4GymId = h4Gym ? h4Gym._id.toString() : '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
                filter = { gymId: { $ne: h4GymId } };
            } else {
                filter = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
            }
        }
        
        const summary = await AuditLog.aggregate([
            { $match: filter },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent logins
        const recentLogins = await AuditLog.find({ ...filter, action: 'LOGIN' })
            .sort({ createdAt: -1 }).limit(10).lean();

        res.json({ summary, recentLogins });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching audit summary', error: err.message });
    }
};

module.exports = { getAuditLogs, getAuditSummary };
