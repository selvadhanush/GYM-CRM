const Notification = require('../models/Notification');
const Member = require('../models/Member');
const User = require('../models/User');

// @desc    Get unread notifications and auto-generate alerts
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    // 1. Auto-generate alerts before fetching
    await generateAutomatedAlerts(req.user);

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(notifications);
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
const markAsRead = async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification && notification.recipient.toString() === req.user._id.toString()) {
        notification.read = true;
        await notification.save();
        res.json({ message: 'Marked as read' });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
};

// @desc    Create gym-wide announcement
// @route   POST /api/notifications/announcement
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    // Find all users in this gym
    const users = await User.find({ gymId: req.user.gymId });

    const notifications = users.map(user => ({
        recipient: user._id,
        gymId: req.user.gymId,
        type: 'announcement',
        message: `Gym Announcement: ${message}`
    }));

    await Notification.insertMany(notifications);
    res.status(201).json({ message: 'Announcement sent to all users' });
};

// Helper logic to find members with expiries or dues
const generateAutomatedAlerts = async (user) => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Only run this check occasionally or for certain triggers
    // For simplicity, we'll check members for local gym

    // 1. Check for Expiries
    const expiringMembers = await Member.find({
        gymId: user.gymId,
        expiryDate: { $lte: threeDaysFromNow, $gt: today },
        status: 'Active'
    });

    for (const member of expiringMembers) {
        const msg = `Member ${member.name}'s plan is expiring on ${member.expiryDate.toLocaleDateString()}`;
        // Create for admin/receptionist (usually the current user if they are admin)
        if (user.role === 'admin' || user.role === 'receptionist') {
            await createUniqueNotification(user._id, user.gymId, 'expiry', msg);
        }
    }

    // 2. Check for Dues (only for staff)
    if (user.role === 'admin' || user.role === 'receptionist') {
        const membersWithDues = await Member.find({
            gymId: user.gymId,
            $expr: { $gt: ["$planPrice", "$paidAmount"] }
        });

        for (const member of membersWithDues) {
            const msg = `Member ${member.name} has a pending balance of ₹${member.planPrice - member.paidAmount}`;
            await createUniqueNotification(user._id, user.gymId, 'payment', msg);
        }
    }
};

const createUniqueNotification = async (recipient, gymId, type, message) => {
    // Check if a similar unread notification already exists to avoid spam
    const exists = await Notification.findOne({
        recipient,
        type,
        message,
        read: false
    });

    if (!exists) {
        await Notification.create({ recipient, gymId, type, message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    createAnnouncement
};
