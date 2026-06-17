const express = require('express');
const router = express.Router();
const {
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin'), getStaff)
    .post(protect, authorize('admin'), createStaff);

router.route('/:id')
    .put(protect, authorize('admin'), updateStaff)
    .delete(protect, authorize('admin'), deleteStaff);

module.exports = router;
