"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Package, Wrench, ChevronRight, Calendar, MapPin, CreditCard } from "lucide-react";

interface OrderWithDetails extends Order {
  returnStatus?: "requested" | "approved" | "rejected" | "refunded";
  returnRequestedAt?: string;
  refundAmount?: number;
  plyCreditsCredited?: boolean;
  deliveredAt?: string;
}

export default function MyOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders");
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === "products" 
      ? order.items.length > 0 
      : order.services && order.services.length > 0;
    
    const matchesSearch = order.items.some(item => 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || (order.services && order.services.some(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    const matchesStatus = selectedStatus === "all" || order.orderStatus === selectedStatus;
    
    const matchesPeriod = selectedPeriod === "all" || (() => {
      const orderDate = new Date(order.createdAt!);
      const now = new Date();
      const diffTime = now.getTime() - orderDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (selectedPeriod) {
        case "7days": return diffDays <= 7;
        case "30days": return diffDays <= 30;
        case "90days": return diffDays <= 90;
        default: return true;
      }
    })();

    return matchesTab && matchesSearch && matchesStatus && matchesPeriod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500";
      case "shipped": return "bg-blue-500";
      case "processing": return "bg-yellow-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getReturnStatusColor = (status?: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "rejected": return "bg-red-500";
      case "refunded": return "bg-blue-500";
      default: return "bg-yellow-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading your orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "products"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Package size={16} />
            Products
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "services"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Wrench size={16} />
            Services
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="placed">Placed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {activeTab === "products" ? <Package size={48} className="mx-auto" /> : <Wrench size={48} className="mx-auto" />}
          </div>
          <p className="text-gray-600">No {activeTab} orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-gray-800">Order #{order._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(order.createdAt!).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                    <span className="font-semibold text-gray-800">₹{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Items List */}
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {activeTab === "products" ? "Products" : "Services"}
                    </h4>
                    <div className="space-y-3">
                      {activeTab === "products" ? (
                        order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800">{item.productName}</h5>
                              <p className="text-sm text-gray-600">{item.brand.Brand_name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                <span className="font-medium text-gray-800">₹{item.productDiscountedPrice || item.productPrice}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        order.services?.map((service, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Wrench className="text-orange-600" size={24} />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800">{service.name}</h5>
                              <p className="text-sm text-gray-600">{service.description}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">Duration: {service.duration}</span>
                                <span className="font-medium text-gray-800">₹{service.price}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Order Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>₹{order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transport:</span>
                          <span>₹{order.transportCharge.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST:</span>
                          <span>₹{order.gst.toLocaleString()}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-₹{order.discount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
                          <span>Total:</span>
                          <span>₹{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <MapPin size={16} />
                        Delivery Address
                      </h4>
                      <p className="text-sm text-gray-600">
                        {order.address.name}<br />
                        {order.address.addressLine1}<br />
                        {order.address.city}, {order.address.state} - {order.address.pincode}
                      </p>
                    </div>

                    {/* Status Updates */}
                    {order.orderStatus === "delivered" && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          ✓ Delivered {order.deliveredAt && `on ${new Date(order.deliveredAt).toLocaleDateString()}`}
                        </p>
                        {order.plyCreditsCredited && (
                          <p className="text-xs text-green-600 mt-1">
                            <CreditCard size={12} className="inline mr-1" />
                            Ply Credits Credited
                          </p>
                        )}
                      </div>
                    )}

                    {/* Return Status */}
                    {order.returnStatus && (
                      <div className={`p-3 rounded-lg ${
                        order.returnStatus === "refunded" ? "bg-blue-50" : 
                        order.returnStatus === "approved" ? "bg-green-50" : 
                        order.returnStatus === "rejected" ? "bg-red-50" : "bg-yellow-50"
                      }`}>
                        <p className="text-sm font-medium">
                          Return Status: <span className={`px-2 py-1 rounded-full text-xs text-white ${getReturnStatusColor(order.returnStatus)}`}>
                            {order.returnStatus.charAt(0).toUpperCase() + order.returnStatus.slice(1)}
                          </span>
                        </p>
                        {order.returnStatus === "refunded" && order.refundAmount && (
                          <p className="text-xs text-gray-600 mt-1">
                            Refund Amount: ₹{order.refundAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                        View Details
                      </button>
                      {order.orderStatus === "delivered" && !order.returnStatus && (
                        <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          Return
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}