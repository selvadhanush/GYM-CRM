const Branch = require('../models/Branch');

/**
 * Attaches `req.tenantFilter` — an object suitable for spreading into
 * any Prisma/MongooseAdapter query.
 *
 * Security Enforcement Rules:
 * 1. Client-provided x-gym-id, x-branch-id, ?gymId=, ?branchId= MUST NEVER expand a user's scope.
 * 2. Non-superadmins are strictly restricted to their authorized gymId (req.user.gymId).
 * 3. Branch-assigned users are strictly restricted to their assigned branchId (req.user.branchId).
 * 4. Org admins can only select a branchId if it belongs to their own organization (verified in Branch DB).
 */
const tenantFilter = async (req, res, next) => {
    try {
        const filter = {};

        if (!req.user) {
            req.tenantFilter = filter;
            return next();
        }

        const role = req.user.role;

        if (role === 'superadmin') {
            const requestedGymId = req.query?.gymId || req.headers['x-gym-id'];
            const requestedBranchId = req.query?.branchId || req.headers['x-branch-id'];

            if (requestedGymId && requestedGymId !== 'SYSTEM' && requestedGymId !== 'null' && requestedGymId !== 'undefined') {
                filter.gymId = requestedGymId;
            }
            if (requestedBranchId && requestedBranchId !== 'null' && requestedBranchId !== 'undefined') {
                filter.branchId = requestedBranchId;
            }
        } else if (role === 'fitpass_admin') {
            const requestedGymId = req.query?.gymId || req.headers['x-gym-id'];
            const requestedBranchId = req.query?.branchId || req.headers['x-branch-id'];

            if (requestedGymId && requestedGymId !== 'null' && requestedGymId !== 'undefined') {
                filter.gymId = requestedGymId;
            } else {
                filter.gymId = 'SYSTEM';
            }
            if (requestedBranchId && requestedBranchId !== 'null' && requestedBranchId !== 'undefined') {
                filter.branchId = requestedBranchId;
            }
        } else {
            // All non-superadmin roles (h4_admin, partner, admin, receptionist, trainer, member)
            // MUST be restricted to their authorized gymId from req.user
            if (req.user.gymId) {
                filter.gymId = req.user.gymId;
            }

            // Determine branch filter:
            const fixedUserBranchId = req.user.userBranchId || req.user.branchId;
            if (fixedUserBranchId) {
                filter.branchId = fixedUserBranchId;
            } else {
                const requestedBranchId = req.query?.branchId || req.headers['x-branch-id'];
                if (requestedBranchId && requestedBranchId !== 'null' && requestedBranchId !== 'undefined') {
                    // Org admin selecting a branch within their OWN gym
                    const validBranch = await Branch.findOne({ _id: requestedBranchId, gymId: req.user.gymId });
                    if (validBranch) {
                        filter.branchId = requestedBranchId;
                    } else {
                        res.status(403);
                        return next(new Error('Access denied: Selected branch does not belong to your organization'));
                    }
                }
            }
        }

        req.tenantFilter = filter;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = tenantFilter;
