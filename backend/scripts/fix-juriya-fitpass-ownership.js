/**
 * Script: Fix mislabeled Fitpass member "Juriya"
 * Problem: Juriya's Member/User records sit on gymId 'SYSTEM' (a sentinel meant for
 *          global FitPrime plans / superadmin scope) and still carry a leftover H4
 *          branch reference, instead of the standard Fitpass convention used by
 *          Sanjaipandian.as (gymId: 'public', branchId: null).
 * Run: node backend/scripts/fix-juriya-fitpass-ownership.js
 */
const prisma = require('../config/prisma');

const MEMBER_ID = '7c9557b9-9b8e-418a-ae98-5797d0e19613'; // Juriya
const USER_ID = '7d625d32-0986-4f0e-b502-8f6ee118e7fa';   // member@fitness.com (Juriya's login)

async function main() {
  console.log('\n🔧 Fixing Fitpass ownership for Juriya...\n');

  const memberBefore = await prisma.member.findUnique({ where: { id: MEMBER_ID } });
  const userBefore = await prisma.user.findUnique({ where: { id: USER_ID } });

  if (!memberBefore || memberBefore.name !== 'Juriya') {
    throw new Error(`Refusing to proceed: Member ${MEMBER_ID} not found or name mismatch (found: ${memberBefore?.name}).`);
  }
  if (!userBefore || userBefore.email !== 'member@fitness.com') {
    throw new Error(`Refusing to proceed: User ${USER_ID} not found or email mismatch (found: ${userBefore?.email}).`);
  }

  console.log('Before:');
  console.log(`  Member.gymId=${memberBefore.gymId} branchId=${memberBefore.branchId}`);
  console.log(`  User.gymId=${userBefore.gymId}`);

  const memberAfter = await prisma.member.update({
    where: { id: MEMBER_ID },
    data: { gymId: 'public', branchId: null },
  });

  const userAfter = await prisma.user.update({
    where: { id: USER_ID },
    data: { gymId: 'public' },
  });

  console.log('\nAfter:');
  console.log(`  Member.gymId=${memberAfter.gymId} branchId=${memberAfter.branchId}`);
  console.log(`  User.gymId=${userAfter.gymId}`);

  console.log('\n✅ Juriya is now correctly labeled as a Fitpass member.\n');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Fix failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
