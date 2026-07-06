const express = require('express');
const router = express.Router();
const { getBranches, createBranch, updateBranch, deleteBranch, getBranchMembers } = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/')
    .get(authorize('admin', 'receptionist', 'trainer', 'superadmin', 'fitpass_admin', 'h4_admin'), getBranches)
    .post(authorize('admin', 'fitpass_admin', 'h4_admin'), createBranch);

router.route('/:id')
    .put(authorize('admin', 'fitpass_admin', 'h4_admin'), updateBranch)
    .delete(authorize('admin', 'fitpass_admin', 'h4_admin'), deleteBranch);

router.get('/:id/members', authorize('admin', 'receptionist', 'trainer', 'superadmin', 'fitpass_admin', 'h4_admin'), getBranchMembers);

module.exports = router;
