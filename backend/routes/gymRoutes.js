const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadGymImages, getPartneredGyms, updateGymImages, getGymSettings, updateGymSettings } = require('../controllers/gymController');

// Public route to get all partnered gyms
router.get('/partnered', getPartneredGyms);

// Protected route for gym admins to upload images (max 5 at once)
router.post('/images', protect, authorize('admin'), upload.array('images', 5), uploadGymImages);

// Protected route for gym admins to reorder or delete images
router.put('/images', protect, authorize('admin'), updateGymImages);

// Protected routes for gym settings
router.get('/settings', protect, authorize('admin', 'superadmin', 'h4_admin'), getGymSettings);
router.put('/settings', protect, authorize('admin', 'superadmin', 'h4_admin'), updateGymSettings);

module.exports = router;
