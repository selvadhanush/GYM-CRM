const mongoose = require('mongoose');

const branchSchema = mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    managerName: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

branchSchema.index({ gymId: 1 });

const Branch = mongoose.model('Branch', branchSchema);
module.exports = Branch;
