const prisma = require('./config/prisma');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash('123456', salt);
    
    await prisma.oTP.update({
      where: { email: 'testuser@gmail.com' },
      data: {
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      }
    });
    console.log('Successfully set OTP for testuser@gmail.com to: 123456');
  } catch (error) {
    console.error('Error setting OTP:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
