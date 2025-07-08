

type City = "Pune" | "Mumbai" | "Navi Mumbai";

interface Category {
  _id?: ObjectId;
  name: string;
  category_image?: string;
  city: City;
}

interface Subcategory {
  _id?: ObjectId;
  name: string;
  category: ObjectId;
  city: City;
}

interface Group {
  _id?: ObjectId;
  name: string;
  category: ObjectId;
  subcategory: ObjectId;
  city: City;
}

interface Subgroup {
  _id?: ObjectId;
  name: string;
  category: ObjectId;
  subcategory: ObjectId;
  group: ObjectId;
  city: City;
}

interface CartBrand {
  _id?: ObjectId;
  Brand_name: string;
}

interface Brand extends CartBrand {
  _id?: ObjectId;
  Brand_name: string;
  Brand_image?: string;
  Category: ObjectId;
  SubCategory: ObjectId[];
  group: ObjectId[];
  subgroup: ObjectId[];
  city: City;
}

// Product-related interfaces
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
  _id: ObjectId;
  product_name: string;
  image?: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  category: ObjectId;
  subcategory?: ObjectId;
  group?: ObjectId;
  subgroup?: ObjectId;
  brand: ObjectId;
  city: City;
  vars?: ProductVariant[];
  rating_and_review?: {
    total_reviews: number;
    average_rating: number;
  };
}

// Frontend types (what components expect)
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

declare global {
  var _mongoClientPromise: Promise<import("mongodb").MongoClient> | undefined;
  var mongoose: {
    conn: import("mongoose").Mongoose | null;
    promise: Promise<import("mongoose").Mongoose> | null;
  } | undefined;
}

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
  isDefault?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromCenter?: number;
}

interface TransportCharges {
  bike: number;
  three_wheeler: number;
  tempo: number;
  pickup: number;
}

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

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  quantity?: number;
}

interface CartState {
  items: CartItem[];
  services: ServiceItem[];
  transport: TransportType;
  coupon: ICoupon | null; // Changed from Coupon to ICoupon
  selectedAddress: Address | null;
  transportCharges: TransportCharges;
  lastUpdated: string;
  sessionId: string;
}

type UseCartReturn = CartState & {
  subtotal: number;
  laborCharges: number;
  transportCharge: number;
  gst: number;
  discount: number;
  total: number;
  dispatch: any; // Replace with proper AppDispatch type
};

type AddressType = 'HOME' | 'WORK' | 'OTHER';
type TransportType = 'bike' | 'three_wheeler' | 'tempo' | 'pickup' | 'standard';

interface User {
  _id?: string;
  phone: string;
  email?: string;
  name?: string;
  image?: string;
  phoneVerified?: Date;
  emailVerified?: Date;
  role: "USER" | "ADMIN";
  status?: "active" | "inactive" | "suspended";
  addresses?: Address[];
  profileCompleted: boolean;
  providers?: {
    provider: string;
    providerId: string;
    connectedAt: Date;
  }[];
  pincode?: string;
  gender?: "male" | "female" | "other";
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

interface Order {
  _id?: string;
  userId: string;
  items: CartItem[];
  services?: ServiceItem[];
  address: Address;
  transportType: TransportType;
  transportCharge: number;
  laborCharges: number;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  coupon?: ICoupon; // Changed from Coupon to ICoupon
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  returnDeadline?: string;
  hasActiveReturn?: boolean;
  canReturn?: boolean;
}

interface ReturnItem {
  cartItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: "damaged" | "defective" | "wrong_item" | "not_as_described" | "other";
  images?: string[];
  refundAmount: number;
  refundMethod?: "original" | "credit";
}

interface Return {
  _id?: string;
  orderId: string;
  userId: string;
  returnItems: ReturnItem[];
  totalRefundAmount: number;
  returnReason: string;
  returnStatus: "requested" | "approved" | "rejected" | "refunded" | "partially_refunded";
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  refundProcessedAt?: string;
  refundTransactionId?: string;
  refundMethod?: "original" | "credit" | "partial";
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

interface PCashCredit {
  amount: number;
  reason: "return_refund" | "referral" | "promotion" | "other";
  source?: string;
  orderId?: string;
  returnId?: string;
  productId?: string;
  creditedAt?: string;
  expiresAt?: string;
  status?: "active" | "expired" | "used";
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
// For frontend/Redux (client-side)
interface ICoupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  discount: number;
  minOrder: number;
  validUntil?: string;
  assignedTo: string[];
  category?: string;
  subcategory?: string;
  group?: string;
  subgroup?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for populated coupon
interface IPopulatedCoupon extends Omit<ICoupon, "category" | "subcategory" | "group" | "subgroup"> {
  _id: Types.ObjectId;
  category?: { _id: Types.ObjectId; name: string };
  subcategory?: { _id: Types.ObjectId; name: string };
  group?: { _id: Types.ObjectId; name: string };
  subgroup?: { _id: Types.ObjectId; name: string };
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


// Add to your existing interfaces
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

// global.d.ts
interface Window {
  Cashfree: any; // You can replace 'any' with a more specific type if available
}