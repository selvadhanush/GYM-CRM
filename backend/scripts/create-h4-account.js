/**
 * Script: Create/Upsert H4 User & Member Account
 * Target: sanjaipandi66@gmail.com
 * Run: node backend/scripts/create-h4-account.js
 */
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function createH4Account() {
  const email = 'sanjaipandi66@gmail.com'.trim().toLowerCase();
  console.log(`\n🏋️ Creating/Verifying H4 Account for: ${email}...\n`);

  // 1. Find or create H4 Gym
  let h4Gym = await prisma.gym.findFirst({
    where: { name: { contains: 'H4', mode: 'insensitive' } },
  });

  if (!h4Gym) {
    h4Gym = await prisma.gym.create({
      data: {
        name: 'H4 Fitness Gym',
        address: 'Coimbatore, Tamil Nadu',
        phone: '9876543210',
        email: 'info@h4fitness.com',
        status: 'Active',
      },
    });
    console.log(`  ✅ Created H4 Gym record (ID: ${h4Gym.id})`);
  } else {
    console.log(`  ℹ️ Found existing H4 Gym (ID: ${h4Gym.id}, Name: ${h4Gym.name})`);
  }

  // 2. Find or create H4 Member record
  let member = await prisma.member.findFirst({
    where: { email },
  });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  let plan = await prisma.plan.findFirst({ where: { gymId: 'SYSTEM' } });

  if (!member) {
    member = await prisma.member.create({
      data: {
        name: 'Sanjai Pandi',
        email: email,
        phone: '9876543210',
        gymId: h4Gym.id,
        planId: plan ? plan.id : 'default_plan',
        joinDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'Active',
        sessionsTotal: 30,
        sessionsRemaining: 30,
        paidAmount: 999,
        planPrice: 999,
      },
    });
    console.log(`  ✅ Created H4 Member profile (ID: ${member.id})`);
  } else {
    member = await prisma.member.update({
      where: { id: member.id },
      data: {
        gymId: h4Gym.id,
        status: 'Active',
        sessionsTotal: Math.max(member.sessionsTotal || 0, 30),
        sessionsRemaining: Math.max(member.sessionsRemaining || 0, 30),
      },
    });
    console.log(`  ✅ Updated H4 Member profile (ID: ${member.id})`);
  }

  // 3. Find or create User account in Prisma PostgreSQL
  let user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Sanjai Pandi',
        email: email,
        password: hashedPassword,
        phone: '9876543210',
        role: 'member',
        gymId: h4Gym.id,
        memberId: member.id,
        isVerified: true,
        isActive: true,
        status: 'Active',
      },
    });
    console.log(`  ✅ Created User account in PostgreSQL (ID: ${user.id})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        gymId: h4Gym.id,
        memberId: member.id,
        role: 'member',
        isVerified: true,
        isActive: true,
        status: 'Active',
      },
    });
    console.log(`  ✅ Updated User account in PostgreSQL (ID: ${user.id})`);
  }

  // 4. Also ensure Mongoose User model sync (if needed by legacy flows)
  try {
    const MongooseUser = require('../models/User');
    const mongooseUser = await MongooseUser.findOne({ email });
    if (!mongooseUser) {
      await MongooseUser.create({
        name: 'Sanjai Pandi',
        email: email,
        password: '123456',
        phone: '9876543210',
        role: 'member',
        gymId: h4Gym.id,
        memberId: member.id,
        isVerified: true,
        status: 'Active',
      });
      console.log(`  ✅ Synced Mongoose User record`);
    } else {
      await MongooseUser.findOneAndUpdate(
        { email },
        {
          gymId: h4Gym.id,
          memberId: member.id,
          role: 'member',
          isVerified: true,
          status: 'Active',
        }
      );
      console.log(`  ✅ Updated Mongoose User record`);
    }
  } catch (e) {
    console.log(`  ℹ️ Mongoose sync skipped/handled.`);
  }

  console.log(`\n🎉 SUCCESS! Account details:`);
  console.log(`   - Email:    ${email}`);
  console.log(`   - Password: 123456 (or via OTP)`);
  console.log(`   - Role:     member`);
  console.log(`   - Gym:      ${h4Gym.name} (H4)`);
  console.log(`   - Status:   Active\n`);

  await prisma.$disconnect();
}

createH4Account().catch((err) => {
  console.error('❌ Account creation failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
