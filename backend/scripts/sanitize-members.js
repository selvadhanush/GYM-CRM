const prisma = require('../config/prisma');

function sanitizePhone(phone, email) {
    if (!phone) return { phone: '0000000000', emailUpdate: null, reason: 'Phone was empty/null' };
    
    let trimmed = phone.trim();
    
    // If it's an email address
    if (trimmed.includes('@')) {
        // Extract email
        const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const extractedEmail = emailMatch ? emailMatch[0] : null;
        
        // Try to see if there are also digits in the phone string
        const digitsOnly = trimmed.replace(/\D/g, '');
        let newPhone = '0000000000';
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            newPhone = digitsOnly;
        }
        
        return {
            phone: newPhone,
            emailUpdate: (!email && extractedEmail) ? extractedEmail : null,
            reason: `Email string detected in phone field: "${trimmed}"`
        };
    }
    
    // If it contains letters (like "N/A" or "no phone")
    if (/[a-zA-Z]/.test(trimmed)) {
        const digitsOnly = trimmed.replace(/\D/g, '');
        let newPhone = '0000000000';
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            newPhone = digitsOnly;
        }
        return {
            phone: newPhone,
            emailUpdate: null,
            reason: `Alphabetic characters detected in phone: "${trimmed}"`
        };
    }
    
    // Clean non-digit characters except leading plus
    const startsWithPlus = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
        return {
            phone: '0000000000',
            emailUpdate: null,
            reason: `No digits found in phone field: "${trimmed}"`
        };
    }
    
    let cleanedPhone = (startsWithPlus ? '+' : '') + digitsOnly;
    if (cleanedPhone !== phone) {
        return {
            phone: cleanedPhone,
            emailUpdate: null,
            reason: `Cleaned special/whitespace characters: "${trimmed}" -> "${cleanedPhone}"`
        };
    }
    
    return null; // Already valid
}

async function main() {
    const args = process.argv.slice(2);
    const isCommit = args.includes('--commit');

    console.log('==================================================');
    console.log('       GYM CRM MEMBER PHONE SANITIZATION          ');
    console.log(`Mode: ${isCommit ? 'COMMIT CHANGES' : 'DRY RUN (No changes will be saved)'}`);
    console.log('==================================================\n');

    try {
        console.log('Connecting to database and fetching members...');
        const members = await prisma.member.findMany();
        console.log(`Found ${members.length} member records total.`);

        let auditedCount = 0;
        let sanitizedCount = 0;
        let emailUpdatesCount = 0;

        for (const member of members) {
            const result = sanitizePhone(member.phone, member.email);
            if (result) {
                sanitizedCount++;
                console.log(`\n[INVALID RECORD] Member: ${member.name} (ID: ${member.id})`);
                console.log(`  - Reason: ${result.reason}`);
                console.log(`  - Phone: "${member.phone}" -> "${result.phone}"`);
                
                let dataToUpdate = { phone: result.phone };
                if (result.emailUpdate) {
                    emailUpdatesCount++;
                    dataToUpdate.email = result.emailUpdate;
                    console.log(`  - Email: "${member.email || 'null'}" -> "${result.emailUpdate}"`);
                }

                if (isCommit) {
                    await prisma.member.update({
                        where: { id: member.id },
                        data: dataToUpdate
                    });
                    console.log('  -> Status: Database updated.');
                } else {
                    console.log('  -> Status: Pending update (dry-run).');
                }
            }
            auditedCount++;
        }

        console.log('\n==================================================');
        console.log('               AUDIT SUMMARY                      ');
        console.log('==================================================');
        console.log(`Total Members Audited:   ${auditedCount}`);
        console.log(`Invalid Records Found:   ${sanitizedCount}`);
        console.log(`Email Upgrades Proposed: ${emailUpdatesCount}`);
        console.log('--------------------------------------------------');
        if (sanitizedCount > 0) {
            if (isCommit) {
                console.log(`SUCCESS: Cleaned and updated ${sanitizedCount} records in the database.`);
            } else {
                console.log('ACTION REQUIRED: Run script with "--commit" to write changes to the database:');
                console.log('  node scripts/sanitize-members.js --commit');
            }
        } else {
            console.log('SUCCESS: All member phone numbers are already clean!');
        }
        console.log('==================================================');

    } catch (error) {
        console.error('An error occurred during sanitization:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
