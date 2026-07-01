const prisma = require('./config/prisma');

async function test() {
    const members = await prisma.member.findMany({ 
        where: { gymId: '05a08fdf-7427-48a5-8b25-e18d5a5668cd' } 
    });
    console.log('H4 MEMBERS:', members.map(m => ({ name: m.name, branchId: m.branchId })));
}

test().catch(console.error).finally(() => prisma.$disconnect());
