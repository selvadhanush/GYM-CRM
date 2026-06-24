/**
 * One-off helper to generate a strong random JWT secret.
 *
 * Usage:
 *   node scripts/generateSecret.js
 *
 * Copy the printed value into your .env file as:
 *   JWT_SECRET=<printed-value>
 *
 * Never commit the real secret to version control.
 */
const crypto = require('crypto');

// 64 bytes -> 512 bits, encoded as hex (128 chars). Strong enough for HS512.
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n========================================================');
console.log(' Generated JWT secret (512-bit):');
console.log('========================================================\n');
console.log(secret);
console.log('\nAdd this to your .env file:');
console.log(`JWT_SECRET=${secret}\n');
