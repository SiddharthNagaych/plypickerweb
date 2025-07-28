import mongoose, { Schema, model, models, Document } from "mongoose";

interface ICoordinates {
  lat: number;
  lng: number;
}

interface IAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: "HOME" | "WORK" | "OTHER";
  addressType?: "SHIPPING" | "BILLING" | "BOTH";
  coordinates?: ICoordinates;
  distanceFromCenter?: number;
  companyName?: string;
  gstNumber?: string;
  email?: string;
}

interface ICoupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minOrder?: number;
  validUntil?: Date;
}

export interface IPaymentRecord {
  amount: number;
  transactionId?: string;
  paidAt?: Date;
  failedAt?: Date;
  date?: Date;
  method?: any;
  status: "pending" | "completed" | "failed";
  type?: "advance" | "remaining" | "full";
}

export interface IAdvancePayment extends IPaymentRecord {
  percentage: number;
}

export interface IFinalPayment extends IPaymentRecord {
  dueDate?: Date;
}

interface IGstDetails {
  number?: string;
  companyName?: string;
  verified?: boolean;
  invoiceId?: string;
  invoiceUrl?: string;
  generatedAt?: Date;
}

export interface IServiceItem {
  frontendId: string;
  databaseId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  duration?: string;
  quantity: number;
  technicianRequired?: boolean;
  serviceType?: string;
  paymentStatus: "pending" | "partial" | "paid" | "failed";
  amountPaid: number;
  variant?: string;
}

export interface IServiceOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  services: IServiceItem[];
  shippingAddress: IAddress;
  billingAddress: IAddress;
  subtotal: number;
  gst: number;
  discount?: number;
  total: number;
  remianingAmount: number;
  paidAmount: number;
  
  coupon?: ICoupon;
  paymentStatus: "pending" | "partial" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "confirmed" | "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledDate: Date;
  scheduledTime: string;
  advancePayment: IAdvancePayment;
  finalPayment?: IFinalPayment;
  paymentHistory: IPaymentRecord[];
  gstDetails?: IGstDetails;
  completionNotes?: string;
  customerSignature?: string;
  technicianNotes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  orderReference?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  remainingAmount: number;
  isFullyPaid: boolean;
  isCancelled: boolean;
  isCompleted: boolean;

  calculatePaidAmount(): number;
  updatePaymentStatus(): Promise<void>;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    transactionId: { type: String, index: true },
    amount: Number,
    type: { type: String },
    status: { type: String },
    paidAt: Date,
    failedAt: Date,
    date: Date,
    method: Schema.Types.Mixed // Remove default, just use Mixed type
  },
  { _id: false, strict: false }
);

const AddressSchema = new Schema<IAddress>(
  {
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
    type: String,
    addressType: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    distanceFromCenter: Number,
    companyName: String,
    gstNumber: String,
    email: String
  },
  { _id: false }
);

const ServiceOrderSchema = new Schema<IServiceOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, unique: true },
    services: [
      {
        frontendId: String,
        databaseId: { type: Schema.Types.ObjectId, ref: "Service" },
        name: String,
        description: String,
        price: Number,
        duration: String,
        quantity: Number,
        technicianRequired: Boolean,
        serviceType: String,
        paymentStatus: String,
        amountPaid: Number,
        variant: String
      }
    ],
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    subtotal: Number,
    gst: Number,
    discount: Number,
    
    total: Number,
    paidAmount:       { type: Number, default: 0 },
remainingAmount:  { type: Number, default: 0 },

    coupon: {
      id: String,
      code: String,
      discount: Number,
      type: String,
      minOrder: Number,
      validUntil: Date
    },
    paymentStatus: { type: String, default: "pending" },
    orderStatus: { type: String, default: "pending" },
    scheduledDate: Date,
    scheduledTime: String,
    // Fixed: Define advancePayment as a subdocument schema
    advancePayment: {
      percentage: { type: Number, default: 10 },
      amount: { type: Number, required: true },
      transactionId: { type: String },
      paidAt: Date,
      failedAt: Date,
      date: Date,
      status: { type: String },
      method: Schema.Types.Mixed, // Remove default, just use Mixed type
      type: { type: String }
    },
    // Fixed: Define finalPayment as a subdocument schema
    finalPayment: {
      amount: Number,
      dueDate: Date,
      transactionId: { type: String },
      paidAt: Date,
      failedAt: Date,
      date: Date,
      status: { type: String },
      method: Schema.Types.Mixed, // Remove default, just use Mixed type
      type: { type: String }
    },
    paymentHistory: [PaymentRecordSchema],
    gstDetails: {
      number: String,
      companyName: String,
      verified: Boolean,
      invoiceId: String,
      invoiceUrl: String,
      generatedAt: Date
    },
    completionNotes: String,
    customerSignature: String,
    technicianNotes: String,
    cancellationReason: String,
    cancelledAt: Date,
    completedAt: Date,
    orderReference: { type: Schema.Types.ObjectId, ref: "Order" }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: false // Added: This allows additional fields to be saved without validation errors
  }
);



ServiceOrderSchema.virtual("isFullyPaid").get(function (this: IServiceOrder): boolean {
  return this.paymentStatus === "paid" || this.remainingAmount <= 0;
});

ServiceOrderSchema.virtual("isCancelled").get(function (this: IServiceOrder): boolean {
  return this.orderStatus === "cancelled";
});

ServiceOrderSchema.virtual("isCompleted").get(function (this: IServiceOrder): boolean {
  return this.orderStatus === "completed";
});

// Pre-save hook
ServiceOrderSchema.pre<IServiceOrder>("save", async function (next) {
  if (!this.orderNumber) {
    const count = await (this.constructor as typeof ServiceOrder).countDocuments();
    this.orderNumber = `SVC-${Date.now().toString().slice(-6)}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

// Fixed: Added the missing calculatePaidAmount method
ServiceOrderSchema.methods.calculatePaidAmount = function (): number {
  return this.paymentHistory
    .filter((p: IPaymentRecord) => p.status === "completed")
    .reduce((sum: number, p: IPaymentRecord) => sum + p.amount, 0);
};
ServiceOrderSchema.methods.updatePaymentStatus = async function (): Promise<void> {
  this.paidAmount = this.calculatePaidAmount();
  this.remainingAmount = Math.max(0, this.total - this.paidAmount);

  if (this.remainingAmount <= 0)      this.paymentStatus = "paid";
  else if (this.paidAmount > 0)       this.paymentStatus = "partial";
  else                                this.paymentStatus = "pending";

  await this.save({ validateModifiedOnly: false });
};


const ServiceOrder =
  models.ServiceOrder || model<IServiceOrder>("ServiceOrder", ServiceOrderSchema);

export default ServiceOrder;