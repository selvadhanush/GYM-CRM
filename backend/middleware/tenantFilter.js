/**
 * Attaches `req.tenantFilter` — an object suitable for spreading into
 * any Prisma/MongooseAdapter query. Controllers use this instead of
 * manually checking gymId/branchId/role.
 *
 * Superadmin (gymId === 'SYSTEM'): empty filter (cross-gym).
 * Gym admin: { gymId: <their gym> }
 * Branch scoped: adds { branchId: <their branch> }
 * Query param override: ?gymId=xxx (for superadmin drilling into one gym)
 */
const tenantFilter = (req, res, next) => {
    const filter = {};
    if (req.query.gymId) {
        filter.gymId = req.query.gymId;
    } else if (req.user?.gymId && req.user.gymId !== 'SYSTEM' && req.user.role !== 'superadmin') {
        filter.gymId = req.user.gymId;
    }
    if (req.user?.branchId) {
        filter.branchId = req.user.branchId;
    }
    req.tenantFilter = filter;
    next();
};

module.exports = tenantFilter;
