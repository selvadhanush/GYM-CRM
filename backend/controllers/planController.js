const Plan = require('../models/Plan');
const { logAudit } = require('../utils/auditLogger');

// @desc    Create a new plan (traditional gym membership plan)
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
            gymId: req.user.gymId,
            branchId: req.user.branchId || null
        });

        if (plan) {
            await logAudit(req, 'PLAN_CREATED', 'Plan', plan._id, `Created plan: ${name}`, name);
            res.status(201).json(plan);
        } else {
            res.status(400).json({ success: false, message: 'Invalid plan data' });
        }
    } catch (error) {
        console.error("PLAN CREATE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all plans (own gym + FitPrime SYSTEM plans)
// @route   GET /api/plans
// @access  Private/Admin
const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({
            $or: [
                { gymId: 'SYSTEM' },
                { gymId: req.user.gymId, branchId: req.user.branchId || null }
            ]
        }).lean();
        res.json(plans);
    } catch (error) {
        console.error("GET PLANS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private/Admin
const getPlanById = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const plan = await Plan.findOne(query);

        if (plan) {
            res.json(plan);
        } else {
            res.status(404).json({ success: false, message: 'Plan not found' });
        }
    } catch (error) {
        console.error("GET PLAN BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    try {
        const { name, duration, price } = req.body;

        const query = { _id: req.params.id, gymId: req.user.gymId };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const plan = await Plan.findOne(query);

        if (plan) {
            plan.name = name || plan.name;
            if (duration !== undefined && duration !== '') {
                plan.duration = Number(duration);
            }
            if (price !== undefined && price !== '') {
                plan.price = Number(price);
            }

            const updatedPlan = await plan.save();
            await logAudit(req, 'PLAN_UPDATED', 'Plan', plan._id, `Updated plan: ${updatedPlan.name}`, updatedPlan.name);
            res.json(updatedPlan);
        } else {
            res.status(404).json({ success: false, message: 'Plan not found' });
        }
    } catch (error) {
        console.error("PLAN UPDATE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const plan = await Plan.findOne(query);

        if (plan) {
            await logAudit(req, 'PLAN_DELETED', 'Plan', plan._id, `Deleted plan: ${plan.name}`, plan.name);
            await plan.deleteOne();
            res.json({ message: 'Plan removed' });
        } else {
            res.status(404).json({ success: false, message: 'Plan not found' });
        }
    } catch (error) {
        console.error("DELETE PLAN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
