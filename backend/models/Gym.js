const mongoose = require('mongoose');

const gymSchema = mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
}, { timestamps: true });

const Gym = mongoose.model('Gym', gymSchema);
module.exports = Gym;
