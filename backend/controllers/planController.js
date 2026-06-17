const Plan = require('../models/Plan');

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    try {
        const { name, duration, price } = req.body;

        if (!name || duration === undefined || price === undefined) {
            res.status(400);
            return res.json({ success: false, message: 'Name, duration, and price are required' });
        }

        const plan = await Plan.create({
            name,
            duration: Number(duration),
            price: Number(price),
            gymId: req.user.gymId
        });

        if (plan) {
            res.status(201).json(plan);
        } else {
            res.status(400).json({ success: false, message: 'Invalid plan data' });
        }
    } catch (error) {
        console.error("PLAN CREATE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private/Admin
const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ gymId: req.user.gymId }).lean();
        res.json(plans);
    } catch (error) {
        console.error("GET PLANS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private/Admin
const getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (plan) {
            res.json(plan);
        } else {
            res.status(404).json({ success: false, message: 'Plan not found' });
        }
    } catch (error) {
        console.error("GET PLAN BY ID ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    try {
        const { name, duration, price } = req.body;

        const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (plan) {
            plan.name = name || plan.name;
            if (duration !== undefined && duration !== '') {
                plan.duration = Number(duration);
            }
            if (price !== undefined && price !== '') {
                plan.price = Number(price);
            }

            const updatedPlan = await plan.save();
            res.json(updatedPlan);
        } else {
            res.status(404).json({ success: false, message: 'Plan not found' });
        }
    } catch (error) {
        console.error("PLAN UPDATE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (plan) {
            await plan.deleteOne();
            res.json({ message: 'Plan removed' });
        } else {
            res.status(404).json({ success: false, message: 'Plan not found' });
        }
    } catch (error) {
        console.error("DELETE PLAN ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
