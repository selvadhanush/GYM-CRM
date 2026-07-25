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

        // Strict pagination parameters with hard cap at 100
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
        const skip = (page - 1) * limit;

        const total = await PtSession.countDocuments(query);
        const sessions = await PtSession.find(query)
            .sort({ sessionDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Batched 3-entity lookup (Member + Trainer + PtPackage)
        const memberIds = [...new Set(sessions.map(s => s.memberId).filter(Boolean))];
        const trainerIds = [...new Set(sessions.map(s => s.trainerId).filter(Boolean))];
        const packageIds = [...new Set(sessions.map(s => s.packageId).filter(Boolean))];

        const [members, trainers, packages] = await Promise.all([
            memberIds.length > 0 ? Member.find({ _id: { $in: memberIds } }).select('id name phone email').lean() : [],
            trainerIds.length > 0 ? User.find({ _id: { $in: trainerIds } }).select('id name email role phone').lean() : [],
            packageIds.length > 0 ? PtPackage.find({ _id: { $in: packageIds } }).select('id name price sessionCount').lean() : []
        ]);

        const memberMap = new Map((members || []).map(m => [m._id ? m._id.toString() : m.id, m]));
        const trainerMap = new Map((trainers || []).map(t => [t._id ? t._id.toString() : t.id, t]));
        const packageMap = new Map((packages || []).map(p => [p._id ? p._id.toString() : p.id, p]));

        const formatted = sessions.map(s => {
            const m = s.memberId ? memberMap.get(s.memberId.toString()) : null;
            const t = s.trainerId ? trainerMap.get(s.trainerId.toString()) : null;
            const pkg = s.packageId ? packageMap.get(s.packageId.toString()) : null;

            return {
                ...s,
                member: m ? { id: m.id || m._id, name: m.name, phone: m.phone, email: m.email } : null,
                trainer: t ? { id: t.id || t._id, name: t.name, email: t.email } : null,
                package: pkg ? { id: pkg.id || pkg._id, name: pkg.name, price: pkg.price, sessionCount: pkg.sessionCount } : null
            };
        });

        res.json({
            success: true,
            data: formatted,
            meta: { page, limit, total }
        });
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
