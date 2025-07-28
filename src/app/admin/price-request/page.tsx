"use client";

import { JSX, useEffect, useState } from "react";
import Image from "next/image";

// Proper TypeScript interface definition
interface RequestItem {
  _id: string;
  type: "architecture" | "service";
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  variant: string;
  variantId: string;
  variantName: string;
  variantImage?: string;
  city: string;
  status: "pending" | "completed" | "expired";
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  userId?: string;
  requestedAt: string;
  createdAt: string;
  completedAt?: string;
  finalPrice?: number;
  estimatedResponseTime?: string;
  requestId?: string;
}

// API Response interfaces
interface ApiResponse {
  success: boolean;
  requests?: RequestItem[];
  error?: string;
}

interface UserPricePayload {
  type: "architecture" | "service";
  userId?: string;
  serviceId: string;
  variant: string;
  variantId: string;
  variantName: string;
  city: string;
  finalPrice: number;
  priceRequestId: string;
}

export default function PriceRequestAdminPage(): JSX.Element {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [currentRequest, setCurrentRequest] = useState<RequestItem | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/price-request");
      const data: ApiResponse = await res.json();
      
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        console.error("Failed to fetch requests:", data.error);
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const openPriceModal = (request: RequestItem): void => {
    setCurrentRequest(request);
    setFinalPrice(request.finalPrice || null);
    setShowModal(true);
  };

  const openDetailsModal = (request: RequestItem): void => {
    setCurrentRequest(request);
    setShowDetailsModal(true);
  };

  const handlePriceSubmit = async (): Promise<void> => {
    if (!currentRequest || finalPrice === null || finalPrice <= 0) {
      alert("Please enter a valid final price");
      return;
    }

    setSubmitting(true);

    try {
      // Update the price request with final price and status
      const updateUrl = currentRequest.type === "architecture"
        ? `/api/architecture/price-request`
        : `/api/services/price-request`;

      const updateRes = await fetch(updateUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: currentRequest._id,
          finalPrice,
          status: "completed"
        }),
      });

      if (!updateRes.ok) {
        const error = await updateRes.json();
        console.error("❌ Failed to update price request:", error);
        alert("Failed to update price request. Please try again.");
        return;
      }

      // Create/update user-specific price record
      const userPricePayload: UserPricePayload = {
        type: currentRequest.type,
        userId: currentRequest.userId,
        serviceId: currentRequest.serviceId,
        variant: currentRequest.variant,
        variantId: currentRequest.variantId,
        variantName: currentRequest.variantName,
        city: currentRequest.city,
        finalPrice,
        priceRequestId: currentRequest._id
      };

      // First try to update existing price
      const updatePriceRes = await fetch("/api/admin/user-price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPricePayload),
      });

      // If no existing record, create a new one
      if (!updatePriceRes.ok) {
        const createRes = await fetch("/api/admin/user-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userPricePayload),
        });

        if (!createRes.ok) {
          const error = await createRes.json();
          console.error("❌ Failed to create user price:", error);
        }
      }

      // Update UI state
      setRequests(prev =>
        prev.map(r =>
          r._id === currentRequest._id 
            ? { 
                ...r, 
                status: "completed" as const, 
                finalPrice,
                completedAt: new Date().toISOString()
              } 
            : r
        )
      );

      setShowModal(false);
      alert("Price updated successfully!");

    } catch (err) {
      console.error("❌ Error during price submission:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search functionality
  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === "all" || request.status === filter;
    const matchesSearch = 
      request.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.variant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      request.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const completedCount = requests.filter(r => r.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-600">Price Request Management</h1>
          <p className="text-gray-600 mt-1">
            {pendingCount} pending, {completedCount} completed requests
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by service name, variant, user name, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-lg mt-2">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-lg text-gray-500">
            {searchTerm || filter !== "all" ? "No matching requests found." : "No price requests found."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {request.variantImage ? (
                            <Image
                              src={request.variantImage}
                              alt={request.variant}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-500">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {request.serviceName}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {request.type} Service
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{request.variant}</div>
                      {request.finalPrice && (
                        <div className="text-sm text-green-600 font-medium">
                          ₹{request.finalPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {request.userName || "Anonymous"}
                      </div>
                      {request.userPhone && (
                        <div className="text-sm text-gray-500">{request.userPhone}</div>
                      )}
                      {request.userEmail && (
                        <div className="text-sm text-gray-500 truncate max-w-[150px]">{request.userEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900">{request.city}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.requestedAt || request.createdAt)}
                      </div>
                      {request.completedAt && (
                        <div className="text-xs text-gray-500">
                          Completed: {formatDate(request.completedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm space-y-1">
                      <button
                        onClick={() => openDetailsModal(request)}
                        className="text-blue-600 hover:text-blue-800 block transition-colors"
                        type="button"
                      >
                        View Details
                      </button>
                      {request.status === "pending" && (
                        <button
                          onClick={() => openPriceModal(request)}
                          className="text-orange-600 hover:text-orange-800 block transition-colors"
                          type="button"
                        >
                          Set Price
                        </button>
                      )}
                      {request.status === "completed" && request.finalPrice && (
                        <button
                          onClick={() => openPriceModal(request)}
                          className="text-gray-600 hover:text-gray-800 block transition-colors"
                          type="button"
                        >
                          Update Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price Setting Modal */}
      {showModal && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {currentRequest.status === "completed" ? "Update Price" : "Set Final Price"}
            </h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Service:</strong> {currentRequest.serviceName}<br />
                <strong>Variant:</strong> {currentRequest.variant}<br />
                <strong>City:</strong> {currentRequest.city}<br />
                <strong>User:</strong> {currentRequest.userName || "Anonymous"}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="finalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Final Price (₹)
              </label>
              <input
                id="finalPrice"
                type="number"
                placeholder="Enter final price"
                value={finalPrice || ""}
                onChange={(e) => setFinalPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-between space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handlePriceSubmit}
                disabled={submitting || !finalPrice || finalPrice <= 0}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                {submitting ? "Saving..." : "Submit Price"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Request Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold transition-colors"
                type="button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Service Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {currentRequest.type}</p>
                  <p><strong>Service:</strong> {currentRequest.serviceName}</p>
                  <p><strong>Variant:</strong> {currentRequest.variant}</p>
                  <p><strong>City:</strong> {currentRequest.city}</p>
                  <p><strong>Service ID:</strong> {currentRequest.serviceId}</p>
                  {currentRequest.variantId && (
                    <p><strong>Variant ID:</strong> {currentRequest.variantId}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">User Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {currentRequest.userName || "Anonymous"}</p>
                  <p><strong>Phone:</strong> {currentRequest.userPhone || "N/A"}</p>
                  <p><strong>Email:</strong> {currentRequest.userEmail || "N/A"}</p>
                  <p><strong>User ID:</strong> {currentRequest.userId || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Request Status</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(currentRequest.status)}`}>
                      {currentRequest.status}
                    </span>
                  </p>
                  <p><strong>Requested At:</strong> {formatDate(currentRequest.requestedAt || currentRequest.createdAt)}</p>
                  {currentRequest.completedAt && (
                    <p><strong>Completed At:</strong> {formatDate(currentRequest.completedAt)}</p>
                  )}
                  {currentRequest.finalPrice && (
                    <p><strong>Final Price:</strong> ₹{currentRequest.finalPrice.toLocaleString()}</p>
                  )}
                </div>
              </div>

              {currentRequest.variantImage && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Variant Image</h3>
                  <Image
                    src={currentRequest.variantImage}
                    alt={currentRequest.variant}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}