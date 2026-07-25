const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantFilter = require('../middleware/tenantFilter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const createExpenseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    amount: z.number().min(0, 'Amount cannot be negative'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    date: z.string().optional()
});

router.use(protect);
router.use(authorize('admin', 'h4_admin'));

router.route('/')
    .post(validate({ body: createExpenseSchema }), createExpense)
    .get(tenantFilter, getExpenses);

router.route('/:id')
    .delete(deleteExpense);

module.exports = router;
