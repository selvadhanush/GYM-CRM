const Member = require('../models/Member');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const TrainerAttendance = require('../models/TrainerAttendance');
const { logAudit } = require('../utils/auditLogger');

/**
 * Parses and extracts the registration number from a raw input string or QR code payload.
 * Expected QR format: GYMCRM:1:<registrationNumber>
 * Expected manual input format: <registrationNumber>
 *
 * @param {string} rawInput
 * @returns {string} Cleaned Registration Number
 */
const parseRegistrationPayload = (rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') {
        return '';
    }
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('GYMCRM:1:')) {
        return trimmed.replace('GYMCRM:1:', '').trim();
    }
    return trimmed;
};

/**
 * Authoritative, Converged Attendance Resolution & Execution Service.
 * Converges both QR scanning and Manual Registration Number entry into ONE pipeline.
 *
 * Pipeline:
 * 1. Payload Parsing & Sanitization
 * 2. Identity Resolution (Member vs Staff User)
 * 3. Tenant & Branch Isolation Validation
 * 4. Status & Role Authorization Check
 * 5. Type-Specific Attendance Business Rules (Member 1/day, Staff/Trainer clock-in)
 * 6. Transactional Write & Audit Logging
 */
const markAttendanceByIdentity = async ({ rawInput, req }) => {
    const regNum = parseRegistrationPayload(rawInput);
    if (!regNum) {
        const error = new Error('Valid Registration Number or QR payload is required');
        error.statusCode = 400;
        throw error;
    }

    // Step 1: Identity Resolution
    let targetMember = await Member.findOne({ registrationNumber: regNum });
    let targetStaff = null;

    if (!targetMember) {
        // Look up staff user (must have memberId === null to represent direct personnel)
        targetStaff = await User.findOne({ registrationNumber: regNum, memberId: null });
    }

    if (!targetMember && !targetStaff) {
        const error = new Error('No member or staff record found matching this Registration Number');
        error.statusCode = 404;
        throw error;
    }

    const targetPerson = targetMember || targetStaff;
    const isMember = !!targetMember;

    // Step 2: Tenant Scoping & Isolation Validation
    // Non-superadmins are strictly restricted to their authorized gymId from req.tenantFilter / req.user
    if (req.user.role !== 'superadmin' && req.user.role !== 'fitpass_admin') {
        const authorizedGymId = req.tenantFilter?.gymId || req.user.gymId;
        if (targetPerson.gymId !== authorizedGymId) {
            const error = new Error('Access denied: Registration Number belongs to a different organization');
            error.statusCode = 403;
            throw error;
        }

        const fixedBranchId = req.user.userBranchId || req.user.branchId || req.tenantFilter?.branchId;
        if (fixedBranchId && targetPerson.branchId && targetPerson.branchId !== fixedBranchId) {
            const error = new Error('Access denied: Registration Number belongs to a different branch');
            error.statusCode = 403;
            throw error;
        }
    }

    // Step 3: Target Person Status Check
    if (isMember) {
        if (targetMember.status !== 'Active') {
            const error = new Error(`Cannot mark attendance: Member status is '${targetMember.status}'`);
            error.statusCode = 400;
            throw error;
        }
    } else {
        if (targetStaff.status !== 'Active' || targetStaff.isActive === false) {
            const error = new Error('Cannot mark attendance: Staff member is inactive or suspended');
            error.statusCode = 400;
            throw error;
        }
    }

    // Step 4: Business Rules & Attendance Creation
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    if (isMember) {
        // Member Attendance Business Rules: 1 check-in per calendar day
        const existingAttendance = await Attendance.findOne({
            memberId: targetMember.id,
            gymId: req.user.gymId,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (existingAttendance) {
            const error = new Error(`Attendance already marked today for ${targetMember.name}`);
            error.statusCode = 400;
            throw error;
        }

        const checkInTimeStr = now.toTimeString().split(' ')[0];
        const attendance = await Attendance.create({
            memberId: targetMember.id,
            date: now,
            checkInTime: checkInTimeStr,
            gymId: req.user.gymId,
            branchId: req.user.branchId || targetMember.branchId || null
        });

        await logAudit(
            req,
            'ATTENDANCE_MARKED_IDENTITY',
            'Attendance',
            attendance.id,
            `Marked attendance via Registration Number (${regNum}) for Member: ${targetMember.name}`,
            targetMember.name
        );

        return {
            success: true,
            type: 'member',
            registrationNumber: regNum,
            person: {
                id: targetMember.id,
                name: targetMember.name,
                phone: targetMember.phone,
                status: targetMember.status,
                gymId: targetMember.gymId,
                branchId: targetMember.branchId
            },
            attendance: {
                id: attendance.id,
                date: attendance.date,
                checkInTime: attendance.checkInTime
            },
            message: `Attendance marked successfully for Member ${targetMember.name}`
        };

    } else {
        // Staff / Trainer Attendance Business Rules
        const existingCheckIn = await TrainerAttendance.findOne({
            trainerId: targetStaff.id,
            gymId: req.user.gymId,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (existingCheckIn) {
            const error = new Error(`Staff/Trainer check-in already recorded today for ${targetStaff.name}`);
            error.statusCode = 400;
            throw error;
        }

        const staffAttendance = await TrainerAttendance.create({
            trainerId: targetStaff.id,
            date: now,
            checkInTime: now,
            gymId: req.user.gymId,
            branchId: req.user.branchId || targetStaff.branchId || null
        });

        await logAudit(
            req,
            'STAFF_ATTENDANCE_MARKED_IDENTITY',
            'TrainerAttendance',
            staffAttendance.id,
            `Marked staff attendance via Registration Number (${regNum}) for Staff: ${targetStaff.name} (${targetStaff.role})`,
            targetStaff.name
        );

        return {
            success: true,
            type: 'staff',
            role: targetStaff.role,
            registrationNumber: regNum,
            person: {
                id: targetStaff.id,
                name: targetStaff.name,
                email: targetStaff.email,
                role: targetStaff.role,
                gymId: targetStaff.gymId,
                branchId: targetStaff.branchId
            },
            attendance: {
                id: staffAttendance.id,
                date: staffAttendance.date,
                checkInTime: staffAttendance.checkInTime
            },
            message: `Staff attendance marked successfully for ${targetStaff.name} (${targetStaff.role})`
        };
    }
};

module.exports = {
    parseRegistrationPayload,
    markAttendanceByIdentity
};
