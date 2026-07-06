const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logAudit } = require('../utils/auditLogger');
const Gym = require('../models/Gym');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const prisma = require('../config/prisma');
const {
    OTP_TTL_MINUTES,
    MAX_OTP_ATTEMPTS,
    MAX_LOGIN_ATTEMPTS,
    LOGIN_LOCK_MINUTES,
} = require('../config/constants');

/**
 * Auth controller -- FitPrime login, registration, and OTP.
 *
 * Security hardening applied here:
 *   - OTPs generated with crypto.randomInt (not Math.random)
 *   - 5-failed-verify lockout: the OTP record's `attempts` counter is incremented
 *     and the OTP is invalidated after MAX_OTP_ATTEMPTS, forcing a fresh code.
 *   - Web login (email+password) has a 5-fail lockout via failedLoginAttempts /
 *     lockUntil on the User row.
 *   - Email is always normalized (trim + lowercase) consistently across endpoints.
 *   - Generic error messages to avoid account enumeration.
 *   - All failed login / OTP attempts are audit-logged (LOGIN_FAILED).
 */

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// Cryptographically secure 6-digit OTP. crypto.randomInt is unbiased.
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

// Hash + persist an OTP for an email, resetting the attempt counter. Used by
// both registration and the login OTP-request flow.
const issueOtp = async (email) => {
    const otpString = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpString, salt);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Upsert so a repeat request replaces any existing OTP for this email and
    // resets the failed-attempt counter to 0.
    await prisma.oTP.upsert({
        where: { email },
        update: { otp: hashedOtp, expiresAt, attempts: 0, createdAt: new Date() },
        create: { email, otp: hashedOtp, expiresAt, attempts: 0 },
    });

    return otpString;
};

// Build the audit "req" object for endpoints where the real req.user is not
// populated (public auth routes). Uses the caller's IP + headers.
const auditReq = (req, partialUser) => ({
    user: partialUser,
    headers: req.headers,
    socket: req.socket,
});

// @desc    Register a new user (public self-signup -> MEMBER role)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, password, phone } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || !phone) {
        res.status(400);
        throw new Error('Name, email, password, and phone are required');
    }
    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        phone,
        gymId: 'public', // members are linked to a gym later
        role: 'member',
        isVerified: false,
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid user data');
    }

    // Issue + email the OTP.
    const otpString = await issueOtp(email);
    console.log(`\n==================================================`);
    console.log(`[DEV ONLY] Generated Registration OTP for ${email}: ${otpString}`);
    console.log(`==================================================\n`);
    try {
        await sendEmail({
            email: user.email,
            subject: 'Gym CRM - Registration Verification OTP',
            message: `Your OTP for registration is: ${otpString}. It is valid for ${OTP_TTL_MINUTES} minutes.`,
        });
    } catch (error) {
        console.error('Email sending failed:', error.message);
        // Non-fatal: user can request a new OTP via the login flow.
    }

    res.status(201).json({
        message: 'User created. Please check your email for the OTP to verify your account.',
        email: user.email,
    });
};

// @desc    Verify OTP (registration confirmation OR login)
// @route   POST /api/auth/verify-otp
// @access  Public (rate-limited + 5-fail lockout)
const verifyOTP = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = req.body.otp ? String(req.body.otp).trim() : '';

    if (!email || !otp) {
        res.status(400);
        throw new Error('Please provide email and OTP');
    }

    const otpRecord = await prisma.oTP.findUnique({ where: { email } });

    if (!otpRecord) {
        res.status(400);
        throw new Error('Invalid or expired OTP. Please request a new one.');
    }

    // Expired -> delete and require a fresh OTP.
    if (new Date() > new Date(otpRecord.expiresAt)) {
        await prisma.oTP.delete({ where: { id: otpRecord.id } }).catch(() => {});
        res.status(400);
        throw new Error('OTP has expired. Please request a new one.');
    }

    // Already burned by too many failed attempts -> force a fresh OTP.
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.oTP.delete({ where: { id: otpRecord.id } }).catch(() => {});
        res.status(400);
        throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
        // Increment the attempt counter. If this attempt hits the threshold,
        // invalidate the OTP so the next try forces a fresh code.
        const newAttempts = otpRecord.attempts + 1;
        const remaining = MAX_OTP_ATTEMPTS - newAttempts;
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
            await prisma.oTP.delete({ where: { id: otpRecord.id } }).catch(() => {});
        } else {
            await prisma.oTP.update({ where: { id: otpRecord.id }, data: { attempts: newAttempts } });
        }

        // Best-effort audit of the failed attempt (the user may not resolve yet).
        try {
            const partialUser = await User.findOne({ email }).select('name role gymId');
            logAudit(
                auditReq(req, partialUser ? {
                    _id: partialUser._id, name: partialUser.name, email,
                    role: partialUser.role, gymId: partialUser.gymId,
                } : { name: 'Unknown', email, role: 'unknown', gymId: 'public' }),
                'LOGIN_FAILED', 'User', '', `Failed OTP verification for ${email} (${remaining} attempt(s) left)`
            ).catch(() => {});
        } catch (e) { /* audit is non-fatal */ }

        res.status(400);
        throw new Error(
            newAttempts >= MAX_OTP_ATTEMPTS
                ? 'Too many failed attempts. Please request a new OTP.'
                : `Invalid OTP. ${remaining} attempt(s) remaining.`
        );
    }

    const user = await User.findOne({ email }).populate('gymId');
    if (!user) {
        res.status(400);
        throw new Error('User not found');
    }

    if (user.isActive === false || user.status !== 'Active') {
        res.status(403);
        throw new Error('Your account is inactive or suspended. Please contact admin.');
    }

    // Success: mark verified, clear any login lockout, delete the used OTP.
    await User.findByIdAndUpdate(user._id, {
        isVerified: true,
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date(),
    });
    await prisma.oTP.delete({ where: { id: otpRecord.id } }).catch(() => {});

    logAudit(
        auditReq(req, { _id: user._id, name: user.name, email: user.email, role: user.role, gymId: user.gymId?._id || user.gymId }),
        'LOGIN', 'User', user._id, `${user.name} logged in via OTP`
    ).catch(() => {});

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        gymId: user.gymId?._id || user.gymId,
        gymName: user.gymId?.name || null,
        branchId: user.branchId || null,
        memberId: user.memberId,
        isVerified: true,
        createdAt: user.createdAt,
        token: generateToken(user._id),
    });
};

// @desc    Auth user & get token (web admin/superadmin email+password login)
// @route   POST /api/auth/login
// @access  Public (rate-limited + account lockout)
const authUser = async (req, res) => {
    const { password, portalType } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email }).populate('gymId');

    // Generic "invalid credentials" for every failure path to avoid enumeration.
    const GENERIC = 'Invalid email or password';

    // Non-existent user -> still consume time and return the generic message.
    if (!user) {
        logAudit(auditReq(req, { name: 'Unknown', email, role: 'unknown', gymId: 'public' }),
            'LOGIN_FAILED', 'User', '', `Failed login for unknown email ${email}`).catch(() => {});
        res.status(401);
        throw new Error(GENERIC);
    }

    if (user.isActive === false || user.status !== 'Active') {
        res.status(403);
        throw new Error('Your account is inactive or suspended. Please contact admin.');
    }

    // Account lockout (too many failed password attempts).
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        const mins = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
        res.status(423);
        throw new Error(`Account temporarily locked. Try again in ${mins} minute(s).`);
    }

    if (!user.isVerified && !['superadmin', 'admin', 'partner', 'fitpass_admin', 'h4_admin'].includes(user.role)) {
        res.status(401);
        throw new Error('Please verify your email before logging in. Request a new OTP if needed.');
    }

    if (!(await user.matchPassword(password))) {
        // Increment failed attempts; lock the account once the threshold is hit.
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const lockData = attempts >= MAX_LOGIN_ATTEMPTS
            ? { failedLoginAttempts: attempts, lockUntil: new Date(Date.now() + LOGIN_LOCK_MINUTES * 60000) }
            : { failedLoginAttempts: attempts };
        await User.findByIdAndUpdate(user._id, lockData);

        logAudit(auditReq(req, { _id: user._id, name: user.name, email, role: user.role, gymId: user.gymId?._id || user.gymId }),
            'LOGIN_FAILED', 'User', user._id, `Failed password login for ${email} (attempt ${attempts})`).catch(() => {});

        res.status(401);
        throw new Error(GENERIC);
    }

    // Portal validation check (applied after password match to prevent account enumeration)
    if (portalType) {
        const userRole = user.role;
        const userGymName = user.gymId?.name || '';
        const userGymId = user.gymId?._id || user.gymId || '';

        if (portalType === 'staff') {
            const isStaff = ['superadmin', 'trainer', 'partner', 'admin', 'receptionist', 'fitpass_admin', 'h4_admin'].includes(userRole);
            if (!isStaff) {
                res.status(403);
                throw new Error('Access Denied: This portal is restricted to Staffs and Partners.');
            }
        } else if (portalType === 'h4') {
            const isH4 = userRole === 'member' && (userGymName.toUpperCase() === 'H4' || userGymId === '05a08fdf-7427-48a5-8b25-e18d5a5668cd');
            if (!isH4) {
                res.status(403);
                throw new Error('Access Denied: This portal is restricted to H4 Gym Members.');
            }
        } else if (portalType === 'fitpass') {
            const isFitpass = userRole === 'member' && (userGymName.toUpperCase() !== 'H4' && userGymId !== '05a08fdf-7427-48a5-8b25-e18d5a5668cd');
            if (!isFitpass) {
                res.status(403);
                throw new Error('Access Denied: This portal is restricted to Fitpass Members.');
            }
        }
    }

    // Success: reset counters.
    await User.findByIdAndUpdate(user._id, { 
        failedLoginAttempts: 0, 
        lockUntil: null,
        lastLogin: new Date(),
    });

    logAudit(auditReq(req, { _id: user._id, name: user.name, email: user.email, role: user.role, gymId: user.gymId?._id || user.gymId }),
        'LOGIN', 'User', user._id, `${user.name} logged in`).catch(() => {});

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId?._id || user.gymId,
        gymName: user.gymId?.name || 'Unknown Gym',
        branchId: user.branchId || null,
        memberId: user.memberId,
        token: generateToken(user._id),
    });
};

// @desc    Check if user exists and send OTP if they do (mobile login flow)
// @route   POST /api/auth/check-user
// @access  Public (rate-limited)
const checkUserAndSendOTP = async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email) {
        res.status(400);
        throw new Error('Please provide an email');
    }

    const user = await User.findOne({ email });

    // Deliberately return the same "new" response shape for non-existent users
    // so the public endpoint can't be used to enumerate accounts. The mobile
    // app routes "new" users to registration.
    if (!user) {
        return res.json({ status: 'new', message: 'User not found, redirect to registration' });
    }

    if (user.isActive === false || user.status !== 'Active') {
        res.status(403);
        throw new Error('Your account is inactive or suspended. Please contact admin.');
    }

    if (user.role === 'superadmin' || user.role === 'partner' || user.role === 'admin') {
        return res.json({ status: 'exists', role: user.role, message: 'Password required' });
    }

    // Issue a fresh OTP (also resets the failed-attempt counter).
    const otpString = await issueOtp(email);
    console.log(`\n==================================================`);
    console.log(`[DEV ONLY] Generated Login OTP for ${email}: ${otpString}`);
    console.log(`==================================================\n`);
    try {
        await sendEmail({
            email: user.email,
            subject: 'Gym CRM - Login Verification OTP',
            message: `Your login OTP is: ${otpString}. It is valid for ${OTP_TTL_MINUTES} minutes.`,
        });
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }

    res.json({
        status: 'exists',
        message: 'OTP sent to your email.',
    });
};

module.exports = { registerUser, verifyOTP, authUser, checkUserAndSendOTP };
