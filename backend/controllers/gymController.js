const Gym = require('../models/Gym');
const { logAudit } = require('../utils/auditLogger');
const prisma = require('../config/prisma');

// @desc    Upload images for a gym
// @route   POST /api/gyms/images
// @access  Private (Admin)
const uploadGymImages = async (req, res) => {
    // Ensure files were uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
    }

    // req.user contains the authenticated user. We expect them to be a gym admin.
    const gymId = req.user.gymId;
    if (!gymId) {
        return res.status(403).json({ message: 'User does not belong to a gym' });
    }

    try {
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const existingImagesCount = gym.images ? gym.images.length : 0;
        const newImagesCount = req.files.length;

        if (existingImagesCount + newImagesCount > 5) {
            return res.status(400).json({ 
                message: `Cannot upload more than 5 images. You currently have ${existingImagesCount} images.` 
            });
        }

        const newImageUrls = req.files.map(file => file.path);
        
        // Add new images to the array
        const updatedImages = gym.images ? [...gym.images, ...newImageUrls] : newImageUrls;
        
        // Update gym images
        gym.images = updatedImages;
        await gym.save();

        await logAudit(req, 'GYM_IMAGES_UPLOADED', 'Gym', gymId, `Uploaded ${newImagesCount} new images for gym`);

        res.status(200).json({
            message: 'Images uploaded successfully',
            images: gym.images
        });
    } catch (error) {
        console.error('Error uploading gym images:', error);
        res.status(500).json({ message: 'Server error during image upload' });
    }
};

// @desc    Get all partnered gyms with their images
// @route   GET /api/gyms/partnered
// @access  Public
const getPartneredGyms = async (req, res) => {
    try {
        // Find all gyms. In this system, all non-system gyms can be considered partnered.
        const gyms = await Gym.find({ id: { $ne: 'SYSTEM' } }).select('id name address phone email status images');
        res.status(200).json(gyms);
    } catch (error) {
        console.error('Error fetching partnered gyms:', error);
        res.status(500).json({ message: 'Server error fetching partnered gyms' });
    }
};

// @desc    Update/reorder gym images
// @route   PUT /api/gyms/images
// @access  Private (Admin)
const updateGymImages = async (req, res) => {
    const { images } = req.body; // Expecting an array of strings
    
    if (!Array.isArray(images)) {
        return res.status(400).json({ message: 'Images must be an array of URLs' });
    }

    if (images.length > 5) {
        return res.status(400).json({ message: 'Cannot have more than 5 images.' });
    }

    const gymId = req.user.gymId;
    if (!gymId) {
        return res.status(403).json({ message: 'User does not belong to a gym' });
    }

    try {
        const updatedGym = await Gym.findByIdAndUpdate(
            gymId, 
            { $set: { images: images } }
        );

        await logAudit(req, 'GYM_IMAGES_UPDATED', 'Gym', gymId, 'Reordered or deleted gym images');

        res.status(200).json({
            message: 'Images updated successfully',
            images: updatedGym.images
        });
    } catch (error) {
        console.error('Error updating gym images:', error);
        res.status(500).json({ message: 'Server error updating images' });
    }
};

// @desc    Get gym settings
// @route   GET /api/gyms/settings
// @access  Private (Admin)
const getGymSettings = async (req, res) => {
    const gymId = req.user.gymId ? req.user.gymId.toString() : null;
    if (!gymId || gymId === 'undefined' || gymId === 'null') return res.status(403).json({ message: 'User does not belong to a gym' });

    try {
        let settings = await prisma.gymSettings.findUnique({ where: { gymId } });
        if (!settings) {
            const gymExists = await prisma.gym.findUnique({ where: { id: gymId } });
            if (!gymExists) {
                return res.status(404).json({ message: `Gym with ID ${gymId} not found in database. Cannot create settings.` });
            }
            settings = await prisma.gymSettings.create({ data: { gymId } });
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching gym settings:', error);
        res.status(500).json({ message: 'Server error fetching gym settings', error: error.message, stack: error.stack });
    }
};

// @desc    Update gym settings
// @route   PUT /api/gyms/settings
// @access  Private (Admin)
const updateGymSettings = async (req, res) => {
    const gymId = req.user.gymId ? req.user.gymId.toString() : null;
    if (!gymId || gymId === 'undefined' || gymId === 'null') return res.status(403).json({ message: 'User does not belong to a gym' });

    try {
        const gymExists = await prisma.gym.findUnique({ where: { id: gymId } });
        if (!gymExists) {
            return res.status(404).json({ message: `Gym with ID ${gymId} not found in database. Cannot update settings.` });
        }

        const updateData = { ...req.body };
        // Clean out fields we don't want to accidentally upsert like id, gymId, createdAt
        delete updateData.id;
        delete updateData.gymId;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const settings = await prisma.gymSettings.upsert({
            where: { gymId },
            update: updateData,
            create: { gymId, ...updateData }
        });
        
        await logAudit(req, 'GYM_SETTINGS_UPDATED', 'GymSettings', settings.id, 'Updated gym configuration settings');
        
        res.status(200).json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating gym settings:', error);
        res.status(500).json({ message: 'Server error updating gym settings' });
    }
};

module.exports = {
    uploadGymImages,
    getPartneredGyms,
    updateGymImages,
    getGymSettings,
    updateGymSettings
};
