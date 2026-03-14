const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logAudit } = require('../utils/auditLogger');

const Gym = require('../models/Gym');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, gymName } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create Gym first
    const gym = await Gym.create({
        name: gymName || `${name}'s Gym`,
    });

    const user = await User.create({
        name,
        email,
        password,
        gymId: gym._id,
        role: 'admin'
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gymId: user.gymId,
            gymName: gym.name,
            memberId: user.memberId,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).populate('gymId');

    if (user && (await user.matchPassword(password))) {
        const responseData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gymId: user.gymId._id,
            gymName: user.gymId.name,
            memberId: user.memberId,
            token: generateToken(user._id),
        };
        // Log login event — build a fake req.user for the logger
        const fakeReq = {
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, gymId: user.gymId._id },
            headers: req.headers,
            socket: req.socket
        };
        await logAudit(fakeReq, 'LOGIN', 'User', user._id, `${user.name} logged in`);
        res.json(responseData);
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};

module.exports = { registerUser, authUser };
