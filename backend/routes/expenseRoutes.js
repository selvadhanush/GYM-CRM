const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .post(createExpense)
    .get(getExpenses);

router.route('/:id')
    .delete(deleteExpense);

module.exports = router;
