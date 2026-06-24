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
    getFitPrimePlans
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Super admin routes
router.route('/gyms')
    .post(protect, authorize('superadmin'), createPartnerGym)
    .get(protect, authorize('superadmin'), getPartnerGyms);

// Update or delete gym (incl. default session duration for FitPrime check-ins).
router.route('/gyms/:id')
    .put(protect, authorize('superadmin'), updatePartnerGym)
    .delete(protect, authorize('superadmin'), deletePartnerGym);

router.route('/plans')
    .post(protect, authorize('superadmin'), createFitPrimePlan)
    .get(protect, authorize('superadmin'), getFitPrimePlans);

router.route('/plans/:id')
    .put(protect, authorize('superadmin'), updateFitPrimePlan)
    .delete(protect, authorize('superadmin'), deleteFitPrimePlan);

module.exports = router;
