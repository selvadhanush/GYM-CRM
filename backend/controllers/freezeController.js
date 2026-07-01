const Member = require('../models/Member');

// @desc    Freeze a member's membership
// @route   POST /api/members/:id/freeze
// @access  Private/Admin/Receptionist
const freezeMember = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const member = await Member.findOne(query);
        if (!member) return res.status(404).json({ message: 'Member not found' });
        if (member.status === 'Frozen') return res.status(400).json({ message: 'Member is already frozen' });

        const { reason } = req.body;

        member.status = 'Frozen';
        member.freezeHistory.push({ freezeDate: new Date(), reason: reason || '' });
        await member.save();

        res.json({ message: 'Member membership frozen successfully', member });
    } catch (error) {
        console.error('Freeze error:', error);
        res.status(500).json({ message: 'Failed to freeze member', error: error.message });
    }
};

// @desc    Unfreeze a member's membership (adds frozen days to expiry)
// @route   POST /api/members/:id/unfreeze
// @access  Private/Admin/Receptionist
const unfreezeMember = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const member = await Member.findOne(query);
        if (!member) return res.status(404).json({ message: 'Member not found' });
        if (member.status !== 'Frozen') return res.status(400).json({ message: 'Member is not frozen' });

        // Find the latest open freeze record (no unfreezeDate)
        const openFreeze = [...member.freezeHistory].reverse().find(f => !f.unfreezeDate);
        if (!openFreeze) return res.status(400).json({ message: 'No active freeze record found' });

        const unfreezeDate = new Date();
        const freezeDate = new Date(openFreeze.freezeDate);
        const frozenMs = unfreezeDate - freezeDate;
        const daysAdded = Math.ceil(frozenMs / (1000 * 60 * 60 * 24));

        // Close the freeze record
        openFreeze.unfreezeDate = unfreezeDate;
        openFreeze.daysAdded = daysAdded;

        // Extend expiry date by number of days frozen
        const currentExpiry = new Date(member.expiryDate);
        currentExpiry.setDate(currentExpiry.getDate() + daysAdded);
        member.expiryDate = currentExpiry;

        member.status = 'Active';
        await member.save();

        res.json({
            message: `Member unfrozen. Expiry extended by ${daysAdded} day(s).`,
            daysAdded,
            newExpiryDate: member.expiryDate,
            member
        });
    } catch (error) {
        console.error('Unfreeze error:', error);
        res.status(500).json({ message: 'Failed to unfreeze member', error: error.message });
    }
};

// @desc    Get freeze history for a member
// @route   GET /api/members/:id/freeze-history
// @access  Private/Admin/Receptionist
const getFreezeHistory = async (req, res) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) {
            query.branchId = req.user.branchId;
        }
        const member = await Member.findOne(query).select('name freezeHistory status');
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json({ name: member.name, status: member.status, freezeHistory: member.freezeHistory });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching freeze history', error: error.message });
    }
};

module.exports = { freezeMember, unfreezeMember, getFreezeHistory };
