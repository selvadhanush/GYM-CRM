const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Lead = require('../models/Lead');

// @desc    Get churn & retention analytics
// @route   GET /api/analytics
const getAnalytics = async (req, res) => {
    try {
        const gymId = req.user.gymId;
        const now = new Date();

        // --- Inactive Members (no attendance in 7+ days) ---
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const Attendance = require('../models/Attendance');
        const recentAttendanceMemberIds = await Attendance.distinct('memberId', {
            gymId,
            date: { $gte: sevenDaysAgo }
        });

        const inactiveCount = await Member.countDocuments({
            gymId,
            status: 'Active',
            _id: { $nin: recentAttendanceMemberIds }
        });

        const inactiveMembers = await Member.find({
            gymId,
            status: 'Active',
            _id: { $nin: recentAttendanceMemberIds }
        }).populate('planId', 'name').select('name phone expiryDate planId joinDate').limit(20);

        // --- Churn Rate (members expired in last 30 days / total 30 days ago) ---
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const expiredLast30 = await Member.countDocuments({
            gymId,
            expiryDate: { $gte: thirtyDaysAgo, $lte: now },
            status: 'Expired'
        });

        const totalActiveMonth = await Member.countDocuments({
            gymId,
            joinDate: { $lte: thirtyDaysAgo }
        });

        const churnRate = totalActiveMonth > 0
            ? ((expiredLast30 / totalActiveMonth) * 100).toFixed(1)
            : 0;

        // --- Renewal Rate (members who renewed vs expired last 90 days) ---
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const renewedCount = await Member.countDocuments({
            gymId,
            status: 'Active',
            joinDate: { $lte: ninetyDaysAgo },
            expiryDate: { $gte: now }
        });

        const expiredLast90 = await Member.countDocuments({
            gymId,
            expiryDate: { $gte: ninetyDaysAgo, $lte: now }
        });

        const totalForRenewal = renewedCount + expiredLast90;
        const renewalRate = totalForRenewal > 0
            ? ((renewedCount / totalForRenewal) * 100).toFixed(1)
            : 0;

        // --- Lifetime Value (avg total paid per member) ---
        const ltv = await Payment.aggregate([
            { $match: { gymId } },
            { $group: { _id: '$memberId', totalPaid: { $sum: '$amount' } } },
            { $group: { _id: null, avgLTV: { $avg: '$totalPaid' } } }
        ]);
        const avgLTV = ltv[0]?.avgLTV ? Math.round(ltv[0].avgLTV) : 0;

        // --- Top value members ---
        const topMembers = await Payment.aggregate([
            { $match: { gymId } },
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
                gymId,
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
            { $match: { gymId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

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
            renewedCount
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ message: 'Error fetching analytics', error: err.message });
    }
};

module.exports = { getAnalytics };
