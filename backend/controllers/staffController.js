const User = require('../models/User');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
    try {
        const staff = await User.find({
            gymId: req.user.gymId,
            role: { $in: ['admin', 'trainer', 'receptionist'] }
        }).select('-password').lean();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staff', error: error.message });
    }
};

// @desc    Create a new staff member
// @route   POST /api/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!['admin', 'trainer', 'receptionist'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const staff = await User.create({
            name,
            email: email.trim().toLowerCase(),
            password,
            role,
            gymId: req.user.gymId
        });

        const result = { ...staff };
        delete result.password;

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error creating staff', error: error.message });
    }
};

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
const updateStaff = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const staff = await User.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        if (email && email.trim().toLowerCase() !== staff.email) {
            const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
            staff.email = email.trim().toLowerCase();
        }

        staff.name = name || staff.name;
        if (role) {
            if (!['admin', 'trainer', 'receptionist'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            staff.role = role;
        }

        if (password) {
            staff.password = password;
        }

        const updatedStaff = await staff.save();
        const result = { ...updatedStaff };
        delete result.password;

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error updating staff', error: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
    try {
        const staff = await User.findOne({ _id: req.params.id, gymId: req.user.gymId });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        if (staff.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        await staff.deleteOne();
        res.json({ message: 'Staff member removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting staff', error: error.message });
    }
};

module.exports = {
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
};
