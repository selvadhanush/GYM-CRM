const Gym = require('../models/Gym');
const { logAudit } = require('../utils/auditLogger');

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

module.exports = {
    uploadGymImages,
    getPartneredGyms,
    updateGymImages
};
