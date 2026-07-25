const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const tenantFilter = require('../middleware/tenantFilter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const createEquipmentSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    brand: z.string().optional(),
    status: z.string().optional(),
    purchaseDate: z.string().optional(),
    branchId: z.string().optional().nullable()
});

const updateEquipmentSchema = createEquipmentSchema.partial();

const createMaintenanceLogSchema = z.object({
    equipmentId: z.string().optional().nullable(),
    equipmentName: z.string().optional(),
    issueDescription: z.string().min(1, 'Issue description is required'),
    status: z.string().optional(),
    cost: z.number().optional(),
    branchId: z.string().optional().nullable()
});

const {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getMaintenanceLogs,
    createMaintenanceLog
} = require('../controllers/equipmentController');

router.route('/maintenance/logs')
    .get(protect, tenantFilter, getMaintenanceLogs)
    .post(protect, validate({ body: createMaintenanceLogSchema }), createMaintenanceLog);

router.route('/')
    .get(protect, tenantFilter, getEquipments)
    .post(protect, validate({ body: createEquipmentSchema }), createEquipment);

router.route('/:id')
    .put(protect, validate({ body: updateEquipmentSchema }), updateEquipment)
    .delete(protect, deleteEquipment);

module.exports = router;
