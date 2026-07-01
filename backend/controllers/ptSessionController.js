const PtSession = require('../models/PtSession');
const Member = require('../models/Member');
const User = require('../models/User');
const PtPackage = require('../models/PtPackage');

// @desc    Create/Schedule a Personal Training session
// @route   POST /api/pt-sessions
// @access  Private/Admin/Trainer
const createSession = async (req, res) => {
    try {
        const { memberId, trainerId, packageId, sessionDate, notes } = req.body;

        if (!memberId || !trainerId || !sessionDate) {
            return res.status(400).json({ success: false, message: 'Member ID, Trainer ID, and Session date are required' });
        }

        // Validate member
        const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Validate trainer
        const trainer = await User.findOne({ _id: trainerId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }), role: 'trainer' });
        if (!trainer) {
            return res.status(404).json({ success: false, message: 'Trainer not found or user is not a trainer' });
        }

        // Validate package (if provided)
        if (packageId) {
            const packageObj = await PtPackage.findOne({ _id: packageId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });
            if (!packageObj) {
                return res.status(404).json({ success: false, message: 'Package not found' });
            }
        }

        const session = await PtSession.create({
            memberId,
            trainerId,
            packageId: packageId || null,
            sessionDate: new Date(sessionDate),
            status: req.body.status || 'Scheduled',
            notes: notes || null,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId })
        });

        res.status(201).json(session);
    } catch (error) {
        console.error("CREATE PT SESSION ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all PT sessions
// @route   GET /api/pt-sessions
// @access  Private/Admin/Trainer/Member
const getSessions = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };

        if (req.user.role === 'member') {
            query.memberId = req.user.memberId;
        } else if (req.user.role === 'trainer') {
            query.trainerId = req.user.id;
        }

        if (req.query.memberId) {
            query.memberId = req.query.memberId;
        }
        if (req.query.trainerId) {
            query.trainerId = req.query.trainerId;
        }

        const sessions = await PtSession.find(query).lean();

        const formatted = [];
        for (const s of sessions) {
            const memberObj = await Member.findOne({ _id: s.memberId });
            const trainerObj = await User.findOne({ _id: s.trainerId }).select('-password');
            const packageObj = s.packageId ? await PtPackage.findOne({ _id: s.packageId }) : null;

            formatted.push({
                ...s,
                member: memberObj || null,
                trainer: trainerObj || null,
                package: packageObj || null
            });
        }

        res.json(formatted);
    } catch (error) {
        console.error("GET PT SESSIONS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single PT session
// @route   GET /api/pt-sessions/:id
// @access  Private/Admin/Trainer/Member
const getSessionById = async (req, res) => {
    try {
        const session = await PtSession.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (session) {
            if (req.user.role === 'member' && session.memberId !== req.user.memberId) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this session' });
            }

            const memberObj = await Member.findOne({ _id: session.memberId });
            const trainerObj = await User.findOne({ _id: session.trainerId }).select('-password');
            const packageObj = session.packageId ? await PtPackage.findOne({ _id: session.packageId }) : null;

            res.json({
                ...session,
                member: memberObj || null,
                trainer: trainerObj || null,
                package: packageObj || null
            });
        } else {
            res.status(404).json({ success: false, message: 'Session not found' });
        }
    } catch (error) {
        console.error("GET PT SESSION BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update PT session status or details
// @route   PUT /api/pt-sessions/:id
// @access  Private/Admin/Trainer
const updateSession = async (req, res) => {
    try {
        const { sessionDate, status, notes, trainerId } = req.body;

        const session = await PtSession.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (session) {
            if (sessionDate) session.sessionDate = new Date(sessionDate);
            if (status) session.status = status;
            if (notes !== undefined) session.notes = notes;
            if (trainerId) {
                const trainer = await User.findOne({ _id: trainerId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }), role: 'trainer' });
                if (!trainer) {
                    return res.status(404).json({ success: false, message: 'Trainer not found' });
                }
                session.trainerId = trainerId;
            }

            const updatedSession = await session.save();
            res.json(updatedSession);
        } else {
            res.status(404).json({ success: false, message: 'Session not found' });
        }
    } catch (error) {
        console.error("UPDATE PT SESSION ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete PT session
// @route   DELETE /api/pt-sessions/:id
// @access  Private/Admin/Trainer
const deleteSession = async (req, res) => {
    try {
        const session = await PtSession.findOne({ _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        if (session) {
            await session.deleteOne();
            res.json({ message: 'Session removed' });
        } else {
            res.status(404).json({ success: false, message: 'Session not found' });
        }
    } catch (error) {
        console.error("DELETE PT SESSION ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    deleteSession
};
