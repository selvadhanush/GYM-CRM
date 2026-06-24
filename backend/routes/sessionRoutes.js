const express = require('express');
const { z } = require('zod');
const { adminAdjustSessions, adminAdjustSchema } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

/**
 * Admin session-adjust sub-router.
 *
 * Mounted standalone in server.js under /api/sessions:
 *   POST /api/sessions/admin-adjust   (admin / receptionist)
 *
 * The member-facing endpoints (check-in / status / history) are wired directly
 * into memberPortalRoutes.js instead, since that router already applies
 * `protect` to everything and lives under /api/member-portal.
 */
const router = express.Router();

router.post(
  '/admin-adjust',
  protect,
  authorize('admin', 'receptionist'),
  validate({ body: adminAdjustSchema }),
  adminAdjustSessions
);

// zod schema reused by memberPortalRoutes.js for the check-in body.
const checkInSchema = z.object({
  gymId: z.string().min(1, 'Gym id from the QR code is required'),
});

module.exports = router;
module.exports.checkInSchema = checkInSchema;
