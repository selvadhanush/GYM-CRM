const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

// @desc    Mark attendance for a member
// @route   POST /api/attendance
// @access  Private/Admin
const markAttendance = async (req, res) => {
    const { memberId } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
        res.status(404);
        throw new Error('Member not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
        memberId,
        date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    });

    if (existingAttendance) {
        res.status(400);
        throw new Error('Attendance already marked for today');
    }

    // Format current time as HH:MM:SS
    const now = new Date();
    const checkInTime = now.toTimeString().split(' ')[0];

    const attendance = await Attendance.create({
        memberId,
        date: now,
        checkInTime,
        gymId: req.user.gymId
    });

    if (attendance) {
        res.status(201).json(attendance);
    } else {
        res.status(400);
        throw new Error('Invalid attendance data');
    }
};


// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private/Admin
const getTodayAttendance = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceList = await Attendance.find({
        gymId: req.user.gymId,
        date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    }).populate('memberId', 'name phone').lean();

    res.json(attendanceList);
};

// @desc    Get attendance history for a member
// @route   GET /api/attendance/member/:memberId
// @access  Private/Admin
const getMemberAttendance = async (req, res) => {
    const attendance = await Attendance.find({
        memberId: req.params.memberId,
        gymId: req.user.gymId
    })
        .sort({ createdAt: -1 })
        .lean();
    res.json(attendance);
};

module.exports = {
    markAttendance,
    getMemberAttendance,
    getTodayAttendance,
};
