const User = require('./models/User');
const Gym = require('./models/Gym');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const createFitprimeUsers = async () => {
    try {
        await connectDB();
        console.log('Database connected...');

        let gym = await Gym.findOne({ name: 'Fitprime Gym' });
        if (!gym) {
            gym = await Gym.create({
                name: 'Fitprime Gym',
                address: 'Fitprime Avenue',
                phone: '123-456-7890',
                email: 'hello@fitprime.com'
            });
            console.log('Fitprime Gym created');
        }

        const adminEmail = 'admin@fitprime.com';
        const userEmail = 'user@fitprime.com';

        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User.create({
                name: 'Fitprime Admin',
                email: adminEmail,
                password: 'adminpassword123',
                role: 'admin',
                gymId: gym._id
            });
            console.log('--- FITPRIME ADMIN CREATED ---');
            console.log('Email:', adminEmail);
            console.log('Password: adminpassword123');
        } else {
            console.log('Fitprime admin already exists.');
        }

        const userExists = await User.findOne({ email: userEmail });
        if (!userExists) {
            await User.create({
                name: 'Fitprime User',
                email: userEmail,
                password: 'userpassword123',
                role: 'member',
                gymId: gym._id
            });
            console.log('--- FITPRIME USER CREATED ---');
            console.log('Email:', userEmail);
            console.log('Password: userpassword123');
        } else {
            console.log('Fitprime user already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Failed to create users:', e.message);
        process.exit(1);
    }
};

createFitprimeUsers();
