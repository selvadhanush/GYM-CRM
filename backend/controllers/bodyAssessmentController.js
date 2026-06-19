const BodyAssessment = require('../models/BodyAssessment');
const Member = require('../models/Member');
const User = require('../models/User');

// @desc    Create/Record a new Body Assessment
// @route   POST /api/body-assessments
// @access  Private/Admin/Trainer
const createAssessment = async (req, res) => {
    try {
        const {
            memberId,
            weight,
            bmi,
            bodyFat,
            muscleMass,
            bmr,
            inBodyScore,
            assessmentDate
        } = req.body;

        if (!memberId || weight === undefined || bmi === undefined || bodyFat === undefined || muscleMass === undefined || bmr === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Member ID, Weight, BMI, Body Fat %, Muscle Mass, and BMR are required'
            });
        }

        // Validate member exists in same gym
        const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const assessment = await BodyAssessment.create({
            memberId,
            trainerId: req.user.id,
            weight: Number(weight),
            bmi: Number(bmi),
            bodyFat: Number(bodyFat),
            muscleMass: Number(muscleMass),
            bmr: Number(bmr),
            inBodyScore: inBodyScore !== undefined ? Number(inBodyScore) : null,
            assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
            gymId: req.user.gymId
        });

        res.status(201).json(assessment);
    } catch (error) {
        console.error("CREATE BODY ASSESSMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get body assessments history
// @route   GET /api/body-assessments
// @access  Private/Admin/Trainer/Member
const getAssessments = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId };

        // If member is calling, force show only their assessments
        if (req.user.role === 'member') {
            query.memberId = req.user.memberId;
        } else if (req.query.memberId) {
            query.memberId = req.query.memberId;
        }

        // Get assessments sorted by assessmentDate descending (newest first)
        const assessments = await BodyAssessment.find(query)
            .sort({ assessmentDate: -1 })
            .lean();

        // Populate member details if requested
        const formatted = [];
        for (const a of assessments) {
            const memberObj = await Member.findOne({ _id: a.memberId });
            const trainerObj = a.trainerId ? await User.findOne({ _id: a.trainerId }).select('-password') : null;

            formatted.push({
                ...a,
                member: memberObj ? { id: memberObj.id, name: memberObj.name, phone: memberObj.phone } : null,
                trainer: trainerObj ? { id: trainerObj.id, name: trainerObj.name } : null
            });
        }

        res.json(formatted);
    } catch (error) {
        console.error("GET BODY ASSESSMENTS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single body assessment
// @route   GET /api/body-assessments/:id
// @access  Private/Admin/Trainer/Member
const getAssessmentById = async (req, res) => {
    try {
        const assessment = await BodyAssessment.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (assessment) {
            if (req.user.role === 'member' && assessment.memberId !== req.user.memberId) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this assessment' });
            }

            const memberObj = await Member.findOne({ _id: assessment.memberId });
            const trainerObj = assessment.trainerId ? await User.findOne({ _id: assessment.trainerId }).select('-password') : null;

            res.json({
                ...assessment,
                member: memberObj ? { id: memberObj.id, name: memberObj.name, phone: memberObj.phone } : null,
                trainer: trainerObj ? { id: trainerObj.id, name: trainerObj.name } : null
            });
        } else {
            res.status(404).json({ success: false, message: 'Assessment not found' });
        }
    } catch (error) {
        console.error("GET BODY ASSESSMENT BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a body assessment record
// @route   PUT /api/body-assessments/:id
// @access  Private/Admin/Trainer
const updateAssessment = async (req, res) => {
    try {
        const {
            weight,
            bmi,
            bodyFat,
            muscleMass,
            bmr,
            inBodyScore,
            assessmentDate
        } = req.body;

        const assessment = await BodyAssessment.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (assessment) {
            if (weight !== undefined) assessment.weight = Number(weight);
            if (bmi !== undefined) assessment.bmi = Number(bmi);
            if (bodyFat !== undefined) assessment.bodyFat = Number(bodyFat);
            if (muscleMass !== undefined) assessment.muscleMass = Number(muscleMass);
            if (bmr !== undefined) assessment.bmr = Number(bmr);
            if (inBodyScore !== undefined) assessment.inBodyScore = inBodyScore !== null ? Number(inBodyScore) : null;
            if (assessmentDate !== undefined) assessment.assessmentDate = assessmentDate ? new Date(assessmentDate) : assessment.assessmentDate;

            const updated = await assessment.save();
            res.json(updated);
        } else {
            res.status(404).json({ success: false, message: 'Assessment not found' });
        }
    } catch (error) {
        console.error("UPDATE BODY ASSESSMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a body assessment record
// @route   DELETE /api/body-assessments/:id
// @access  Private/Admin/Trainer
const deleteAssessment = async (req, res) => {
    try {
        const assessment = await BodyAssessment.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (assessment) {
            await assessment.deleteOne();
            res.json({ message: 'Body assessment removed' });
        } else {
            res.status(404).json({ success: false, message: 'Assessment not found' });
        }
    } catch (error) {
        console.error("DELETE BODY ASSESSMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAssessment,
    getAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment
};
