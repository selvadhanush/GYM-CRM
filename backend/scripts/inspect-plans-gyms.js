const prisma = require('../config/prisma');

async function main() {
    const plans = await prisma.plan.findMany();
    const gyms = await prisma.gym.findMany();
    const branches = await prisma.branch.findMany();
    
    console.log('--- PLANS ---');
    console.log(JSON.stringify(plans, null, 2));
    
    console.log('--- GYMS ---');
    console.log(JSON.stringify(gyms, null, 2));
    
    console.log('--- BRANCHES ---');
    console.log(JSON.stringify(branches, null, 2));
    
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
