const express = require('express');
const router = express.Router();
const {
    upsertSalaryStructure,
    getSalaryStructure,
    generateMonthlyPayroll,
    getPayrolls,
    updatePayrollStatus,
    addCommission
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'trainer'), getPayrolls);

router.post('/generate', protect, authorize('admin'), generateMonthlyPayroll);
router.post('/salary-structure', protect, authorize('admin'), upsertSalaryStructure);
router.get('/salary-structure/:trainerId', protect, authorize('admin', 'trainer'), getSalaryStructure);
router.post('/commission', protect, authorize('admin'), addCommission);
router.put('/:id', protect, authorize('admin'), updatePayrollStatus);

module.exports = router;
