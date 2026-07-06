const { z } = require('zod');
const User = require('../models/User');
const Gym = require('../models/Gym');
const Plan = require('../models/Plan');
const generateToken = require('../utils/generateToken');
const { logAudit } = require('../utils/auditLogger');
const { DEFAULT_SESSION_DURATION_MINUTES } = require('../config/constants');

// --- zod schemas (validation lives at the controller boundary; routes apply
//     them via the shared validate middleware where convenient, but for the
//     superadmin mutations we parse here to keep the controller self-contained) ---
const createGymSchema = z.object({
    gymName: z.string().min(1, 'Gym name is required').max(120),
    gymAddress: z.string().max(300).optional(),
    // Per-gym default session duration for FitPrime check-ins (minutes).
    defaultSessionDurationMinutes: z.number().int().min(15).max(600).optional(),
    adminName: z.string().min(1, 'Admin name is required').max(120),
    adminEmail: z.string().email('A valid admin email is required'),
    adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
});

const updateGymSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    address: z.string().max(300).optional(),
    phone: z.string().max(40).optional(),
    email: z.string().email().or(z.literal('')).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
    defaultSessionDurationMinutes: z.number().int().min(15).max(600).optional(),
    adminPassword: z.string().min(6, 'Admin password must be at least 6 characters').optional(),
});

const fitPrimePlanSchema = z.object({
    name: z.string().min(1, 'Plan name is required').max(120),
    sessions: z.number().int().positive('Sessions must be a positive whole number'),
    price: z.number().nonnegative('Price must be zero or positive'),
});

// @desc    Create a partner gym and admin user
// @route   POST /api/superadmin/gyms
// @access  Private (Super Admin)
const createPartnerGym = async (req, res) => {
    const parsed = createGymSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.issues[0].message);
    }
    const { gymName, gymAddress, defaultSessionDurationMinutes, adminName, adminEmail, adminPassword } = parsed.data;

    if (gymName && (gymName.toLowerCase() === 'h4' || gymName.toLowerCase().includes('h4'))) {
        res.status(400);
        throw new Error('H4 is a separate division and cannot be created as a FitPass partner.');
    }

    const normalizedEmail = adminEmail.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const gym = await Gym.create({
        name: gymName,
        address: gymAddress || '',
        defaultSessionDurationMinutes: defaultSessionDurationMinutes || DEFAULT_SESSION_DURATION_MINUTES,
    });

    const user = await User.create({
        name: adminName,
        email: normalizedEmail,
        password: adminPassword,
        gymId: gym._id,
        role: 'admin'
    });

    if (user) {
        await logAudit(req, 'GYM_CREATED', 'Gym', gym._id, `Super admin created partner gym: ${gymName}`, gymName);
        res.status(201).json({
            gym: {
                _id: gym._id,
                name: gym.name,
                address: gym.address,
                defaultSessionDurationMinutes: gym.defaultSessionDurationMinutes,
            },
            admin: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid data');
    }
};

// @desc    Update a partner gym (incl. default session duration setting)
// @route   PUT /api/superadmin/gyms/:id
// @access  Private (Super Admin)
const updatePartnerGym = async (req, res) => {
    const parsed = updateGymSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.issues[0].message);
    }

    const gym = await Gym.findById(req.params.id);
    if (!gym) {
        res.status(404);
        throw new Error('Gym not found');
    }

    const updates = parsed.data;
    if (updates.name !== undefined) gym.name = updates.name;
    if (updates.address !== undefined) gym.address = updates.address;
    if (updates.phone !== undefined) gym.phone = updates.phone;
    if (updates.email !== undefined) gym.email = updates.email;
    if (updates.status !== undefined) gym.status = updates.status;
    if (updates.defaultSessionDurationMinutes !== undefined) {
        gym.defaultSessionDurationMinutes = updates.defaultSessionDurationMinutes;
    }
    await gym.save();

    if (updates.adminPassword) {
        const adminUser = await User.findOne({ gymId: gym._id, role: 'admin' });
        if (adminUser) {
            adminUser.password = updates.adminPassword;
            await adminUser.save();
        }
    }

    await logAudit(req, 'GYM_UPDATED', 'Gym', gym._id, `Updated gym settings: ${gym.name}`, gym.name);

    res.json({
        _id: gym._id,
        name: gym.name,
        address: gym.address,
        phone: gym.phone,
        email: gym.email,
        status: gym.status,
        defaultSessionDurationMinutes: gym.defaultSessionDurationMinutes,
    });
};

// @desc    Get all partner gyms
// @route   GET /api/superadmin/gyms
// @access  Private (Super Admin)
const getPartnerGyms = async (req, res) => {
    const allGyms = await Gym.find({}).lean();
    // Exclude H4 gyms from partner list
    const gyms = allGyms.filter(g => !g.name || !g.name.toLowerCase().includes('h4'));
    const users = await User.find({ role: 'admin' });

    const gymsWithAdmins = gyms.map(gym => {
        const admins = users.filter(u => u.gymId?.toString() === gym._id?.toString() || u.gymId === gym._id);
        return {
            ...gym,
            admins: admins.map(a => ({ _id: a._id, name: a.name, email: a.email }))
        };
    });

    res.json(gymsWithAdmins);
};

// @desc    Get or create H4 gym
// @route   GET /api/superadmin/h4-gym
// @access  Private (Super Admin)
const getOrCreateH4Gym = async (req, res) => {
    let gym = await Gym.findOne({ name: 'H4' });
    if (!gym) {
        gym = await Gym.create({
            name: 'H4',
            address: 'H4 Head Office',
            phone: '555-0100',
            email: 'h4@gymcrm.com'
        });
        await logAudit(req, 'GYM_CREATED', 'Gym', gym._id, `System automatically created H4 Gym`, 'H4');
    }
    res.json(gym);
};

// @desc    Delete a partner gym
// @route   DELETE /api/superadmin/gyms/:id
// @access  Private (Super Admin)
const deletePartnerGym = async (req, res) => {
    const gym = await Gym.findById(req.params.id);
    if (!gym) {
        res.status(404);
        throw new Error('Gym not found');
    }
    await User.deleteMany({ gymId: gym._id, role: 'admin' });
    await gym.deleteOne();
    await logAudit(req, 'GYM_DELETED', 'Gym', gym._id, `Super admin deleted partner gym: ${gym.name}`, gym.name);
    res.json({ message: 'Gym and associated admins removed' });
};

// @desc    Create a FitPrime Plan (session-based global plan)
// @route   POST /api/superadmin/plans
// @access  Private (Super Admin)
const createFitPrimePlan = async (req, res) => {
    const parsed = fitPrimePlanSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.issues[0].message);
    }
    const { name, sessions, price } = parsed.data;

    const plan = await Plan.create({
        name,
        sessions,
        price,
        // Legacy duration fields are nulled for SYSTEM plans; sessions are the
        // source of truth for FitPrime plans.
        duration: 0,
        durationUnit: 'sessions',
        gymId: 'SYSTEM'
    });

    await logAudit(req, 'PLAN_CREATED', 'Plan', plan._id, `Super admin created FitPrime plan: ${name} (${sessions} sessions)`, name);

    res.status(201).json(plan);
};

// @desc    Update a FitPrime Plan
// @route   PUT /api/superadmin/plans/:id
// @access  Private (Super Admin)
const updateFitPrimePlan = async (req, res) => {
    const plan = await Plan.findOne({ _id: req.params.id, gymId: 'SYSTEM' });
    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }

    const parsed = fitPrimePlanSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.issues[0].message);
    }
    const { name, sessions, price } = parsed.data;
    if (name !== undefined) plan.name = name;
    if (sessions !== undefined) plan.sessions = sessions;
    if (price !== undefined) plan.price = price;
    await plan.save();

    await logAudit(req, 'PLAN_UPDATED', 'Plan', plan._id, `Updated FitPrime plan: ${plan.name} (${plan.sessions} sessions)`, plan.name);

    res.json(plan);
};

// @desc    Delete a FitPrime Plan
// @route   DELETE /api/superadmin/plans/:id
// @access  Private (Super Admin)
const deleteFitPrimePlan = async (req, res) => {
    const plan = await Plan.findOne({ _id: req.params.id, gymId: 'SYSTEM' });
    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }
    await plan.deleteOne();
    await logAudit(req, 'PLAN_DELETED', 'Plan', plan._id, `Deleted FitPrime plan: ${plan.name}`, plan.name);
    res.json({ message: 'Plan removed' });
};

// @desc    Get all FitPrime Plans
// @route   GET /api/superadmin/plans
// @access  Private (Super Admin)
const getFitPrimePlans = async (req, res) => {
    const plans = await Plan.find({ gymId: 'SYSTEM' });
    res.json(plans);
};

// --- dedicated admin management ---
const createAdminSchema = z.object({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('A valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['fitpass_admin', 'h4_admin']),
});

const updateAdminSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
});

// @desc    Get all dedicated admins (fitpass_admin, h4_admin)
// @route   GET /api/superadmin/admins
// @access  Private (Super Admin)
const getDedicatedAdmins = async (req, res) => {
    const admins = await User.find({ role: { $in: ['fitpass_admin', 'h4_admin'] } }).select('-password').lean();
    res.json(admins);
};

// @desc    Create a dedicated admin account
// @route   POST /api/superadmin/admins
// @access  Private (Super Admin)
const createDedicatedAdmin = async (req, res) => {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.issues[0].message);
    }
    const { name, email, password, role } = parsed.data;

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    let gymId = 'SYSTEM';
    if (role === 'h4_admin') {
        const h4Gym = await Gym.findOne({ name: 'H4' });
        gymId = h4Gym ? h4Gym._id : '05a08fdf-7427-48a5-8b25-e18d5a5668cd';
    }

    const admin = await User.create({
        name,
        email: normalizedEmail,
        password,
        role,
        gymId,
        isVerified: true,
    });

    if (admin) {
        await logAudit(req, 'ADMIN_CREATED', 'User', admin._id, `Super admin created dedicated admin: ${name} (${role})`, name);
        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            gymId: admin.gymId,
        });
    } else {
        res.status(400);
        throw new Error('Invalid data');
    }
};

// @desc    Update a dedicated admin account
// @route   PUT /api/superadmin/admins/:id
// @access  Private (Super Admin)
const updateDedicatedAdmin = async (req, res) => {
    const parsed = updateAdminSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.issues[0].message);
    }

    const admin = await User.findOne({ _id: req.params.id, role: { $in: ['fitpass_admin', 'h4_admin'] } });
    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    const updates = parsed.data;
    if (updates.name !== undefined) admin.name = updates.name;
    if (updates.password !== undefined) admin.password = updates.password;
    if (updates.status !== undefined) {
        admin.status = updates.status;
        admin.isActive = updates.status === 'Active';
    }
    await admin.save();

    await logAudit(req, 'ADMIN_UPDATED', 'User', admin._id, `Updated dedicated admin: ${admin.name}`, admin.name);

    res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
    });
};

// @desc    Delete a dedicated admin account
// @route   DELETE /api/superadmin/admins/:id
// @access  Private (Super Admin)
const deleteDedicatedAdmin = async (req, res) => {
    const admin = await User.findOne({ _id: req.params.id, role: { $in: ['fitpass_admin', 'h4_admin'] } });
    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }
    await admin.deleteOne();
    await logAudit(req, 'ADMIN_DELETED', 'User', admin._id, `Super admin deleted dedicated admin: ${admin.name}`, admin.name);
    res.json({ message: 'Dedicated admin removed' });
};

module.exports = {
    createPartnerGym,
    updatePartnerGym,
    getPartnerGyms,
    deletePartnerGym,
    createFitPrimePlan,
    updateFitPrimePlan,
    deleteFitPrimePlan,
    getFitPrimePlans,
    getOrCreateH4Gym,
    getDedicatedAdmins,
    createDedicatedAdmin,
    updateDedicatedAdmin,
    deleteDedicatedAdmin
};
