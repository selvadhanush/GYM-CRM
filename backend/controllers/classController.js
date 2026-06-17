const GymClass = require('../models/GymClass');
const Member = require('../models/Member');

// @desc    Get all classes for a gym
// @route   GET /api/classes
// @access  Private/Admin/Trainer
const getClasses = async (req, res) => {
    try {
        const classes = await GymClass.find({ gymId: req.user.gymId })
            .sort({ scheduleDate: 1 })
            .lean();
        // Add seatsAvailable computed field
        const result = classes.map(c => ({
            ...c,
            seatsAvailable: c.maxSeats - (c.bookings?.length || 0)
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching classes', error: error.message });
    }
};

// @desc    Create a class
// @route   POST /api/classes
// @access  Private/Admin/Trainer
const createClass = async (req, res) => {
    try {
        const { name, type, description, trainerName, scheduleDate, startTime, endTime, maxSeats } = req.body;
        if (!name || !type || !scheduleDate || !startTime || !endTime || !maxSeats) {
            return res.status(400).json({ message: 'name, type, scheduleDate, startTime, endTime, maxSeats are required' });
        }
        const gymClass = await GymClass.create({
            name,
            type,
            description,
            trainerName,
            scheduleDate: new Date(scheduleDate),
            startTime,
            endTime,
            maxSeats: Number(maxSeats),
            gymId: req.user.gymId,
            bookings: []
        });
        res.status(201).json(gymClass);
    } catch (error) {
        res.status(500).json({ message: 'Error creating class', error: error.message });
    }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
    try {
        const gymClass = await GymClass.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });
        res.json({ message: 'Class deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting class', error: error.message });
    }
};

// @desc    Get bookings for a class
// @route   GET /api/classes/:id/bookings
// @access  Private/Admin/Trainer
const getClassBookings = async (req, res) => {
    try {
        const gymClass = await GymClass.findOne({ _id: req.params.id, gymId: req.user.gymId })
            .populate('bookings.memberId', 'name phone');
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });
        res.json(gymClass);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
};

// @desc    Member books a class slot
// @route   POST /api/member-portal/classes/:id/book
// @access  Private/Member
const bookClass = async (req, res) => {
    try {
        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const alreadyBooked = gymClass.bookings.some(
            b => b && b.memberId && req.user.memberId && b.memberId.toString() === req.user.memberId.toString()
        );
        if (alreadyBooked) return res.status(400).json({ message: 'Already booked this class' });

        if (gymClass.bookings.length >= gymClass.maxSeats) {
            return res.status(400).json({ message: 'Class is full' });
        }

        const member = await Member.findById(req.user.memberId).select('name');
        gymClass.bookings.push({ 
            memberId: req.user.memberId, 
            memberName: member?.name || '',
            bookedAt: new Date()
        });
        await gymClass.save();

        res.json({
            message: 'Class booked successfully',
            seatsAvailable: gymClass.maxSeats - gymClass.bookings.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error booking class', error: error.message });
    }
};

// @desc    Member cancels a class booking
// @route   DELETE /api/member-portal/classes/:id/book
// @access  Private/Member
const cancelBooking = async (req, res) => {
    try {
        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const bookingIndex = gymClass.bookings.findIndex(
            b => b && b.memberId && req.user.memberId && b.memberId.toString() === req.user.memberId.toString()
        );
        if (bookingIndex === -1) return res.status(400).json({ message: 'No booking found for this class' });

        gymClass.bookings.splice(bookingIndex, 1);
        await gymClass.save();

        res.json({
            message: 'Booking cancelled',
            seatsAvailable: gymClass.maxSeats - gymClass.bookings.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
};

// @desc    Member views available classes
// @route   GET /api/member-portal/classes
// @access  Private/Member
const getMemberClasses = async (req, res) => {
    try {
        const member = await Member.findById(req.user.memberId).select('gymId');
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const classes = await GymClass.find({ gymId: member.gymId, scheduleDate: { $gte: today } })
            .sort({ scheduleDate: 1 })
            .lean();

        const result = classes.map(c => ({
            ...c,
            seatsAvailable: c.maxSeats - (c.bookings?.length || 0),
            isBooked: c.bookings?.some(b => b.memberId.toString() === req.user.memberId.toString()) || false
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching classes', error: error.message });
    }
};

// @desc    Admin books a class for a member
// @route   POST /api/classes/:id/book
// @access  Private/Admin or Trainer
const adminBookClass = async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!memberId) {
            return res.status(400).json({ message: 'Member ID is required' });
        }

        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const alreadyBooked = gymClass.bookings.some(
            b => b && b.memberId && b.memberId.toString() === memberId.toString()
        );
        if (alreadyBooked) return res.status(400).json({ message: 'Member already booked for this class' });

        if (gymClass.bookings.length >= gymClass.maxSeats) {
            return res.status(400).json({ message: 'Class is full' });
        }

        const member = await Member.findById(memberId).select('name');
        if (!member) return res.status(404).json({ message: 'Member not found' });

        gymClass.bookings.push({ 
            memberId: memberId, 
            memberName: member.name,
            bookedAt: new Date()
        });
        await gymClass.save();

        res.json({
            message: 'Class booked successfully by admin',
            bookings: gymClass.bookings
        });
    } catch (error) {
        res.status(500).json({ message: 'Error booking class', error: error.message });
    }
};

// @desc    Admin cancels a member booking
// @route   DELETE /api/classes/:id/bookings/:memberId
// @access  Private/Admin or Trainer
const adminCancelBooking = async (req, res) => {
    try {
        const { memberId } = req.params;
        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const bookingIndex = gymClass.bookings.findIndex(
            b => b && b.memberId && b.memberId.toString() === memberId.toString()
        );
        if (bookingIndex === -1) return res.status(400).json({ message: 'No booking found for this member' });

        gymClass.bookings.splice(bookingIndex, 1);
        await gymClass.save();

        res.json({
            message: 'Booking cancelled by admin',
            bookings: gymClass.bookings
        });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
};

module.exports = { 
    getClasses, 
    createClass, 
    deleteClass, 
    getClassBookings, 
    bookClass, 
    cancelBooking, 
    getMemberClasses,
    adminBookClass,
    adminCancelBooking
};
