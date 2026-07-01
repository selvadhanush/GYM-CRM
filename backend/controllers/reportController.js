const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Member = require('../models/Member');
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

module.exports = {
    getRevenueReport,
    getExpenseReport
};
