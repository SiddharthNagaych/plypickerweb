import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    // Primary identifiers
    phone: { 
      type: String, 
      unique: true, 
      sparse: true, // Allows multiple null values
      index: true 
    },
    email: { 
      type: String, 
      unique: true, 
      sparse: true, 
      index: true 
    },
    
    // Profile information
    name: { type: String, trim: true },
    image: { type: String },
    
    // Additional signup data
    pincode: { type: String },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other'],
      lowercase: true 
    },
    
    // Verification status
    phoneVerified: { type: Date },
    emailVerified: { type: Date },
    
    // User role and status
    role: { 
      type: String, 
      enum: ['USER', 'ADMIN'], 
      default: 'USER' 
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    
    // OAuth provider info
    providers: [{
      provider: { type: String, required: true }, // 'google', 'phone'
      providerId: { type: String, required: true },
      connectedAt: { type: Date, default: Date.now }
    }],
    
    // Profile completion tracking
    profileCompleted: { type: Boolean, default: false },
    
    // Metadata
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },

        gstDetails: [{
      number: { 
        type: String, 
        uppercase: true,
        trim: true,
        validate: {
          validator: function(v: string) {
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
          },
          message: props => `${props.value} is not a valid GST number!`
        }
      },
      companyName: { type: String, trim: true },
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      isDefault: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }]
  },

  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ phone: 1, phoneVerified: 1 });
userSchema.index({ email: 1, emailVerified: 1 });
userSchema.index({ "providers.provider": 1, "providers.providerId": 1 });

// Pre-save middleware to set profileCompleted
userSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isModified('email') || this.isModified('pincode') || this.isModified('gender')) {
    this.profileCompleted = !!(this.name && (this.email || this.phone) && this.pincode && this.gender);
  }
  next();
});

// Instance method to check if user has complete profile
userSchema.methods.hasCompleteProfile = function() {
  return !!(this.name && (this.email || this.phone) && this.pincode && this.gender);
};

// Static method to find or create user
userSchema.statics.findOrCreate = async function(userData: any) {
  const { phone, email, provider, providerId, ...otherData } = userData;
  
  // Try to find existing user
  let user = null;
  if (phone) {
    user = await this.findOne({ phone });
  } else if (email) {
    user = await this.findOne({ email });
  }
  
  if (user) {
    // Update existing user with new data
    Object.assign(user, otherData);
    
    // Add provider if not already present
    if (provider && providerId) {
      const providerExists = user.providers.some(
        (p: any) => p.provider === provider && p.providerId === providerId
      );
      if (!providerExists) {
        user.providers.push({ provider, providerId });
      }
    }
    
    await user.save();
    return user;
  }
  
  // Create new user
  const newUserData = {
    phone,
    email,
    ...otherData,
    providers: provider && providerId ? [{ provider, providerId }] : []
  };
  
  return await this.create(newUserData);
};

const User = models.User || model("User", userSchema);
export default User;
