import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['SIGNUP_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup when expiresAt timestamp passes
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify submitted plaintext OTP against stored hash
otpSchema.methods.matchOtp = async function (enteredOtp) {
  return await bcrypt.compare(enteredOtp, this.hashedOtp);
};

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
export default OTP;
