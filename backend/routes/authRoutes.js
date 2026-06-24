const express = require('express');
const { z } = require('zod');
const { registerUser, authUser, verifyOTP, checkUserAndSendOTP } = require('../controllers/authController');
const { authLimiter, otpVerifyLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');

const router = express.Router();

// --- Zod Validation Schemas ---
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const checkUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.union([z.string(), z.number()])
    .transform(val => String(val).trim())
    .refine(val => /^\d{6}$/.test(val), 'OTP must be a 6-digit number'),
});

// Tight per-IP rate limits on the auth surface (brute-force protection):
//   - login + check-user + register: 5 / 15 min (authLimiter)
//   - verify-otp: 5 / 10 min (otpVerifyLimiter) -- the critical OTP brute-force fix
router.post('/register', authLimiter, validate({ body: registerSchema }), registerUser);
router.post('/login', authLimiter, validate({ body: loginSchema }), authUser);
router.post('/check-user', authLimiter, validate({ body: checkUserSchema }), checkUserAndSendOTP);
router.post('/verify-otp', otpVerifyLimiter, validate({ body: verifyOtpSchema }), verifyOTP);

module.exports = router;

