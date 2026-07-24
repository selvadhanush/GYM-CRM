const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const prisma = require('../config/prisma');
const { jsonToCsv } = require('../utils/csvUtils');

// @desc    Download monthly revenue report
// @route   GET /api/reports/revenue
// @access  Private/Admin
const getRevenueReport = async (req, res) => {
    const { month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const query = {
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        date: { $gte: start, $lte: end }
    };
    if (req.user.branchId) {
        query.branchId = req.user.branchId;
    }

    const payments = await Payment.find(query).populate('memberId', 'name');

    const data = payments.map(p => ({
        Date: p.date.toISOString().split('T')[0],
        Member: p.memberId?.name || 'Unknown',
        Amount: p.amount,
        Method: p.method
    }));

    const csv = jsonToCsv(data, ['Date', 'Member', 'Amount', 'Method']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${month}_${year}.csv`);
    res.status(200).send(csv);
};

// @desc    Download monthly expense report
// @route   GET /api/reports/expenses
// @access  Private/Admin
const getExpenseReport = async (req, res) => {
    const { month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const query = {
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        date: { $gte: start, $lte: end }
    };
    if (req.user.branchId) {
        query.branchId = req.user.branchId;
    }

    const expenses = await Expense.find(query);

    const data = expenses.map(e => ({
        Date: e.date.toISOString().split('T')[0],
        Title: e.title,
        Category: e.category,
        Amount: e.amount
    }));

    const csv = jsonToCsv(data, ['Date', 'Title', 'Category', 'Amount']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expense_report_${month}_${year}.csv`);
    res.status(200).send(csv);
};

// @desc    Get report summary dashboard data
// @route   GET /api/reports/summary?year=YYYY
// @access  Private/Admin
const getReportSummary = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const gymId = req.user.gymId;
        const branchId = req.user.branchId || null;

        const baseQuery = {
            gymId,
            ...(branchId && { branchId }),
        };

        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // ─── Year boundaries ──────────────────────────────────────────────
        const yearStart = new Date(year, 0, 1);
        const yearEnd   = new Date(year, 11, 31, 23, 59, 59, 999);

        // ─── Current month boundaries ─────────────────────────────────────
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // ─── Last 90 days ─────────────────────────────────────────────────
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // ══════════════════════════════════════════════════════════════════
        // 1. Revenue by month  (Payment)
        // ══════════════════════════════════════════════════════════════════
        const payments = await Payment.find({
            ...baseQuery,
            date: { $gte: yearStart, $lte: yearEnd },
        });

        const revenueMap = {}; // { 0: 0, 1: 0, … }
        MONTH_NAMES.forEach((_, i) => { revenueMap[i] = 0; });
        payments.forEach((p) => {
            const m = new Date(p.date).getMonth();
            revenueMap[m] = (revenueMap[m] || 0) + (p.amount || 0);
        });

        // ══════════════════════════════════════════════════════════════════
        // 2. Expenses by month  (Expense)
        // ══════════════════════════════════════════════════════════════════
        const expenses = await Expense.find({
            ...baseQuery,
            date: { $gte: yearStart, $lte: yearEnd },
        });

        const expenseMap = {};
        MONTH_NAMES.forEach((_, i) => { expenseMap[i] = 0; });
        expenses.forEach((e) => {
            const m = new Date(e.date).getMonth();
            expenseMap[m] = (expenseMap[m] || 0) + (e.amount || 0);
        });

        const revenueByMonth = MONTH_NAMES.map((month, i) => ({
            month,
            revenue:  parseFloat(revenueMap[i].toFixed(2)),
            expenses: parseFloat(expenseMap[i].toFixed(2)),
            profit:   parseFloat((revenueMap[i] - expenseMap[i]).toFixed(2)),
        }));

        // ══════════════════════════════════════════════════════════════════
        // 3. New members by month  (Member)
        // ══════════════════════════════════════════════════════════════════
        const newMembersAll = await Member.find({
            ...baseQuery,
            joinDate: { $gte: yearStart, $lte: yearEnd },
        });

        const newMemberMap = {};
        MONTH_NAMES.forEach((_, i) => { newMemberMap[i] = 0; });
        newMembersAll.forEach((m) => {
            const idx = new Date(m.joinDate).getMonth();
            newMemberMap[idx] = (newMemberMap[idx] || 0) + 1;
        });

        const newMembersByMonth = MONTH_NAMES.map((month, i) => ({
            month,
            count: newMemberMap[i],
        }));

        // ══════════════════════════════════════════════════════════════════
        // 4. Attendance by day of week  (last 90 days)
        // ══════════════════════════════════════════════════════════════════
        const attendanceRecords = await Attendance.find({
            ...baseQuery,
            date: { $gte: ninetyDaysAgo },
        });

        const dayMap = {};
        DAY_NAMES.forEach((d) => { dayMap[d] = 0; });
        attendanceRecords.forEach((a) => {
            const dayName = DAY_NAMES[new Date(a.date).getDay()];
            dayMap[dayName] = (dayMap[dayName] || 0) + 1;
        });

        // Ordered Mon→Sun
        const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const attendanceByDay = orderedDays.map((day) => ({
            day,
            count: dayMap[day] || 0,
        }));

        // ══════════════════════════════════════════════════════════════════
        // 5. Plan popularity  (Member grouped by planId → Prisma plan name)
        // ══════════════════════════════════════════════════════════════════
        const allMembers = await Member.find(baseQuery);

        const planCountMap = {}; // { planId: { count, revenue } }
        allMembers.forEach((m) => {
            if (!m.planId) return;
            if (!planCountMap[m.planId]) {
                planCountMap[m.planId] = { count: 0, revenue: 0 };
            }
            planCountMap[m.planId].count   += 1;
            planCountMap[m.planId].revenue += m.planPrice || 0;
        });

        // Sort descending by member count, take top 6
        const topPlanIds = Object.entries(planCountMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 6)
            .map(([id]) => id);

        // Batch-fetch plan names from Prisma (PostgreSQL)
        const prismaPlans = await prisma.plan.findMany({
            where: { id: { in: topPlanIds } },
            select: { id: true, name: true },
        });

        const planNameById = {};
        prismaPlans.forEach((p) => { planNameById[p.id] = p.name; });

        const planPopularity = topPlanIds.map((id) => ({
            name:    planNameById[id] || id,
            members: planCountMap[id].count,
            revenue: parseFloat(planCountMap[id].revenue.toFixed(2)),
        }));

        // ══════════════════════════════════════════════════════════════════
        // 6. Expense by category  (year-scoped)
        // ══════════════════════════════════════════════════════════════════
        const categoryMap = {};
        expenses.forEach((e) => {
            const cat = e.category || 'Uncategorized';
            categoryMap[cat] = (categoryMap[cat] || 0) + (e.amount || 0);
        });

        const expenseByCategory = Object.entries(categoryMap)
            .map(([category, amount]) => ({
                category,
                amount: parseFloat(amount.toFixed(2)),
            }))
            .sort((a, b) => b.amount - a.amount);

        // ══════════════════════════════════════════════════════════════════
        // 7. Member status summary
        // ══════════════════════════════════════════════════════════════════
        const statusMap = {};
        allMembers.forEach((m) => {
            const s = (m.status || 'Unknown').toLowerCase();
            statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const memberStatusSummary = {
            active:  statusMap['active']  || 0,
            expired: statusMap['expired'] || 0,
            total:   allMembers.length,
        };

        // ══════════════════════════════════════════════════════════════════
        // 8. Top metrics
        // ══════════════════════════════════════════════════════════════════
        const totalRevenue  = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Revenue this current calendar month
        const revenueThisMonth = payments
            .filter((p) => {
                const d = new Date(p.date);
                return d >= currentMonthStart && d <= currentMonthEnd;
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Attendance this current calendar month
        const attendanceThisMonth = attendanceRecords.filter((a) => {
            const d = new Date(a.date);
            return d >= currentMonthStart && d <= currentMonthEnd;
        }).length;

        // New members this current calendar month
        const newMembersThisMonth = newMembersAll.filter((m) => {
            const d = new Date(m.joinDate);
            return d >= currentMonthStart && d <= currentMonthEnd;
        }).length;

        const avgRevenuePerMember = memberStatusSummary.active > 0
            ? parseFloat((totalRevenue / memberStatusSummary.active).toFixed(2))
            : 0;

        const topMetrics = {
            totalRevenue:            parseFloat(totalRevenue.toFixed(2)),
            totalExpenses:           parseFloat(totalExpenses.toFixed(2)),
            netProfit:               parseFloat((totalRevenue - totalExpenses).toFixed(2)),
            avgRevenuePerMember,
            totalAttendanceThisMonth: attendanceThisMonth,
            newMembersThisMonth,
        };

        // ══════════════════════════════════════════════════════════════════
        // Response
        // ══════════════════════════════════════════════════════════════════
        res.status(200).json({
            revenueByMonth,
            newMembersByMonth,
            attendanceByDay,
            planPopularity,
            expenseByCategory,
            memberStatusSummary,
            topMetrics,
        });
    } catch (err) {
        console.error('[getReportSummary]', err);
        res.status(500).json({ message: 'Failed to generate report summary', error: err.message });
    }
};

module.exports = {
    getRevenueReport,
    getExpenseReport,
    getReportSummary,
};
