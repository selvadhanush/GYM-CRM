const mongoose = require('mongoose');

const gymClassSchema = mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g. Yoga, Zumba, Strength
    description: { type: String, default: '' },
    trainerName: { type: String, default: '' },
    scheduleDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "10:00"
    maxSeats: { type: Number, required: true, default: 10 },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    bookings: [{
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        memberName: { type: String },
        bookedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

gymClassSchema.index({ gymId: 1, scheduleDate: 1 });

const GymClass = mongoose.model('GymClass', gymClassSchema);
module.exports = GymClass;
