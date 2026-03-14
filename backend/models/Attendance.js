const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    date: { type: Date, default: Date.now },
    checkInTime: { type: String, required: true },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
}, { timestamps: true });

attendanceSchema.index({ memberId: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
