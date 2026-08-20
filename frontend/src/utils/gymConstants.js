// Gym IDs that belong to the "H4" division/brand, as opposed to the general
// FitPass/FitPrime partner gyms. Kept as a single source of truth so the list
// only needs updating in one place if the H4 gym(s) ever change.
// Mirrors backend/config/constants.js H4_GYM_IDS.
export const H4_GYM_IDS = [
    '05a08fdf-7427-48a5-8b25-e18d5a5668cd',
    '327d37e7-f978-43a9-82ef-e6c4a4dc3c5d',
];

/**
 * Returns true when the given gym name and/or gym id identify an H4 gym.
 * @param {string|null|undefined} gymName
 * @param {string|null|undefined} gymId
 */
export function isH4Gym(gymName, gymId) {
    const normalizedGym = (gymName || '').toUpperCase();
    return normalizedGym === 'H4' || H4_GYM_IDS.includes(gymId);
}
