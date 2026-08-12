const prisma = require('./prisma');
const logger = require('../lib/logger');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      // Run a simple raw query to test connection to Neon DB
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Neon DB (PostgreSQL) connected successfully via Prisma');
      return;
    } catch (error) {
      logger.error({ err: error, attempt: i, retries }, 'Neon DB connection attempt failed');
      if (i === retries) {
        logger.error('Neon DB connection error: max retries reached, exiting');
        process.exit(1);
      }
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
