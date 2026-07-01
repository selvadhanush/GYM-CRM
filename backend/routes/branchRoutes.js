const express = require('express');
const router = express.Router();
const { getBranches, createBranch, updateBranch, deleteBranch, getBranchMembers } = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/')
    .get(authorize('admin', 'receptionist', 'trainer', 'superadmin'), getBranches)
    .post(authorize('admin'), createBranch);

router.route('/:id')
    .put(authorize('admin'), updateBranch)
    .delete(authorize('admin'), deleteBranch);

router.get('/:id/members', authorize('admin', 'receptionist', 'trainer', 'superadmin'), getBranchMembers);

module.exports = router;
