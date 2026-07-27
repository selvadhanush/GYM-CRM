const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const WorkoutTemplate = require('../models/WorkoutTemplate');

// @desc    Create a workout template
// @route   POST /api/workout-templates
// @access  Private/Admin/Trainer
const createTemplate = catchAsync(async (req, res, next) => {
    try {
        const { name, description, exercises } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Template name is required' });
        }

        const template = await WorkoutTemplate.create({
            name,
            description: description || null,
            exercises: exercises ? (typeof exercises === 'string' ? exercises : JSON.stringify(exercises)) : null,
            gymId: req.user.gymId,
            branchId: req.user.branchId || null
        });

        res.status(201).json(template);
    } catch (error) { next(error); }
});

// @desc    Get all workout templates
// @route   GET /api/workout-templates
// @access  Private/Admin/Trainer/Member
const getTemplates = catchAsync(async (req, res, next) => {
    try {
        const templates = await WorkoutTemplate.find({ gymId: req.user.gymId }).lean();
        
        // Parse exercises JSON string if present
        const formatted = templates.map(t => {
            if (t.exercises && typeof t.exercises === 'string') {
                try {
                    t.exercises = JSON.parse(t.exercises);
                } catch (e) {}
            }
            return t;
        });

        res.json(formatted);
    } catch (error) { next(error); }
});

// @desc    Get single workout template
// @route   GET /api/workout-templates/:id
// @access  Private/Admin/Trainer/Member
const getTemplateById = catchAsync(async (req, res, next) => {
    try {
        const template = await WorkoutTemplate.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (template) {
            if (template.exercises && typeof template.exercises === 'string') {
                try {
                    template.exercises = JSON.parse(template.exercises);
                } catch (e) {}
            }
            res.json(template);
        } else {
            res.status(404).json({ success: false, message: 'Template not found' });
        }
    } catch (error) { next(error); }
});

// @desc    Update workout template
// @route   PUT /api/workout-templates/:id
// @access  Private/Admin/Trainer
const updateTemplate = catchAsync(async (req, res, next) => {
    try {
        const { name, description, exercises } = req.body;

        const template = await WorkoutTemplate.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (template) {
            template.name = name || template.name;
            if (description !== undefined) template.description = description;
            if (exercises !== undefined) {
                template.exercises = typeof exercises === 'string' ? exercises : JSON.stringify(exercises);
            }

            const updatedTemplate = await template.save();
            if (updatedTemplate.exercises && typeof updatedTemplate.exercises === 'string') {
                try {
                    updatedTemplate.exercises = JSON.parse(updatedTemplate.exercises);
                } catch (e) {}
            }
            res.json(updatedTemplate);
        } else {
            res.status(404).json({ success: false, message: 'Template not found' });
        }
    } catch (error) { next(error); }
});

// @desc    Delete workout template
// @route   DELETE /api/workout-templates/:id
// @access  Private/Admin/Trainer
const deleteTemplate = catchAsync(async (req, res, next) => {
    try {
        const template = await WorkoutTemplate.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (template) {
            await template.deleteOne();
            res.json({ message: 'Template removed' });
        } else {
            res.status(404).json({ success: false, message: 'Template not found' });
        }
    } catch (error) { next(error); }
});

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};
