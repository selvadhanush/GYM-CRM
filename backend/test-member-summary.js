require('dotenv').config();
const { getMemberFitPassSummary } = require('./controllers/sessionController');
const prisma = require('./config/prisma');

async function main() {
    try {
        const user = await prisma.user.findFirst({ where: { role: 'superadmin' } });
        // Let's find any member who has FitPassAuditLog
        const log = await prisma.fitPassAuditLog.findFirst({ where: { accessStatus: 'Success' } });
        if (!log) {
            console.log("No fitpass logs found");
            return;
        }

        const req = {
            user: { gymId: user.gymId, role: user.role },
            params: { memberId: log.memberId }
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

        console.log("Calling getMemberFitPassSummary for member:", log.memberId);
        await getMemberFitPassSummary(req, res);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
