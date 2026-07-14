const prisma = require('./prisma');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      // Run a simple raw query to test connection to Neon DB
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Neon DB (PostgreSQL) Connected successfully via Prisma!');
      return;
    } catch (error) {
      console.error(`❌ Neon DB Connection Attempt ${i} Failed: ${error.message}`);
      if (i === retries) {
        console.error('❌ Neon DB Connection Error: Max retries reached. Exiting...');
        process.exit(1);
      }
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
