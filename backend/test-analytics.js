require('dotenv').config();
const { getFitPassAnalytics } = require('./controllers/sessionController');
const prisma = require('./config/prisma');

async function main() {
    try {
        console.log("Looking for a superadmin user...");
        const user = await prisma.user.findFirst({ where: { role: 'superadmin' } });
        if (!user) {
            console.log("No superadmin user found");
            return;
        }

        const req = {
            user: { gymId: user.gymId, role: user.role }
        };

        const res = {
            status: function(code) {
                console.log("STATUS:", code);
                return this;
            },
            json: function(data) {
                console.log("JSON:");
                console.dir(data, { depth: null });
            }
        };

        console.log("Calling getFitPassAnalytics...");
        await getFitPassAnalytics(req, res);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
