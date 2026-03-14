const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :id from parent
const { freezeMember, unfreezeMember, getFreezeHistory } = require('../controllers/freezeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/freeze', protect, authorize('admin', 'receptionist'), freezeMember);
router.post('/unfreeze', protect, authorize('admin', 'receptionist'), unfreezeMember);
router.get('/freeze-history', protect, authorize('admin', 'receptionist'), getFreezeHistory);

module.exports = router;
