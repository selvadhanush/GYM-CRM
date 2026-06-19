const express = require('express');
const router = express.Router();
const {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage
} = require('../controllers/ptPackageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getPackages)
    .post(protect, authorize('admin'), createPackage);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getPackageById)
    .put(protect, authorize('admin'), updatePackage)
    .delete(protect, authorize('admin'), deletePackage);

module.exports = router;
