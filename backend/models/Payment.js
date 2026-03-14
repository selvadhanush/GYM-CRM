const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Online (Razorpay)'], required: true },
    date: { type: Date, default: Date.now },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    transactionId: { type: String, default: null },
}, { timestamps: true });

paymentSchema.index({ memberId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
