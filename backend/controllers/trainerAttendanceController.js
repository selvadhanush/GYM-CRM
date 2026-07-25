const TrainerAttendance = require('../models/TrainerAttendance');
const User = require('../models/User');

// @desc    Check In Trainer
// @route   POST /api/trainer-attendance/checkin
// @access  Private (Trainer/Admin)
const checkInTrainer = async (req, res) => {
    try {
        const trainerId = req.user.role === 'trainer' ? req.user.id : req.body.trainerId;
        
        if (!trainerId) {
            return res.status(400).json({ success: false, message: 'Trainer ID is required' });
        }

        // Validate trainer exists
        const trainerQuery = { _id: trainerId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            trainerQuery.branchId = req.user.branchId;
        }
        const trainer = await User.findOne(trainerQuery);
        if (!trainer || trainer.role !== 'trainer') {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        // Check if already checked in today (start of day to end of day)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingQuery = {
            trainerId,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        };
        if (req.user.branchId) {
            existingQuery.branchId = req.user.branchId;
        }

        const existing = await TrainerAttendance.findOne(existingQuery);

        if (existing) {
            return res.status(400).json({ success: false, message: 'Trainer already checked in today' });
        }

        const attendance = await TrainerAttendance.create({
            trainerId,
            date: new Date(),
            checkInTime: new Date(),
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            branchId: req.user.branchId || null
        });

        res.status(201).json(attendance);
    } catch (error) {
        console.error("TRAINER CHECKIN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check Out Trainer
// @route   POST /api/trainer-attendance/checkout
// @access  Private (Trainer/Admin)
const checkOutTrainer = async (req, res) => {
    try {
        const trainerId = req.user.role === 'trainer' ? req.user.id : req.body.trainerId;

        if (!trainerId) {
            return res.status(400).json({ success: false, message: 'Trainer ID is required' });
        }

        const query = {
            trainerId,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            checkOutTime: null
        };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }

        // Find active check-in (where checkOutTime is null)
        const attendance = await TrainerAttendance.findOne(query);

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No active check-in found for this trainer' });
        }

        const checkOutTime = new Date();
        const checkInTime = new Date(attendance.checkInTime);
        const diffMs = checkOutTime - checkInTime;
        const workingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2)); // in hours

        attendance.checkOutTime = checkOutTime;
        attendance.workingHours = workingHours;

        const updated = await attendance.save();
        res.json(updated);
    } catch (error) {
        console.error("TRAINER CHECKOUT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Trainer Attendance Logs
// @route   GET /api/trainer-attendance
// @access  Private (Admin/Trainer)
const getTrainerAttendance = async (req, res) => {
    try {
        let query = {};
        if (req.query.gymId) {
            query.gymId = req.query.gymId;
        } else if (req.user.gymId && req.user.gymId !== 'SYSTEM' && req.user.role !== 'superadmin') {
            query.gymId = req.user.gymId;
        }
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }

        if (req.user.role === 'trainer') {
            query.trainerId = req.user.id;
        } else if (req.query.trainerId) {
            query.trainerId = req.query.trainerId;
        }

        // Strict pagination parameters with hard cap at 100
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
        const skip = (page - 1) * limit;

        const total = await TrainerAttendance.countDocuments(query);
        const logs = await TrainerAttendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Batched Trainer lookup ONLY
        const trainerIds = [...new Set(logs.map(l => l.trainerId).filter(Boolean))];
        const trainers = trainerIds.length > 0
            ? await User.find({ _id: { $in: trainerIds } }).select('id name email role phone').lean()
            : [];

        const trainerMap = new Map((trainers || []).map(t => [t._id ? t._id.toString() : t.id, t]));

        const formatted = logs.map(log => {
            const t = log.trainerId ? trainerMap.get(log.trainerId.toString()) : null;
            return {
                ...log,
                trainer: t ? { id: t.id || t._id, name: t.name, email: t.email } : null
            };
        });

        res.json({
            success: true,
            data: formatted,
            meta: { page, limit, total }
        });
    } catch (error) {
        console.error("GET TRAINER ATTENDANCE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    checkInTrainer,
    checkOutTrainer,
    getTrainerAttendance
};
