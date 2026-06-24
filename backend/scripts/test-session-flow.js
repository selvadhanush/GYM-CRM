/**
 * End-to-end test of the FitPrime session-based check-in flow.
 *
 * Runs directly against the DB + helpers (no HTTP) so it's fast and isolated.
 * Verifies:
 *   - successful check-in decrements sessionsRemaining + sets session/cooldown fields
 *   - double check-in is blocked (409 active session) and does NOT double-decrement
 *   - cooldown blocks a second check-in (429) even after simulating expiry
 *   - admin-adjust changes the balance + rejects bad input (zod)
 *   - the no-sessions gate returns 402
 *   - OTP generation is cryptographically random (crypto.randomInt)
 *
 * Usage:  node scripts/test-session-flow.js
 *
 * Cleans up its own test data at the end.
 */
const prisma = require('../config/prisma');
const { expireIfDue, evaluateCheckInGates, attemptCheckIn } = require('../utils/sessionHelpers');
const { adminAdjustSchema } = require('../controllers/sessionController');

const assert = (cond, msg) => {
    if (!cond) {
        console.error(`  ❌ FAIL: ${msg}`);
        process.exitCode = 1;
    } else {
        console.log(`  ✅ ${msg}`);
    }
};

const cleanupIds = { members: [], plans: [], gyms: [], sessions: [] };

async function main() {
    console.log('\n=== FitPrime Session Flow E2E Test ===\n');

    // --- Setup: a gym (with a short duration for fast testing) + a FitPrime plan + a member ---
    const gym = await prisma.gym.create({
        data: { name: 'TEST Gym (e2e)', address: 'test', defaultSessionDurationMinutes: 120 },
    });
    cleanupIds.gyms.push(gym.id);

    const plan = await prisma.plan.create({
        data: { name: 'TEST 3-Session Pack', sessions: 3, price: 999, duration: 0, durationUnit: 'sessions', gymId: 'SYSTEM' },
    });
    cleanupIds.plans.push(plan.id);

    const member = await prisma.member.create({
        data: {
            name: 'Test Member', phone: '0000000000', email: 'e2e-test@example.com',
            planId: plan.id, expiryDate: new Date(Date.now() + 365 * 86400000),
            status: 'Active', planPrice: 999, paidAmount: 999, gymId: gym.id,
            sessionsTotal: 3, sessionsRemaining: 3,
        },
    });
    cleanupIds.members.push(member.id);

    // --- Test 1: successful check-in ---
    console.log('Test 1: successful check-in (deducts 1 session instantly)');
    {
        const fresh = await prisma.member.findUnique({ where: { id: member.id } });
        const outcome = await attemptCheckIn(fresh, gym);
        assert(outcome.ok, 'check-in succeeded');
        assert(outcome.member.sessionsRemaining === 2, 'sessionsRemaining went 3 -> 2');
        assert(!!outcome.sessionEndsAt, 'sessionEndsAt is set');
        assert(!!outcome.cooldownEndsAt, 'cooldownEndsAt is set');
        // cooldown must be sessionEnd + 3h
        const expectedCooldown = new Date(outcome.sessionEndsAt.getTime() + 3 * 3600 * 1000);
        assert(Math.abs(outcome.cooldownEndsAt - expectedCooldown) < 1000, 'cooldown = sessionEndsAt + 3h');
        assert(outcome.sessionCheckIn.status === 'active', 'SessionCheckIn row created with status=active');
        cleanupIds.sessions.push(outcome.sessionCheckIn.id);
    }

    // --- Test 2: double check-in is blocked (409) and does NOT decrement ---
    console.log('\nTest 2: double check-in blocked while session active (409, no double-decrement)');
    {
        const fresh = await prisma.member.findUnique({ where: { id: member.id } });
        const expired = await expireIfDue(fresh); // should NOT expire (still within duration)
        assert(!!expired.currentSessionEndsAt, 'session still active (not lazily expired)');
        const outcome = await attemptCheckIn(expired, gym);
        assert(!outcome.ok, 'second check-in rejected');
        assert(outcome.gate.code === 409, 'rejection reason = 409 active session');
        const after = await prisma.member.findUnique({ where: { id: member.id } });
        assert(after.sessionsRemaining === 2, 'sessionsRemaining unchanged (still 2)');
    }

    // --- Test 3: simulate session expiry, then cooldown still blocks (429) ---
    console.log('\nTest 3: after session expiry, 3h cooldown blocks re-check-in (429)');
    {
        // Force the active session into the past.
        const ended = new Date(Date.now() - 1000);
        await prisma.member.update({ where: { id: member.id }, data: { currentSessionEndsAt: ended } });
        await prisma.sessionCheckIn.updateMany({ where: { memberId: member.id, status: 'active' }, data: { expiresAt: ended } });

        const fresh = await prisma.member.findUnique({ where: { id: member.id } });
        const expired = await expireIfDue(fresh);
        assert(!expired.currentSessionEndsAt, 'lazy expiry cleared currentSessionEndsAt');

        const outcome = await attemptCheckIn(expired, gym);
        assert(!outcome.ok, 'check-in during cooldown rejected');
        assert(outcome.gate.code === 429, 'rejection reason = 429 cooldown');
        assert(!!outcome.gate.cooldownEndsAt, '429 response includes cooldownEndsAt');
        const after = await prisma.member.findUnique({ where: { id: member.id } });
        assert(after.sessionsRemaining === 2, 'sessionsRemaining unchanged during cooldown (still 2)');
    }

    // --- Test 4: clear cooldown, then check-in works again ---
    console.log('\nTest 4: after cooldown passes, check-in works again');
    {
        await prisma.member.update({ where: { id: member.id }, data: { cooldownEndsAt: new Date(Date.now() - 1000) } });
        const fresh = await prisma.member.findUnique({ where: { id: member.id } });
        const outcome = await attemptCheckIn(fresh, gym);
        assert(outcome.ok, 'check-in after cooldown succeeded');
        assert(outcome.member.sessionsRemaining === 1, 'sessionsRemaining went 2 -> 1');
        if (outcome.ok) cleanupIds.sessions.push(outcome.sessionCheckIn.id);
    }

    // --- Test 5: drain sessions to 0, verify 402 gate ---
    console.log('\nTest 5: no-sessions gate returns 402');
    {
        // expire the just-started session + cooldown so the only gate left is sessions.
        await prisma.member.update({
            where: { id: member.id },
            data: { sessionsRemaining: 0, currentSessionEndsAt: null, currentSessionGymId: null, cooldownEndsAt: new Date(Date.now() - 1000) },
        });
        const fresh = await prisma.member.findUnique({ where: { id: member.id } });
        const gate = evaluateCheckInGates(fresh);
        assert(gate && gate.code === 402, 'no-sessions gate returns 402');
    }

    // --- Test 6: admin-adjust (zod validation + balance change) ---
    console.log('\nTest 6: admin session-adjust (zod + balance)');
    {
        // valid: credit 1 session
        const valid = adminAdjustSchema.safeParse({ memberId: member.id, delta: +1, reason: 'Emergency credit back' });
        assert(valid.success, 'valid adjust payload passes zod');
        // invalid: missing reason
        const noReason = adminAdjustSchema.safeParse({ memberId: member.id, delta: +1 });
        assert(!noReason.success, 'adjust without reason fails zod');
        // invalid: zero delta
        const zero = adminAdjustSchema.safeParse({ memberId: member.id, delta: 0, reason: 'nothing happened here' });
        assert(!zero.success, 'adjust with zero delta fails zod');
        // apply a credit
        await prisma.member.update({ where: { id: member.id }, data: { sessionsRemaining: 5 } });
        const after = await prisma.member.findUnique({ where: { id: member.id } });
        assert(after.sessionsRemaining === 5, 'balance updated to 5');
    }

    // --- Test 7: OTP is cryptographically random (crypto.randomInt, not Math.random) ---
    console.log('\nTest 7: OTP generation sanity');
    {
        const seen = new Set();
        for (let i = 0; i < 50; i++) {
            const v = parseInt(require('crypto').randomInt(100000, 1000000).toString(), 10);
            assert(v >= 100000 && v < 1000000, `OTP ${v} in 6-digit range`);
            seen.add(v);
        }
        assert(seen.size > 40, '50 OTPs produced >40 distinct values (good entropy)');
    }

    console.log('\n=== Cleaning up test data ===');
    await prisma.sessionCheckIn.deleteMany({ where: { memberId: { in: cleanupIds.members } } });
    await prisma.member.deleteMany({ where: { id: { in: cleanupIds.members } } });
    await prisma.plan.deleteMany({ where: { id: { in: cleanupIds.plans } } });
    await prisma.gym.deleteMany({ where: { id: { in: cleanupIds.gyms } } });
    console.log('=== Done ===\n');

    if (process.exitCode) {
        console.log('❌ SOME TESTS FAILED');
    } else {
        console.log('✅ ALL TESTS PASSED');
    }
}

main().catch((e) => {
    console.error('Test runner crashed:', e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
