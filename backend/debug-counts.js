const prisma = require('./config/prisma');

async function test() {
  const sessions = await prisma.sessionCheckIn.findMany({
    orderBy: { startedAt: 'desc' },
    take: 1
  });

  if (sessions.length === 0) {
    console.log("No sessions found");
    return;
  }

  const gymId = sessions[0].gymId;
  console.log("Partner GymId from recent session:", gymId);

  const totalMembers = await prisma.member.count({ where: { gymId } });
  const activeMembers = await prisma.member.count({ where: { gymId, status: 'Active' } });
  
  const allMembers = await prisma.member.findMany();
  
  console.log("Total members for gym:", totalMembers);
  console.log("Active members for gym:", activeMembers);
  
  console.log("All members:", allMembers.map(m => ({ id: m.id, name: m.name, gymId: m.gymId })));
}

test().then(() => console.log('done')).catch(console.error);
