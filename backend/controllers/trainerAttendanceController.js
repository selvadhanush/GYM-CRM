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
        const trainer = await User.findOne({ _id: trainerId, gymId: req.user.gymId });
        if (!trainer || trainer.role !== 'trainer') {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        // Check if already checked in today (start of day to end of day)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existing = await TrainerAttendance.findOne({
            trainerId,
            gymId: req.user.gymId,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Trainer already checked in today' });
        }

        const attendance = await TrainerAttendance.create({
            trainerId,
            date: new Date(),
            checkInTime: new Date(),
            gymId: req.user.gymId
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

        // Find active check-in (where checkOutTime is null)
        const attendance = await TrainerAttendance.findOne({
            trainerId,
            gymId: req.user.gymId,
            checkOutTime: null
        });

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
        let query = { gymId: req.user.gymId };

        if (req.user.role === 'trainer') {
            query.trainerId = req.user.id;
        } else if (req.query.trainerId) {
            query.trainerId = req.query.trainerId;
        }

        const logs = await TrainerAttendance.find(query).sort({ date: -1 }).lean();

        // Populate Trainer details
        const formatted = [];
        for (const log of logs) {
            const trainerObj = await User.findOne({ _id: log.trainerId }).select('-password');
            formatted.push({
                ...log,
                trainer: trainerObj ? { id: trainerObj.id, name: trainerObj.name, email: trainerObj.email } : null
            });
        }

        res.json(formatted);
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
