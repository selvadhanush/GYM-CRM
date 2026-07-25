const Equipment = require('../models/Equipment');
const MaintenanceLog = require('../models/MaintenanceLog');

// @desc    Get all equipments
// @route   GET /api/equipments
// @access  Private
const getEquipments = async (req, res) => {
    try {
        const queryFilter = {};
        if (req.user && req.user.gymId && req.user.gymId !== 'SYSTEM') {
            queryFilter.gymId = req.user.gymId;
        }
        if (req.user && req.user.branchId) {
            queryFilter.branchId = req.user.branchId;
        }
        const equipments = await Equipment.find(queryFilter);
        res.status(200).json(equipments);
    } catch (error) {
        console.error('Error fetching equipments:', error);
        res.status(500).json({ message: 'Server error fetching equipments', error: error.message });
    }
};

// @desc    Create new equipment
// @route   POST /api/equipments
// @access  Private
const createEquipment = async (req, res) => {
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
    } catch (error) {
        console.error('Error creating equipment:', error);
        res.status(500).json({ message: 'Server error creating equipment', error: error.message });
    }
};

// @desc    Update equipment
// @route   PUT /api/equipments/:id
// @access  Private
const updateEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        res.status(200).json(equipment);
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ message: 'Server error updating equipment', error: error.message });
    }
};

// @desc    Delete equipment
// @route   DELETE /api/equipments/:id
// @access  Private
const deleteEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndDelete(req.params.id);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ message: 'Server error deleting equipment', error: error.message });
    }
};

// @desc    Get equipment maintenance logs
// @route   GET /api/equipments/maintenance/logs
// @access  Private
const getMaintenanceLogs = async (req, res) => {
    try {
        const queryFilter = {};
        if (req.user && req.user.gymId && req.user.gymId !== 'SYSTEM') {
            queryFilter.gymId = req.user.gymId;
        }
        if (req.user && req.user.branchId) {
            queryFilter.branchId = req.user.branchId;
        }
        const logs = await MaintenanceLog.find(queryFilter);
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching maintenance logs:', error);
        res.status(500).json({ message: 'Server error fetching maintenance logs', error: error.message });
    }
};

// @desc    Create maintenance log
// @route   POST /api/equipments/maintenance/logs
// @access  Private
const createMaintenanceLog = async (req, res) => {
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
    } catch (error) {
        console.error('Error creating maintenance log:', error);
        res.status(500).json({ message: 'Server error creating maintenance log', error: error.message });
    }
};

module.exports = {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getMaintenanceLogs,
    createMaintenanceLog
};
