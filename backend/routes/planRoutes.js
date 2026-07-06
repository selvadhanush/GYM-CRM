const express = require('express');
const router = express.Router();
const {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'superadmin', 'h4_admin'), getPlans)
    .post(protect, authorize('admin', 'h4_admin'), createPlan);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'superadmin', 'h4_admin'), getPlanById)
    .put(protect, authorize('admin', 'h4_admin'), updatePlan)
    .delete(protect, authorize('admin', 'h4_admin'), deletePlan);

module.exports = router;
