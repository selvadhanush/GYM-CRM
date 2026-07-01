const prisma = require('../config/prisma');

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, GymId: ${u.gymId}, MemberId: ${u.memberId}`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
