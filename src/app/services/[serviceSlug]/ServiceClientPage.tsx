"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addService } from "@/store/cartSlice";

const CITY = "Pune";

export default function ServiceClientPage({ service }: { service: any }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [length, setLength] = useState(1);
  const [width, setWidth] = useState(1);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(3600); // 1hr
  const [isRequesting, setIsRequesting] = useState(false);

  const variant = service.vars?.[variantIndex];
  const images = variant?.attrs?.imgs || service.attrs?.imgs || [];
  const primaryImage = images?.[0] || "/placeholder.png";

  const pricing = variant?.pricing?.find((p: any) => p.city === CITY);
  const price = pricing?.discounted_price ?? pricing?.price ?? null;

  const totalUnits = quantity * length * width;
  const totalPrice = (price ?? 0) * totalUnits;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleAddToCart = () => {
    dispatch(
      addService({
        name: service.serviceName,
        price: totalPrice,
        description: variant?.serviceDescription,
        quantity: totalUnits,
        duration: "1 hour",
      })
    );
    router.push("/cart");
  };

  const handlePriceRequest = async () => {
    if (price) {
      setShowPriceModal(true);
    } else {
      setShowTimerModal(true);
      setIsRequesting(true);
      await fetch("/api/services/price-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service._id,
          city: CITY,
          variant: variant?.attrs?.Variants ?? "default",
        }),
      });
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    if (showTimerModal) {
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTimerModal]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Image */}
      <div>
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
          <Image
            src={primaryImage}
            alt="service"
            fill
            className="object-cover"
          />
        </div>
        {images?.length > 1 && (
          <div className="flex mt-4 gap-3 overflow-x-auto">
            {images.map((img: string, i: number) => (
              <div
                key={i}
                className="w-16 h-16 relative rounded overflow-hidden border"
              >
                <Image src={img} alt={`Preview ${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {service.serviceName}
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          {service.serviceCategory || "Service"}
        </p>
      
        <p className="text-2xl font-semibold text-orange-600 mb-6">
          {price ? `₹ ${price.toLocaleString()}` : "Price on request"}
        </p>

        {/* Variants */}
        {service.vars?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Variants</h3>
            <div className="flex gap-2">
              {service.vars.map((v: any, i: number) => {
                const p = v.pricing?.find((p: any) => p.city === CITY);
                const vp = p?.discounted_price ?? p?.price;
                return (
                  <button
                    key={i}
                    onClick={() => setVariantIndex(i)}
                    className={`min-w-[80px] p-2 rounded border text-xs text-center ${
                      variantIndex === i
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-300"
                    }`}
                  >
                    <p>{v.attrs?.Variants || `Option ${i + 1}`}</p>
                    {vp && <p className="text-orange-600 font-medium">₹{vp}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            className="border w-1/2 py-2 rounded text-sm"
            disabled
          >
            Add to cart
          </button>
          <button
            onClick={handlePriceRequest}
            disabled={isRequesting}
            className={`w-1/2 py-2 rounded text-sm font-medium text-white ${
              price
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-gray-900 hover:bg-black"
            }`}
          >
            {price ? "Book Now" : isRequesting ? "Requesting..." : "Get Price"}
          </button>
        </div>
      </div>

      {/* Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-95">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <h2 className="text-lg font-semibold text-center mb-4">Enter Details</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border p-2 rounded"
                placeholder="Quantity"
              />
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="border p-2 rounded"
                placeholder="Length (ft)"
              />
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="border p-2 rounded"
                placeholder="Width (ft)"
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Per unit"
                value={price ?? 0}
                readOnly
              />
            </div>
            <p className="text-center mb-4">Total Price: ₹{totalPrice}</p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                className="px-4 py-2 bg-orange-500 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Modal */}
      {showTimerModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-95">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <h2 className="text-lg font-bold text-center mb-3">Price Requested</h2>
            <p className="text-center text-sm text-gray-600 mb-3">
              Our team will reach out with pricing within 1 hour.
            </p>
            <p className="text-center font-semibold text-xl mb-3">
              {formatTime(remainingTime)}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowTimerModal(false)}
                className="px-4 py-2 border rounded"
              >
                Need help?
              </button>
              <button
                onClick={() => setShowTimerModal(false)}
                className="px-4 py-2 bg-orange-500 text-white rounded"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
