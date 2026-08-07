const prisma = require('./prisma');

const connectDB = async (retries = 8, delay = 4000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      // Run a simple raw query to test connection to Neon DB
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Neon DB (PostgreSQL) Connected successfully via Prisma!');
      return;
    } catch (error) {
      console.error(`❌ Neon DB Connection Attempt ${i}/${retries} Failed: ${error.message}`);
      if (i === retries) {
        console.warn('⚠️ Neon DB Connection Warning: Could not reach Neon DB right away. Server will remain online and automatically retry DB connection on incoming requests.');
        return;
      }
      console.log(`Retrying connection in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
