const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/Zippy/GYM-CRM/backend/.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    // We can just use the native collection
    const plans = await mongoose.connection.collection('plans').find({}).toArray();
    console.log('All Plans in DB:');
    console.log(JSON.stringify(plans, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();
