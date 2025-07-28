"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addService } from "@/store/cartSlice";
import { useSession } from "next-auth/react";

const CITY = "Pune";

interface Props {
  params: Promise<{ id: string }>;
}

interface ServiceVariant {
  _id: string; // Using _id instead of variantId
  variantName: string;
  serviceDescription?: string;
  specs?: string;
  images: string[];
  prices?: { price: number; city: string }[];
  get_price_requested?: boolean;
}

interface ArchitectureService {
  _id: string;
  serviceName: string;
  serviceDescription: string;
  variants: ServiceVariant[];
}

interface UserPriceRequest {
  status: "pending" | "completed" | "rejected";
  finalPrice?: number;
  requestedAt: string;
}

export default function ArchitectureServiceDetailPage({ params }: Props) {
  const dispatch = useDispatch();
  
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [service, setService] = useState<ArchitectureService | null>(null);
  const [selected, setSelected] = useState<ServiceVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [userPrice, setUserPrice] = useState<number | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [userPriceRequest, setUserPriceRequest] =
    useState<UserPriceRequest | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );

  const [quantity, setQuantity] = useState(1);
  const [length, setLength] = useState(1);
  const [width, setWidth] = useState(1);
  const [remainingTime, setRemainingTime] = useState(7200);

  const resolvedParams =use(params);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/architecture/${resolvedParams.id}?city=${CITY}`;

  // Fetch service data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return notFound();
        const data = await res.json();
        setService(data.service);
        setSelected(data.service.variants?.[0]);
        setSelectedImageIndex(0);
      } catch (err) {
        console.error("Error:", err);
        notFound();
      }
    };
    fetchData();
  }, [url]);

// Update the useEffect that checks user price request status
useEffect(() => {
  const checkUserPriceRequest = async () => {
    if (
      !service ||
      !selected ||
      authStatus !== "authenticated" ||
      !session?.user?.id ||
      !selected._id
    )
      return;

    try {
      const response = await fetch(
        `/api/architecture/price-request?serviceId=${service._id}&variantId=${selected._id}&userId=${session.user.id}`,
        { method: "GET" }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserPriceRequest(data.request || null);
          if (data.request?.status === "completed" && data.request.finalPrice) {
            setUserPrice(data.request.finalPrice);
          } else {
            setUserPrice(null);
          }
        } else {
          // No existing request found
          setUserPriceRequest(null);
          setUserPrice(null);
        }
      } else {
        // No existing request found
        setUserPriceRequest(null);
        setUserPrice(null);
      }
    } catch (err) {
      console.error("Error checking price request status:", err);
      setUserPriceRequest(null);
      setUserPrice(null);
    }
  };

  checkUserPriceRequest();
}, [service, selected, authStatus, session, selected?._id]);

// Update the handleVariantChange function
const handleVariantChange = (variant: ServiceVariant) => {
  if (!variant._id) {
    console.error("Variant missing ID!", variant);
    return;
  }
  setSelected(variant);
  setSelectedVariantId(variant._id);
  setSelectedImageIndex(0);
  setUserPrice(null);
  setUserPriceRequest(null);
  
  // Force re-check of price request status for new variant
  setTimeout(() => {
    checkUserPriceRequestForVariant(variant._id);
  }, 100);
};

// Add this new function to check price request for specific variant
const checkUserPriceRequestForVariant = async (variantId: string) => {
  if (!service || authStatus !== "authenticated" || !session?.user?.id) return;

  try {
    const response = await fetch(
      `/api/architecture/price-request?serviceId=${service._id}&variantId=${variantId}&userId=${session.user.id}`,
      { method: "GET" }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setUserPriceRequest(data.request || null);
        if (data.request?.status === "completed" && data.request.finalPrice) {
          setUserPrice(data.request.finalPrice);
        } else {
          setUserPrice(null);
        }
      }
    }
  } catch (err) {
    console.error("Error checking price request status:", err);
  }
};

// Add a polling mechanism to check for updates periodically (optional but recommended)
useEffect(() => {
  let pollInterval: NodeJS.Timeout;
  
  if (userPriceRequest?.status === "pending" && selected?._id) {
    pollInterval = setInterval(() => {
      checkUserPriceRequestForVariant(selected._id);
    }, 30000); // Check every 30 seconds for pending requests
  }

  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
}, [userPriceRequest?.status, selected?._id]);

// Update the initial service fetch to set selectedVariantId
useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return notFound();
      const data = await res.json();
      setService(data.service);
      const firstVariant = data.service.variants?.[0];
      if (firstVariant) {
        setSelected(firstVariant);
        setSelectedVariantId(firstVariant._id);
      }
      setSelectedImageIndex(0);
    } catch (err) {
      console.error("Error:", err);
      notFound();
    }
  };
  fetchData();
}, [url]);

  useEffect(() => {
    if (showTimerModal) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTimerModal]);

  const formatTime = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const hasPrice =
    userPrice !== null ||
    (selected?.prices?.[0]?.price && selected?.prices?.[0]?.price > 0);
  const isPriceRequestPending =
    userPriceRequest?.status === "pending" && !hasPrice;

  const handleGetPrice = async () => {
    if (!selected || !service || !session?.user?.id || !selectedVariantId)
      return;

    try {
      const response = await fetch("/api/architecture/price-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service._id,
          city: CITY,
          variantId: selectedVariantId, // Send ID instead of name
          variantName: selected.variantName, // Keep for backward compatibility
          userId: session.user.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserPriceRequest({
          status: "pending",
          requestedAt: new Date().toISOString(),
        });
        setShowTimerModal(true);

        // Update the selected variant's flag
        if (service && selected) {
          setService((prev) => ({
            ...prev!,
            variants: prev!.variants.map((v) =>
              v.variantName === selected.variantName
                ? { ...v, get_price_requested: true }
                : v
            ),
          }));
        }
      } else {
        alert(data.error || "Failed to submit price request");
      }
    } catch (err) {
      console.error("Error requesting price:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleBuyNow = async () => {
    if (!selected) return;

    if (authStatus !== "authenticated") {
      alert("Please login to continue");
      router.push("/login");
      return;
    }

    if (hasPrice) {
      setShowPricingModal(true);
    } else {
      await handleGetPrice();
    }
  };

  const handleAddToCart = () => {
    if (!hasPrice || !service || !selected) {
      alert("Please get price first");
      return;
    }

    const baseUnitPrice = userPrice ?? selected?.prices?.[0]?.price ?? 0;
    const totalUnits = quantity * length * width;
    const finalPrice = baseUnitPrice * totalUnits;

    dispatch(
      addService({
        name: service.serviceName,
        price: finalPrice,
        description: selected?.serviceDescription || "",
        duration: "1 hour",
        quantity: totalUnits,
      })
    );
    router.push("/cart");
  };



  if (!service || authStatus === "loading")
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );

  const baseUnitPrice = userPrice ?? selected?.prices?.[0]?.price ?? 0;
  const totalUnits = quantity * length * width;
  const finalTotal = baseUnitPrice * totalUnits;

  const finalDisplayPrice = hasPrice
    ? baseUnitPrice.toLocaleString()
    : "Get Price";

  const currentImages = selected?.images || [];
  const currentMainImage =
    currentImages[selectedImageIndex] || currentImages[0] || "/placeholder.png";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Left: Images */}
      <div>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
          <Image
            src={currentMainImage}
            alt={service.serviceName}
            fill
            className="object-cover"
          />
        </div>
        <div className="mt-4 flex gap-3">
          {currentImages.map((img, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 rounded overflow-hidden cursor-pointer border-2 ${
                selectedImageIndex === idx
                  ? "border-orange-500"
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedImageIndex(idx)}
            >
              <Image
                src={img}
                alt={`thumbnail ${idx + 1}`}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Info */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          {service.serviceName}
        </h1>
        <p className="text-base text-gray-500 mb-1">
          {service.serviceDescription}
        </p>

        <p className="text-2xl text-orange-600 font-bold mb-6">
          ₹ {finalDisplayPrice}
          {isPriceRequestPending && (
            <span className="text-sm text-gray-500 ml-2">
              (Price request pending)
            </span>
          )}
        </p>

        {/* Accordions */}
        <div className="border rounded mb-4">
          <details className="group">
            <summary className="cursor-pointer p-3 text-sm font-semibold text-gray-800 bg-gray-50">
              Specifications
            </summary>
            <div className="px-4 py-2 text-sm text-gray-600">
              {selected?.specs || "No specifications available"}
            </div>
          </details>
          <details className="group border-t">
            <summary className="cursor-pointer p-3 text-sm font-semibold text-gray-800 bg-gray-50">
              Description
            </summary>
            <div className="px-4 py-2 text-sm text-gray-600">
              {selected?.serviceDescription || service.serviceDescription}
            </div>
          </details>
        </div>

        {/* Variants */}
        {service.variants?.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Variants</h4>
            <div className="grid grid-cols-3 gap-3">
              {service.variants.map((variant: ServiceVariant, idx: number) => (
                <div
                  key={idx}
                  className={`border rounded p-2 text-sm text-center cursor-pointer transition-all ${
                    selected?.variantName === variant.variantName
                      ? "border-orange-500 text-orange-600 bg-orange-50"
                      : "hover:border-orange-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleVariantChange(variant)}
                >
                  <div className="w-20 h-20 mx-auto mb-2 overflow-hidden rounded">
                    <Image
                      src={variant.images?.[0] || "/placeholder.png"}
                      alt={variant.variantName}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-xs font-medium">{variant.variantName}</p>
                  {authStatus === "authenticated" &&
                    userPriceRequest?.status === "pending" &&
                    selected?.variantName === variant.variantName && (
                      <p className="text-xs text-orange-500 mt-1">
                        Price pending
                      </p>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Terms & Conditions
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>The booking amount is fixed and non-negotiable</li>
            <li>The customer shall inspect the work daily or alternatively</li>
            <li>Material is optional</li>
            <li>100% refundable cancellation before 72 hours</li>
          </ul>
        </div>

        {/* Login Notice */}
        {authStatus !== "authenticated" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              Please{" "}
              <button
                onClick={() => router.push("/login")}
                className="underline font-medium hover:text-blue-800"
              >
                login
              </button>{" "}
              to request custom pricing and add items to cart.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleAddToCart}
            disabled={!hasPrice || authStatus !== "authenticated"}
            className={`flex-1 border px-4 py-3 rounded transition-all ${
              hasPrice && authStatus === "authenticated"
                ? "text-gray-800 hover:bg-gray-100"
                : "text-gray-400 bg-gray-100 cursor-not-allowed"
            }`}
          >
            Add to cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isPriceRequestPending}
            className={`flex-1 px-4 py-3 rounded text-white transition-all ${
              hasPrice
                ? "bg-orange-500 hover:bg-orange-600"
                : isPriceRequestPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-900"
            }`}
          >
            {hasPrice
              ? "Buy Now"
              : isPriceRequestPending
              ? "Request Submitted"
              : "Get Price"}
          </button>
        </div>
      </div>

      {/* Modal: Pricing */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border border-gray-300 rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Confirm Service Details
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
              />
              <input
                type="number"
                className="border p-2 rounded bg-gray-50"
                placeholder="Unit Price"
                value={baseUnitPrice}
                readOnly
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Length (ft)"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                min="1"
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Width (ft)"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600">Total Units: {totalUnits}</p>
              <p className="text-lg font-bold text-gray-800">
                Total Price: ₹ {finalTotal.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setShowPricingModal(false)}
                className="border px-4 py-2 rounded hover:bg-gray-50"
              >
                Back
              </button>
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                onClick={handleAddToCart}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Timer */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border border-gray-300 rounded-2xl shadow-xl p-6 w-[90%] max-w-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Price Request Submitted
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Our team is working on your request. We'll get back to you within:
            </p>
            <div className="mx-auto mb-6">
              <div className="text-3xl font-bold bg-orange-100 text-orange-600 px-6 py-3 rounded-xl inline-block">
                {formatTime(remainingTime)}
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowTimerModal(false)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Need Help?
              </button>
              <button
                onClick={() => setShowTimerModal(false)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
