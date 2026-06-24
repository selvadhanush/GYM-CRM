/**
 * FitPrime session-based check-in controller.
 *
 * Endpoints (all mounted under /api/member-portal unless noted):
 *   POST   /sessions/check-in          member scans a gym QR -> 1 session deducted, instantly
 *   GET    /sessions/status            current session state for the mobile timer
 *   GET    /sessions/history           member's check-in history
 *   POST   /api/sessions/admin-adjust  admin manually adds/removes sessions (the emergency
 *                                      credit-back path; heavily audited)
 *
 * Design notes:
 *   - Instant deduction happens inside attemptCheckIn()'s atomic conditional update.
 *   - Cooldown is GLOBAL (across all partner gyms) and measured from SESSION END.
 *   - expireIfDue() runs before every gate evaluation to avoid stale active-session blocks.
 */
const { z } = require('zod');
const prisma = require('../config/prisma');
const Gym = require('../models/Gym');
const Member = require('../models/Member');
const { logAudit } = require('../utils/auditLogger');
const { expireIfDue, evaluateCheckInGates, attemptCheckIn } = require('../utils/sessionHelpers');

// Shared helper: load + lazily expire a member from the authed user's memberId.
const loadMemberForUser = async (req) => {
  if (!req.user?.memberId) return null;
  const member = await prisma.member.findUnique({ where: { id: req.user.memberId } });
  return member ? await expireIfDue(member) : null;
};

// @desc    Check in to a gym by scanning its QR (deducts 1 session instantly)
// @route   POST /api/member-portal/sessions/check-in
// @access  Private/Member
const checkIn = async (req, res) => {
  try {
    const member = await loadMemberForUser(req);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }

    // Pre-check the gates before touching the DB so we can log a blocked attempt
    // (useful for abuse detection) and return a precise error fast.
    const gate = evaluateCheckInGates(member);
    if (gate) {
      // Audit the blocked attempt (non-fatal). Only logged when the caller has
      // a gym context; mobile members have gymId='public' so this is best-effort.
      if (req.user?.gymId && req.user.gymId !== 'public') {
        await logAudit(req, 'CHECK_IN_BLOCKED', 'Member', member.id,
          `Check-in blocked (${gate.code}): ${gate.message}`).catch(() => {});
      }
      return res.status(gate.code).json({
        success: false,
        message: gate.message,
        ...(gate.sessionEndsAt ? { sessionEndsAt: gate.sessionEndsAt } : {}),
        ...(gate.cooldownEndsAt ? { cooldownEndsAt: gate.cooldownEndsAt } : {}),
      });
    }

    // Resolve the gym whose QR was scanned (its duration drives session length).
    const { gymId } = req.body;
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found for this QR code.' });
    }

    // Atomic decrement (race-safe).
    const outcome = await attemptCheckIn(member, gym);
    if (!outcome.ok) {
      const g = outcome.gate;
      return res.status(g.code).json({
        success: false,
        message: g.message,
        ...(g.cooldownEndsAt ? { cooldownEndsAt: g.cooldownEndsAt } : {}),
        ...(g.sessionEndsAt ? { sessionEndsAt: g.sessionEndsAt } : {}),
      });
    }

    // Audit the successful check-in.
    await logAudit(req, 'CHECK_IN', 'Member', member.id,
      `Checked in at ${gym.name}; ${outcome.member.sessionsRemaining} session(s) remaining.`).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Check-in successful. 1 session deducted.',
      sessionsRemaining: outcome.member.sessionsRemaining,
      sessionStartsAt: outcome.sessionCheckIn.startedAt,
      sessionEndsAt: outcome.sessionEndsAt,
      cooldownEndsAt: outcome.cooldownEndsAt,
      gym: { id: gym.id, name: gym.name },
    });
  } catch (error) {
    console.error('CHECK-IN ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Check-in failed.' });
  }
};

// @desc    Get the member's current session state (for the mobile live timer)
// @route   GET /api/member-portal/sessions/status
// @access  Private/Member
const getSessionStatus = async (req, res) => {
  try {
    const member = await loadMemberForUser(req);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }

    const now = new Date();
    const active = !!(member.currentSessionEndsAt && new Date(member.currentSessionEndsAt) > now);
    const inCooldown = !!(member.cooldownEndsAt && new Date(member.cooldownEndsAt) > now);

    return res.json({
      success: true,
      sessionsRemaining: member.sessionsRemaining || 0,
      active,
      sessionEndsAt: active ? member.currentSessionEndsAt : null,
      currentSessionGymId: active ? member.currentSessionGymId : null,
      inCooldown,
      cooldownEndsAt: inCooldown ? member.cooldownEndsAt : null,
      lastCheckInAt: member.lastCheckInAt || null,
    });
  } catch (error) {
    console.error('SESSION STATUS ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load session status.' });
  }
};

// @desc    Get the member's check-in history
// @route   GET /api/member-portal/sessions/history
// @access  Private/Member
const getSessionHistory = async (req, res) => {
  try {
    if (!req.user?.memberId) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }
    const history = await prisma.sessionCheckIn.findMany({
      where: { memberId: req.user.memberId },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, history });
  } catch (error) {
    console.error('SESSION HISTORY ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load history.' });
  }
};

// Zod schema for the admin session-adjust (the manual emergency credit-back path).
// `reason` is HARD required at the validation layer -- this is the only fraud-dispute
// backstop now that there is no automated check-out verification.
const adminAdjustSchema = z.object({
  memberId: z.string().min(1, 'Member id is required'),
  delta: z
    .number()
    .int('Delta must be a whole number')
    .refine((n) => n !== 0, 'Delta must not be zero'),
  reason: z
    .string()
    .min(5, 'A reason (min 5 chars) is required for session adjustments')
    .max(300, 'Reason is too long (max 300 chars)'),
});

// @desc    Admin manually adjusts a member's session balance (emergency credit-back)
// @route   POST /api/sessions/admin-adjust
// @access  Private/Admin, Receptionist
const adminAdjustSessions = async (req, res) => {
  try {
    const { memberId, delta, reason } = adminAdjustSchema.parse(req.body);

    // Tenant isolation: the member must belong to the admin's gym.
    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in your gym.' });
    }

    const before = member.sessionsRemaining || 0;
    // Floor at 0 so admins can't accidentally push the balance negative.
    const after = Math.max(0, before + delta);

    await Member.findByIdAndUpdate(member._id, { sessionsRemaining: after });

    await logAudit(req, 'SESSION_ADJUSTED', 'Member', member._id,
      `Sessions ${before} -> ${after} (${delta >= 0 ? '+' : ''}${delta}). Reason: ${reason}`,
      member.name || '');

    return res.json({
      success: true,
      message: `Session balance updated from ${before} to ${after}.`,
      sessionsRemaining: after,
    });
  } catch (error) {
    if (error?.issues) {
      // zod error
      return res.status(400).json({ success: false, message: error.issues[0].message });
    }
    console.error('ADMIN SESSION ADJUST ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Could not adjust sessions.' });
  }
};

module.exports = {
  checkIn,
  getSessionStatus,
  getSessionHistory,
  adminAdjustSessions,
  // Re-export the schema so routes can wire it into the validate middleware.
  adminAdjustSchema,
};
