const mongoose = require('mongoose');

const planSchema = mongoose.Schema({
    name: { type: String, required: true },
    duration: { type: Number, required: true }, // in days
    price: { type: Number, required: true },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
