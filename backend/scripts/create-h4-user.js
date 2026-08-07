const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function createH4User() {
    const email = 'sanjaipandi66@gmail.com';
    const plainPassword = '1234567890';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const gymId = '05a08fdf-7427-48a5-8b25-e18d5a5668cd'; // H4 Gym ID
    const branchId = '2e207ea4-5017-45be-bd25-d94b741b1221'; // H5 branch

    // 1. Create or get Member
    let member = await prisma.member.findFirst({
        where: { email, gymId }
    });

    if (!member) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        member = await prisma.member.create({
            data: {
                name: 'Sanjai Pandi',
                email,
                phone: '9876543210',
                gymId,
                branchId,
                planId: '37584223-c7a6-42cc-86c9-37b843f7c5d5',
                status: 'Active',
                joinDate: new Date(),
                expiryDate
            }
        });
        console.log('Created H4 Member:', member.id);
    } else {
        console.log('Existing H4 Member found:', member.id);
    }

    // 2. Create or update User account for H4
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        const updated = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                role: 'member',
                gymId,
                branchId,
                memberId: member.id
            }
        });
        console.log('Updated H4 User:', updated.id, updated.email);
    } else {
        const created = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'member',
                name: 'Sanjai Pandi',
                gymId,
                branchId,
                memberId: member.id
            }
        });
        console.log('Created H4 User:', created.id, created.email);
    }

    process.exit(0);
}

createH4User().catch(err => {
    console.error('Error creating H4 user:', err);
    process.exit(1);
});
