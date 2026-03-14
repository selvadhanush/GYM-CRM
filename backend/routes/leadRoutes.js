const express = require('express');
const router = express.Router();
const { getLeads, createLead, updateLead, deleteLead, getLeadSummary } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin', 'receptionist'));

router.get('/summary', getLeadSummary);
router.route('/').get(getLeads).post(createLead);
router.route('/:id').put(updateLead).delete(deleteLead);

module.exports = router;
