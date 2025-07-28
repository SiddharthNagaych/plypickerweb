"use client";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { calculateDistance } from "../../utils/distanceCalculator";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import Image from "next/image";
import { MapPin, X } from "lucide-react";
import {
  applyCoupon,
  setTransport,
  setSelectedAddress,
  updateTransportCharges,
} from "../../store/cartSlice";
import type { RootState } from "../../store";
import { useGoogleMapsContext } from "../../components/home/common/context/GoogleMapsContext";
import { useSession } from "next-auth/react";
import AddressFormModal from "./Address/AddressFormModal";
import AddressSelectionModal from "./Address/AddressSelectionModal";
import TabSelector, { TabType } from "@/components/Cart1/TabSelector";

import ProgressBar from "@/components/Cart1/ProgressBar";

import router from "next/router";
import ItemsList from "../Cart1/items/ItemsList";
import BillingAddressCard from "../Cart1/address/BillingAddressCard";
import ShippingAddressCard from "../Cart1/address/ShippingAddressCard";
import CouponBox from "../Cart1/modifiers/CouponBox";
import PcashBox from "../Cart1/modifiers/PcashBox";
import TransportOptions, {
  TransportOption,
} from "../Cart1/modifiers/TransportOptions";
import AdvancePayment from "../Cart1/modifiers/AdvancePayment";
import SchedulePicker from "../Cart1/modifiers/SchedulePicker";
import GstModal from "../Cart1/modifiers/GstModal";
import OrderSummary from "../Cart1/summary/OrderSummary";
import ActionButtons from "../Cart1/summary/ActionButtons";
import { useOrderTotals } from "@/hooks/cart/useOrderTotals";
import { usePcashBalance } from "@/hooks/cart/usePcash";
import { useAddressBook } from "@/hooks/cart/useAddressBook";

import { usePayment } from "@/hooks/cart/usePayment";

const CartPage: React.FC = () => {
  const dispatch = useDispatch();

  const { data: session } = useSession();
  const { balance: pcashBalance, maxApplicable: maxPcashApplicable } =
    usePcashBalance(!!session?.user?.id);

  // New state for service-specific features
  const [advancePaymentPercentage, setAdvancePaymentPercentage] = useState<
    number | null
  >(null);
  const [serviceDate, setServiceDate] = useState<string>("");
  const [serviceTime, setServiceTime] = useState<string>("");
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstDetails, setGstDetails] = useState({
    companyName: "",
    gstNumber: "",
    billingAddress: null as Address | null,
  });
  const [companyName, setCompanyName] = useState("");
  const [gstVerified, setGstVerified] = useState(false);
  const [isGstModalContext, setIsGstModalContext] = useState(false);

  // 3. Add billing address state:
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);

  // Address state
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const {
    paying: isProcessingPayment,
    error: paymentError,
    payProduct,
    payService,
  } = usePayment();
  const { isLoaded: isGoogleMapsLoaded, loadError } = useGoogleMapsContext();

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

  const [usePcash, setUsePcash] = useState(false);

  const [pcashApplied, setPcashApplied] = useState(0);
  const [activeTab, setActiveTab] = useState<"products" | "services">(
    "products"
  );
  const [currentStep, setCurrentStep] = useState<
    "cart" | "checkout" | "payment"
  >("cart");
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showCouponPopup, setShowCouponPopup] = useState(false);

  const [addressSelectionMode, setAddressSelectionMode] = useState<
    "shipping" | "billing"
  >("shipping");
  const transportOptions =
    activeTab === "products"
      ? [
          {
            id: "bike" as TransportType,
            name: "Bike",
            time: "5-7 days",
            price: transportCharges.bike,
            image: "",
          },
          {
            id: "three_wheeler" as TransportType,
            name: "Three Wheeler",
            time: "2-3 days",
            price: transportCharges.three_wheeler,
            image: "",
          },
          {
            id: "tempo" as TransportType,
            name: "Tempo",
            time: "1-2 days",
            price: transportCharges.tempo,
            image: "",
          },
          {
            id: "pickup" as TransportType,
            name: "Pickup",
            time: "1-2 days",
            price: transportCharges.pickup,
            image: "",
          },
        ]
      : [];

  const {
    subtotal,
    laborCharges,
    transportCharge,
    gst,
    discount,
    pcashAppliedAmount,
    totalBeforePcash,
    total,
  } = useOrderTotals({
    activeTab,
    items,
    services,
    selectedAddress,
    transport,
    transportCharges,
    coupon,
    usePcash,
    pcashApplied,
    pcashBalance,
    maxPcashApplicable,
  });

  // Helper function
  const validateGst = () => {
    return true;
  };

  const canContinueToPayment =
    selectedAddress &&
    (useShippingAsBilling || billingAddress || gstVerified) &&
    !(
      activeTab === "services" &&
      (!serviceDate || !serviceTime || !advancePaymentPercentage)
    );

  const canPay =
    selectedAddress &&
    (useShippingAsBilling || billingAddress || gstVerified) &&
    total > 0 &&
    !(
      activeTab === "services" &&
      (!serviceDate || !serviceTime || !advancePaymentPercentage)
    );

  // Check if cart is empty (considering both products and services)
  const isCartEmpty =
    items.length === 0 && (!services || services.length === 0);

  const {
    addresses: userAddresses,
    addAddress,
    removeAddress,
  } = useAddressBook(!!session?.user?.id);

  const handlePayment = async () => {
    /* ── safety guards ─────────────────────────────── */
    if (!session?.user) {
      console.error("No user session");
      return;
    }
    if (!selectedAddress) {
      console.error("Please select a delivery address");
      return;
    }
    if (gstVerified && !validateGst()) {
      console.error("Invalid GST details");
      return;
    }

    try {
      /* ── service flow ─────────────────────────────── */
      if (activeTab === "services") {
        const advanceAmt = Math.round(
          total * (advancePaymentPercentage! / 100)
        );

        const ok = await payService({
          userId: session.user.id,
          services: services.map((s) => ({
            serviceId: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            quantity: s.quantity ?? 1,
          })),
          shippingAddress: selectedAddress,
          billingAddress: useShippingAsBilling
            ? selectedAddress
            : billingAddress,
          subtotal,
          gst,
          discount,
          total,
          scheduledDate: serviceDate,
          scheduledTime: serviceTime,
          advancePayment: {
            percentage: advancePaymentPercentage!,
            amount: advanceAmt,
          },
          gstDetails: gstVerified
            ? {
                companyName,
                gstNumber,
                billingAddress: billingAddress ?? selectedAddress,
              }
            : undefined,
        });
        if (ok) router.push("/my-orders");
        return;
      }

      /* ── product flow ─────────────────────────────── */
      const ok = await payProduct({
        items,
        subtotal,
        laborCharges,
        transportCharge,
        gst,
        discount,
        total,

        customer: {
          id: session.user.id,
          email: session.user.email ?? "", // fallback to empty string
          phone: selectedAddress.phone ?? "",
          name: session.user.name ?? "",
        },
        shippingAddress: selectedAddress,
        billingAddress: useShippingAsBilling ? selectedAddress : billingAddress,
      });

      if (ok) router.push("/my-orders");
    } catch (err) {
      console.error("Payment error:", err);
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

  // Coupon Popup Component
  const CouponPopup = () => {
    if (!showCouponPopup) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-[0px_2px_8px_0px_#00000033]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Available Coupons</h3>
            <button
              onClick={() => setShowCouponPopup(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {availableCoupons.map((availableCoupon) => (
              <div
                key={availableCoupon.id}
                className="p-3 border rounded-lg hover:border-[#FF7803] cursor-pointer shadow-sm"
                onClick={() => handleApplyCoupon(availableCoupon.code)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-black">
                      {availableCoupon.code}
                    </span>
                    <p className="text-sm text-gray-600">
                      {availableCoupon.type === "percentage"
                        ? `${availableCoupon.discount}% off`
                        : `₹${availableCoupon.discount} off`}
                    </p>
                  </div>
                  <button className="text-[#FF7803] text-sm font-medium">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const AddressPopup = () => {
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

    const CENTER_PUNE = { lat: 18.5204, lng: 73.8567 };
    const geocodeCache = useRef<Record<string, any>>({});
    const distanceCache = useRef<Record<string, number>>({});

    const extractPincode = (address: string): string => {
      const pincodeMatch = address.match(/\b\d{6}\b/);
      return pincodeMatch ? pincodeMatch[0] : "";
    };

    const handleGetCurrentLocation = async () => {
      setLoading(true);
      setError(null);
      setSelectedLocation(null);

      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }

        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps is not loaded yet");
        }

        // Get current position
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              (err) => {
                reject(new Error(`Failed to get location: ${err.message}`));
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            );
          }
        );

        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        const results = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === "OK" && results) {
                  resolve(results);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
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

          // Center the map on the found location
          if (map) {
            map.panTo(new google.maps.LatLng(latitude, longitude));
            map.setZoom(15);
          }
        } else {
          throw new Error("No address found for this location");
        }
      } catch (err) {
        console.error("Error getting location:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not get your current location. Please try again or enter manually."
        );
      } finally {
        setLoading(false);
      }
    };

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

    const confirmLocation = async () => {
      if (!selectedLocation || !distanceFromCenter || !session?.user?.id)
        return;

      const addressComponents = selectedLocation.address.split(",");
      const newAddress = {
        name: "My Location",
        phone: session.user.phone || "7524864876",
        addressLine1: addressComponents[0] || "",
        city: addressComponents[addressComponents.length - 3]?.trim() || "",
        state: addressComponents[addressComponents.length - 2]?.trim() || "",
        pincode: selectedLocation.pincode,
        country: "India",
        type: "HOME",
        coordinates: selectedLocation.coords,
        distanceFromCenter,
        isDefault: false,
        userId: session.user.id,
      };

      try {
        const response = await fetch("/api/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddress),
        });

        if (response.ok) {
          const savedAddress = await response.json();
          dispatch(setSelectedAddress(savedAddress));
          dispatch(
            updateTransportCharges({
              bike: Math.round(savedAddress.distanceFromCenter * 10),
              three_wheeler: Math.round(savedAddress.distanceFromCenter * 15),
              tempo: Math.round(savedAddress.distanceFromCenter * 20),
              pickup: Math.round(savedAddress.distanceFromCenter * 25),
            })
          );
          setShowAddressPopup(false);
        }
      } catch (error) {
        console.error("Error saving address:", error);
        setError("Failed to save address. Please try again.");
      }
    };

    if (loadError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-[0px_2px_8px_0px_#00000033]">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-[0px_2px_8px_0px_#00000033]">
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
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0px_2px_8px_0px_#00000033]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Select Delivery Location</h3>
            <button
              onClick={() => setShowAddressPopup(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <button
              className="flex items-center w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={handleGetCurrentLocation}
              disabled={loading}
            >
              <MapPin className="w-5 h-5 text-[#FF7803]" />
              <span className="ml-2">
                {loading
                  ? "Detecting your location..."
                  : "Use Current Location"}
              </span>
              {loading && (
                <span className="ml-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF7803]"></div>
                </span>
              )}
            </button>
          </div>

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

          {error && (
            <div className="p-2 mb-4 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

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

          {selectedLocation && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4 shadow-sm">
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
        <TabSelector activeTab={activeTab} onChange={setActiveTab} />

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-8 space-y-6">
            {/* Checkout Step - Show address cards */}
            {currentStep === "checkout" && (
              <div className="space-y-6">
                {/* Shipping Address Card */}
                <ShippingAddressCard
                  address={selectedAddress}
                  onChangeClick={() => {
                    setAddressSelectionMode("shipping");
                    setShowAddressSelection(true);
                  }}
                />

                {/* Billing Address Card */}
                <BillingAddressCard
                  gstVerified={gstVerified}
                  companyName={companyName}
                  gstNumber={gstNumber}
                  useShippingAsBilling={useShippingAsBilling}
                  billingAddress={billingAddress}
                  onToggleSame={(checked) => {
                    setUseShippingAsBilling(checked);
                    if (checked) setBillingAddress(null);
                  }}
                  onAddOrChange={() => {
                    setAddressSelectionMode("billing");
                    setShowAddressSelection(true);
                  }}
                />
              </div>
            )}

            {!selectedAddress ? (
              <div className="bg-white p-6 rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                </div>
                <button
                  onClick={() => {
                    setAddressSelectionMode("shipping");
                    setShowAddressSelection(true);
                  }}
                  className="w-full py-3 border-2 border-dashed border-[#FF7803] rounded-lg text-[#FF7803] font-medium flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Address
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <button
                    onClick={() => {
                      setAddressSelectionMode("shipping");
                      setShowAddressSelection(true);
                    }}
                    className="text-[#FF7803] text-sm hover:underline"
                  >
                    Change
                  </button>
                </div>
                <div className="text-black">
                  <p className="font-medium">{selectedAddress.name}</p>
                  <p className="text-sm">{selectedAddress.phone}</p>
                  <p className="mt-2">{selectedAddress.addressLine1}</p>
                  <p>
                    {selectedAddress.city}, {selectedAddress.state}{" "}
                    {selectedAddress.pincode}
                  </p>
                  {selectedAddress.distanceFromCenter && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedAddress.distanceFromCenter.toFixed(1)} km from
                      center
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Address Display Section - Add this */}
            {selectedAddress && currentStep === "cart" && (
              <div className="p-4 border rounded-lg mb-6 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{selectedAddress.name}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedAddress.addressLine1}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedAddress.city}, {selectedAddress.state} -{" "}
                      {selectedAddress.pincode}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {selectedAddress.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch(setSelectedAddress(null))}
                    className="text-gray-500 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === "cart" && (
              <div className="space-y-4">
                {/* Cart Step - Show products/services */}
                <ItemsList activeTab={activeTab} />
                {/* END of cart list */}
              </div>
            )}
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-[0px_2px_8px_0px_#00000033] sticky top-6">
              <div className="p-4">
                {/* GST Section - Show in cart step */}
                {currentStep === "cart" && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-black">
                        GST Details
                      </h3>
                      {gstVerified ? (
                        <button
                          onClick={() => {
                            setGstVerified(false);
                            setCompanyName("");
                            setGstNumber("");
                            setGstDetails({
                              companyName: "",
                              gstNumber: "",
                              billingAddress: null,
                            });
                          }}
                          className="text-red-500 text-sm font-medium"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowGstModal(true)}
                          className="text-[#FF7803] text-sm font-medium"
                        >
                          Add GST
                        </button>
                      )}
                    </div>

                    {gstVerified ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-600 font-medium text-sm">
                            GST Registered
                          </span>
                        </div>
                        <p className="font-medium text-sm">{companyName}</p>
                        <p className="text-xs text-gray-600">
                          GST: {gstNumber}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 border border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-gray-500 text-sm">
                          No GST details added
                        </p>
                        <button
                          onClick={() => setShowGstModal(true)}
                          className="text-[#FF7803] text-sm mt-1"
                        >
                          Add for business purchase
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "services" && (
                  <>
                    <AdvancePayment
                      subtotal={subtotal}
                      selectedPct={advancePaymentPercentage}
                      onSelect={(pct) => setAdvancePaymentPercentage(pct)}
                    />

                    <SchedulePicker
                      date={serviceDate}
                      time={serviceTime}
                      onDateChange={setServiceDate}
                      onTimeChange={setServiceTime}
                    />
                  </>
                )}

                <CouponBox />

                <PcashBox
                  balance={pcashBalance}
                  usePcash={usePcash}
                  maxApplicable={maxPcashApplicable}
                  applied={pcashApplied}
                  onToggle={setUsePcash}
                  onChangeAmount={(val) =>
                    setPcashApplied(
                      Math.min(val, pcashBalance, maxPcashApplicable)
                    )
                  }
                />

                {activeTab === "products" && currentStep === "cart" && (
                  <TransportOptions
                    options={transportOptions as TransportOption[]}
                    selectedId={transport as TransportType | null}
                    onSelect={(id) => dispatch(setTransport(id))}
                  />
                )}

                {/* Order Summary */}
                <OrderSummary
                  activeTab={activeTab}
                  serviceDate={serviceDate}
                  serviceTime={serviceTime}
                  advancePct={advancePaymentPercentage}
                  itemCount={items.length + (services?.length || 0)}
                  subtotal={subtotal}
                  labor={laborCharges}
                  transport={transportCharge}
                  gst={gst}
                  discount={discount}
                  pcashApplied={pcashAppliedAmount}
                  total={total}
                  gstVerified={gstVerified}
                  companyName={companyName}
                  gstNumber={gstNumber}
                />

                <GstModal
                  isOpen={showGstModal}
                  onClose={() => setShowGstModal(false)}
                  details={gstDetails}
                  onChange={setGstDetails}
                  onSelectBilling={() => {
                    setAddressSelectionMode("billing");
                    setShowGstModal(false); // close modal before opening address list
                    setTimeout(() => setShowAddressSelection(true), 0);
                  }}
                  onSave={() => {
                    if (validateGst()) {
                      setGstVerified(true);
                      setCompanyName(gstDetails.companyName);
                      setGstNumber(gstDetails.gstNumber);
                      setShowGstModal(false);
                    }
                  }}
                />

                <ActionButtons
                  currentStep={currentStep}
                  activeTab={activeTab}
                  isCartEmpty={isCartEmpty}
                  canContinueToPayment={!!canContinueToPayment}
                  canPay={!!canPay}
                  isProcessingPayment={isProcessingPayment}
                  onProceedToCheckout={() => setCurrentStep("checkout")}
                  onBackToCart={() =>
                    setCurrentStep(
                      currentStep === "payment" ? "checkout" : "cart"
                    )
                  }
                  onContinueToPayment={() => setCurrentStep("payment")}
                  onPay={handlePayment}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popups */}
      {showAddressSelection && (
        <AddressSelectionModal
          isOpen={showAddressSelection}
          onClose={() => {
            setShowAddressSelection(false);
            setIsGstModalContext(false);
          }}
          selectedAddress={
            addressSelectionMode === "shipping"
              ? selectedAddress
              : billingAddress
          }
          onSelectAddress={(address) => {
            if (addressSelectionMode === "shipping") {
              dispatch(setSelectedAddress(address));
            } else if (addressSelectionMode === "billing") {
              // If we're in GST modal context, update GST details
              if (showGstModal) {
                setGstDetails({
                  ...gstDetails,
                  billingAddress: address,
                });
              } else {
                setBillingAddress(address);
              }
            }
            setShowAddressSelection(false);
          }}
          onAddNewAddress={() => {
            setShowAddressSelection(false);
            setShowAddressForm(true);
          }}
          onRemoveAddress={removeAddress}
          addresses={userAddresses}
          mode={addressSelectionMode}
          onUseCurrentLocation={() => {
            setShowAddressSelection(false); // Close address selection
            setShowAddressPopup(true); // Open the address popup for current location
          }}
        />
      )}

      {showAddressForm && (
        <AddressFormModal
          isOpen={showAddressForm}
          onClose={() => setShowAddressForm(false)}
          onSubmit={(address) => {
            if (addressSelectionMode === "shipping") {
              addAddress(address);
            } else {
              setBillingAddress(address);
              setShowAddressForm(false);
            }
          }}
          mode={addressSelectionMode}
        />
      )}

      {showAddressPopup && <AddressPopup />}
      <CouponPopup />
    </div>
  );
};
export default CartPage;
