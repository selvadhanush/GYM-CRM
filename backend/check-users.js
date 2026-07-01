const User = require('./models/User');
const dotenv = require('dotenv');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const check = async () => {
    try {
        const users = await User.find({});
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.log('Users found:', users.map(u => ({ email: u.email, role: u.role, gymId: u.gymId })));
        }
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
};

check();
