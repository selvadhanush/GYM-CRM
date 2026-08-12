const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function createOrUpdateUser() {
    const email = 'sanjaipandian.as@gmail.com';
    const plainPassword = '1234567890';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log(`User ${email} already exists. Updating password...`);
        const updated = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword
            }
        });
        console.log('Updated user:', updated.id, updated.email, updated.role);
    } else {
        console.log(`Creating user ${email}...`);
        const created = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'member',
                name: 'Sanjai Pandian',
                gymId: 'public'
            }
        });
        console.log('Created user:', created.id, created.email, created.role);
    }

    process.exit(0);
}

createOrUpdateUser().catch(err => {
    console.error('Error creating user:', err);
    process.exit(1);
});
