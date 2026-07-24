const prisma = require('../config/prisma');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = catchAsync(async (req, res, next) => {
    const { subject, category, message } = req.body;

    if (!subject || !category || !message) {
        return next(new AppError('Please provide subject, category and message', 400));
    }

    const ticket = await prisma.ticket.create({
        data: {
            subject,
            category,
            gymId: req.user.gymId,
            branchId: req.user.branchId || null,
            creatorId: req.user.id || req.user._id?.toString() || 'unknown',
            creatorName: req.user.name,
            creatorRole: req.user.role,
            messages: {
                create: {
                    senderId: req.user.id || req.user._id?.toString() || 'unknown',
                    senderName: req.user.name,
                    senderRole: req.user.role,
                    message
                }
            }
        },
        include: {
            messages: true
        }
    });

    res.status(201).json({
        success: true,
        data: ticket
    });
});

// @desc    Get all tickets (scoped by user role)
// @route   GET /api/tickets
// @access  Private
exports.getTickets = catchAsync(async (req, res, next) => {
    const isAdmin = ['superadmin', 'admin', 'h4_admin', 'trainer'].includes(req.user.role);
    
    let whereClause = { gymId: req.user.gymId };
    
    if (!isAdmin) {
        // Regular users only see their own tickets
        whereClause.creatorId = req.user.id || req.user._id?.toString();
    }

    const tickets = await prisma.ticket.findMany({
        where: whereClause,
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        success: true,
        data: tickets
    });
});

// @desc    Reply to a ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
exports.replyToTicket = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
        return next(new AppError('Please provide a message', 400));
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
        return next(new AppError('Ticket not found', 404));
    }

    const isAdmin = ['superadmin', 'admin', 'h4_admin'].includes(req.user.role);

    // If it's a regular user, verify they own the ticket
    if (!isAdmin && ticket.creatorId !== (req.user.id || req.user._id?.toString())) {
        return next(new AppError('Not authorized to access this ticket', 403));
    }

    // Determine new status
    const newStatus = isAdmin ? 'resolved' : 'pending';

    const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
            status: newStatus,
            messages: {
                create: {
                    senderId: req.user.id || req.user._id?.toString() || 'unknown',
                    senderName: req.user.name,
                    senderRole: isAdmin ? 'support' : req.user.role,
                    message
                }
            }
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    res.status(200).json({
        success: true,
        data: updatedTicket
    });
});

// @desc    Update ticket status directly (admin only)
// @route   PUT /api/tickets/:id/status
// @access  Private (Admin)
exports.updateTicketStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved'].includes(status)) {
        return next(new AppError('Invalid status', 400));
    }

    const ticket = await prisma.ticket.update({
        where: { id },
        data: { status },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    res.status(200).json({
        success: true,
        data: ticket
    });
});
