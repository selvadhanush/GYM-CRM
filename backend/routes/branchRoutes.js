const express = require('express');
const router = express.Router();
const { getBranches, createBranch, updateBranch, deleteBranch, getBranchMembers } = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));
router.route('/').get(getBranches).post(createBranch);
router.route('/:id').put(updateBranch).delete(deleteBranch);
router.get('/:id/members', getBranchMembers);

module.exports = router;
