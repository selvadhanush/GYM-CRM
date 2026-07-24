const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 30000, // wait up to 30s for connection (helps with Neon cold starts)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
