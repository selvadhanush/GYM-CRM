const { z } = require('zod');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('\n[FATAL] Invalid environment configuration:');
    parsed.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('\nPlease fix the environment variables and restart the server.\n');
    process.exit(1);
}

module.exports = parsed.data;
