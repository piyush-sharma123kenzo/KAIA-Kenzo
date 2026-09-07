import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    landmark: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'BRAND', 'ADMIN'],
      default: 'CUSTOMER',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    profileImage: {
      url: {
        type: String,
        default: '',
      },
      publicId: {
        type: String,
        default: '',
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    addresses: [addressSchema],
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field alias: isEmailVerified <-> emailVerified
userSchema.virtual('isEmailVerified').get(function () {
  return this.emailVerified;
}).set(function (val) {
  this.emailVerified = val;
});

// Sync status and isActive, role normalization, name sync before saving
userSchema.pre('save', async function (next) {
  // Normalize role to uppercase if string provided
  if (this.role && typeof this.role === 'string') {
    this.role = this.role.toUpperCase();
  }

  // Keep isActive and status in sync
  if (this.isModified('isActive') && !this.isModified('status')) {
    this.status = this.isActive ? 'Active' : 'Suspended';
  } else if (this.isModified('status') && !this.isModified('isActive')) {
    this.isActive = this.status === 'Active';
  } else if (this.status === 'Suspended') {
    this.isActive = false;
  }

  // Auto sync full name from firstName & lastName if provided
  if (this.firstName && this.lastName && !this.isModified('name')) {
    this.name = `${this.firstName.trim()} ${this.lastName.trim()}`;
  }

  // Encrypt password if modified
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
