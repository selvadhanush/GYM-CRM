const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function seedPartnerUsers() {
  console.log('\n🔐 Seeding Admin Login Accounts for FitPass Partner Gyms...\n');
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Get all gyms from DB
  const gyms = await prisma.gym.findMany();
  console.log(`Found ${gyms.length} gyms in DB.`);

  for (const gym of gyms) {
    if (!gym.email) {
      console.log(`⚠️ Gym "${gym.name}" has no email listed. Skipping...`);
      continue;
    }

    const email = gym.email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: passwordHash,
          gymId: gym.id,
          role: 'admin',
          isActive: true,
          status: 'Active',
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      });
      console.log(`🔄 Updated login account for "${gym.name}": Email=${email} | Password=123456`);
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: `${gym.name} Admin`,
          email,
          password: passwordHash,
          gymId: gym.id,
          role: 'admin',
          isActive: true,
          status: 'Active',
          isVerified: true,
        },
      });
      console.log(`✅ Created login account for "${gym.name}": Email=${email} | Password=123456`);
    }
  }

  // Also check if Iron Pulse Fitness user exists
  const ironPulseGym = await prisma.gym.findFirst({ where: { name: { contains: 'Iron Pulse', mode: 'insensitive' } } });
  if (ironPulseGym) {
    const email = 'admin@ironpulsefitness.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: passwordHash, gymId: ironPulseGym.id, role: 'admin', isActive: true, status: 'Active', failedLoginAttempts: 0, lockUntil: null },
      });
      console.log(`🔄 Updated login for Iron Pulse Fitness: ${email} | Password=123456`);
    } else {
      await prisma.user.create({
        data: { name: 'Iron Pulse Admin', email, password: passwordHash, gymId: ironPulseGym.id, role: 'admin', isActive: true, status: 'Active', isVerified: true },
      });
      console.log(`✅ Created login for Iron Pulse Fitness: ${email} | Password=123456`);
    }
  }

  console.log('\n✨ Partner gym admin login accounts successfully seeded & updated!\n');
  await prisma.$disconnect();
}

seedPartnerUsers().catch((err) => {
  console.error('❌ Failed to seed partner users:', err);
  prisma.$disconnect();
  process.exit(1);
});
