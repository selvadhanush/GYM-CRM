const prisma = require('./config/prisma');

async function audit() {
  const fitPassPlans = await prisma.plan.findMany({
    where: { gymId: 'SYSTEM' },
    select: { id: true, name: true, sessions: true, price: true }
  });
  const fitPassPlanIds = fitPassPlans.map(p => p.id);

  const members = await prisma.member.findMany({
    where: { planId: { in: fitPassPlanIds } }
  });

  console.log(`Found ${members.length} FitPass Members.`);

  for (const m of members) {
    const total = m.sessionsTotal || 0;
    const remaining = m.sessionsRemaining || 0;
    const used = total - remaining;

    const logs = await prisma.fitPassAuditLog.findMany({
      where: {
        OR: [
          { memberId: m.id },
          { memberName: { contains: m.name, mode: 'insensitive' } }
        ]
      }
    });

    const successLogs = logs.filter(l => l.accessStatus === 'Success');
    const failedLogs = logs.filter(l => l.accessStatus === 'Failed');

    console.log(`Member: ${m.name} (ID: ${m.id})`);
    console.log(`  Plan Total: ${total} | Remaining: ${remaining} | Sessions Used: ${used}`);
    console.log(`  Audit Logs Count: Total ${logs.length} (Success: ${successLogs.length}, Failed: ${failedLogs.length})`);
    console.log('--------------------------------------------------');
  }

  process.exit(0);
}

audit().catch(console.error);
