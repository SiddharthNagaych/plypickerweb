"use client";
//@ts-ignore
import { load } from "@cashfreepayments/cashfree-js";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { calculateDistance } from "../../utils/distanceCalculator";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";

import {
  MapPin,
  Plus,
  Minus,
  X,
  Heart,
  Package,
  Wrench,
  Tag,
  Truck,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import {
  addItem,
  updateQuantity,
  removeItem,
  toggleLabor,
  updateLaborFloors,
  applyCoupon,
  removeCoupon,
  setTransport,
  updateAddress,
  setSelectedAddress,
  updateTransportCharges,
  clearCart,
} from "../../store/cartSlice";
import type { RootState } from "../../store";
import { useGoogleMapsContext } from "../../components/home/common/context/GoogleMapsContext";
import { useSession } from "next-auth/react";





const CartPage: React.FC = () => {
  const dispatch = useDispatch();
 
  const { data: session } = useSession();



  // Payment-related state
  const [cashfree, setCashfree] = useState<any>(null);
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Redux state
  const {
    items,
    services,
    transport,
    coupon,
    selectedAddress,
    transportCharges,
  } = useSelector((state: RootState) => state.cart);

  // Component state
  const [availableCoupons, setAvailableCoupons] = useState<ICoupon[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [pcashBalance, setPcashBalance] = useState(0);
  const [usePcash, setUsePcash] = useState(false);
  const [maxPcashApplicable, setMaxPcashApplicable] = useState(0);
  const [pcashApplied, setPcashApplied] = useState(0);
  const [activeTab, setActiveTab] = useState<"products" | "services">(
    "products"
  );
  const [currentStep, setCurrentStep] = useState<
    "cart" | "checkout" | "payment"
  >("cart");
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.productDiscountedPrice ?? item.productPrice) * item.quantity,
    0
  );

  const laborCharges = items.reduce((sum, item) => {
    if (item.includeLabor && item.laborPerFloor && item.laborFloors) {
      return sum + item.laborPerFloor * item.laborFloors;
    }
    return sum;
  }, 0);

  const transportCharge =
    transport === "standard"
      ? 100
      : transportCharges[transport as keyof typeof transportCharges] || 0;

  const gst = Math.round((subtotal + laborCharges + transportCharge) * 0.18);

  const discount = coupon
    ? coupon.type === "percentage"
      ? Math.round((subtotal * coupon.discount) / 100)
      : coupon.discount
    : 0;

  const pcashAppliedAmount = usePcash
    ? Math.min(pcashBalance, maxPcashApplicable, pcashApplied)
    : 0;

  const totalBeforePcash =
    subtotal + laborCharges + transportCharge + gst - discount;
  const total = Math.max(0, totalBeforePcash - pcashAppliedAmount);

  const transportOptions = [
    {
      id: "bike" as TransportType,
      name: "Bike",
      time: "5-7 days",
      price: transportCharges.bike || 50,
      image: "",
    },
    {
      id: "three_wheeler" as TransportType,
      name: "Three Wheeler",
      time: "2-3 days",
      price: transportCharges.three_wheeler || 150,
      image: "",
    },
    {
      id: "tempo" as TransportType,
      name: "Tempo",
      time: "1-2 days",
      price: transportCharges.tempo || 489,
      image: "",
    },
    {
      id: "pickup" as TransportType,
      name: "Pickup",
      time: "1-2 days",
      price: transportCharges.pickup || 613,
      image: "",
    },
  ];

  const { isLoaded: isGoogleMapsLoaded, loadError } = useGoogleMapsContext();

const createPaymentSession = async () => {
  try {
    if (!selectedAddress) throw new Error("Please select a delivery address");
    if (!session?.user?.email) throw new Error("User session not found");
    if (total <= 0) throw new Error("Invalid order amount");

    const orderData = {
      amount: total,
      customer: {
        customer_id: session.user.id || `guest_${Date.now()}`,
        customer_email: session.user.email,
        customer_phone: selectedAddress.phone || "7524864876",
        customer_name:
          selectedAddress.name || session.user.name || "Guest User",
      },
      order_meta: {
        return_url: `${window.location.origin}/payment/success?order_id={order_id}`,
        notify_url: `${window.location.origin}/api/payment/webhook`,
      },
      payment_methods: "cc,dc,upi", // ✅ Make this dynamic if needed
    };

    const response = await fetch("/api/payment/createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create payment session");
    }

    return data;
  } catch (error) {
    console.error("Error creating payment session:", error);
    throw error;
  }
};

const handleCashfreePayment = async () => {
  setIsProcessingPayment(true);
  setPaymentError(null);

  try {
    const data = await createPaymentSession();

    if (!data?.payment_session_id) {
      throw new Error("Payment session ID not received from server");
    }
    
    const { load } = await import("@cashfreepayments/cashfree-js");
    const cashfree = await load({ mode: "sandbox" });

    const result = await cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_modal",
    });

    if (result.error) {
      console.log("Popup closed or error:", result.error);
    } else if (result.paymentDetails) {
      console.log("Payment completed:", result.paymentDetails);
    }
  } catch (error) {
    console.error("Payment error:", error);
    setPaymentError(
      error instanceof Error
        ? error.message
        : "Payment failed. Please try again."
    );
  } finally {
    setIsProcessingPayment(false);
  }
};






  // Fetch available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch("/api/profile/coupons");
        if (!response.ok) throw new Error("Failed to fetch coupons");
        const data = await response.json();
        setAvailableCoupons(data);
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      }
    };

    fetchCoupons();
  }, []);

  // Fetch PCash balance
  useEffect(() => {
    const fetchPcashBalance = async () => {
      try {
        const response = await fetch("/api/profile/pcash");
        if (!response.ok) throw new Error("Failed to fetch PCash balance");
        const data = await response.json();

        setPcashBalance(data.currentBalance);
        const maxApplicable = Math.min(
          data.currentBalance,
          Math.round(subtotal * 0.3)
        );
        setMaxPcashApplicable(maxApplicable);
        setPcashApplied(maxApplicable);
      } catch (error) {
        console.error("Failed to fetch PCash balance:", error);
      }
    };

    if (session?.user?.id) {
      fetchPcashBalance();
    }
  }, [session?.user?.id, subtotal]);

  // Handle apply coupon
  const handleApplyCoupon = async (code?: string) => {
    const couponCode = code || couponInput;
    if (!couponCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await fetch("/api/profile/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: couponCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid coupon code");
      }

      const couponData = await response.json();
      dispatch(applyCoupon(couponData));
      setCouponError("");
      setCouponInput("");
    } catch (error: any) {
      setCouponError(error.message);
    }
  };

  // Helper function to calculate transport charges
  const calculateTransportCharge = (
    basePrice: number,
    distanceKm: number
  ): number => {
    let charge = basePrice;

    if (distanceKm > 20) {
      charge += basePrice * 0.2 * (distanceKm - 20);
    } else if (distanceKm > 10) {
      charge += basePrice * 0.15 * (distanceKm - 10);
    } else if (distanceKm > 5) {
      charge += basePrice * 0.1 * (distanceKm - 5);
    }

    return Math.round(charge);
  };

  // Stepper component
  const CartStepper = () => {
    const steps = [
      { id: "cart", name: "Cart" },
      { id: "checkout", name: "Checkout" },
      { id: "payment", name: "Payment" },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? "bg-[#FF7803] text-white"
                      : steps.findIndex((s) => s.id === currentStep) > index
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {steps.findIndex((s) => s.id === currentStep) > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-gray-600">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-20 mx-4 ${
                    steps.findIndex((s) => s.id === currentStep) > index
                      ? "bg-green-500"
                      : currentStep === step.id
                      ? "bg-[#FF7803]"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Address Popup Component
  const AddressPopup = () => {
    if (!showAddressPopup) return null;

    // State for location management
    const [userLocation, setUserLocation] = useState<{
      lat: number;
      lng: number;
    } | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<{
      address: string;
      coords: { lat: number; lng: number };
      pincode: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [distanceFromCenter, setDistanceFromCenter] = useState<number | null>(
      null
    );

    // Central Pune coordinates
    const CENTER_PUNE = { lat: 18.5204, lng: 73.8567 };

    // Cache for storing geocoding results
    const geocodeCache = useRef<Record<string, any>>({});
    const distanceCache = useRef<Record<string, number>>({});

    // Extract pincode from address
    const extractPincode = (address: string): string => {
      const pincodeMatch = address.match(/\b\d{6}\b/);
      return pincodeMatch ? pincodeMatch[0] : "";
    };

    // Handle current location
    const handleGetCurrentLocation = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );

        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        const results = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === "OK" && results) resolve(results);
                else reject(new Error("Geocoding failed"));
              }
            );
          }
        );

        if (results[0]) {
          const address = results[0].formatted_address;
          const pincode = extractPincode(address);
          const location = {
            address,
            coords: { lat: latitude, lng: longitude },
            pincode,
          };

          setSelectedLocation(location);
          calculateDistanceFromCenter(location.coords);
        }
      } catch (err) {
        console.error("Error getting location:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not get your current location"
        );
      } finally {
        setLoading(false);
      }
    };

    // Calculate distance from center
    const calculateDistanceFromCenter = async (destination: {
      lat: number;
      lng: number;
    }) => {
      const cacheKey = `${destination.lat},${destination.lng}`;

      if (distanceCache.current[cacheKey]) {
        setDistanceFromCenter(distanceCache.current[cacheKey]);
        return;
      }

      try {
        const dist = await calculateDistance(
          CENTER_PUNE,
          destination,
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
        );

        distanceCache.current[cacheKey] = dist;
        setDistanceFromCenter(dist);
      } catch (err) {
        console.error("Distance calculation error:", err);
        setDistanceFromCenter(null);
      }
    };

    // Handle search
    const handleSearch = async () => {
      if (!map || !searchQuery) return;

      setLoading(true);
      setError(null);

      try {
        if (geocodeCache.current[searchQuery]) {
          const cached = geocodeCache.current[searchQuery];
          setSelectedLocation(cached);
          map.panTo(
            new google.maps.LatLng(cached.coords.lat, cached.coords.lng)
          );
          map.setZoom(15);
          calculateDistanceFromCenter(cached.coords);
          return;
        }

        const geocoder = new google.maps.Geocoder();
        const results = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode({ address: searchQuery }, (results, status) => {
              if (status === "OK" && results) resolve(results);
              else reject(new Error("Location not found"));
            });
          }
        );

        if (results[0]) {
          const location = results[0].geometry.location;
          const address = results[0].formatted_address;
          const pincode = extractPincode(address);
          const locationData = {
            address,
            coords: { lat: location.lat(), lng: location.lng() },
            pincode,
          };

          geocodeCache.current[searchQuery] = locationData;

          setSelectedLocation(locationData);
          map.panTo(location);
          map.setZoom(15);
          calculateDistanceFromCenter(locationData.coords);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(
          err instanceof Error ? err.message : "Could not find location"
        );
      } finally {
        setLoading(false);
      }
    };

    // Confirm location
    const confirmLocation = () => {
      if (!selectedLocation) return;

      const addressComponents = selectedLocation.address.split(",");
      const newAddress: Address = {
        id: `addr_${Date.now()}`,
        name: "My Location",
        phone: "",
        addressLine1: addressComponents[0] || "",
        city: addressComponents[addressComponents.length - 3]?.trim() || "",
        state: addressComponents[addressComponents.length - 2]?.trim() || "",
        pincode: selectedLocation.pincode,
        country: "India",
        type: "HOME" as AddressType,
        isDefault: false,
        coordinates: selectedLocation.coords,
        distanceFromCenter: distanceFromCenter || 0,
      };

      if (distanceFromCenter) {
        dispatch(
          updateTransportCharges({
            bike: calculateTransportCharge(50, distanceFromCenter),
            three_wheeler: calculateTransportCharge(150, distanceFromCenter),
            tempo: calculateTransportCharge(489, distanceFromCenter),
            pickup: calculateTransportCharge(613, distanceFromCenter),
          })
        );
      }

      dispatch(setSelectedAddress(newAddress));
      setShowAddressPopup(false);
    };

    // Loading or error states
    if (loadError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Error Loading Maps</h3>
              <p className="text-gray-600 mb-4">
                Unable to load Google Maps. Please try again later.
              </p>
              <button
                onClick={() => setShowAddressPopup(false)}
                className="bg-[#FF7803] text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!isGoogleMapsLoaded) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Loading Maps...</h3>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7803] mx-auto"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Select Delivery Location</h3>
            <button
              onClick={() => setShowAddressPopup(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Location Button */}
          <div className="mb-6">
            <button
              className="flex items-center w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={handleGetCurrentLocation}
              disabled={loading}
            >
              <MapPin className="w-5 h-5 text-[#FF7803]" />
              <span className="ml-2">Use Current Location</span>
              {loading && <span className="ml-2">Loading...</span>}
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Search for area, street name, or pincode..."
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery}
              className={`px-4 py-2 rounded-r-lg ${
                loading || !searchQuery
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#FF7803] text-white hover:bg-orange-600"
              }`}
            >
              Search
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 mb-4 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          {/* Map Container */}
          <div className="h-64 w-full bg-gray-100 rounded-lg mb-4 relative">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={userLocation || CENTER_PUNE}
              zoom={userLocation ? 15 : 12}
              onLoad={(map) => setMap(map)}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {selectedLocation && (
                <>
                  <Marker position={selectedLocation.coords} />
                  {distanceFromCenter && (
                    <Circle
                      center={CENTER_PUNE}
                      radius={distanceFromCenter * 1000}
                      options={{
                        fillColor: "#FF7803",
                        fillOpacity: 0.2,
                        strokeColor: "#FF7803",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                      }}
                    />
                  )}
                </>
              )}
            </GoogleMap>
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="font-medium">Selected Location:</p>
              <p className="text-sm text-gray-600">
                {selectedLocation.address}
              </p>
              {distanceFromCenter && (
                <p className="text-xs text-gray-500 mt-1">
                  {distanceFromCenter.toFixed(1)} km from center of Pune
                </p>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={confirmLocation}
            disabled={!selectedLocation || loading}
            className={`w-full py-3 rounded-lg font-semibold ${
              !selectedLocation || loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#FF7803] text-white hover:bg-orange-600"
            }`}
          >
            {loading ? "Processing..." : "Confirm Location"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex bg-white rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md flex items-center gap-2 ${
                activeTab === "products"
                  ? "bg-[#FF7803] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Products
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === "products"
                    ? "bg-white bg-opacity-20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {items.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md flex items-center gap-2 ${
                activeTab === "services"
                  ? "bg-[#FF7803] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Services
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === "services"
                    ? "bg-white bg-opacity-20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {services?.length || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <CartStepper />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-8 space-y-6">
            {/* Address Card - Only in cart step */}
            {currentStep === "cart" && (
              <div className="p-6 rounded-lg bg-[#F7F7F7] shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-3xl font-semibold flex items-center gap-2">
                    Address
                  </h3>
                  <button
                    onClick={() => setShowAddressPopup(true)}
                    className="text-[#FF7803] text-sm font-medium hover:underline"
                  >
                    Change
                  </button>
                </div>
                {selectedAddress ? (
                  <div className="text-gray-700">
                    <p className="font-medium">{selectedAddress.name}</p>
                    <p className="text-sm">{selectedAddress.phone}</p>
                    <p className="mt-2">{selectedAddress.addressLine1}</p>
                    <p>
                      {selectedAddress.city}, {selectedAddress.state}{" "}
                      {selectedAddress.pincode}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedAddress.type} • {selectedAddress.country}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No address selected</p>
                )}
              </div>
            )}

            {/* Checkout step descriptions */}
            {currentStep === "checkout" && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">
                    Delivery Information
                  </h3>
                  <p className="text-gray-600">
                    Your order will be delivered to the selected address. Please
                    ensure someone is available to receive the delivery.
                  </p>
                </div>

                {/* Transport Options */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Select Transport Option
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transportOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          transport === option.id
                            ? "border-[#FF7803] bg-orange-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => dispatch(setTransport(option.id))}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{option.name}</h4>
                            <p className="text-sm text-gray-600">
                              {option.time}
                            </p>
                          </div>
                          <span className="font-semibold text-[#FF7803]">
                            ₹{option.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === "payment" && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                {/* Show payment error if any */}
                {paymentError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{paymentError}</p>
                  </div>
                )}
              </div>
            )}
            {/* Cart Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {activeTab === "products" ? "Products" : "Services"} in Cart
              </h3>

              {activeTab === "products" && (
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <img
                          src={item.productImage || "/placeholder.jpg"}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-gray-600">
                            {item.productDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-semibold text-[#FF7803]">
                              ₹
                              {item.productDiscountedPrice ?? item.productPrice}
                            </span>
                            {item.productDiscountedPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{item.productPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  productId: item.productId,
                                  variantIndex: item.variantIndex,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              )
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  productId: item.productId,
                                  variantIndex: item.variantIndex,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              )
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Labor Option */}
                        {item.laborPerFloor && (
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={item.includeLabor}
                                onChange={() =>
                                  dispatch(
                                    toggleLabor({
                                      productId: item.productId,
                                      variantIndex: item.variantIndex,
                                      includeLabor: !item.includeLabor,
                                    })
                                  )
                                }
                              />
                              <Wrench className="w-4 h-4" />
                              Labor
                            </label>
                            {item.includeLabor && (
                              <input
                                type="number"
                                min="1"
                                value={item.laborFloors || 1}
                                onChange={(e) =>
                                  dispatch(
                                    updateLaborFloors({
                                      productId: item.productId,
                                      variantIndex: item.variantIndex,
                                      floors: parseInt(e.target.value),
                                    })
                                  )
                                }
                                className="w-16 p-1 border rounded text-center"
                              />
                            )}
                          </div>
                        )}

                        {/* Remove Button */}
                        <button
                          onClick={() =>
                            dispatch(
                              removeItem({
                                productId: item.productId,
                                variantIndex: item.variantIndex,
                              })
                            )
                          }
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "services" && (
                <div className="space-y-4">
                  {!services || services.length === 0 ? (
                    <div className="text-center py-12">
                      <Wrench className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No services selected</p>
                    </div>
                  ) : (
                    services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Wrench className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                          <span className="font-semibold text-[#FF7803]">
                            ₹{service.price}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              {/* Subtotal */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                {/* Labor Charges */}
                {laborCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Labor Charges</span>
                    <span>₹{laborCharges}</span>
                  </div>
                )}

                {/* Transport Charges */}
                <div className="flex justify-between">
                  <span>Transport</span>
                  <span>₹{transportCharge}</span>
                </div>

                {/* GST */}
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{gst}</span>
                </div>

                {/* Discount */}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}

                {/* PCash Applied */}
                {pcashAppliedAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>PCash Applied</span>
                    <span>-₹{pcashAppliedAmount}</span>
                  </div>
                )}
              </div>

              {/* Coupon Section */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Apply Coupon
                </h4>

                {coupon ? (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-green-700 font-medium">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => dispatch(removeCoupon())}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
                      />
                      <button
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-2 bg-[#FF7803] text-white rounded hover:bg-orange-600"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-500">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Available Coupons */}
              {availableCoupons.length > 0 && !coupon && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Available Coupons</h4>
                  <div className="space-y-2">
                    {availableCoupons.slice(0, 3).map((availableCoupon) => (
                      <div
                        key={availableCoupon._id}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => handleApplyCoupon(availableCoupon.code)}
                      >
                        <div>
                          <span className="font-medium">
                            {availableCoupon.code}
                          </span>
                          <p className="text-xs text-gray-600">
                            {availableCoupon.type === "percentage"
                              ? `${availableCoupon.discount}% off`
                              : `₹${availableCoupon.discount} off`}
                          </p>
                        </div>
                        <button className="text-[#FF7803] text-sm">
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PCash Section */}
              {pcashBalance > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    PCash Balance: ₹{pcashBalance}
                  </h4>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={usePcash}
                      onChange={(e) => setUsePcash(e.target.checked)}
                    />
                    <span className="text-sm">
                      Use PCash (Max: ₹{maxPcashApplicable})
                    </span>
                  </label>
                  {usePcash && (
                    <input
                      type="range"
                      min="0"
                      max={maxPcashApplicable}
                      value={pcashApplied}
                      onChange={(e) =>
                        setPcashApplied(parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  )}
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-[#FF7803]">₹{total}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {currentStep === "cart" && (
                  <>
                    <button
                      onClick={() => setCurrentStep("checkout")}
                      disabled={items.length === 0 || !selectedAddress}
                      className="w-full py-3 bg-[#FF7803] text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={() => dispatch(clearCart())}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear Cart
                    </button>
                  </>
                )}

                {currentStep === "checkout" && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setCurrentStep("payment")}
                      disabled={!transport || !selectedAddress}
                      className="w-full py-3 bg-[#FF7803] text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                    >
                      Continue to Payment
                    </button>
                    <button
                      onClick={() => setCurrentStep("cart")}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Cart
                    </button>
                  </div>
                )}

                {currentStep === "payment" && (
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          // First try the SDK method
                          await handleCashfreePayment();
                        } catch (sdkError) {
                          console.log(
                            "SDK payment failed, trying redirect...",
                            sdkError
                          );
                         
                        }
                      }}
                      disabled={isProcessingPayment}
                      className={`w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors ${
                        isProcessingPayment
                          ? "opacity-70 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isProcessingPayment ? "Processing..." : "Place Order"}
                    </button>
                    <button
                      onClick={() => setCurrentStep("checkout")}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Popup */}
      <AddressPopup />
    </div>
  );
};

export default CartPage;
