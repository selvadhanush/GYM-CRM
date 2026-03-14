const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const dns = require('dns');

// Bypass DNS issues
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const Gym = require('./models/Gym');

        let gym = await Gym.findOne({ name: 'Elite Fitness Center' });
        if (!gym) {
            gym = await Gym.create({
                name: 'Elite Fitness Center',
                address: '123 Fitness Ave, Muscle Town',
                phone: '555-0199',
                email: 'contact@elitefitness.com'
            });
            console.log('Default gym created');
        }

        const adminExists = await User.findOne({ email: 'admin@example.com' });
        if (adminExists) {
            adminExists.gymId = gym._id;
            await adminExists.save();
            console.log('Admin user updated with gymId');
            process.exit(0);
        }

        await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            gymId: gym._id
        });

        console.log('--- ADMIN ACCOUNT CREATED ---');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('------------------------------');
        process.exit(0);
    } catch (e) {
        console.error('Seeding failed:', e.message);
        process.exit(1);
    }
};

seed();
