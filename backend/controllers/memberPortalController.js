const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Gym = require('../models/Gym');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { expireIfDue } = require('../utils/sessionHelpers');

// @desc    Get logged in member profile/plan
// @route   GET /api/member-portal/plan
// @access  Private/Member
const getMyPlan = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const member = await Member.findById(req.user.memberId).populate('planId');
    if (!member) {
        res.status(404);
        throw new Error('Member profile not found');
    }

    // Lazily expire an active session whose time has run out, so the returned
    // state is always accurate even between cron ticks.
    await expireIfDue(member);

    res.json(member);
};

// @desc    Get Fit-Prime (Global) Plans
// @route   GET /api/member-portal/fitprime-plans
// @access  Private/Member
const getFitPrimePlans = async (req, res) => {
    if (req.user.role !== 'member') {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const plans = await Plan.find({ gymId: 'SYSTEM' }).lean();
    res.json(plans);
};

// @desc    Get all active partner gyms
// @route   GET /api/member-portal/gyms
// @access  Private/Member
const getPartnerGyms = async (req, res) => {
    const gyms = await Gym.find({ status: 'Active', name: { $ne: 'SYSTEM' } }).lean();
    
    try {
        const prisma = require('../config/prisma');
        const activeSessionsGroupBy = await prisma.sessionCheckIn.groupBy({
            by: ['gymId'],
            _count: { id: true },
            where: { status: 'active', expiresAt: { gt: new Date() } }
        });
        const occupancyMap = {};
        activeSessionsGroupBy.forEach(item => {
            occupancyMap[item.gymId] = item._count.id;
        });

        const gymsWithOccupancy = gyms.map(gym => ({
            ...gym,
            activeSessions: occupancyMap[gym._id?.toString() || gym.id] || 0
        }));
        res.json(gymsWithOccupancy);
    } catch (err) {
        console.error('Error fetching partner gyms occupancy:', err);
        res.json(gyms);
    }
};

// @desc    Get logged in member attendance
// @route   GET /api/member-portal/attendance
// @access  Private/Member
const getMyAttendance = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const attendance = await Attendance.find({ memberId: req.user.memberId }).lean();
    
    const prisma = require('../config/prisma');
    const sessions = await prisma.sessionCheckIn.findMany({
        where: { memberId: req.user.memberId },
        orderBy: { startedAt: 'desc' }
    });

    const combined = [
        ...attendance,
        ...sessions.map(s => ({
            _id: s.id,
            id: s.id,
            memberId: s.memberId,
            date: s.startedAt,
            checkInTime: s.startedAt.toTimeString().split(' ')[0],
            gymId: s.gymId,
            gymName: s.gymName,
            isFitPrimeSession: true,
            status: s.status
        }))
    ];

    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(combined);
};

// @desc    Get logged in member payments
// @route   GET /api/member-portal/payments
// @access  Private/Member
const getMyPayments = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    const payments = await Payment.find({ memberId: req.user.memberId }).sort({ date: -1 });
    res.json(payments);
};

// @desc    Create Razorpay Order
// @route   POST /api/member-portal/payment/create-order
// @access  Private/Member
const createRazorpayOrder = async (req, res) => {
    try {
        if (!req.user?.memberId) {
            return res.status(403).json({ message: 'Not authorized as a member (no memberId in token)' });
        }

        const member = await Member.findById(req.user.memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        const amountDue = (member.planPrice || 0) - (member.paidAmount || 0);

        if (amountDue <= 0) {
            return res.status(400).json({ message: 'No dues pending for this member' });
        }

        // --- PARTIAL PAYMENT: use custom amount from request body ---
        let paymentAmount = req.body ? Number(req.body.amount) : NaN;
        if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
            // fallback to full due amount if not provided
            paymentAmount = amountDue;
        }
        if (paymentAmount > amountDue) {
            return res.status(400).json({ message: `Amount ₹${paymentAmount} exceeds total due ₹${amountDue}` });
        }

        const amountInPaise = Math.round(paymentAmount * 100);
        if (amountInPaise < 100) {
            return res.status(400).json({ message: `Amount too small: ₹${paymentAmount}. Minimum is ₹1.` });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const hasRazorpayKeys = keyId && keySecret && 
                                keyId !== 'your_razorpay_key_id' &&
                                keyId !== 'null' && keyId !== 'undefined' && keyId.trim() !== '' &&
                                keySecret !== 'null' && keySecret !== 'undefined' && keySecret.trim() !== '';

        if (!hasRazorpayKeys) {
            console.log('Razorpay keys missing or invalid in .env. Returning a mock order for testing.');
            const mockOrder = {
                id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
                amount: amountInPaise,
                currency: "INR",
                receipt: `rcpt_${(member._id || member.id).toString().slice(-6)}_${Date.now()}`,
                status: "created",
                is_mock: true
            };
            return res.status(201).json(mockOrder);
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${(member._id || member.id).toString().slice(-6)}_${Date.now()}`,
            notes: { paymentAmount: paymentAmount, memberId: (member._id || member.id).toString() },
        };

        const order = await instance.orders.create(options);
        res.status(201).json(order);
    } catch (error) {
        console.error('RAZORPAY CREATE-ORDER ERROR:', error);
        res.status(500).json({
            message: 'Razorpay order creation failed',
            error: error.message || String(error),
            details: error.error?.description || error.description || 'Check server logs for details'
        });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/member-portal/payment/verify
// @access  Private/Member
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_paid } = req.body || {};

        if (!req.user?.memberId) {
            return res.status(403).json({ message: 'Not authorized as a member' });
        }

        const member = await Member.findById(req.user.memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
        let isAuthentic = false;

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const hasKeySecret = keySecret && keySecret !== 'null' && keySecret !== 'undefined' && keySecret.trim() !== '';

        if (isMock || !hasKeySecret) {
            isAuthentic = true;
        } else {
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(body.toString())
                .digest('hex');
            isAuthentic = expectedSignature === razorpay_signature;
        }

        if (isAuthentic) {
            // Use the actual amount paid (partial or full)
            const amountPaid = Number(amount_paid) || ((member.planPrice || 0) - (member.paidAmount || 0));

            // Create Payment record
            await Payment.create({
                memberId: member._id || member.id,
                gymId: member.gymId,
                amount: amountPaid,
                method: 'Online (Razorpay)',
                date: new Date(),
                transactionId: razorpay_payment_id || `txn_${crypto.randomBytes(8).toString('hex')}`
            });

            // Increment paidAmount by the partial amount paid
            member.paidAmount = Math.min((member.paidAmount || 0) + amountPaid, member.planPrice || 0);
            // Mark active only if fully paid
            if (member.paidAmount >= (member.planPrice || 0)) {
                member.status = 'Active';
            }
            await member.save();

            res.status(200).json({
                success: true,
                message: 'Payment verified and recorded successfully',
                amountPaid,
                remainingDue: (member.planPrice || 0) - member.paidAmount
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('PAYMENT VERIFICATION ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// @desc    Create Razorpay Order for Plan Purchase
// @route   POST /api/member-portal/purchase-plan/create-order
// @access  Private/Member
const purchasePlanOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        // Allow users without memberId to buy a plan (it's their first plan)

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        const amountInPaise = Math.round(plan.price * 100);

        const userIdString = req.user && req.user._id ? req.user._id.toString() : 'mockuser';
        const receiptId = `rcpt_plan_${userIdString.slice(-6)}_${Date.now()}`;

        // Mock mode is only available in non-production. In production a missing
        // real key is a hard error (would otherwise let members "buy" plans for free).
        const isMockEnv = !process.env.RAZORPAY_KEY_ID ||
                          !process.env.RAZORPAY_KEY_SECRET ||
                          process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id';
        if (isMockEnv && process.env.NODE_ENV === 'production') {
            console.error('Razorpay keys missing in production; refusing to create a mock order.');
            return res.status(503).json({ message: 'Payments are not configured.' });
        }

        if (isMockEnv) {
            const mockOrder = {
                id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
                amount: amountInPaise,
                currency: "INR",
                receipt: receiptId,
                status: "created",
                is_mock: true,
                notes: { newPlanId: planId.toString() }
            };
            return res.status(201).json(mockOrder);
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: receiptId,
            notes: { newPlanId: planId.toString(), userId: userIdString },
        };

        const order = await instance.orders.create(options);
        res.status(201).json(order);
    } catch (error) {
        console.error('purchasePlanOrder ERROR:', error.message);
        res.status(500).json({ message: 'Order creation failed', error: error.message || String(error) });
    }
};

// @desc    Verify Plan Purchase
// @route   POST /api/member-portal/purchase-plan/verify
// @access  Private/Member
const purchasePlanVerify = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    // Mock verification is dev-only. In production a missing key is a hard error.
    const isMock = (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) ||
                   !process.env.RAZORPAY_KEY_SECRET ||
                   process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret';
    if (isMock && process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, message: 'Payments are not configured.' });
    }

    let isAuthentic = false;
    if (isMock) {
        isAuthentic = true;
    } else {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        isAuthentic = expectedSignature === razorpay_signature;
    }

    if (!isAuthentic) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
    }

    // --- FitPrime session-based crediting ---
    // A FitPrime (SYSTEM) plan grants a fixed number of sessions (plan.sessions).
    // We credit sessionsRemaining / sessionsTotal instead of a time-based expiry.
    // (The previous logic forced a bogus +30-day expiry for "hours" plans.)
    const isFitPrimePlan = plan.gymId === 'SYSTEM';
    const sessionsToCredit = isFitPrimePlan ? (plan.sessions || 0) : 0;

    let member = null;
    if (req.user.memberId) {
        member = await Member.findById(req.user.memberId);
    }

    if (!member) {
        // Create a member profile for this user. Note: phone is taken from the
        // authed user's phone (fixed -- previously this stored the email here).
        member = await Member.create({
            name: req.user.name,
            phone: req.user.phone || 'N/A',
            email: req.user.email,
            planId: plan._id,
            joinDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // far-future; sessions gate access, not time
            status: 'Active',
            planPrice: plan.price,
            paidAmount: plan.price,
            gymId: req.user.gymId, ...(req.user.branchId && { branchId: req.user.branchId }),
            sessionsTotal: sessionsToCredit,
            sessionsRemaining: sessionsToCredit,
        });

        // Link memberId to the User account and update role to 'member'.
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, { memberId: member._id, role: 'member' });
    } else {
        member.planId = plan._id;
        member.planPrice = plan.price;
        member.paidAmount = plan.price;
        member.status = 'Active';
        if (isFitPrimePlan) {
            // Top up (not replace) the session balance on a re-purchase.
            member.sessionsTotal = (member.sessionsTotal || 0) + sessionsToCredit;
            member.sessionsRemaining = (member.sessionsRemaining || 0) + sessionsToCredit;
        }
        await member.save();
    }

    await Payment.create({
        memberId: member._id,
        gymId: member.gymId,
        amount: plan.price,
        method: 'Online (Razorpay)',
        date: new Date(),
        transactionId: razorpay_payment_id
    });

    res.status(200).json({
        success: true,
        message: 'Plan purchased successfully',
        plan,
        sessionsRemaining: member.sessionsRemaining || 0,
    });
};

// @desc    Cancel Active Plan
// @route   POST /api/member-portal/plan/cancel
// @access  Private/Member
const cancelMyPlan = async (req, res) => {
    if (!req.user?.memberId) {
        return res.status(403).json({ message: 'Not authorized as a member' });
    }

    const member = await Member.findById(req.user.memberId);
    if (!member) {
        return res.status(404).json({ message: 'Member profile not found' });
    }

    member.planId = '';
    member.planPrice = 0;
    member.paidAmount = 0;
    member.status = 'Inactive';
    // Clear any FitPrime session balance/active session on cancellation.
    member.sessionsRemaining = 0;
    member.sessionsTotal = 0;
    member.currentSessionEndsAt = null;
    member.currentSessionGymId = null;
    member.cooldownEndsAt = null;
    await member.save();

    res.status(200).json({ success: true, message: 'Plan cancelled successfully' });
};

// @desc    Get consolidated dashboard data for member (plan, attendance, gyms, session status)
// @route   GET /api/member-portal/dashboard
// @access  Private/Member
const getDashboardData = async (req, res) => {
    if (req.user.role !== 'member' || !req.user.memberId) {
        res.status(403);
        throw new Error('Not authorized as a member');
    }

    try {
        const memberId = req.user.memberId;

        // Fetch member profile/plan (with lazy session expiry)
        const member = await Member.findById(memberId).populate('planId');
        if (!member) {
            res.status(404);
            throw new Error('Member profile not found');
        }

        await expireIfDue(member);

        const prisma = require('../config/prisma');

        // Fetch everything in parallel to minimize waiting times
        const [attendance, gyms, sessions] = await Promise.all([
            Attendance.find({ memberId }).lean(),
            Gym.find({ status: 'Active', name: { $ne: 'SYSTEM' } }).lean(),
            prisma.sessionCheckIn.findMany({
                where: { memberId },
                orderBy: { startedAt: 'desc' }
            })
        ]);

        // Fetch active checkins count grouped by gymId
        const activeSessionsGroupBy = await prisma.sessionCheckIn.groupBy({
            by: ['gymId'],
            _count: { id: true },
            where: { status: 'active', expiresAt: { gt: new Date() } }
        });
        const occupancyMap = {};
        activeSessionsGroupBy.forEach(item => {
            occupancyMap[item.gymId] = item._count.id;
        });

        const gymsWithOccupancy = gyms.map(gym => ({
            ...gym,
            activeSessions: occupancyMap[gym._id?.toString() || gym.id] || 0
        }));

        // Retrieve last check-in to identify the last visited gym
        const lastCheckIn = sessions.length > 0 ? sessions[0] : null;
        let lastVisitedGym = null;
        if (lastCheckIn) {
            const foundGym = gymsWithOccupancy.find(g => (g._id?.toString() || g.id) === lastCheckIn.gymId);
            if (foundGym) {
                lastVisitedGym = foundGym;
            } else {
                const dbGym = await Gym.findById(lastCheckIn.gymId);
                if (dbGym) {
                    lastVisitedGym = {
                        ...dbGym,
                        activeSessions: occupancyMap[lastCheckIn.gymId] || 0
                    };
                }
            }
        }

        // Process attendance & sessions into combined format
        const combinedAttendance = [
            ...attendance,
            ...sessions.map(s => ({
                _id: s.id,
                id: s.id,
                memberId: s.memberId,
                date: s.startedAt,
                checkInTime: s.startedAt.toTimeString().split(' ')[0],
                gymId: s.gymId,
                gymName: s.gymName,
                isFitPrimeSession: true,
                status: s.status
            }))
        ];
        combinedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Evaluate session status details
        const now = new Date();
        const active = !!(member.currentSessionEndsAt && new Date(member.currentSessionEndsAt) > now);
        const inCooldown = !!(member.cooldownEndsAt && new Date(member.cooldownEndsAt) > now);

        const sessionStatus = {
            active,
            sessionEndsAt: active ? member.currentSessionEndsAt : null,
            currentSessionGymId: active ? member.currentSessionGymId : null,
            inCooldown,
            cooldownEndsAt: inCooldown ? member.cooldownEndsAt : null,
            lastCheckInAt: member.lastCheckInAt || null,
        };

        res.json({
            success: true,
            member,
            attendance: combinedAttendance,
            partnerGyms: gymsWithOccupancy,
            sessionStatus,
            lastVisitedGym
        });
    } catch (error) {
        console.error('CONSOLIDATED DASHBOARD DATA ERROR:', error.message);
        res.status(500).json({ success: false, message: 'Could not load dashboard data.' });
    }
};

module.exports = {
    getMyPlan,
    getMyAttendance,
    getMyPayments,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getFitPrimePlans,
    purchasePlanOrder,
    purchasePlanVerify,
    cancelMyPlan,
    getPartnerGyms,
    getDashboardData
};
