const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('--- Checking Trainer Accounts in DB ---');
  
  const gym = await prisma.gym.findFirst();
  const gymId = gym ? gym.id : 'default-gym-id';

  const trainerEmail = 'trainer@h4fitness.com';
  const plainPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  let trainerUser = await prisma.user.findFirst({
    where: { email: trainerEmail },
  });

  if (!trainerUser) {
    trainerUser = await prisma.user.create({
      data: {
        name: 'H4 Certified Trainer',
        email: trainerEmail,
        password: hashedPassword,
        role: 'trainer',
        gymId: gymId,
        isVerified: true,
        status: 'Active',
      },
    });
    console.log('Created new Trainer account:', trainerUser.email);
  } else {
    await prisma.user.update({
      where: { id: trainerUser.id },
      data: {
        password: hashedPassword,
        role: 'trainer',
        gymId: gymId || trainerUser.gymId,
      },
    });
    console.log('Updated existing Trainer account password to:', plainPassword);
  }

  // Also query existing trainer accounts in DB
  const allTrainers = await prisma.user.findMany({
    where: {
      role: 'trainer',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log('\n=========================================');
  console.log('🔑 TRAINER DASHBOARD CREDENTIALS:');
  console.log(`   Email:    ${trainerEmail}`);
  console.log(`   Password: ${plainPassword}`);
  console.log(`   Role:     trainer`);
  console.log('=========================================');
  console.log('All Trainer Accounts in System:', allTrainers);
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
