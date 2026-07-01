const prisma = require('./config/prisma');
require('dotenv').config();

(async () => {
  try {
    const otps = await prisma.oTP.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Last 5 generated OTP records in database:');
    console.log(JSON.stringify(otps, null, 2));
  } catch (error) {
    console.error('Error fetching OTP:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
