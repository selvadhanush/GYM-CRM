const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const AuditLog = require('../models/AuditLog');
const prisma = require('../config/prisma');
const { translateQuery } = require('../models/MongooseAdapter');

// @desc    Get audit logs for a gym
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = catchAsync(async (req, res, next) => {
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
    } catch (err) { next(err); }
});

// @desc    Get activity summary (counts by action type)
// @route   GET /api/audit/summary
// @access  Private/Admin
const getAuditSummary = catchAsync(async (req, res, next) => {
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
        
        // Group-by-action pushed down to Postgres via Prisma's groupBy instead
        // of the generic Mongoose-shim aggregate(), which would otherwise pull
        // every matching row (the audit log grows unbounded) into Node just to
        // count them in JS.
        const grouped = await prisma.auditLog.groupBy({
            by: ['action'],
            where: translateQuery(filter),
            _count: { action: true },
            orderBy: { _count: { action: 'desc' } }
        });
        const summary = grouped.map(g => ({ _id: g.action, count: g._count.action }));

        // Recent logins
        const recentLogins = await AuditLog.find({ ...filter, action: 'LOGIN' })
            .sort({ createdAt: -1 }).limit(10).lean();

        res.json({ summary, recentLogins });
    } catch (err) { next(err); }
});

module.exports = { getAuditLogs, getAuditSummary };
