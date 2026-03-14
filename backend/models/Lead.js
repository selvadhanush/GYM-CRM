const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    source: { type: String, enum: ['Walk-in', 'Instagram', 'Facebook', 'Referral', 'Google', 'WhatsApp', 'Other'], default: 'Walk-in' },
    status: { type: String, enum: ['New', 'Contacted', 'Interested', 'Converted', 'Lost'], default: 'New' },
    interestedPlan: { type: String, default: '' },
    notes: { type: String, default: '' },
    followUpDate: { type: Date, default: null },
    convertedMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    assignedTo: { type: String, default: '' },
}, { timestamps: true });

leadSchema.index({ gymId: 1, status: 1 });
leadSchema.index({ gymId: 1, followUpDate: 1 });

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
