const express = require('express');
const router = express.Router();
const {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} = require('../controllers/workoutTemplateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getTemplates)
    .post(protect, authorize('admin', 'trainer'), createTemplate);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getTemplateById)
    .put(protect, authorize('admin', 'trainer'), updateTemplate)
    .delete(protect, authorize('admin', 'trainer'), deleteTemplate);

module.exports = router;
