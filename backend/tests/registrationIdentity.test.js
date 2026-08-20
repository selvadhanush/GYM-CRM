const request = require('supertest');
const { parseRegistrationPayload } = require('../services/attendanceService');
const { generateRegistrationNumber } = require('../utils/registrationGenerator');
const Member = require('../models/Member');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Attendance = require('../models/Attendance');

describe('Registration Identity & Converged Attendance Test Suite', () => {

    let testPlanId;

    beforeAll(async () => {
        let plan = await Plan.findOne({});
        if (!plan) {
            plan = await Plan.create({
                name: 'Identity Test Plan',
                price: 1000,
                duration: 30,
                gymId: 'H4-GYM'
            });
        }
        testPlanId = plan.id;
    });

    beforeEach(async () => {
        await User.deleteMany({ email: { $in: ['staff_trainer_test@gymcrm.com', 'linked_member_test@gymcrm.com'] } });
        await Member.deleteMany({
            registrationNumber: {
                $in: ['REG-MEMBER-8888', 'REG-TEST-TENANTA', 'REG-TEST-DAILYCHECKIN', 'REG-TEST-EXPIRED']
            }
        });
        await Member.deleteMany({ phone: { $in: ['9998887770', '9111111111', '9222222222', '9333333333'] } });
    });

    test('1. Payload parsing handles both raw registration numbers and GYMCRM:1: payload format', () => {
        expect(parseRegistrationPayload('GYMCRM:1:REG-100001')).toBe('REG-100001');
        expect(parseRegistrationPayload('  GYMCRM:1:REG-100002  ')).toBe('REG-100002');
        expect(parseRegistrationPayload('REG-100003')).toBe('REG-100003');
        expect(parseRegistrationPayload('   REG-100004   ')).toBe('REG-100004');
        expect(parseRegistrationPayload('')).toBe('');
        expect(parseRegistrationPayload(null)).toBe('');
    });

    test('2. Registration number generation produces valid sequential REG- format', async () => {
        const reg1 = await generateRegistrationNumber();
        const reg2 = await generateRegistrationNumber();
        expect(reg1).toMatch(/^REG-\d+/);
        expect(reg2).toMatch(/^REG-\d+/);
        expect(reg1).not.toBe(reg2);
    });

    test('3. User schema rule: Member-linked User has null registrationNumber, Direct Staff User has non-null registrationNumber', async () => {
        const uniqueSuffix = Date.now();
        // Direct Staff User
        const staffUser = await User.create({
            name: 'Test Staff Trainer',
            email: `staff_trainer_${uniqueSuffix}@gymcrm.com`,
            password: 'password123',
            role: 'trainer',
            registrationNumber: `REG-STAFF-${uniqueSuffix}`,
            gymId: 'H4-GYM'
        });
        expect(staffUser.registrationNumber).toBe(`REG-STAFF-${uniqueSuffix}`);

        // Member-linked User
        const member = await Member.create({
            name: 'Test Linked Member',
            phone: '9998887770',
            registrationNumber: `REG-MEMBER-${uniqueSuffix}`,
            gymId: 'H4-GYM',
            planId: testPlanId,
            joinDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 86400000),
            status: 'Active'
        });

        const memberUser = await User.create({
            name: 'Test Member User Account',
            email: `linked_member_${uniqueSuffix}@gymcrm.com`,
            password: 'password123',
            role: 'member',
            memberId: member.id,
            gymId: 'H4-GYM'
        });

        expect(memberUser.registrationNumber).toBeNull();
        expect(memberUser.memberId).toBe(member.id);

        // Cleanup
        await User.deleteMany({ id: { $in: [staffUser.id, memberUser.id] } });
        await Member.deleteMany({ id: member.id });
    });

    test('4. Cross-tenant access rejection on attendance check-in by identity', async () => {
        const { markAttendanceByIdentity } = require('../services/attendanceService');

        // Member in Tenant A
        const memberTenantA = await Member.create({
            name: 'Tenant A Member',
            phone: '9111111111',
            registrationNumber: 'REG-TEST-TENANTA',
            gymId: 'GYM-TENANT-A',
            planId: testPlanId,
            joinDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 86400000),
            status: 'Active'
        });

        // Request originating from Tenant B admin
        const reqTenantB = {
            user: { role: 'admin', gymId: 'GYM-TENANT-B' },
            tenantFilter: { gymId: 'GYM-TENANT-B' }
        };

        await expect(
            markAttendanceByIdentity({ rawInput: 'GYMCRM:1:REG-TEST-TENANTA', req: reqTenantB })
        ).rejects.toThrow('Access denied: Registration Number belongs to a different organization');

        // Cleanup
        await Member.deleteMany({ id: memberTenantA.id });
    });

    test('5. Single calendar day attendance restriction for members', async () => {
        const { markAttendanceByIdentity } = require('../services/attendanceService');

        const member = await Member.create({
            name: 'Daily Checkin Member',
            phone: '9222222222',
            registrationNumber: 'REG-TEST-DAILYCHECKIN',
            gymId: 'GYM-TENANT-CHECKIN',
            planId: testPlanId,
            joinDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 86400000),
            status: 'Active'
        });

        const req = {
            user: { role: 'admin', gymId: 'GYM-TENANT-CHECKIN' },
            tenantFilter: { gymId: 'GYM-TENANT-CHECKIN' }
        };

        // First check-in should succeed
        const res1 = await markAttendanceByIdentity({ rawInput: 'REG-TEST-DAILYCHECKIN', req });
        expect(res1.success).toBe(true);
        expect(res1.type).toBe('member');

        // Second check-in on same day should be rejected
        await expect(
            markAttendanceByIdentity({ rawInput: 'REG-TEST-DAILYCHECKIN', req })
        ).rejects.toThrow(/Attendance already marked today/);

        // Cleanup
        await Attendance.deleteMany({ memberId: member.id });
        await Member.deleteMany({ id: member.id });
    });

    test('6. Inactive member status rejection', async () => {
        const { markAttendanceByIdentity } = require('../services/attendanceService');

        const inactiveMember = await Member.create({
            name: 'Expired Status Member',
            phone: '9333333333',
            registrationNumber: 'REG-TEST-EXPIRED',
            gymId: 'GYM-TENANT-STATUS',
            planId: testPlanId,
            joinDate: new Date(),
            expiryDate: new Date(Date.now() - 86400000),
            status: 'Expired'
        });

        const req = {
            user: { role: 'admin', gymId: 'GYM-TENANT-STATUS' },
            tenantFilter: { gymId: 'GYM-TENANT-STATUS' }
        };

        await expect(
            markAttendanceByIdentity({ rawInput: 'REG-TEST-EXPIRED', req })
        ).rejects.toThrow("Cannot mark attendance: Member status is 'Expired'");

        // Cleanup
        await Member.deleteMany({ id: inactiveMember.id });
    });
});
