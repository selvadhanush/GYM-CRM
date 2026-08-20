const prisma = require('../config/prisma');

let cachedH4GymId = null;

/**
 * Dynamically resolves the H4 Gym record ID from the database.
 * Caches the result in memory for fast resolution, falling back to database query if needed.
 */
const getH4GymId = async () => {
    if (cachedH4GymId) {
        return cachedH4GymId;
    }
    try {
        const Gym = require('../models/Gym');
        const h4Gym = await Gym.findOne({ name: 'H4' });
        if (h4Gym) {
            cachedH4GymId = h4Gym.id || h4Gym._id;
            return cachedH4GymId;
        }
    } catch (err) {
        // Fallback gracefully if database isn't ready
    }
    return null;
};

/**
 * Checks whether a given gymId corresponds to the H4 Gym.
 */
const isH4Gym = async (gymId) => {
    if (!gymId) return false;
    const h4Id = await getH4GymId();
    return h4Id ? gymId === h4Id : false;
};

/**
 * Resets the cached H4 Gym ID (used during tests or seeding).
 */
const resetH4GymCache = () => {
    cachedH4GymId = null;
};

module.exports = { getH4GymId, isH4Gym, resetH4GymCache };
