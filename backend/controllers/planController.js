const Plan = require('../models/Plan');

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    const { name, duration, price } = req.body;

    const plan = await Plan.create({
        name,
        duration,
        price,
        gymId: req.user.gymId
    });

    if (plan) {
        res.status(201).json(plan);
    } else {
        res.status(400);
        throw new Error('Invalid plan data');
    }
};

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private/Admin
const getPlans = async (req, res) => {
    const plans = await Plan.find({ gymId: req.user.gymId }).lean();
    res.json(plans);
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private/Admin
const getPlanById = async (req, res) => {
    const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });

    if (plan) {
        res.json(plan);
    } else {
        res.status(404);
        throw new Error('Plan not found');
    }
};

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    const { name, duration, price } = req.body;

    const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });

    if (plan) {
        plan.name = name || plan.name;
        plan.duration = duration || plan.duration;
        plan.price = price || plan.price;

        const updatedPlan = await plan.save();
        res.json(updatedPlan);
    } else {
        res.status(404);
        throw new Error('Plan not found');
    }
};

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });

    if (plan) {
        await plan.deleteOne();
        res.json({ message: 'Plan removed' });
    } else {
        res.status(404);
        throw new Error('Plan not found');
    }
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
