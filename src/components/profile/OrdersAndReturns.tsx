"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Package,
  Wrench,
  AlertCircle,
  Clock,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface Brand {
  Brand_name: string;
  _id: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  productDiscountedPrice?: number;
  productImage?: string;
  quantity: number;
  includeLabor: boolean;
  laborFloors?: number;
  laborPerFloor?: number;
  variantIndex?: number;
  variantName?: string;
  brand: Brand;
}

interface Service {
  name: string;
  description: string;
  price: number;
  duration: string;
  quantity?: number;
  technicianRequired?: boolean;
  paymentStatus?: string;
  amountPaid?: number;
}

interface Address {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  services?: Service[];
  address: Address;
  transportType: string;
  transportCharge: number;
  laborCharges: number;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paidAmount?: number;
  remainingAmount?: number;
  pcashUsed?: number;
  createdAt: string;
  updatedAt: string;
  returnStatus?:
    | "requested"
    | "approved"
    | "rejected"
    | "refunded"
    | "partially_refunded";
  returnRequestedAt?: string;
  refundAmount?: number;
  plyCreditsCredited?: boolean;
  plyCreditsAmount?: number;
  returnReason?: string;
  refundMethod?: string;
  deliveredAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isServiceOrder?: boolean;
  advancePayment?: {
    percentage: number;
    amount: number;
    paidAt?: string;
    status?: string;
  };
  finalPayment?: {
    amount: number;
    paidAt?: string;
    status?: string;
  };
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "services">(
    "products"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [activeTab, selectedStatus, userId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("userId", userId || "");
      params.append("type", activeTab);
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }

      const endpoint =
        activeTab === "products" ? "/api/orders" : "/api/service-orders";
      const response = await axios.get(`${endpoint}?${params.toString()}`);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemainingPayment = async (orderId: string) => {
    try {
      setPaymentLoading(orderId);
      const response = await axios.post("/api/payment/service-remaining", {
        orderId,
        userId,
      });

      if (response.data.success) {
        //@ts-ignore
        const { load } = await import("@cashfreepayments/cashfree-js");
        const cashfree = await load({
          mode:
            process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
              ? "production"
              : "sandbox",
        });

        await cashfree.checkout({
          paymentSessionId: response.data.payment_session_id,
          redirectTarget: "_self",
          onSuccess: async () => {
            await fetchOrders(); // ✅ Refetch after success
          },
          onFailure: async () => {
            await fetchOrders(); // Optional: still refetch on fail just in case
          },
        });
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setPaymentLoading(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.items?.some(
        (item) =>
          item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.brand?.Brand_name.toLowerCase().includes(
            searchQuery.toLowerCase()
          )
      ) ||
      (order.services &&
        order.services.some((service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesPeriod =
      selectedPeriod === "all" ||
      (() => {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (selectedPeriod) {
          case "7days":
            return diffDays <= 7;
          case "30days":
            return diffDays <= 30;
          case "90days":
            return diffDays <= 90;
          default:
            return true;
        }
      })();

    return matchesSearch && matchesPeriod;
  });

  const getStatusColor = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "partial") return "text-yellow-600";
    switch (status) {
      case "delivered":
      case "confirmed":
      case "paid":
        return "text-green-600";
      case "shipped":
      case "scheduled":
        return "text-blue-600";
      case "processing":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "partial") return "Partially Paid";
    switch (status) {
      case "delivered":
        return "Delivered";
      case "shipped":
        return "Shipped";
      case "processing":
        return "Processing";
      case "cancelled":
        return "Cancelled";
      case "confirmed":
        return "Confirmed";
      case "scheduled":
        return "Scheduled";
      default:
        return "Placed";
    }
  };

  const renderServiceOrderCard = (order: Order) => {
    const isRefunded = order.returnStatus === "refunded";
    const isCancelled = order.orderStatus === "cancelled";
    const isConfirmed = order.orderStatus === "confirmed";
    const isScheduled = order.orderStatus === "scheduled";

    // Calculate remaining amount more accurately
    const isFullyPaid =
      order.paymentStatus === "paid" || (order.remainingAmount ?? 0) < 1;

    const actualRemainingAmount =
      order.remainingAmount ??
      Math.max(0, order.total - (order.paidAmount || 0));
    const hasRemainingPayment = !isFullyPaid && actualRemainingAmount > 0;

    return (
      <div
        key={order._id}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        {/* Header - show correct status based on actual payment */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCancelled
                  ? "bg-red-100"
                  : isConfirmed || actualRemainingAmount === 0
                  ? "bg-green-100"
                  : isScheduled
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }`}
            >
              {isCancelled ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Wrench className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div>
              <h3
                className={`font-semibold ${getStatusColor(
                  order.orderStatus,
                  actualRemainingAmount === 0 ? "paid" : order.paymentStatus
                )}`}
              >
                {actualRemainingAmount === 0
                  ? "Fully Paid"
                  : getStatusText(order.orderStatus)}
              </h3>
              <p className="text-sm text-gray-600">
                {isCancelled
                  ? "Service cancelled"
                  : isConfirmed || actualRemainingAmount === 0
                  ? "Service confirmed"
                  : isScheduled
                  ? `Scheduled for ${
                      order.scheduledDate
                        ? new Date(order.scheduledDate).toLocaleDateString(
                            "en-GB"
                          )
                        : "TBD"
                    }`
                  : `Service booked on ${new Date(
                      order.createdAt
                    ).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold text-gray-800">
              ₹{order.total.toLocaleString()}
            </div>
            {hasRemainingPayment && (
              <div className="text-sm text-orange-600">
                ₹{actualRemainingAmount.toLocaleString()} pending
              </div>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center">
            <Wrench className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">
              {order.services?.[0]?.name || "Service"}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Duration: {order.services?.[0]?.duration || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              {order.services?.[0]?.description || "Service details"}
            </p>
          </div>
        </div>

        {/* Scheduled Date & Time */}
        {(order.scheduledDate || order.scheduledTime) && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">Scheduled</p>
              <p className="text-sm text-gray-600">
                {order.scheduledDate &&
                  new Date(order.scheduledDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                {order.scheduledTime && ` at ${order.scheduledTime}`}
              </p>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Payment Status:
            </span>
            <span
              className={`text-sm font-semibold ${getStatusColor(
                isFullyPaid ? "paid" : order.paymentStatus
              )}`}
            >
              {isFullyPaid
                ? "Fully Paid"
                : order.paymentStatus === "partial"
                ? "Partially Paid"
                : "Pending"}
            </span>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-600">
              Paid: ₹{(order.total - actualRemainingAmount).toLocaleString()}
            </div>
            {hasRemainingPayment && (
              <div className="text-orange-600">
                Due: ₹{actualRemainingAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 flex items-center justify-between">
          {(order.paymentStatus === "paid" ||
            (order.remainingAmount ?? 0) < 1) && (
            <a
              href={`/api/invoice/service/${order._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 font-medium text-sm hover:text-orange-700"
            >
              Download Invoice
            </a>
          )}

          {hasRemainingPayment && (
            <button
              onClick={() => handleRemainingPayment(order._id)}
              disabled={paymentLoading === order._id}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                paymentLoading === order._id
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {paymentLoading === order._id ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                `Pay ₹${actualRemainingAmount.toLocaleString()}`
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderProductOrderCard = (order: Order) => {
    const isRefunded = order.returnStatus === "refunded";
    const isCancelled = order.orderStatus === "cancelled";
    const isDelivered = order.orderStatus === "delivered";
    const isShipped = order.orderStatus === "shipped";
    const isProcessing = order.orderStatus === "processing";

    return (
      <div
        key={order._id}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCancelled
                  ? "bg-red-100"
                  : isDelivered
                  ? "bg-green-100"
                  : isShipped
                  ? "bg-blue-100"
                  : isProcessing
                  ? "bg-yellow-100"
                  : "bg-gray-100"
              }`}
            >
              {isCancelled ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : isDelivered ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : isShipped ? (
                <Truck className="w-5 h-5 text-blue-500" />
              ) : (
                <Package className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <h3
                className={`font-semibold ${getStatusColor(order.orderStatus)}`}
              >
                {getStatusText(order.orderStatus)}
              </h3>
              <p className="text-sm text-gray-600">
                {isDelivered && order.deliveredAt
                  ? `Delivered on ${new Date(
                      order.deliveredAt
                    ).toLocaleDateString("en-GB")}`
                  : `Ordered on ${new Date(order.createdAt).toLocaleDateString(
                      "en-GB",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold text-gray-800">
              ₹{order.total.toLocaleString()}
            </div>
            {isRefunded && order.refundAmount && (
              <div className="text-sm text-green-600">
                ₹{order.refundAmount.toLocaleString()} refunded
              </div>
            )}
          </div>
        </div>

        {/* Product Items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">
                  {item.productName}
                </h4>
                <p className="text-sm text-gray-600 mb-1">
                  Brand: {item.brand?.Brand_name}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Qty: {item.quantity}</span>
                  <span className="text-gray-800 font-medium">
                    ₹
                    {(
                      item.productDiscountedPrice || item.productPrice
                    ).toLocaleString()}
                  </span>
                  {item.productDiscountedPrice &&
                    item.productDiscountedPrice < item.productPrice && (
                      <span className="text-gray-400 line-through">
                        ₹{item.productPrice.toLocaleString()}
                      </span>
                    )}
                </div>
                {item.variantName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Variant: {item.variantName}
                  </p>
                )}
                {item.includeLabor && (
                  <p className="text-xs text-blue-600 mt-1">
                    Labor included ({item.laborFloors} floors)
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Address */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-1">
            Delivery Address
          </h5>
          <p className="text-sm text-gray-600">
            {order.address?.name} • {order.address?.phone}
          </p>
          <p className="text-sm text-gray-600">{order.address?.addressLine1}</p>
          <p className="text-sm text-gray-600">
            {order.address?.city}, {order.address?.state} -{" "}
            {order.address?.pincode}
          </p>
        </div>

        {/* Payment & Delivery Info */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {order.paymentMethod} •{" "}
              {order.paymentStatus === "paid" ? "Paid" : "Pending"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {order.transportType} • ₹{order.transportCharge}
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{order.subtotal?.toLocaleString()}</span>
          </div>
          {order.laborCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Labor Charges</span>
              <span>₹{order.laborCharges?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Transport</span>
            <span>₹{order.transportCharge?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST</span>
            <span>₹{order.gst?.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{order.discount?.toLocaleString()}</span>
            </div>
          )}
          {order.pcashUsed && order.pcashUsed > 0 && (
            <div className="flex justify-between text-green-600">
              <span>P-Cash Used</span>
              <span>-₹{order.pcashUsed?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
            <span>Total</span>
            <span>₹{order.total?.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 flex items-center justify-between">
          <a
            href={`/api/invoice/${order._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 font-medium text-sm hover:text-orange-700"
          >
            Download Invoice
          </a>

          <div className="flex items-center gap-2">
            {isDelivered &&
              !isRefunded &&
              order.returnStatus !== "requested" && (
                <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Return Order
                </button>
              )}
            {order.returnStatus === "requested" && (
              <span className="text-xs text-orange-600 px-2 py-1 bg-orange-50 rounded">
                Return Requested
              </span>
            )}
            {!isCancelled && !isDelivered && (
              <button className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Track Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">
            Track and manage your orders and services
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex bg-white rounded-lg p-1 w-fit border">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "products"
                  ? "bg-orange-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "services"
                  ? "bg-orange-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Wrench className="w-4 h-4 inline mr-2" />
              Services
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="placed">Placed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                {activeTab === "services" && (
                  <>
                    <option value="confirmed">Confirmed</option>
                    <option value="scheduled">Scheduled</option>
                  </>
                )}
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No {activeTab} found
              </h3>
              <p className="text-gray-500">
                {searchQuery ||
                selectedStatus !== "all" ||
                selectedPeriod !== "all"
                  ? "Try adjusting your search or filters"
                  : `You haven't placed any ${activeTab} orders yet`}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) =>
              activeTab === "services"
                ? renderServiceOrderCard(order)
                : renderProductOrderCard(order)
            )
          )}
        </div>
      </div>
    </div>
  );
}
