const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Document will be automatically deleted after 10 minutes (600 seconds)
    },
});

// Hash the OTP before saving
otpSchema.pre('save', async function (next) {
    if (!this.isModified('otp')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
});

// Method to verify OTP
otpSchema.methods.matchOTP = async function (enteredOTP) {
    return await bcrypt.compare(enteredOTP, this.otp);
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
