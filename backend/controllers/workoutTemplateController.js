const WorkoutTemplate = require('../models/WorkoutTemplate');

// @desc    Create a workout template
// @route   POST /api/workout-templates
// @access  Private/Admin/Trainer
const createTemplate = async (req, res) => {
    try {
        const { name, description, exercises } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Template name is required' });
        }

        const template = await WorkoutTemplate.create({
            name,
            description: description || null,
            exercises: exercises ? (typeof exercises === 'string' ? exercises : JSON.stringify(exercises)) : null,
            gymId: req.user.gymId
        });

        res.status(201).json(template);
    } catch (error) {
        console.error("CREATE WORKOUT TEMPLATE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all workout templates
// @route   GET /api/workout-templates
// @access  Private/Admin/Trainer/Member
const getTemplates = async (req, res) => {
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
    } catch (error) {
        console.error("GET WORKOUT TEMPLATES ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single workout template
// @route   GET /api/workout-templates/:id
// @access  Private/Admin/Trainer/Member
const getTemplateById = async (req, res) => {
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
    } catch (error) {
        console.error("GET WORKOUT TEMPLATE BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update workout template
// @route   PUT /api/workout-templates/:id
// @access  Private/Admin/Trainer
const updateTemplate = async (req, res) => {
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
    } catch (error) {
        console.error("UPDATE WORKOUT TEMPLATE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete workout template
// @route   DELETE /api/workout-templates/:id
// @access  Private/Admin/Trainer
const deleteTemplate = async (req, res) => {
    try {
        const template = await WorkoutTemplate.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (template) {
            await template.deleteOne();
            res.json({ message: 'Template removed' });
        } else {
            res.status(404).json({ success: false, message: 'Template not found' });
        }
    } catch (error) {
        console.error("DELETE WORKOUT TEMPLATE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};
