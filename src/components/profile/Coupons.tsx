"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minOrder: number;
  validUntil?: string;
  categoryName?: string;
  subcategoryName?: string;
  groupName?: string;
  subgroupName?: string;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/profile/coupons").then((res) => {
      setCoupons(res.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading your coupons...</div>;

  if (coupons.length === 0) {
    return <div className="text-gray-500">You don’t have any active coupons right now.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Coupons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="text-orange-600 font-bold text-lg mb-1">{coupon.code}</div>
            <div className="text-sm text-gray-700 mb-2">
              {coupon.type === "percentage"
                ? `${coupon.discount}% off`
                : `₹${coupon.discount} off`}{" "}
              on orders above ₹{coupon.minOrder}
            </div>

            {coupon.validUntil && (
              <p className="text-xs text-gray-500">
                Valid until: {new Date(coupon.validUntil).toLocaleDateString()}
              </p>
            )}

            <div className="mt-2 text-xs text-gray-600">
              {coupon.categoryName && <p>Category: {coupon.categoryName}</p>}
              {coupon.subcategoryName && <p>Subcategory: {coupon.subcategoryName}</p>}
              {coupon.groupName && <p>Group: {coupon.groupName}</p>}
              {coupon.subgroupName && <p>Subgroup: {coupon.subgroupName}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
