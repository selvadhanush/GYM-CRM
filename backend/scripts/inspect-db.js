const prisma = require('../config/prisma');

async function main() {
    const members = await prisma.member.findMany();
    console.log('--- ALL MEMBERS IN DB ---');
    console.log(JSON.stringify(members, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
