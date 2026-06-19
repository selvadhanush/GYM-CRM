const express = require('express');
const router = express.Router();
const {
    assignTrainer,
    getAssignments,
    removeAssignment
} = require('../controllers/memberTrainerAssignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer'), getAssignments)
    .post(protect, authorize('admin'), assignTrainer);

router.route('/:id')
    .delete(protect, authorize('admin'), removeAssignment);

module.exports = router;
