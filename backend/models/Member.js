const mongoose = require('mongoose');

const memberSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    joinDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Frozen'], default: 'Active' },
    planPrice: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    freezeHistory: [{
        freezeDate: { type: Date, required: true },
        unfreezeDate: { type: Date, default: null },
        reason: { type: String, default: '' },
        daysAdded: { type: Number, default: 0 }
    }]
}, { timestamps: true });

memberSchema.index({ phone: 1 });
memberSchema.index({ email: 1 });
memberSchema.index({ status: 1 });

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
