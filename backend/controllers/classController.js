const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const GymClass = require('../models/GymClass');
const Member = require('../models/Member');

// @desc    Get all classes for a gym
// @route   GET /api/classes
// @access  Private/Admin/Trainer
const getClasses = catchAsync(async (req, res, next) => {
    try {
        const query = { ...req.tenantFilter };
        const classes = await GymClass.find(query)
            .sort({ scheduleDate: 1 })
            .lean();
        // Add seatsAvailable computed field
        const result = classes.map(c => ({
            ...c,
            seatsAvailable: c.maxSeats - (c.bookings?.length || 0)
        }));
        res.json(result);
    } catch (error) { next(error); }
};

// @desc    Create a class
// @route   POST /api/classes
// @access  Private/Admin/Trainer
const createClass = catchAsync(async (req, res, next) => {
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
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            branchId: req.user.branchId || null,
            bookings: []
        });
        res.status(201).json(gymClass);
    } catch (error) { next(error); }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = catchAsync(async (req, res, next) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const gymClass = await GymClass.findOneAndDelete(query);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });
        res.json({ message: 'Class deleted' });
    } catch (error) { next(error); }
};

// @desc    Get bookings for a class
// @route   GET /api/classes/:id/bookings
// @access  Private/Admin/Trainer
const getClassBookings = catchAsync(async (req, res, next) => {
    try {
        const query = { _id: req.params.id, gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }) };
        if (req.user.branchId) query.branchId = req.user.branchId;
        const gymClass = await GymClass.findOne(query)
            .populate('bookings.memberId', 'name phone');
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });
        res.json(gymClass);
    } catch (error) { next(error); }
};

// @desc    Member books a class slot
// @route   POST /api/member-portal/classes/:id/book
// @access  Private/Member
const bookClass = catchAsync(async (req, res, next) => {
    try {
        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const alreadyBooked = gymClass.bookings.some(
            b => b && (b.memberId || b).toString() === req.user.memberId.toString()
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
    } catch (error) { next(error); }
};

// @desc    Member cancels a class booking
// @route   DELETE /api/member-portal/classes/:id/book
// @access  Private/Member
const cancelBooking = catchAsync(async (req, res, next) => {
    try {
        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const bookingIndex = gymClass.bookings.findIndex(
            b => b && (b.memberId || b).toString() === req.user.memberId.toString()
        );
        if (bookingIndex === -1) return res.status(400).json({ message: 'No booking found for this class' });

        gymClass.bookings.splice(bookingIndex, 1);
        await gymClass.save();

        res.json({
            message: 'Booking cancelled',
            seatsAvailable: gymClass.maxSeats - gymClass.bookings.length
        });
    } catch (error) { next(error); }
};

// @desc    Member views available classes
// @route   GET /api/member-portal/classes
// @access  Private/Member
const getMemberClasses = catchAsync(async (req, res, next) => {
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
            isBooked: c.bookings?.some(b => b && (b.memberId || b).toString() === req.user.memberId.toString()) || false
        }));
        res.json(result);
    } catch (error) { next(error); }
};

// @desc    Admin books a class for a member
// @route   POST /api/classes/:id/book
// @access  Private/Admin or Trainer
const adminBookClass = catchAsync(async (req, res, next) => {
    try {
        const { memberId } = req.body;
        if (!memberId) {
            return res.status(400).json({ message: 'Member ID is required' });
        }

        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const alreadyBooked = gymClass.bookings.some(
            b => b && (b.memberId || b).toString() === memberId.toString()
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
    } catch (error) { next(error); }
};

// @desc    Admin cancels a member booking
// @route   DELETE /api/classes/:id/bookings/:memberId
// @access  Private/Admin or Trainer
const adminCancelBooking = catchAsync(async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const gymClass = await GymClass.findById(req.params.id);
        if (!gymClass) return res.status(404).json({ message: 'Class not found' });

        const bookingIndex = gymClass.bookings.findIndex(
            b => b && (b.memberId || b).toString() === memberId.toString()
        );
        if (bookingIndex === -1) return res.status(400).json({ message: 'No booking found for this member' });

        gymClass.bookings.splice(bookingIndex, 1);
        await gymClass.save();

        res.json({
            message: 'Booking cancelled by admin',
            bookings: gymClass.bookings
        });
    } catch (error) { next(error); }
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
