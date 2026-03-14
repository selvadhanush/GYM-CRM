const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.log('Users found:', users.map(u => u.email));
        }
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
};

check();
