/**
 * Seed Script: Activate FitPass plan for all existing members
 * Run: node backend/scripts/seed-active-member-plan.js
 */
const prisma = require('../config/prisma');

async function main() {
  console.log('\n🚀 Activating FitPass Plans for Members...\n');

  // Find a FitPass plan from DB
  let plan = await prisma.plan.findFirst({
    where: { gymId: 'SYSTEM' },
  });

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'FitPass Pro',
        duration: 30,
        durationUnit: 'days',
        sessions: 15,
        price: 999,
        gymId: 'SYSTEM',
      },
    });
  }

  // Update all members to Active with session credits
  const updated = await prisma.member.updateMany({
    data: {
      planId: plan.id,
      planPrice: plan.price,
      paidAmount: plan.price,
      status: 'Active',
      sessionsTotal: 15,
      sessionsRemaining: 15,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Activated FitPass plan (${plan.name} - 15 sessions) for ${updated.count} member(s)!`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
