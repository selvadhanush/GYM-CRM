const express = require('express');
const router = express.Router();
const {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    logCompletedWorkout
} = require('../controllers/workoutPlanController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/log', protect, logCompletedWorkout);

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getPlans)
    .post(protect, authorize('admin', 'trainer'), createPlan);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getPlanById)
    .put(protect, authorize('admin', 'trainer'), updatePlan)
    .delete(protect, authorize('admin', 'trainer'), deletePlan);

module.exports = router;
