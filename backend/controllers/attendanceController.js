const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const { logAudit } = require('../utils/auditLogger');

// @desc    Mark attendance for a member (traditional gym check-in by staff)
// @route   POST /api/attendance
// @access  Private/Admin
const markAttendance = catchAsync(async (req, res, next) => {
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
});


// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private/Admin
const getTodayAttendance = catchAsync(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
        ...req.tenantFilter,
        date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    };

    const attendanceList = await Attendance.find(query).populate('memberId', 'name phone').lean();

    res.json(attendanceList);
});

// @desc    Get attendance history for a member
// @route   GET /api/attendance/member/:memberId
// @access  Private/Admin
const getMemberAttendance = catchAsync(async (req, res, next) => {
    // IDOR Protection: Verify member belongs to authorized tenant scope
    const memberQuery = { _id: req.params.memberId, ...req.tenantFilter };
    const member = await Member.findOne(memberQuery);
    if (!member) {
        return res.status(404).json({ message: 'Member not found' });
    }

    const query = {
        memberId: req.params.memberId,
        ...req.tenantFilter
    };

    const attendance = await Attendance.find(query)
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
    res.json(attendance);
});

// @desc    Converged identity check-in via QR payload or manual Registration Number
// @route   POST /api/attendance/checkin-identity
// @access  Private/Admin/Receptionist
const markAttendanceByIdentityController = catchAsync(async (req, res, next) => {
    const { attendanceService } = require('../services/attendanceService');
    const { markAttendanceByIdentity } = require('../services/attendanceService');
    const input = req.body.identityInput || req.body.registrationNumber || req.body.qrCode || req.body.memberId;

    if (!input) {
        return res.status(400).json({ message: 'Registration Number or QR payload is required' });
    }

    try {
        const result = await markAttendanceByIdentity({ rawInput: input, req });
        res.status(200).json(result);
    } catch (err) {
        const status = err.statusCode || 400;
        res.status(status).json({ message: err.message });
    }
});

// @desc    Lookup person identity by Registration Number within authorized tenant scope
// @route   GET /api/attendance/lookup-identity/:registrationNumber
// @access  Private/Admin/Receptionist
const lookupIdentityController = catchAsync(async (req, res, next) => {
    const { parseRegistrationPayload } = require('../services/attendanceService');
    const regNum = parseRegistrationPayload(req.params.registrationNumber);
    const User = require('../models/User');

    let member = await Member.findOne({ registrationNumber: regNum });
    let staff = null;

    if (!member) {
        staff = await User.findOne({ registrationNumber: regNum, memberId: null });
    }

    if (!member && !staff) {
        return res.status(404).json({ message: 'No entity found with this Registration Number' });
    }

    const person = member || staff;
    const isMember = !!member;

    // Security check: Ensure person belongs to caller's tenant
    if (req.user.role !== 'superadmin' && req.user.role !== 'fitpass_admin') {
        const authorizedGymId = req.tenantFilter?.gymId || req.user.gymId;
        if (person.gymId !== authorizedGymId) {
            return res.status(404).json({ message: 'No entity found with this Registration Number' });
        }

        const fixedBranchId = req.user.userBranchId || req.user.branchId || req.tenantFilter?.branchId;
        if (fixedBranchId && person.branchId && person.branchId !== fixedBranchId) {
            return res.status(404).json({ message: 'No entity found with this Registration Number' });
        }
    }

    res.json({
        type: isMember ? 'member' : 'staff',
        registrationNumber: regNum,
        person: {
            id: person.id,
            name: person.name,
            phone: person.phone || null,
            email: person.email || null,
            status: person.status,
            role: isMember ? 'Member' : person.role,
            gymId: person.gymId,
            branchId: person.branchId
        }
    });
});

module.exports = {
    markAttendance,
    getMemberAttendance,
    getTodayAttendance,
    markAttendanceByIdentityController,
    lookupIdentityController
};
