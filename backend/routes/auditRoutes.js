const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditSummary } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('superadmin'));
router.get('/summary', getAuditSummary);
router.get('/', getAuditLogs);

module.exports = router;
