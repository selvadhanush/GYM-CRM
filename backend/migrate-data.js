const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Models
const Gym = require('./models/Gym');
const User = require('./models/User');
const Member = require('./models/Member');
const Plan = require('./models/Plan');
const Attendance = require('./models/Attendance');
const Payment = require('./models/Payment');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Get or Create Default Gym
        let defaultGym = await Gym.findOne({ name: 'Elite Fitness Center' });
        if (!defaultGym) {
            defaultGym = await Gym.create({
                name: 'Elite Fitness Center',
                address: '123 Fitness Ave, Muscle Town',
                phone: '555-0199',
                email: 'contact@elitefitness.com'
            });
            console.log('Created default gym:', defaultGym.name);
        } else {
            console.log('Using existing default gym:', defaultGym.name);
        }

        const gymId = defaultGym._id;

        // 2. Update Collections
        const collections = [
            { model: User, name: 'Users' },
            { model: Member, name: 'Members' },
            { model: Plan, name: 'Plans' },
            { model: Attendance, name: 'Attendance' },
            { model: Payment, name: 'Payments' }
        ];

        for (const col of collections) {
            const result = await col.model.updateMany(
                { gymId: { $exists: false } },
                { $set: { gymId: gymId } }
            );
            console.log(`Updated ${col.name}: ${result.modifiedCount} records`);

            // Also handle cases where gymId is null
            const resultNull = await col.model.updateMany(
                { gymId: null },
                { $set: { gymId: gymId } }
            );
            console.log(`Updated ${col.name} (null gymId): ${resultNull.modifiedCount} records`);
        }

        console.log('Data migration completed successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e.message);
        process.exit(1);
    }
};

migrate();
