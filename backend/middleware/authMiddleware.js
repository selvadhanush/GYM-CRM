const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Gym = require('../models/Gym');
const { getH4GymId } = require('../utils/h4Helpers');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                res.status(401);
                return next(new Error('Not authorized, user not found'));
            }

            if (user.isActive === false || user.status !== 'Active') {
                res.status(403);
                return next(new Error('Not authorized, account is inactive or suspended'));
            }

            req.user = user;
            req.user.userBranchId = user.branchId || null;
            if (req.log) {
                req.log = req.log.child({ userId: user._id || user.id });
            }

            // Enforce tenant scoping rules based on role
            if (req.user.role === 'superadmin') {
                // Superadmin can dynamically select target gym or branch via headers or query params
                const targetGymId = req.query?.gymId || req.headers['x-gym-id'];
                const targetBranchId = req.query?.branchId || req.headers['x-branch-id'];

                req.user.gymId = targetGymId || user.gymId || 'SYSTEM';
                req.user.branchId = targetBranchId || user.userBranchId || user.branchId || null;
            } else if (req.user.role === 'fitpass_admin') {
                req.user.gymId = 'SYSTEM';
                req.user.branchId = null;
                
                let targetBranchId = req.query?.branchId || req.headers['x-branch-id'];
                let targetGymId = req.query?.gymId || req.headers['x-gym-id'];
                
                if (targetBranchId) {
                    const targetBranch = await Branch.findOne({ _id: targetBranchId });
                    if (targetBranch && targetBranch.fitPassEnabled) {
                        req.user.gymId = targetBranch.gymId;
                        req.user.branchId = targetBranchId;
                    }
                } else if (targetGymId) {
                    const gym = await Gym.findById(targetGymId);
                    if (gym && gym.name.toUpperCase() !== 'H4') {
                        req.user.gymId = targetGymId;
                    }
                }
            } else if (req.user.role === 'h4_admin') {
                // H4 admin is locked to the H4 gymId
                const h4GymId = await getH4GymId();
                req.user.gymId = h4GymId || user.gymId;
                
                const fixedBranch = user.userBranchId || user.branchId;
                if (fixedBranch) {
                    req.user.branchId = fixedBranch;
                } else {
                    const requestedBranch = req.query?.branchId || req.headers['x-branch-id'];
                    if (requestedBranch) {
                        const targetBranch = await Branch.findOne({ _id: requestedBranch, gymId: req.user.gymId });
                        req.user.branchId = targetBranch ? requestedBranch : null;
                    } else {
                        req.user.branchId = null;
                    }
                }
            } else if (req.user.role === 'partner' || req.user.role === 'admin') {
                // Organization Admin is locked to their assigned gymId
                req.user.gymId = user.gymId;
                const fixedBranch = user.userBranchId || user.branchId;
                if (fixedBranch) {
                    req.user.branchId = fixedBranch;
                } else {
                    const requestedBranch = req.query?.branchId || req.headers['x-branch-id'];
                    if (requestedBranch) {
                        const targetBranch = await Branch.findOne({ _id: requestedBranch, gymId: user.gymId });
                        req.user.branchId = targetBranch ? requestedBranch : null;
                    } else {
                        req.user.branchId = null;
                    }
                }
            } else {
                // All other roles (receptionist, trainer, member) are strictly isolated to their user record
                req.user.gymId = user.gymId;
                req.user.branchId = user.userBranchId || user.branchId || null;
            }

            return next();
        } catch (error) {
            console.error('PROTECT CATCH ERROR:', error.message, error.stack);
            logger.error({ err: error }, 'Auth middleware failed to authorize request');
            if (res.statusCode === 200) {
                res.status(401);
            }
            return next(new Error(error.message || 'Not authorized, token failed'));
        }
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized, missing user data'));
        }
        if (req.user.role === 'superadmin' || roles.includes(req.user.role)) {
            return next();
        }
        res.status(403);
        return next(new Error(`User role ${req.user.role} is not authorized to access this route`));
    };
};

module.exports = { protect, authorize };
