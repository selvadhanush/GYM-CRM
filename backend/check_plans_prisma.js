const prisma = require('./config/prisma');

async function main() {
  const plans = await prisma.plan.findMany();
  console.log('All Plans in DB:');
  console.log(JSON.stringify(plans, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
