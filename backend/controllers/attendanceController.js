const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const { logAudit } = require('../utils/auditLogger');

// @desc    Mark attendance for a member (traditional gym check-in by staff)
// @route   POST /api/attendance
// @access  Private/Admin
const markAttendance = async (req, res) => {
    const { memberId } = req.body;

    // Tenant isolation: the member must belong to the caller's gym and branch if applicable.
    const memberQuery = { _id: memberId, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
    if (req.user.branchId) {
        memberQuery.branchId = req.user.branchId;
    }
    const member = await Member.findOne(memberQuery);
    if (!member) {
        res.status(404);
        throw new Error('Member not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingQuery = {
        memberId,
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    };
    if (req.user.branchId) {
        existingQuery.branchId = req.user.branchId;
    }

    const existingAttendance = await Attendance.findOne(existingQuery);

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
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        branchId: req.user.branchId || null
    });

    if (attendance) {
        await logAudit(req, 'ATTENDANCE_MARKED', 'Attendance', attendance._id,
            `Marked attendance for ${member.name}`, member.name);
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

    const query = {
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
        date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    };
    if (req.user.branchId) {
        query.branchId = req.user.branchId;
    }

    const attendanceList = await Attendance.find(query).populate('memberId', 'name phone').lean();

    res.json(attendanceList);
};

// @desc    Get attendance history for a member
// @route   GET /api/attendance/member/:memberId
// @access  Private/Admin
const getMemberAttendance = async (req, res) => {
    const query = {
        memberId: req.params.memberId,
        gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId })
    };
    if (req.user.branchId) {
        query.branchId = req.user.branchId;
    }

    const attendance = await Attendance.find(query)
        .sort({ createdAt: -1 })
        .lean();
    res.json(attendance);
};

module.exports = {
    markAttendance,
    getMemberAttendance,
    getTodayAttendance,
};
