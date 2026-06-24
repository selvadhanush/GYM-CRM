const express = require('express');
const dns = require('dns');
const helmet = require('helmet');

// Fix for ECONNREFUSED issues on networks that block SRV records.
// Uses Google Public DNS for internal resolution.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { PLACEHOLDER_SECRETS } = require('./config/constants');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { globalLimiter } = require('./middleware/rateLimiters');
const startCronJobs = require('./utils/cronJobs');

dotenv.config();

// --- Boot-time security guard (B1): never start with a missing/placeholder JWT secret ---
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || PLACEHOLDER_SECRETS.includes(jwtSecret)) {
    console.error('\n[FATAL] JWT_SECRET is missing or still set to a placeholder value.');
    console.error('Generate one with:  node scripts/generateSecret.js');
    console.error('Then put it in your .env as JWT_SECRET=<value>\n');
    process.exit(1);
}

connectDB();
startCronJobs();

const app = express();

// --- Security headers (B4) ---
app.use(helmet());

// --- Global rate limiter (B2) ---
app.use('/api', globalLimiter);

// --- CORS (B4: tightened for production) ---
// In production only explicit origins are trusted. In dev we also allow
// localhost and local network IPs (for Expo / physical device testing).
const isProd = process.env.NODE_ENV === 'production';
const prodOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use(cors({
    credentials: true,
    origin(origin, callback) {
        // Allow non-browser clients (mobile apps, curl) which send no Origin.
        if (!origin) return callback(null, true);
        if (!isProd) {
            // Dev: localhost + RFC1918 LAN (Expo, physical devices).
            if (
                origin.startsWith('http://localhost:') ||
                origin.startsWith('http://192.168.') ||
                origin.startsWith('http://10.') ||
                origin.startsWith('http://172.')
            ) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
        // Prod: explicit allowlist only.
        if (prodOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
}));

app.use(express.json({ limit: '1mb' })); // bound body size -> mild DoS hardening
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, status: 'Server running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/members/:id', require('./routes/freezeRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/member-portal', require('./routes/memberPortalRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/gyms', require('./routes/gymRoutes'));

// FitPrime session admin-adjust (member-facing session routes live under
// member-portal above). Mounted standalone with its own protect/authorize.
app.use('/api/sessions', require('./routes/sessionRoutes'));

// Test routes (Dev only)
app.use('/api/test', require('./routes/testRoutes'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
