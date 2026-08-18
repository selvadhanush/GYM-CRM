/**
 * Centralized tunable constants for the FitPrime session + security features.
 * Keeping these in one place makes policy changes (e.g. cooldown length,
 * lockout thresholds) a single-file edit.
 */
module.exports = {
  // --- OTP security ---
  OTP_TTL_MINUTES: 10,
  MAX_OTP_ATTEMPTS: 5, // after this many failed verifies, the OTP is invalidated

  // --- Web login lockout (email+password) ---
  MAX_LOGIN_ATTEMPTS: 5, // failed attempts before the account is locked
  LOGIN_LOCK_MINUTES: 15, // lock duration after MAX_LOGIN_ATTEMPTS failures

  // --- FitPrime sessions ---
  // Cooldown (global across all partner gyms) measured from SESSION END.
  COOLDOWN_MS: 3 * 60 * 60 * 1000, // 3 hours
  DEFAULT_SESSION_DURATION_MINUTES: 120, // fallback if a gym has no setting (2h)

  // Placeholder/default secrets that must NEVER boot in production.
  PLACEHOLDER_SECRETS: [
    'your_super_secret_jwt_key_here',
    'change_me',
    'secret',
  ],

  // --- H4 gym division ---
  // Gym IDs that belong to the "H4" division/brand, as opposed to the general
  // FitPass/FitPrime partner gyms. Kept as a single source of truth so the
  // list only needs updating in one place if the H4 gym(s) ever change.
  H4_GYM_IDS: [
    '05a08fdf-7427-48a5-8b25-e18d5a5668cd',
    '327d37e7-f978-43a9-82ef-e6c4a4dc3c5d',
  ],
};
