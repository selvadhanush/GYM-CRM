const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getMaintenanceLogs,
    createMaintenanceLog
} = require('../controllers/equipmentController');

router.route('/maintenance/logs')
    .get(protect, getMaintenanceLogs)
    .post(protect, createMaintenanceLog);

router.route('/')
    .get(protect, getEquipments)
    .post(protect, createEquipment);

router.route('/:id')
    .put(protect, updateEquipment)
    .delete(protect, deleteEquipment);

module.exports = router;
