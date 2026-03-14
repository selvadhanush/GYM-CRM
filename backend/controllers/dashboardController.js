const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalMembers = await Member.countDocuments({ gymId: req.user.gymId });
        const activeMembers = await Member.countDocuments({ gymId: req.user.gymId, status: 'Active' });
        const expiredMembers = await Member.countDocuments({ gymId: req.user.gymId, status: 'Expired' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const expiringSoonCount = await Member.countDocuments({
            gymId: req.user.gymId,
            status: 'Active',
            expiryDate: { $gte: today, $lte: nextWeek }
        });

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const newMembersThisMonth = await Member.countDocuments({
            gymId: req.user.gymId,
            createdAt: { $gte: startOfMonth }
        });

        const todayAttendanceCount = await Attendance.countDocuments({
            gymId: req.user.gymId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const revenueData = await Payment.aggregate([
            {
                $match: {
                    gymId: req.user.gymId,
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const monthlyRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        const expenseData = await Expense.aggregate([
            {
                $match: {
                    gymId: req.user.gymId,
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const monthlyExpenses = expenseData.length > 0 ? expenseData[0].total : 0;
        const monthlyProfit = monthlyRevenue - monthlyExpenses;

        // Advanced Analytics Aggregations

        // 1. Revenue Trend (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const revenueTrend = await Payment.aggregate([
            { $match: { gymId: req.user.gymId, date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' }
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 2. Plan-wise Revenue Breakdown
        const planBreakdown = await Payment.aggregate([
            { $match: { gymId: req.user.gymId } },
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'member'
                }
            },
            { $unwind: '$member' },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'member.planId',
                    foreignField: '_id',
                    as: 'plan'
                }
            },
            { $unwind: '$plan' },
            {
                $group: {
                    _id: '$plan.name',
                    value: { $sum: '$amount' }
                }
            }
        ]);

        // 3. Payment Method Breakdown
        const methodBreakdown = await Payment.aggregate([
            { $match: { gymId: req.user.gymId } },
            {
                $group: {
                    _id: '$method',
                    value: { $sum: '$amount' }
                }
            }
        ]);

        // 4. Inactive Members (Active members with no attendance in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentlyActiveIds = await Attendance.distinct('memberId', {
            gymId: req.user.gymId,
            date: { $gte: sevenDaysAgo }
        });

        const inactiveMembersCount = await Member.countDocuments({
            gymId: req.user.gymId,
            status: 'Active',
            _id: { $nin: recentlyActiveIds }
        });

        res.json({
            totalMembers,
            activeMembers,
            expiredMembers,
            expiringSoonCount,
            newMembersThisMonth,
            todayAttendanceCount,
            monthlyRevenue,
            monthlyExpenses,
            monthlyProfit,
            revenueTrend,
            planBreakdown,
            methodBreakdown,
            inactiveMembersCount,
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
};

module.exports = {
    getDashboardStats,
};
