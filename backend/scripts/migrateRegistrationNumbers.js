const prisma = require('../config/prisma');
const { generateRegistrationNumber } = require('../utils/registrationGenerator');

async function migrateRegistrationNumbers() {
    console.log('=== Starting Registration Number Data Migration ===');

    // 1. Populate Members without registrationNumber
    const membersToUpdate = await prisma.member.findMany({
        where: {
            OR: [
                { registrationNumber: null },
                { registrationNumber: '' }
            ]
        }
    });

    console.log(`Found ${membersToUpdate.length} members needing Registration Numbers.`);

    let memberCount = 0;
    for (const member of membersToUpdate) {
        let regNum;
        let attempts = 0;
        let success = false;

        while (!success && attempts < 5) {
            attempts++;
            regNum = await generateRegistrationNumber();
            try {
                await prisma.member.update({
                    where: { id: member.id },
                    data: { registrationNumber: regNum }
                });
                success = true;
                memberCount++;
            } catch (err) {
                console.warn(`Retry attempt ${attempts} for member ${member.id} due to collision.`);
            }
        }
        if (!success) {
            console.error(`Failed to assign Registration Number for member ${member.id}`);
        }
    }

    console.log(`Successfully assigned Registration Numbers to ${memberCount} members.`);

    // 2. Populate Staff Users without registrationNumber
    // ONLY direct staff (admin, partner, receptionist, trainer) where memberId IS NULL
    const staffToUpdate = await prisma.user.findMany({
        where: {
            memberId: null,
            role: { in: ['admin', 'partner', 'receptionist', 'trainer', 'superadmin'] },
            OR: [
                { registrationNumber: null },
                { registrationNumber: '' }
            ]
        }
    });

    console.log(`Found ${staffToUpdate.length} staff personnel needing Registration Numbers.`);

    let staffCount = 0;
    for (const staff of staffToUpdate) {
        let regNum;
        let attempts = 0;
        let success = false;

        while (!success && attempts < 5) {
            attempts++;
            regNum = await generateRegistrationNumber();
            try {
                await prisma.user.update({
                    where: { id: staff.id },
                    data: { registrationNumber: regNum }
                });
                success = true;
                staffCount++;
            } catch (err) {
                console.warn(`Retry attempt ${attempts} for staff ${staff.id} due to collision.`);
            }
        }
        if (!success) {
            console.error(`Failed to assign Registration Number for staff ${staff.id}`);
        }
    }

    console.log(`Successfully assigned Registration Numbers to ${staffCount} staff personnel.`);
    console.log('=== Registration Number Data Migration Complete ===');
}

if (require.main === module) {
    migrateRegistrationNumbers()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = migrateRegistrationNumbers;
