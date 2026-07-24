const prisma = require('./config/prisma');

async function main() {
    try {
        console.log("Checking for missing Gyms for all users...");
        
        // Get all users
        const users = await prisma.user.findMany({ select: { id: true, email: true, gymId: true, role: true } });
        
        let fixedCount = 0;
        
        for (const user of users) {
            if (!user.gymId) continue;
            
            // Check if gym exists
            const gymExists = await prisma.gym.findUnique({ where: { id: user.gymId } });
            
            if (!gymExists) {
                console.log(`[Missing Gym] User ${user.email} (Role: ${user.role}) has gymId ${user.gymId} which does NOT exist in Gym table.`);
                console.log(`Creating fallback Gym with ID: ${user.gymId}...`);
                
                try {
                    await prisma.gym.create({
                        data: {
                            id: user.gymId,
                            name: `Restored Gym for ${user.email}`,
                            email: user.email,
                            phone: "0000000000"
                        }
                    });
                    console.log(`Successfully created Gym ${user.gymId}`);
                    fixedCount++;
                } catch (err) {
                    console.error(`Failed to create Gym ${user.gymId}:`, err.message);
                }
            }
        }
        
        console.log(`\nProcess complete! Fixed ${fixedCount} missing gyms.`);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
