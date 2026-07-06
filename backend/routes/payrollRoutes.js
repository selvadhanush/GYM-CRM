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
    .get(protect, authorize('admin', 'trainer', 'h4_admin'), getPayrolls);

router.post('/generate', protect, authorize('admin', 'h4_admin'), generateMonthlyPayroll);
router.post('/salary-structure', protect, authorize('admin', 'h4_admin'), upsertSalaryStructure);
router.get('/salary-structure/:trainerId', protect, authorize('admin', 'trainer', 'h4_admin'), getSalaryStructure);
router.post('/commission', protect, authorize('admin', 'h4_admin'), addCommission);
router.put('/:id', protect, authorize('admin', 'h4_admin'), updatePayrollStatus);

module.exports = router;
