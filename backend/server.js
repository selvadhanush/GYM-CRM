const express = require('express');
const dns = require('dns');

// Fix for ECONNREFUSED issues on networks that block SRV records
// Use Google Public DNS for all internal resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const startCronJobs = require('./utils/cronJobs');

dotenv.config();

connectDB();
startCronJobs();

const app = express();

// Middleware
console.log('CORS Allowed Origin:', process.env.CLIENT_URL || 'http://localhost:5173');
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or any localhost origin for dev convenience
        if (!origin || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
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

// Test routes (Dev only)
app.use('/api/test', require('./routes/testRoutes'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
