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
    .get(protect, authorize('admin', 'receptionist', 'trainer'), getPlans)
    .post(protect, authorize('admin'), createPlan);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer'), getPlanById)
    .put(protect, authorize('admin'), updatePlan)
    .delete(protect, authorize('admin'), deletePlan);

module.exports = router;
