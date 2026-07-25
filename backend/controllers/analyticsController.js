const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Lead = require('../models/Lead');
const Expense = require('../models/Expense');

// @desc    Get churn & retention analytics
// @route   GET /api/analytics
const getAnalytics = catchAsync(async (req, res, next) => {
        const now = new Date();

        const queryFilter = { ...req.tenantFilter };

        // --- Inactive Members (no attendance in 7+ days) ---
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const Attendance = require('../models/Attendance');
        const attendanceQuery = { ...queryFilter, date: { $gte: sevenDaysAgo } };
        if (req.user.branchId) {
            attendanceQuery.branchId = req.user.branchId;
        }
        const recentAttendanceMemberIds = await Attendance.distinct('memberId', attendanceQuery);

        const inactiveCount = await Member.countDocuments({
            ...queryFilter,
            status: 'Active',
            _id: { $nin: recentAttendanceMemberIds }
        });

        const inactiveMembers = await Member.find({
            ...queryFilter,
            status: 'Active',
            _id: { $nin: recentAttendanceMemberIds }
        }).populate('planId', 'name').select('name phone expiryDate planId joinDate').limit(20);

        // --- Churn Rate (members expired in last 30 days / total 30 days ago) ---
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const expiredLast30 = await Member.countDocuments({
            ...queryFilter,
            expiryDate: { $gte: thirtyDaysAgo, $lte: now },
            status: 'Expired'
        });

        const totalActiveMonth = await Member.countDocuments({
            ...queryFilter,
            joinDate: { $lte: thirtyDaysAgo }
        });

        const churnRate = totalActiveMonth > 0
            ? ((expiredLast30 / totalActiveMonth) * 100).toFixed(1)
            : 0;

        // --- Renewal Rate (members who renewed vs expired last 90 days) ---
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const renewedCount = await Member.countDocuments({
            ...queryFilter,
            status: 'Active',
            joinDate: { $lte: ninetyDaysAgo },
            expiryDate: { $gte: now }
        });

        const expiredLast90 = await Member.countDocuments({
            ...queryFilter,
            expiryDate: { $gte: ninetyDaysAgo, $lte: now }
        });

        const totalForRenewal = renewedCount + expiredLast90;
        const renewalRate = totalForRenewal > 0
            ? ((renewedCount / totalForRenewal) * 100).toFixed(1)
            : 0;

        // --- Lifetime Value (avg total paid per member) ---
        const ltv = await Payment.aggregate([
            { $match: queryFilter },
            { $group: { _id: '$memberId', totalPaid: { $sum: '$amount' } } },
            { $group: { _id: null, avgLTV: { $avg: '$totalPaid' } } }
        ]);
        const avgLTV = ltv[0]?.avgLTV ? Math.round(ltv[0].avgLTV) : 0;

        // --- Top value members ---
        const topMembers = await Payment.aggregate([
            { $match: queryFilter },
            { $group: { _id: '$memberId', totalPaid: { $sum: '$amount' } } },
            { $sort: { totalPaid: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'members',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'member'
                }
            },
            { $unwind: '$member' },
            { $project: { name: '$member.name', phone: '$member.phone', totalPaid: 1 } }
        ]);

        // --- Monthly churn trend (last 6 months) ---
        const churnTrend = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const count = await Member.countDocuments({
                ...queryFilter,
                expiryDate: { $gte: start, $lte: end },
                status: 'Expired'
            });
            churnTrend.push({
                month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
                churned: count
            });
        }

        // --- Membership status breakdown ---
        const statusBreakdown = await Member.aggregate([
            { $match: queryFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // --- Financial & Revenue Performance Metrics ---
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const [revenueMonthAgg, expenseMonthAgg, revenueTotalAgg] = await Promise.all([
            Payment.aggregate([
                { $match: { ...queryFilter, date: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { ...queryFilter, date: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Payment.aggregate([
                { $match: queryFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const monthlyRevenue = revenueMonthAgg[0]?.total || 0;
        const monthlyExpenses = expenseMonthAgg[0]?.total || 0;
        const monthlyProfit = monthlyRevenue - monthlyExpenses;
        const totalLifetimeRevenue = revenueTotalAgg[0]?.total || 0;

        // --- Monthly Revenue Trend (Last 6 Months) ---
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const revenueTrendAgg = await Payment.aggregate([
            { $match: { ...queryFilter, date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: '$date' }, year: { $year: '$date' } },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = date.getMonth() + 1;
            const y = date.getFullYear();
            const found = revenueTrendAgg.find(r => r._id.month === m && r._id.year === y);
            revenueTrend.push({
                month: date.toLocaleString('default', { month: 'short' }),
                revenue: found ? found.total : 0
            });
        }

        // --- Payment Method Breakdown ---
        const paymentMethods = await Payment.aggregate([
            { $match: queryFilter },
            { $group: { _id: '$method', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        // --- Plan Revenue & Popularity Breakdown ---
        const planDistribution = await Payment.aggregate([
            { $match: queryFilter },
            { $lookup: { from: 'members', localField: 'memberId', foreignField: '_id', as: 'member' } },
            { $unwind: '$member' },
            { $lookup: { from: 'plans', localField: 'member.planId', foreignField: '_id', as: 'plan' } },
            { $unwind: '$plan' },
            { $group: { _id: '$plan.name', totalRevenue: { $sum: '$amount' }, memberCount: { $sum: 1 } } },
            { $sort: { totalRevenue: -1 } }
        ]);

        // --- Lead Funnel & Conversion Analytics ---
        const [totalLeads, convertedLeads, pendingLeads, lostLeads] = await Promise.all([
            Lead.countDocuments(queryFilter),
            Lead.countDocuments({ ...queryFilter, status: 'Converted' }),
            Lead.countDocuments({ ...queryFilter, status: { $in: ['New', 'Contacted', 'Trial Booked', 'Follow Up'] } }),
            Lead.countDocuments({ ...queryFilter, status: 'Lost' })
        ]);

        const conversionRate = totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

        res.json({
            inactiveCount,
            inactiveMembers,
            churnRate: parseFloat(churnRate),
            renewalRate: parseFloat(renewalRate),
            avgLTV,
            topMembers,
            churnTrend,
            statusBreakdown,
            expiredLast30,
            renewedCount,

            // Comprehensive Business Metrics
            monthlyRevenue,
            monthlyExpenses,
            monthlyProfit,
            totalLifetimeRevenue,
            revenueTrend,
            paymentMethods: paymentMethods.map(p => ({ method: p._id || 'Other', totalAmount: p.totalAmount, count: p.count })),
            planDistribution: planDistribution.map(p => ({ name: p._id, totalRevenue: p.totalRevenue, memberCount: p.memberCount })),
            leadFunnel: {
                totalLeads,
                convertedLeads,
                pendingLeads,
                lostLeads,
                conversionRate
            }
        });
});

module.exports = { getAnalytics };
