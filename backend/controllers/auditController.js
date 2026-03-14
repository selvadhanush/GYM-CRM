const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs for a gym
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
    try {
        const { action, userId, limit = 100, page = 1 } = req.query;
        const filter = { gymId: req.user.gymId };
        if (action) filter.action = action;
        if (userId) filter.userId = userId;

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
        const summary = await AuditLog.aggregate([
            { $match: { gymId: req.user.gymId } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent logins
        const recentLogins = await AuditLog.find({ gymId: req.user.gymId, action: 'LOGIN' })
            .sort({ createdAt: -1 }).limit(10).lean();

        res.json({ summary, recentLogins });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching audit summary', error: err.message });
    }
};

module.exports = { getAuditLogs, getAuditSummary };
