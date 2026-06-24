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
    .get(protect, authorize('admin', 'receptionist', 'superadmin'), getMembers)
    .post(protect, authorize('admin', 'receptionist'), createMember);

router.get('/export/csv', protect, authorize('admin'), exportMembersCSV);
router.get('/expiring-soon', protect, authorize('admin', 'receptionist'), getExpiringSoonMembers);

router.get('/status', protect, getMembers); // Optional: redundant with query params but good for clarity

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist'), getMemberById)
    .put(protect, authorize('admin', 'receptionist'), updateMember)
    .delete(protect, authorize('admin'), deleteMember);

module.exports = router;
