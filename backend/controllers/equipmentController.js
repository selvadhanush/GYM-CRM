const Equipment = require('../models/Equipment');
const MaintenanceLog = require('../models/MaintenanceLog');

// @desc    Create new gym equipment
// @route   POST /api/equipments
// @access  Private (Admin)
const createEquipment = async (req, res) => {
    try {
        const { name, type, purchaseDate, warrantyExpiry, serviceSchedule, status } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Equipment name is required' });
        }

        const equipment = await Equipment.create({
            name,
            type: type || null,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
            serviceSchedule: serviceSchedule || null,
            status: status || 'Active',
            gymId: req.user.gymId
        });

        res.status(201).json(equipment);
    } catch (error) {
        console.error("CREATE EQUIPMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all gym equipments
// @route   GET /api/equipments
// @access  Private (Admin/Receptionist/Trainer)
const getEquipments = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId };

        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.type) {
            query.type = req.query.type;
        }

        const equipments = await Equipment.find(query).sort({ name: 1 }).lean();
        res.json(equipments);
    } catch (error) {
        console.error("GET EQUIPMENTS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single equipment details
// @route   GET /api/equipments/:id
// @access  Private (Admin/Receptionist/Trainer)
const getEquipmentById = async (req, res) => {
    try {
        const item = await Equipment.findOne({ _id: req.params.id, gymId: req.user.gymId });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        res.json(item);
    } catch (error) {
        console.error("GET EQUIPMENT BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update equipment info
// @route   PUT /api/equipments/:id
// @access  Private (Admin)
const updateEquipment = async (req, res) => {
    try {
        const { name, type, purchaseDate, warrantyExpiry, serviceSchedule, status } = req.body;
        const item = await Equipment.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        if (name !== undefined) item.name = name;
        if (type !== undefined) item.type = type;
        if (purchaseDate !== undefined) item.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
        if (warrantyExpiry !== undefined) item.warrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;
        if (serviceSchedule !== undefined) item.serviceSchedule = serviceSchedule;
        if (status !== undefined) item.status = status;

        const updated = await item.save();
        res.json(updated);
    } catch (error) {
        console.error("UPDATE EQUIPMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete equipment
// @route   DELETE /api/equipments/:id
// @access  Private (Admin)
const deleteEquipment = async (req, res) => {
    try {
        const item = await Equipment.findOne({ _id: req.params.id, gymId: req.user.gymId });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // Delete associated maintenance logs
        const logs = await MaintenanceLog.find({ equipmentId: req.params.id, gymId: req.user.gymId });
        for (const log of logs) {
            await log.deleteOne();
        }

        await item.deleteOne();
        res.json({ message: 'Equipment and maintenance logs removed' });
    } catch (error) {
        console.error("DELETE EQUIPMENT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Log a maintenance event
// @route   POST /api/equipments/maintenance
// @access  Private (Admin)
const createMaintenanceLog = async (req, res) => {
    try {
        const { equipmentId, serviceDate, cost, description, technicianName, nextServiceDate, updateEquipmentStatus } = req.body;

        if (!equipmentId) {
            return res.status(400).json({ success: false, message: 'Equipment ID is required' });
        }

        // Verify equipment exists
        const item = await Equipment.findOne({ _id: equipmentId, gymId: req.user.gymId });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        const log = await MaintenanceLog.create({
            equipmentId,
            serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
            cost: cost !== undefined ? Number(cost) : 0,
            description: description || null,
            technicianName: technicianName || null,
            nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
            gymId: req.user.gymId
        });

        // Optionally update the status of the equipment (e.g. if serviced, set back to Active)
        if (updateEquipmentStatus) {
            item.status = updateEquipmentStatus;
            await item.save();
        }

        res.status(201).json(log);
    } catch (error) {
        console.error("CREATE MAINTENANCE LOG ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all maintenance logs or filter by equipment
// @route   GET /api/equipments/maintenance/logs
// @access  Private (Admin/Receptionist/Trainer)
const getMaintenanceLogs = async (req, res) => {
    try {
        let query = { gymId: req.user.gymId };

        if (req.query.equipmentId) {
            query.equipmentId = req.query.equipmentId;
        }

        const logs = await MaintenanceLog.find(query).sort({ serviceDate: -1 }).lean();

        // Populate Equipment name
        const formatted = [];
        for (const log of logs) {
            const eq = await Equipment.findOne({ _id: log.equipmentId });
            formatted.push({
                ...log,
                equipmentName: eq ? eq.name : 'Unknown Equipment'
            });
        }

        res.json(formatted);
    } catch (error) {
        console.error("GET MAINTENANCE LOGS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a maintenance log
// @route   DELETE /api/equipments/maintenance/:id
// @access  Private (Admin)
const deleteMaintenanceLog = async (req, res) => {
    try {
        const log = await MaintenanceLog.findOne({ _id: req.params.id, gymId: req.user.gymId });
        if (!log) {
            return res.status(404).json({ success: false, message: 'Log not found' });
        }
        await log.deleteOne();
        res.json({ message: 'Maintenance log removed' });
    } catch (error) {
        console.error("DELETE MAINTENANCE LOG ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createEquipment,
    getEquipments,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    createMaintenanceLog,
    getMaintenanceLogs,
    deleteMaintenanceLog
};
