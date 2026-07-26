const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Equipment = require('../models/Equipment');
const MaintenanceLog = require('../models/MaintenanceLog');

// @desc    Get all equipments
// @route   GET /api/equipments
// @access  Private
const getEquipments = catchAsync(async (req, res, next) => {
    try {
        const queryFilter = { ...req.tenantFilter };
        const equipments = await Equipment.find(queryFilter);
        res.status(200).json(equipments);
    } catch (error) { next(error); }
});

// @desc    Create new equipment
// @route   POST /api/equipments
// @access  Private
const createEquipment = catchAsync(async (req, res, next) => {
    try {
        const { name, brand, status, purchaseDate, branchId } = req.body;
        const gymId = req.user?.gymId || req.body.gymId || 'public';
        const finalBranchId = branchId || req.user?.branchId || null;

        const equipment = await Equipment.create({
            name,
            brand: brand || '',
            status: status || 'Functional',
            purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            gymId,
            branchId: finalBranchId
        });

        res.status(201).json(equipment);
    } catch (error) { next(error); }
});

// @desc    Update equipment
// @route   PUT /api/equipments/:id
// @access  Private
const updateEquipment = catchAsync(async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        res.status(200).json(equipment);
    } catch (error) { next(error); }
});

// @desc    Delete equipment
// @route   DELETE /api/equipments/:id
// @access  Private
const deleteEquipment = catchAsync(async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndDelete(req.params.id);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) { next(error); }
});

// @desc    Get equipment maintenance logs
// @route   GET /api/equipments/maintenance/logs
// @access  Private
const getMaintenanceLogs = catchAsync(async (req, res, next) => {
    try {
        const queryFilter = { ...req.tenantFilter };
        const logs = await MaintenanceLog.find(queryFilter);
        res.status(200).json(logs);
    } catch (error) { next(error); }
});

// @desc    Create maintenance log
// @route   POST /api/equipments/maintenance/logs
// @access  Private
const createMaintenanceLog = catchAsync(async (req, res, next) => {
    try {
        const { equipmentId, equipmentName, issueDescription, status, cost, branchId } = req.body;
        const gymId = req.user?.gymId || 'public';
        const finalBranchId = branchId || req.user?.branchId || null;

        const log = await MaintenanceLog.create({
            equipmentId: equipmentId || null,
            equipmentName: equipmentName || '',
            issueDescription: issueDescription || '',
            status: status || 'In Progress',
            cost: Number(cost) || 0,
            loggedDate: new Date(),
            gymId,
            branchId: finalBranchId
        });

        res.status(201).json(log);
    } catch (error) { next(error); }
});

module.exports = {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getMaintenanceLogs,
    createMaintenanceLog
};
