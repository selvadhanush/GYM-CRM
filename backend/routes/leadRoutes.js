const express = require('express');
const router = express.Router();
const { getLeads, createLead, updateLead, deleteLead, getLeadSummary } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Summary — CRM admins only (partners have no pipeline stats)
router.get('/summary', protect, authorize('admin', 'receptionist', 'h4_admin'), getLeadSummary);

// GET leads — admins + partner (read-only, scoped by gymId in controller)
// POST leads — admins only (partners cannot create leads)
router.route('/')
  .get(protect, authorize('admin', 'receptionist', 'h4_admin', 'partner'), getLeads)
  .post(protect, authorize('admin', 'receptionist', 'h4_admin'), createLead);

// PUT / DELETE — admins only
router.route('/:id')
  .put(protect, authorize('admin', 'receptionist', 'h4_admin'), updateLead)
  .delete(protect, authorize('admin', 'receptionist', 'h4_admin'), deleteLead);

module.exports = router;
