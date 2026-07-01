const User = require('./models/User');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');
const Member = require('./models/Member');
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

        // 1. Create or Update Admin User
        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Fitprime Admin',
                email: adminEmail,
                password: 'adminpassword123',
                role: 'admin',
                gymId: gym._id
            });
            console.log('--- FITPRIME ADMIN CREATED ---');
        } else {
            adminUser.gymId = gym._id;
            await adminUser.save();
            console.log('Fitprime admin updated to match active gymId.');
        }

        // 2. Create or Update Member Plan
        let plan = await Plan.findOne({ gymId: gym._id });
        if (!plan) {
            plan = await Plan.create({
                name: 'Basic Plan',
                duration: 30,
                price: 1000,
                gymId: gym._id
            });
            console.log('Created basic subscription plan for gym');
        }

        // 3. Create or Update Member Record in Member Table
        let member = await Member.findOne({ email: userEmail });
        if (!member) {
            member = await Member.create({
                name: 'Fitprime User',
                phone: '1234567890',
                email: userEmail,
                planId: plan._id,
                joinDate: new Date(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'Active',
                gymId: gym._id
            });
            console.log('--- MEMBER RECORD CREATED ---');
        } else {
            member.name = 'Fitprime User';
            member.phone = '123-456-7890';
            member.email = userEmail;
            member.gymId = gym._id;
            member.planId = plan._id;
            await member.save();
            console.log('Member record updated and sanitized to match active gymId and plan.');
        }

        // 4. Create or Update Member User
        let memberUser = await User.findOne({ email: userEmail });
        if (!memberUser) {
            memberUser = await User.create({
                name: 'Fitprime User',
                email: userEmail,
                password: 'userpassword123',
                role: 'member',
                gymId: gym._id,
                memberId: member._id
            });
            console.log('--- FITPRIME MEMBER USER CREATED ---');
        } else {
            memberUser.gymId = gym._id;
            memberUser.memberId = member._id;
            await memberUser.save();
            console.log('Fitprime member user updated and linked to Member record.');
        }

        console.log('All FitPrime users and members are now fully aligned!');
        process.exit(0);
    } catch (e) {
        console.error('Failed to create/align users:', e.message);
        process.exit(1);
    }
};

createFitprimeUsers();
