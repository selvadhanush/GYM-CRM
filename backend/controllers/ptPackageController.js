const PtPackage = require('../models/PtPackage');

// @desc    Create a Personal Training package
// @route   POST /api/pt-packages
// @access  Private/Admin
const createPackage = async (req, res) => {
    try {
        const { name, description, price, sessionCount, duration } = req.body;

        if (!name || price === undefined || sessionCount === undefined) {
            return res.status(400).json({ success: false, message: 'Name, price, and session count are required' });
        }

        const packageObj = await PtPackage.create({
            name,
            description: description || null,
            price: Number(price),
            sessionCount: Number(sessionCount),
            duration: duration ? Number(duration) : null,
            gymId: req.user.gymId
        });

        res.status(201).json(packageObj);
    } catch (error) {
        console.error("CREATE PT PACKAGE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all Personal Training packages
// @route   GET /api/pt-packages
// @access  Private/Admin/Trainer/Member
const getPackages = async (req, res) => {
    try {
        const packages = await PtPackage.find({ gymId: req.user.gymId }).lean();
        res.json(packages);
    } catch (error) {
        console.error("GET PT PACKAGES ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single Personal Training package
// @route   GET /api/pt-packages/:id
// @access  Private/Admin/Trainer/Member
const getPackageById = async (req, res) => {
    try {
        const packageObj = await PtPackage.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (packageObj) {
            res.json(packageObj);
        } else {
            res.status(404).json({ success: false, message: 'Package not found' });
        }
    } catch (error) {
        console.error("GET PT PACKAGE BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Personal Training package
// @route   PUT /api/pt-packages/:id
// @access  Private/Admin
const updatePackage = async (req, res) => {
    try {
        const { name, description, price, sessionCount, duration } = req.body;

        const packageObj = await PtPackage.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (packageObj) {
            packageObj.name = name || packageObj.name;
            if (description !== undefined) packageObj.description = description;
            if (price !== undefined) packageObj.price = Number(price);
            if (sessionCount !== undefined) packageObj.sessionCount = Number(sessionCount);
            if (duration !== undefined) packageObj.duration = duration ? Number(duration) : null;

            const updatedPackage = await packageObj.save();
            res.json(updatedPackage);
        } else {
            res.status(404).json({ success: false, message: 'Package not found' });
        }
    } catch (error) {
        console.error("UPDATE PT PACKAGE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Personal Training package
// @route   DELETE /api/pt-packages/:id
// @access  Private/Admin
const deletePackage = async (req, res) => {
    try {
        const packageObj = await PtPackage.findOne({ _id: req.params.id, gymId: req.user.gymId });

        if (packageObj) {
            await packageObj.deleteOne();
            res.json({ message: 'Package removed' });
        } else {
            res.status(404).json({ success: false, message: 'Package not found' });
        }
    } catch (error) {
        console.error("DELETE PT PACKAGE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage
};
