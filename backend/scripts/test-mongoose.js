const connectDB = require('../config/db');
const Member = require('../models/Member');

async function main() {
    await connectDB();
    const members = await Member.find({ gymId: '55e98f15-5f0f-4a8d-9dec-bcfa7a5817a5' }).lean();
    console.log('--- MONGOOSE ADAPTER MEMBERS ---');
    console.log(JSON.stringify(members, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
