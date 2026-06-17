const prisma = require('./prisma');

const connectDB = async () => {
  try {
    // Run a simple raw query to test connection to Neon DB
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Neon DB (PostgreSQL) Connected successfully via Prisma!');
  } catch (error) {
    console.error(`❌ Neon DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
