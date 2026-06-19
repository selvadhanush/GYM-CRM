const express = require('express');
const router = express.Router();
const {
    createAssessment,
    getAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment
} = require('../controllers/bodyAssessmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getAssessments)
    .post(protect, authorize('admin', 'trainer'), createAssessment);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getAssessmentById)
    .put(protect, authorize('admin', 'trainer'), updateAssessment)
    .delete(protect, authorize('admin', 'trainer'), deleteAssessment);

module.exports = router;
