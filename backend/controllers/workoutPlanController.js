const WorkoutPlan = require('../models/WorkoutPlan');
const Member = require('../models/Member');
const User = require('../models/User');

// @desc    Create a workout plan for a member
// @route   POST /api/workout-plans
// @access  Private/Admin/Trainer
const createPlan = async (req, res) => {
    try {
        const { memberId, name, startDate, endDate, exercises } = req.body;

        if (!memberId || !name) {
            return res.status(400).json({ success: false, message: 'Member ID and Plan name are required' });
        }

        // Validate member exists
        const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const plan = await WorkoutPlan.create({
            memberId,
            trainerId: req.user.role === 'trainer' ? req.user.id : (req.body.trainerId || null),
            name,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            exercises: exercises ? (typeof exercises === 'string' ? exercises : JSON.stringify(exercises)) : null,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId })
        });

        res.status(201).json(plan);
    } catch (error) {
        console.error("CREATE WORKOUT PLAN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all workout plans
// @route   GET /api/workout-plans
// @access  Private/Admin/Trainer/Member
const getPlans = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };

        // If member is fetching, only show their plans
        if (req.user.role === 'member') {
            query.memberId = req.user.memberId;
        } else if (req.user.role === 'trainer') {
            // Option to filter by trainer
            query.trainerId = req.user.id;
        }

        // If searching for specific member's plans
        if (req.query.memberId) {
            query.memberId = req.query.memberId;
        }

        const plans = await WorkoutPlan.find(query).lean();

        const formatted = [];
        for (const p of plans) {
            if (p.exercises && typeof p.exercises === 'string') {
                try {
                    p.exercises = JSON.parse(p.exercises);
                } catch (e) {}
            }
            // Populate member and trainer manually
            const memberObj = await Member.findOne({ _id: p.memberId });
            const trainerObj = p.trainerId ? await User.findOne({ _id: p.trainerId }).select('-password') : null;
            
            formatted.push({
                ...p,
                member: memberObj || null,
                trainer: trainerObj || null
            });
        }

        res.json(formatted);
    } catch (error) {
        console.error("GET WORKOUT PLANS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single workout plan
// @route   GET /api/workout-plans/:id
// @access  Private/Admin/Trainer/Member
const getPlanById = async (req, res) => {
    try {
        const plan = await WorkoutPlan.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (plan) {
            // Check member authorization
            if (req.user.role === 'member' && plan.memberId !== req.user.memberId) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this plan' });
            }

            if (plan.exercises && typeof plan.exercises === 'string') {
                try {
                    plan.exercises = JSON.parse(plan.exercises);
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
            res.status(404).json({ success: false, message: 'Workout plan not found' });
        }
    } catch (error) {
        console.error("GET WORKOUT PLAN BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update workout plan
// @route   PUT /api/workout-plans/:id
// @access  Private/Admin/Trainer
const updatePlan = async (req, res) => {
    try {
        const { name, startDate, endDate, exercises, trainerId } = req.body;

        const plan = await WorkoutPlan.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (plan) {
            plan.name = name || plan.name;
            if (startDate !== undefined) plan.startDate = startDate ? new Date(startDate) : null;
            if (endDate !== undefined) plan.endDate = endDate ? new Date(endDate) : null;
            if (exercises !== undefined) {
                plan.exercises = typeof exercises === 'string' ? exercises : JSON.stringify(exercises);
            }
            if (trainerId !== undefined) plan.trainerId = trainerId || null;

            const updatedPlan = await plan.save();
            if (updatedPlan.exercises && typeof updatedPlan.exercises === 'string') {
                try {
                    updatedPlan.exercises = JSON.parse(updatedPlan.exercises);
                } catch (e) {}
            }
            res.json(updatedPlan);
        } else {
            res.status(404).json({ success: false, message: 'Workout plan not found' });
        }
    } catch (error) {
        console.error("UPDATE WORKOUT PLAN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete workout plan
// @route   DELETE /api/workout-plans/:id
// @access  Private/Admin/Trainer
const deletePlan = async (req, res) => {
    try {
        const plan = await WorkoutPlan.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (plan) {
            await plan.deleteOne();
            res.json({ message: 'Workout plan removed' });
        } else {
            res.status(404).json({ success: false, message: 'Workout plan not found' });
        }
    } catch (error) {
        console.error("DELETE WORKOUT PLAN ERROR:", error);
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
