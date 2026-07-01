const prisma = require('../config/prisma');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Helper to generate JWT tokens matching authMiddleware expectation
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

async function main() {
    console.log('=== STARTING FITPASS AUTOMATED QA RUN ===\n');

    // 1. Identify test users
    const superAdminUserId = '1a957b4a-b6ad-4b97-9cae-04d3f2a8e30e';
    const fitPassMemberUserId = 'efe81fc7-8c54-4dd3-9bd7-ad4a1092b746'; // Sanjai pandian
    const fitPassMemberId = '7c0a8c79-f553-4dba-aebc-14d764d26201';
    const normalMemberUserId = '4b6d413d-b3d4-4d5b-ba0a-e0f89b0def22'; // Fitprime User
    const normalMemberId = '149a9724-ee59-416d-bd39-455bbd3eb544';

    // 2. Generate tokens
    const superAdminToken = generateToken(superAdminUserId);
    const fitPassMemberToken = generateToken(fitPassMemberUserId);
    const normalMemberToken = generateToken(normalMemberUserId);

    // Target Gym and Branch IDs for test scans
    const testGymId = '05a08fdf-7427-48a5-8b25-e18d5a5668cd'; // H4 Gym
    const testBranchId = '2e207ea4-5017-45be-bd25-d94b741b1221'; // H5 Branch (Participating)

    const results = [];
    const runTest = async (name, testFn) => {
        try {
            await testFn();
            results.push({ name, status: 'PASSED', error: null });
            console.log(`✅ TEST PASSED: ${name}`);
        } catch (err) {
            results.push({ name, status: 'FAILED', error: err.message });
            console.log(`❌ TEST FAILED: ${name}`);
            console.error(err);
        }
    };

    // Helper to reset member B's state in DB before specific checks
    const resetMemberState = async ({ sessionsRemaining = 10, currentSessionEndsAt = null, cooldownEndsAt = null, status = 'Active' } = {}) => {
        await prisma.member.update({
            where: { id: fitPassMemberId },
            data: {
                sessionsRemaining,
                sessionsTotal: 10,
                currentSessionEndsAt,
                cooldownEndsAt,
                status,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days in future
            }
        });
    };

    // ----------------------------------------------------
    // TEST CASE 1: Normal CRM Member Gating
    // ----------------------------------------------------
    await runTest('Normal local member check-in block (Cross-branch)', async () => {
        const res = await axios.post('http://localhost:5000/api/member-portal/sessions/check-in', {
            gymId: testGymId,
            branchId: testBranchId,
            deviceInfo: 'Android Test Device'
        }, {
            headers: { Authorization: `Bearer ${normalMemberToken}` },
            validateStatus: () => true
        });

        if (res.status !== 403) {
            throw new Error(`Expected status 403, got ${res.status}`);
        }
        if (!res.data.message.includes('Normal members can only check in to their registered home branch')) {
            throw new Error(`Unexpected error message: ${res.data.message}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 2: FitPass Member Check-in Success
    // ----------------------------------------------------
    await runTest('Active FitPass member successful check-in', async () => {
        await resetMemberState({ sessionsRemaining: 10 });
        
        const res = await axios.post('http://localhost:5000/api/member-portal/sessions/check-in', {
            gymId: testGymId,
            branchId: testBranchId,
            deviceInfo: 'iOS Test Device'
        }, {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` },
            validateStatus: () => true
        });

        if (res.status !== 200) {
            throw new Error(`Expected status 200, got ${res.status}. Data: ${JSON.stringify(res.data)}`);
        }

        // Verify remaining sessions in database
        const member = await prisma.member.findUnique({ where: { id: fitPassMemberId } });
        if (member.sessionsRemaining !== 9) {
            throw new Error(`Expected 9 sessions remaining, got ${member.sessionsRemaining}`);
        }
        if (!member.currentSessionEndsAt) {
            throw new Error('Expected active session to be set on the member profile');
        }
    });

    // ----------------------------------------------------
    // TEST CASE 3: Double-Scan Active Session Protection
    // ----------------------------------------------------
    await runTest('Double-scan rejection (Active session gate)', async () => {
        // Active session is still running from Test Case 2
        const res = await axios.post('http://localhost:5000/api/member-portal/sessions/check-in', {
            gymId: testGymId,
            branchId: testBranchId,
            deviceInfo: 'iOS Test Device'
        }, {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` },
            validateStatus: () => true
        });

        if (res.status !== 409) {
            throw new Error(`Expected status 409 (Active Session Conflict), got ${res.status}. Message: ${res.data.message}`);
        }
        
        // Confirm no further session decrement
        const member = await prisma.member.findUnique({ where: { id: fitPassMemberId } });
        if (member.sessionsRemaining !== 9) {
            throw new Error(`Sessions should remain 9, got ${member.sessionsRemaining}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 4: Cooldown Verification
    // ----------------------------------------------------
    await runTest('Cooldown active gate validation', async () => {
        // Simulate active session ended, but cooldown is still in the future
        await resetMemberState({
            sessionsRemaining: 9,
            currentSessionEndsAt: null,
            cooldownEndsAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour in future
        });

        const res = await axios.post('http://localhost:5000/api/member-portal/sessions/check-in', {
            gymId: testGymId,
            branchId: testBranchId,
            deviceInfo: 'iOS Test Device'
        }, {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` },
            validateStatus: () => true
        });

        if (res.status !== 429) {
            throw new Error(`Expected status 429 (Too Many Requests / Cooldown), got ${res.status}. Message: ${res.data.message}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 5: Out of Sessions Gating
    // ----------------------------------------------------
    await runTest('Zero sessions remaining check-in block', async () => {
        await resetMemberState({ sessionsRemaining: 0 });

        const res = await axios.post('http://localhost:5000/api/member-portal/sessions/check-in', {
            gymId: testGymId,
            branchId: testBranchId,
            deviceInfo: 'iOS Test Device'
        }, {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` },
            validateStatus: () => true
        });

        if (res.status !== 402) {
            throw new Error(`Expected status 402 (Payment Required), got ${res.status}. Message: ${res.data.message}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 6: Branch Opt-in Validation
    // ----------------------------------------------------
    await runTest('Non-participating branch check-in block', async () => {
        // Temporarily disable fitPass on the target branch
        await prisma.branch.update({
            where: { id: testBranchId },
            data: { fitPassEnabled: false }
        });

        await resetMemberState({ sessionsRemaining: 5 });

        const res = await axios.post('http://localhost:5000/api/member-portal/sessions/check-in', {
            gymId: testGymId,
            branchId: testBranchId,
            deviceInfo: 'iOS Test Device'
        }, {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` },
            validateStatus: () => true
        });

        // Restore branch state
        await prisma.branch.update({
            where: { id: testBranchId },
            data: { fitPassEnabled: true }
        });

        if (res.status !== 403) {
            throw new Error(`Expected status 403, got ${res.status}. Message: ${res.data.message}`);
        }
        if (!res.data.message.includes('not participating in FitPass')) {
            throw new Error(`Expected not participating error message, got: ${res.data.message}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 7: Member Portal APIs
    // ----------------------------------------------------
    await runTest('Member Portal: Get session status', async () => {
        const res = await axios.get('http://localhost:5000/api/member-portal/sessions/status', {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` }
        });
        if (res.status !== 200 || !res.data.success) {
            throw new Error(`Invalid status response: ${JSON.stringify(res.data)}`);
        }
    });

    await runTest('Member Portal: Get check-in history', async () => {
        const res = await axios.get('http://localhost:5000/api/member-portal/sessions/history', {
            headers: { Authorization: `Bearer ${fitPassMemberToken}` }
        });
        if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.history)) {
            throw new Error(`Invalid history response: ${JSON.stringify(res.data)}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 8: Admin & Analytics APIs
    // ----------------------------------------------------
    await runTest('Admin Portal: Get member summary', async () => {
        const res = await axios.get(`http://localhost:5000/api/sessions/member-summary/${fitPassMemberId}`, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        if (res.status !== 200 || !res.data.success || !res.data.summary) {
            throw new Error(`Invalid summary response: ${JSON.stringify(res.data)}`);
        }
    });

    await runTest('Admin Portal: Get global analytics', async () => {
        const res = await axios.get('http://localhost:5000/api/sessions/analytics', {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        if (res.status !== 200 || !res.data.success || !res.data.analytics) {
            throw new Error(`Invalid analytics response: ${JSON.stringify(res.data)}`);
        }
    });

    // ----------------------------------------------------
    // TEST CASE 9: Verification of Audit Log Integrity
    // ----------------------------------------------------
    await runTest('Verify FitPassAuditLog table records', async () => {
        const logs = await prisma.fitPassAuditLog.findMany({
            where: { memberId: fitPassMemberId },
            orderBy: { checkInTimestamp: 'desc' }
        });

        if (logs.length === 0) {
            throw new Error('No audit logs recorded for Sanjai pandian');
        }

        // Validate the structure of the latest log entry
        const latestLog = logs[0];
        const requiredFields = [
            'id', 'memberId', 'memberName', 'fitPassMembershipId',
            'organizationId', 'gymIdVisited', 'gymName', 'checkInTimestamp',
            'accessStatus', 'totalPurchasedSessions', 'sessionsUsedBefore',
            'sessionsDeducted', 'remainingSessionsAfter', 'membershipExpiryDate'
        ];

        for (const field of requiredFields) {
            if (latestLog[field] === undefined || latestLog[field] === null) {
                throw new Error(`Audit log is missing required compliance field: ${field}`);
            }
        }
        console.log(`Latest log entry verified: Status=${latestLog.accessStatus}, Reason=${latestLog.failureReason}`);
    });

    // Cleanup member state back to normal
    await resetMemberState({ sessionsRemaining: 29, currentSessionEndsAt: null, cooldownEndsAt: null });

    console.log('\n=== TESTING SUMMARY ===');
    console.table(results);

    const hasFailed = results.some(r => r.status === 'FAILED');
    if (hasFailed) {
        console.log('❌ SOME TESTS FAILED.');
        process.exit(1);
    } else {
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! FITPASS MODULE IS PRODUCTION READY.');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal testing error:', err);
    process.exit(1);
});
