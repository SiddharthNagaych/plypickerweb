// Basic types
type City = "Pune" | "Mumbai" | "Navi Mumbai";
type AddressType = "HOME" | "WORK" | "OTHER";
type TransportType = "bike" | "three_wheeler" | "tempo" | "pickup";
type PaymentStatus = "pending" | "partial" | "paid" | "failed";
type OrderStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
type CouponType = "percentage" | "fixed";
type UserRole = "USER" | "ADMIN";
type UserStatus = "active" | "inactive" | "suspended";
type Gender = "male" | "female" | "other";
type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "refunded"
  | "partially_refunded";
type ReturnCondition =
  | "damaged"
  | "defective"
  | "wrong_item"
  | "not_as_described"
  | "other";
type RefundMethod = "original" | "credit" | "partial";
type PCashCreditReason = "return_refund" | "referral" | "promotion" | "other";
type PCashStatus = "active" | "expired" | "used";

// Category hierarchy interfaces
interface Category {
  _id?: Types.ObjectId;
  name: string;
  category_image?: string;
  city: City;
}

interface Subcategory {
  _id?: Types.ObjectId;
  name: string;
  category: Types.ObjectId;
  city: City;
  image?: string;
}

interface Group {
  _id?: Types.ObjectId;
  name: string;
  category: Types.ObjectId;
  subcategory: Types.ObjectId;
  city: City;
}

interface Subgroup {
  _id?: Types.ObjectId;
  name: string;
  category: Types.ObjectId;
  subcategory: Types.ObjectId;
  group: Types.ObjectId;
  city: City;
}

// Brand interfaces
interface CartBrand {
  _id?: Types.ObjectId;
  Brand_name: string;
}

interface Brand extends CartBrand {
  Brand_image?: string;
  Category: Types.ObjectId;
  SubCategory: Types.ObjectId[];
  group: Types.ObjectId[];
  subgroup: Types.ObjectId[];
  city: City;
}

// Product interfaces
interface ProductVariant {
  product_name: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  attributes: {
    color?: string;
    size?: string;
    material?: string;
  };
  images?: string[];
}

interface Product {
  _id: Types.ObjectId;
  product_name: string;
  image?: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId;
  group?: Types.ObjectId;
  subgroup?: Types.ObjectId;
  brand: Types.ObjectId;
  city: City;
  vars?: ProductVariant[];
  rating_and_review?: {
    total_reviews: number;
    average_rating: number;
  };
}

// Frontend display interfaces
interface ProductCardData {
  id: string;
  product_name: string;
  image?: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  brandId?: string;
  brandName?: string;
  averageRating?: number;
  totalReviews?: number;
}

interface BrandFilter {
  id: string;
  name: string;
  count?: number;
}

interface ColorFilter {
  value: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface Breadcrumb {
  level: "category" | "subcategory" | "group" | "subgroup";
  id: string;
  name: string;
  href: string;
}

interface ProductFilters {
  categoryId: string;
  subcategoryId?: string;
  groupId?: string;
  subgroupId?: string;
  brandId?: string[];
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  maxDiscount?: number;
  city?: string;
  page?: number;
  limit?: number;
}

interface ProductListResponse {
  results: ProductCardData[];
  total: number;
  facets: {
    brands: BrandFilter[];
    colors: ColorFilter[];
    price: PriceRange;
    discount: PriceRange;
  };
  breadcrumbs: Breadcrumb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Address and transport interfaces
interface Address {
  id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: AddressType;
  addressType?: "SHIPPING" | "BILLING" | "BOTH";
  isDefault?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromCenter?: number;
  companyName?: string;
  gstNumber?: string;
  email?: string;
}

interface TransportCharges {
  bike: number;
  three_wheeler: number;
  tempo: number;
  pickup: number;
}

// Cart interfaces
interface Desc {
  Box_Packing?: string;
  Size?: string;
  Colour?: string;
  Material?: string;
}

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productDescription?: string;
  productPrice: number;
  productDiscountedPrice?: number;
  productImage?: string;
  desc: Desc;
  brand: CartBrand;
  quantity: number;
  variantIndex?: number;
  variantName?: string;
  includeLabor: boolean;
  laborFloors: number;
  laborPerFloor?: number;
  applicability?: number;
  loadingUnloadingPrice?: number;
  estimatedDelivery?: string;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  services: ServiceItem[];
  transport: TransportType;
  coupon: ICoupon | null;
  selectedAddress: Address | null;
  billingAddress: Address | null; // Add this line
  transportCharges: TransportCharges;
  lastUpdated: string;
  sessionId: string;
}

interface UseCartReturn extends CartState {
  subtotal: number;
  laborCharges: number;
  transportCharge: number;
  gst: number;
  discount: number;
  total: number;
  dispatch: any; // Replace with proper AppDispatch type
}

// User and authentication interfaces
interface User {
  _id?: string;
  phone: string;
  email?: string;
  name?: string;
  image?: string;
  phoneVerified?: Date;
  emailVerified?: Date;
  role: UserRole;
  status?: UserStatus;
  addresses?: Address[];
  profileCompleted: boolean;
  providers?: {
    provider: string;
    providerId: string;
    connectedAt: Date;
  }[];
  pincode?: string;
  gender?: Gender;
  lastLoginAt?: Date;
  loginCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OtpVerification {
  _id?: string;
  phone: string;
  otp: string;
  verified: boolean;
  verifiedAt?: Date;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Order and payment interfaces
interface IAddress {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: AddressType;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromCenter?: number;
}

interface ICoupon {
  id: string;
  code: string;
  discount: number;
  type: CouponType;
  minOrder?: number;
  validUntil?: string;
}

interface IAdvancePayment {
  percentage: number;
  amount: number;
  transactionId?: string;
  paidAt?: Date;
}

interface IFinalPayment {
  amount: number;
  transactionId?: string;
  paidAt?: Date;
}

interface IGstDetails {
  number?: string;
  companyName?: string;
  verified?: boolean;

  generatedAt?: Date;
}

interface IServiceItem {
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

interface IServiceOrder extends Document {
  _id: string | Types.ObjectId; // ✅ Add this line
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  services: IServiceItem[];
  shippingAddress: IAddress;
  billingAddress: IAddress;
  subtotal: number;
  gst: number;
  discount?: number;
  total: number;
  coupon?: ICoupon;
  paymentStatus: "pending" | "partial" | "paid" | "failed" | "refunded";
  orderStatus:
    | "pending"
    | "confirmed"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled";
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

interface Order {
  _id?: string;
  userId: string;
  items: CartItem[];
  services?: ServiceItem[];
  shippingAddress: Address; // Changed from just 'address'
  billingAddress: Address; // Added
  transportType: TransportType;
  transportCharge: number;
  laborCharges: number;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  coupon?: ICoupon;
  paymentStatus: PaymentStatus;
  orderStatus: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  returnDeadline?: string;
  hasActiveReturn?: boolean;
  canReturn?: boolean;
  gstDetails?: {
    number?: string;
    companyName?: string;
    verified?: boolean;
  };
}

// Return and refund interfaces
interface ReturnItem {
  cartItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
  images?: string[];
  refundAmount: number;
  refundMethod?: RefundMethod;
}

interface Return {
  _id?: string;
  orderId: string;
  userId: string;
  returnItems: ReturnItem[];
  totalRefundAmount: number;
  returnReason: string;
  returnStatus: ReturnStatus;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  refundProcessedAt?: string;
  refundTransactionId?: string;
  refundMethod?: RefundMethod;
  plyCreditsCredited: boolean;
  plyCreditsAmount?: number;
  plyCreditsCreditedAt?: string;
  adminNotes?: string;
  processedBy?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt?: string;
  updatedAt?: string;
}

// PCash interfaces
interface PCashCredit {
  amount: number;
  reason: PCashCreditReason;
  source?: string;
  orderId?: string;
  returnId?: string;
  productId?: string;
  creditedAt?: string;
  expiresAt?: string;
  status?: PCashStatus;
}

interface PCashConsumption {
  amount: number;
  orderId?: string;
  productId?: string;
  usedAt?: string;
  remainingBalance?: number;
}

interface PCash {
  userId: string;
  credited: PCashCredit[];
  consumed: PCashConsumption[];
  totalCredited?: number;
  totalConsumed?: number;
  currentBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AppStateWithReturns {
  orders: Order[];
  returns: Return[];
  pcash?: PCash;
}

// Help ticket interfaces
interface IHelpTicket {
  _id?: string;
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  issueType?: string;
  message: string;
  attachment?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketResponse extends Omit<IHelpTicket, "userId"> {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTicketRequest {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  issueType?: string;
  message: string;
  attachment?: string;
}

// Payment interfaces
interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface PaymentSession {
  id: string;
  order_id: string;
  payment_session_id: string;
  status: string;
}

interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentSessionId?: string;
  error?: string;
}

// Service interfaces
interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  quantity?: number;
}

interface IPaymentRecord {
  amount: number;
  transactionId?: string;
  paidAt?: Date;
  failedAt?: Date;
  date?: Date;
  method?: any;
  status: "pending" | "completed" | "failed";
  type?: "advance" | "remaining" | "full";
}




 interface ITicketMessage {
  _id?: Types.ObjectId;
  from: "user" | "agent" | "system";
  text: string;
  files?: { url: string; name: string }[];
  createdAt?: Date;
}

interface ITicket {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  subject: string;
  category: "order" | "return" | "payment" | "account" | "other";
  messages: ITicketMessage[];
  status: "open" | "in_progress" | "resolved";
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketMeta {
  _id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}
// Global declarations
declare global {
  var _mongoClientPromise: Promise<import("mongodb").MongoClient> | undefined;
  var mongoose:
    | {
        conn: mongoose.Mongoose | null;
        promise: Promise<mongoose.Mongoose> | null;
      }
    | undefined;
  interface Window {
    Cashfree: any; // Replace 'any' with more specific type if available
  }
}
