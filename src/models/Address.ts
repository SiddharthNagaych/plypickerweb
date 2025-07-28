import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  addressType?: 'SHIPPING' | 'BILLING' | 'BOTH';
  locationType?: 'HOME' | 'OFFICE' | 'OTHER';
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromCenter?: number; // in km
  isDefault?: boolean;
  isActive?: boolean;
  companyName?: string; // For GST/business addresses
  gstNumber?: string;  // For GST invoices
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
    addressType: {
      type: String,
      enum: ['SHIPPING', 'BILLING', 'BOTH'],
      default: 'SHIPPING'
    },
    locationType: {
      type: String,
      enum: ['HOME', 'OFFICE', 'OTHER'],
      default: 'HOME'
    },
    addressLine1: { 
      type: String, 
      required: true,
      trim: true 
    },
    addressLine2: { 
      type: String, 
      trim: true 
    },
    landmark: {
      type: String,
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
    coordinates: {
      type: {
        lat: Number,
        lng: Number
      },
      _id: false
    },
    distanceFromCenter: {
      type: Number  // Distance in kilometers from city center
    },
    companyName: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
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

// Pre-save hook: reset isDefault for other addresses of same type
AddressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    const AddressModel = this.constructor as mongoose.Model<IAddress>;
    await AddressModel.updateMany(
      { 
        userId: this.userId, 
        addressType: this.addressType,
        _id: { $ne: this._id } 
      },
      { isDefault: false }
    );
  }
  
  // If address is BOTH type, ensure we don't have separate entries
  if (this.addressType === 'BOTH') {
    const AddressModel = this.constructor as mongoose.Model<IAddress>;
    await AddressModel.updateMany(
      {
        userId: this.userId,
        $or: [
          { addressType: 'SHIPPING', isDefault: true },
          { addressType: 'BILLING', isDefault: true }
        ],
        _id: { $ne: this._id }
      },
      { isDefault: false }
    );
  }
  next();
});

// Indexes
AddressSchema.index({ userId: 1, isActive: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });
AddressSchema.index({ userId: 1, addressType: 1 });
AddressSchema.index({ pincode: 1 });
AddressSchema.index({ coordinates: '2dsphere' }); // For geospatial queries

export default models.Address || model<IAddress>("Address", AddressSchema);