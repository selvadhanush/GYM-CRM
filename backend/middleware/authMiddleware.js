const jwt = require('jsonwebtoken');
const User = require('../models/User');

const Branch = require('../models/Branch');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            if (user.isActive === false || user.status !== 'Active') {
                res.status(403);
                throw new Error('Not authorized, account is inactive or suspended');
            }

            req.user = user;

            // Enforce hierarchical authentication scoping
            if (req.user.role === 'superadmin') {
                // Super Admin can switch to any gym & branch
                if (req.headers['x-gym-id']) {
                    req.user.gymId = req.headers['x-gym-id'];
                }
                if (req.headers['x-branch-id']) {
                    req.user.branchId = req.headers['x-branch-id'];
                }
            } else if (req.user.role === 'partner') {
                // Organization Admin is locked to their gymId
                req.user.gymId = user.gymId;
                if (req.headers['x-branch-id']) {
                    // Only allow switching to branches that belong to their gymId
                    const targetBranch = await Branch.findOne({ 
                        _id: req.headers['x-branch-id'], 
                        gymId: user.gymId 
                    });
                    if (targetBranch) {
                        req.user.branchId = req.headers['x-branch-id'];
                    } else {
                        req.user.branchId = null; // default to consolidated reports/view
                    }
                } else {
                    req.user.branchId = null;
                }
            } else {
                // All other roles (admin, receptionist, trainer, member) are strictly isolated
                req.user.gymId = user.gymId;
                req.user.branchId = user.branchId;
            }

            next();
        } catch (error) {
            console.error(error);
            if (res.statusCode === 200) {
                res.status(401);
            }
            throw new Error(error.message || 'Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
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
