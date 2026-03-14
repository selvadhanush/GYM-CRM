const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
}, { timestamps: true });

expenseSchema.index({ gymId: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
