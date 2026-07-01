const Expense = require('../models/Expense');
const { logAudit } = require('../utils/auditLogger');

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private/Admin
const createExpense = async (req, res) => {
    const { title, amount, category, description, date } = req.body;

    const expense = await Expense.create({
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        branchId: req.user.branchId || null,
        title,
        amount: Number(amount),
        category,
        description,
        date: date ? new Date(date) : new Date()
    });

    if (expense) {
        await logAudit(req, 'EXPENSE_ADDED', 'Expense', expense._id, `Added expense: ${title} ₹${amount} (${category})`, title);
        res.status(201).json(expense);
    } else {
        res.status(400);
        throw new Error('Invalid expense data');
    }
};

// @desc    Get all expenses for a gym
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = async (req, res) => {
    const query = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
    if (req.user.branchId) {
        query.branchId = req.user.branchId;
    }
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = async (req, res) => {
    const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
    if (req.user.branchId) {
        query.branchId = req.user.branchId;
    }
    const expense = await Expense.findOne(query);

    if (expense) {
        await logAudit(req, 'EXPENSE_DELETED', 'Expense', expense._id, `Deleted expense: ${expense.title} ₹${expense.amount}`, expense.title);
        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } else {
        res.status(404);
        throw new Error('Expense not found');
    }
};

module.exports = {
    createExpense,
    getExpenses,
    deleteExpense
};
