const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, createAnnouncement } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/:id', markAsRead);
router.post('/announcement', authorize('admin'), createAnnouncement);

module.exports = router;
