const Notification = require('../models/Notification');
const Member = require('../models/Member');
const User = require('../models/User');

// @desc    Get unread notifications and auto-generate alerts
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        // 1. Auto-generate alerts before fetching
        await generateAutomatedAlerts(req.user);

        const notifications = await Notification.find({ recipientId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);
    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (notification && notification.recipientId === req.user._id) {
            notification.read = true;
            await notification.save();
            res.json({ message: 'Marked as read' });
        } else {
            res.status(404).json({ success: false, message: 'Notification not found' });
        }
    } catch (error) {
        console.error("MARK NOTIFICATION READ ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Create gym-wide announcement
// @route   POST /api/notifications/announcement
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            res.status(400);
            return res.json({ success: false, message: 'Message is required' });
        }

        // Find all users in this gym
        const users = await User.find({ gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) });

        const notifications = users.map(user => ({
            recipientId: user._id,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            type: 'announcement',
            message: `Gym Announcement: ${message}`
        }));

        await Notification.insertMany(notifications);
        res.status(201).json({ message: 'Announcement sent to all users' });
    } catch (error) {
        console.error("CREATE ANNOUNCEMENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// Helper logic to find members with expiries or dues
const generateAutomatedAlerts = async (user) => {
    try {
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
            const allMembers = await Member.find({ gymId: user.gymId });
            const membersWithDues = allMembers.filter(member => member.planPrice > member.paidAmount);

            for (const member of membersWithDues) {
                const msg = `Member ${member.name} has a pending balance of ₹${member.planPrice - member.paidAmount}`;
                await createUniqueNotification(user._id, user.gymId, 'payment', msg);
            }
        }
    } catch (error) {
        console.error("GENERATE AUTOMATED ALERTS ERROR:", error);
    }
};

const createUniqueNotification = async (recipientId, gymId, type, message) => {
    try {
        // Check if a similar unread notification already exists to avoid spam
        const exists = await Notification.findOne({
            recipientId,
            type,
            message,
            read: false
        });

        if (!exists) {
            await Notification.create({ recipientId, gymId, type, message });
        }
    } catch (error) {
        console.error("CREATE UNIQUE NOTIFICATION ERROR:", error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    createAnnouncement
};
