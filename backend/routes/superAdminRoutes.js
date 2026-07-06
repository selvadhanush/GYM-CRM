const express = require('express');
const router = express.Router();
const {
    createPartnerGym,
    updatePartnerGym,
    getPartnerGyms,
    deletePartnerGym,
    createFitPrimePlan,
    updateFitPrimePlan,
    deleteFitPrimePlan,
    getFitPrimePlans,
    getOrCreateH4Gym,
    getDedicatedAdmins,
    createDedicatedAdmin,
    updateDedicatedAdmin,
    deleteDedicatedAdmin
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Super admin routes
router.route('/gyms')
    .post(protect, authorize('superadmin', 'fitpass_admin'), createPartnerGym)
    .get(protect, authorize('superadmin', 'fitpass_admin'), getPartnerGyms);

router.route('/h4-gym')
    .get(protect, authorize('superadmin', 'h4_admin'), getOrCreateH4Gym);

// Update or delete gym (incl. default session duration for FitPrime check-ins).
router.route('/gyms/:id')
    .put(protect, authorize('superadmin', 'fitpass_admin'), updatePartnerGym)
    .delete(protect, authorize('superadmin', 'fitpass_admin'), deletePartnerGym);

router.route('/plans')
    .post(protect, authorize('superadmin', 'fitpass_admin'), createFitPrimePlan)
    .get(protect, authorize('superadmin', 'fitpass_admin'), getFitPrimePlans);

router.route('/plans/:id')
    .put(protect, authorize('superadmin', 'fitpass_admin'), updateFitPrimePlan)
    .delete(protect, authorize('superadmin', 'fitpass_admin'), deleteFitPrimePlan);

// Dedicated Admin CRUD routes
router.route('/admins')
    .get(protect, authorize('superadmin'), getDedicatedAdmins)
    .post(protect, authorize('superadmin'), createDedicatedAdmin);

router.route('/admins/:id')
    .put(protect, authorize('superadmin'), updateDedicatedAdmin)
    .delete(protect, authorize('superadmin'), deleteDedicatedAdmin);

module.exports = router;
