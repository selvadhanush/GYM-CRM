const express = require('express');
const router = express.Router();
const {
    createEquipment,
    getEquipments,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    createMaintenanceLog,
    getMaintenanceLogs,
    deleteMaintenanceLog
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getEquipments)
    .post(protect, authorize('admin'), createEquipment);

router.route('/maintenance')
    .post(protect, authorize('admin'), createMaintenanceLog);

router.route('/maintenance/logs')
    .get(protect, getMaintenanceLogs);

router.route('/maintenance/:id')
    .delete(protect, authorize('admin'), deleteMaintenanceLog);

router.route('/:id')
    .get(protect, getEquipmentById)
    .put(protect, authorize('admin'), updateEquipment)
    .delete(protect, authorize('admin'), deleteEquipment);

module.exports = router;
