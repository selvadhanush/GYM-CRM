const DietPlan = require('../models/DietPlan');
const Member = require('../models/Member');
const User = require('../models/User');

// @desc    Create a diet plan for a member
// @route   POST /api/diet-plans
// @access  Private/Admin/Trainer
const createPlan = async (req, res) => {
    try {
        const { memberId, name, startDate, endDate, meals } = req.body;

        if (!memberId || !name) {
            return res.status(400).json({ success: false, message: 'Member ID and Plan name are required' });
        }

        // Validate member exists
        const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const plan = await DietPlan.create({
            memberId,
            trainerId: req.user.role === 'trainer' ? req.user.id : (req.body.trainerId || null),
            name,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            meals: meals ? (typeof meals === 'string' ? meals : JSON.stringify(meals)) : null,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId })
        });

        res.status(201).json(plan);
    } catch (error) {
        console.error("CREATE DIET PLAN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all diet plans
// @route   GET /api/diet-plans
// @access  Private/Admin/Trainer/Member
const getPlans = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };

        // If member is fetching, only show their plans
        if (req.user.role === 'member') {
            query.memberId = req.user.memberId;
        } else if (req.user.role === 'trainer') {
            query.trainerId = req.user.id;
        }

        if (req.query.memberId) {
            query.memberId = req.query.memberId;
        }

        // Strict pagination parameters with hard cap at 100
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
        const skip = (page - 1) * limit;

        const total = await DietPlan.countDocuments(query);
        const plans = await DietPlan.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Batched multi-entity lookup (Trainer + Member)
        const memberIds = [...new Set(plans.map(p => p.memberId).filter(Boolean))];
        const trainerIds = [...new Set(plans.map(p => p.trainerId).filter(Boolean))];

        const [members, trainers] = await Promise.all([
            memberIds.length > 0 ? Member.find({ _id: { $in: memberIds } }).select('id name phone email').lean() : [],
            trainerIds.length > 0 ? User.find({ _id: { $in: trainerIds } }).select('id name email role phone').lean() : []
        ]);

        const memberMap = new Map((members || []).map(m => [m._id ? m._id.toString() : m.id, m]));
        const trainerMap = new Map((trainers || []).map(t => [t._id ? t._id.toString() : t.id, t]));

        const formatted = plans.map(p => {
            let parsedMeals = p.meals;
            if (p.meals && typeof p.meals === 'string') {
                try {
                    parsedMeals = JSON.parse(p.meals);
                } catch (e) {}
            }
            const m = p.memberId ? memberMap.get(p.memberId.toString()) : null;
            const t = p.trainerId ? trainerMap.get(p.trainerId.toString()) : null;

            return {
                ...p,
                meals: parsedMeals,
                member: m ? { id: m.id || m._id, name: m.name, phone: m.phone, email: m.email } : null,
                trainer: t ? { id: t.id || t._id, name: t.name, email: t.email } : null
            };
        });

        res.json({
            success: true,
            data: formatted,
            meta: { page, limit, total }
        });
    } catch (error) {
        console.error("GET DIET PLANS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single diet plan
// @route   GET /api/diet-plans/:id
// @access  Private/Admin/Trainer/Member
const getPlanById = async (req, res) => {
    try {
        const plan = await DietPlan.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (plan) {
            if (req.user.role === 'member' && plan.memberId !== req.user.memberId) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this plan' });
            }

            if (plan.meals && typeof plan.meals === 'string') {
                try {
                    plan.meals = JSON.parse(plan.meals);
                } catch (e) {}
            }

            const memberObj = await Member.findOne({ _id: plan.memberId });
            const trainerObj = plan.trainerId ? await User.findOne({ _id: plan.trainerId }).select('-password') : null;

            res.json({
                ...plan,
                member: memberObj || null,
                trainer: trainerObj || null
            });
        } else {
            res.status(404).json({ success: false, message: 'Diet plan not found' });
        }
    } catch (error) {
        console.error("GET DIET PLAN BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update diet plan
// @route   PUT /api/diet-plans/:id
// @access  Private/Admin/Trainer
const updatePlan = async (req, res) => {
    try {
        const { name, startDate, endDate, meals, trainerId } = req.body;

        const plan = await DietPlan.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (plan) {
            plan.name = name || plan.name;
            if (startDate !== undefined) plan.startDate = startDate ? new Date(startDate) : null;
            if (endDate !== undefined) plan.endDate = endDate ? new Date(endDate) : null;
            if (meals !== undefined) {
                plan.meals = typeof meals === 'string' ? meals : JSON.stringify(meals);
            }
            if (trainerId !== undefined) plan.trainerId = trainerId || null;

            const updatedPlan = await plan.save();
            if (updatedPlan.meals && typeof updatedPlan.meals === 'string') {
                try {
                    updatedPlan.meals = JSON.parse(updatedPlan.meals);
                } catch (e) {}
            }
            res.json(updatedPlan);
        } else {
            res.status(404).json({ success: false, message: 'Diet plan not found' });
        }
    } catch (error) {
        console.error("UPDATE DIET PLAN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete diet plan
// @route   DELETE /api/diet-plans/:id
// @access  Private/Admin/Trainer
const deletePlan = async (req, res) => {
    try {
        const plan = await DietPlan.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (plan) {
            await plan.deleteOne();
            res.json({ message: 'Diet plan removed' });
        } else {
            res.status(404).json({ success: false, message: 'Diet plan not found' });
        }
    } catch (error) {
        console.error("DELETE DIET PLAN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan
};
