/**
 * Seed Script: Populate initial gym reviews
 * Run: node backend/scripts/seed-reviews.js
 */
const prisma = require('../config/prisma');

const REVIEWS = [
  {
    rating: 5,
    comment: 'Exceptional strength equipment and heavy dumbbells! Very clean locker rooms and polite staff.',
    memberName: 'Arun Kumar',
  },
  {
    rating: 5,
    comment: 'Super convenient FitPass check-in. The trainers are always attentive and helpful.',
    memberName: 'Priya Sundaram',
  },
  {
    rating: 4,
    comment: 'Great cardio area with high-speed treadmills. Gets a bit busy during peak 6-8 PM hours.',
    memberName: 'Vikram R.',
  },
  {
    rating: 5,
    comment: 'Top-tier ambiance and AC. Love the sauna and shower amenities after heavy workouts.',
    memberName: 'Kavitha N.',
  },
];

async function seed() {
  console.log('\n⭐ Seeding Verified Gym Reviews...\n');

  const gyms = await prisma.gym.findMany({ where: { status: 'Active', id: { not: 'SYSTEM' } } });
  if (gyms.length === 0) {
    console.log('No active gyms found.');
    return;
  }

  let count = 0;
  for (const gym of gyms) {
    for (const rev of REVIEWS) {
      await prisma.review.create({
        data: {
          gymId: gym.id,
          memberId: `mock_member_${Math.random().toString(36).substring(7)}`,
          memberName: rev.memberName,
          rating: rev.rating,
          comment: rev.comment,
        },
      });
      count++;
    }
    console.log(`  ✅ Added 4 verified reviews for ${gym.name}`);
  }

  console.log(`\n✨ Done seeding ${count} reviews!\n`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed reviews failed:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
