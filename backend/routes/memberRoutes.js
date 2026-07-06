const express = require('express');
const router = express.Router();
const {
    createMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember,
    getExpiringSoonMembers,
    exportMembersCSV,
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'superadmin', 'fitpass_admin', 'h4_admin'), getMembers)
    .post(protect, authorize('admin', 'receptionist', 'h4_admin'), createMember);

router.get('/export/csv', protect, authorize('admin', 'h4_admin'), exportMembersCSV);
router.get('/expiring-soon', protect, authorize('admin', 'receptionist', 'h4_admin'), getExpiringSoonMembers);

router.get('/status', protect, getMembers); // Optional: redundant with query params but good for clarity

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'fitpass_admin', 'h4_admin'), getMemberById)
    .put(protect, authorize('admin', 'receptionist', 'fitpass_admin', 'h4_admin'), updateMember)
    .delete(protect, authorize('admin', 'h4_admin'), deleteMember);

module.exports = router;
