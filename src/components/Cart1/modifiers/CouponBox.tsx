"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyCoupon, removeCoupon } from "@/store/cartSlice";
import type { RootState } from "@/store";
import { X } from "lucide-react";

const CouponBox: React.FC = () => {
  const dispatch = useDispatch();
  const coupon = useSelector((s: RootState) => s.cart.coupon);

  const [availableCoupons, setAvailableCoupons] = useState<ICoupon[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  /* fetch once */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile/coupons");
        if (res.ok) setAvailableCoupons(await res.json());
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      }
    })();
  }, []);

  /* helpers */
  const handleApply = async (code?: string) => {
    const codeToUse = code || couponInput;
    if (!codeToUse) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const res = await fetch("/api/profile/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToUse }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      dispatch(applyCoupon(await res.json()));
      setCouponInput("");
      setCouponError("");
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-3">Coupons</h3>

      {coupon ? (
        <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <span className="font-medium text-green-700">{coupon.code}</span>
            <p className="text-xs text-green-600">
              {coupon.type === "percentage"
                ? `${coupon.discount}% off`
                : `₹${coupon.discount} off`}
            </p>
          </div>
          <button
            onClick={() => dispatch(removeCoupon())}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex mb-3">
            <input
              type="text"
              placeholder="Enter coupon code"
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <button
              onClick={() => handleApply()}
              className="px-4 py-2 bg-[#FF7803] text-white rounded-r-lg hover:bg-orange-600"
            >
              Apply
            </button>
          </div>

          {availableCoupons.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Available Coupons:</p>
              {availableCoupons.map((c) => (
                <div
                  key={c.id}
                  className="p-2 border border-gray-200 rounded-lg flex justify-between items-center cursor-pointer hover:border-[#FF7803]"
                  onClick={() => handleApply(c.code)}
                >
                  <span className="font-medium text-sm">{c.code}</span>
                  <span className="text-[#FF7803] text-xs">
                    {c.type === "percentage"
                      ? `${c.discount}% off`
                      : `₹${c.discount} off`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
    </div>
  );
};

export default CouponBox;
