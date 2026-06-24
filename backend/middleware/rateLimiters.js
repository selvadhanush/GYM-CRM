/**
 * Centralized rate-limit configuration (express-rate-limit).
 *
 * Three limiters are exported:
 *   - globalLimiter:   applied to all /api routes (broad DoS protection)
 *   - authLimiter:     applied to /api/auth/login and /api/auth/check-user
 *                      (password/OTP-request brute-force protection)
 *   - otpVerifyLimiter: applied to /api/auth/verify-otp
 *                      (the critical OTP brute-force fix: 6-digit code is
 *                       trivially guessable without a tight limit)
 *
 * Standard headers (RateLimit-*) are enabled; on block the response is 429
 * with a `Retry-After`-style message.
 */
const rateLimit = require('express-rate-limit');

const trustProxyNote = 'Behind a reverse proxy set app.set("trust proxy", N).';

// Slightly relaxed in development so testing isn't painful.
const isProd = process.env.NODE_ENV === 'production';

const basicMessage = (retrySec) => ({
  success: false,
  message: `Too many requests. Please try again in ${Math.ceil(retrySec / 60)} minute(s).`,
});

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isProd ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip the health check so monitoring never gets throttled.
  skip: (req) => req.path === '/api/health',
  handler: (req, res) => {
    const retryMs = req.rateLimit?.resetTime
      ? new Date(req.rateLimit.resetTime).getTime() - Date.now()
      : 0;
    res.status(429).json(basicMessage(Math.max(1, retryMs / 1000)));
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 5 : 50, // 5 attempts / 15 min in production
  standardHeaders: true,
  legacyHeaders: true, // emit Retry-After for clients that read it
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later or request a new OTP.',
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isProd ? 5 : 50, // 5 verification attempts / 10 min in production
  standardHeaders: true,
  legacyHeaders: true,
  message: {
    success: false,
    message: 'Too many OTP attempts. Please request a new code and try again later.',
  },
});

module.exports = { globalLimiter, authLimiter, otpVerifyLimiter };
