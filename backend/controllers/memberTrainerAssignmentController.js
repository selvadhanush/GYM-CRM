const MemberTrainerAssignment = require('../models/MemberTrainerAssignment');
const User = require('../models/User');
const Member = require('../models/Member');

// @desc    Assign a trainer to a member
// @route   POST /api/trainer-assignments
// @access  Private/Admin
const assignTrainer = async (req, res) => {
    try {
        const { memberId, trainerId } = req.body;

        if (!memberId || !trainerId) {
            return res.status(400).json({ success: false, message: 'Member ID and Trainer ID are required' });
        }

        // Validate member exists in the same gym
        const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Validate trainer exists in the same gym and has role 'trainer'
        const trainer = await User.findOne({ _id: trainerId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }), role: 'trainer' });
        if (!trainer) {
            return res.status(404).json({ success: false, message: 'Trainer not found or user is not a trainer' });
        }

        // Check if assignment already exists
        const existingAssignment = await MemberTrainerAssignment.findOne({
            memberId,
            trainerId,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId })
        });

        if (existingAssignment) {
            return res.status(400).json({ success: false, message: 'Trainer is already assigned to this member' });
        }

        const assignment = await MemberTrainerAssignment.create({
            memberId,
            trainerId,
            assignedDate: new Date(),
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId })
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error("ASSIGN TRAINER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all trainer assignments
// @route   GET /api/trainer-assignments
// @access  Private/Admin/Trainer
const getAssignments = async (req, res) => {
    try {
        const assignments = await MemberTrainerAssignment.find({ gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) }).lean();
        
        // Populate member and trainer manually since PerformPopulate in MongooseAdapter is basic
        const populated = [];
        for (const assoc of assignments) {
            const memberObj = await Member.findOne({ _id: assoc.memberId });
            const trainerObj = await User.findOne({ _id: assoc.trainerId }).select('-password');
            populated.push({
                ...assoc,
                member: memberObj || null,
                trainer: trainerObj || null
            });
        }

        res.json(populated);
    } catch (error) {
        console.error("GET ASSIGNMENTS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove a trainer assignment
// @route   DELETE /api/trainer-assignments/:id
// @access  Private/Admin
const removeAssignment = async (req, res) => {
    try {
        const assignment = await MemberTrainerAssignment.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (assignment) {
            await assignment.deleteOne();
            res.json({ message: 'Trainer assignment removed' });
        } else {
            res.status(404).json({ success: false, message: 'Assignment not found' });
        }
    } catch (error) {
        console.error("REMOVE ASSIGNMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    assignTrainer,
    getAssignments,
    removeAssignment
};
