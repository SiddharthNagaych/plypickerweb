
import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  type: 'HOME' | 'OFFICE' | 'OTHER';
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  isActive: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    phone: { 
      type: String, 
      required: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
    },
    type: {
      type: String,
      enum: ['HOME', 'OFFICE', 'OTHER'],
      default: 'HOME'
    },
    addressLine1: { 
      type: String, 
      required: true,
      trim: true 
    },

    city: { 
      type: String, 
      required: true,
      trim: true 
    },
    state: { 
      type: String, 
      required: true,
      trim: true 
    },
    pincode: { 
      type: String, 
      required: true,
      match: [/^\d{6}$/, 'Please enter a valid pincode']
    },
    country: { 
      type: String, 
      default: 'India',
      trim: true 
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Fixed pre-save hook with proper typing
AddressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Use proper model reference
    const AddressModel = this.constructor as mongoose.Model<IAddress>;
    await AddressModel.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Index for faster queries
AddressSchema.index({ userId: 1, isActive: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });

export default models.Address || model<IAddress>("Address", AddressSchema);
