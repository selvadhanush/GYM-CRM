const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const url = process.env.DATABASE_URL.replace('&channel_binding=require', '');
console.log('Testing URL:', url);

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function test() {
  try {
    const res = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ CONNECTED TO NEON DB SUCCESSFULLY!', res);
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
