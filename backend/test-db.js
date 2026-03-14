const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Success!');
        process.exit(0);
    } catch (e) {
        console.error('Failed!', e.message);
        process.exit(1);
    }
};

test();
