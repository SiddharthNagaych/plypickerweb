"use client";
import React from "react";

export type TabType = "products" | "services";

interface Props {
  activeTab: TabType;
  /* service‑only inputs */
  serviceDate: string;
  serviceTime: string;
  advancePct: number | null;

  /* common price inputs */
  itemCount: number;
  subtotal: number;
  labor: number;
  transport: number;
  gst: number;
  discount: number;
  pcashApplied: number;
  total: number;

  /* GST info */
  gstVerified: boolean;
  companyName: string;
  gstNumber: string;
}

const OrderSummary: React.FC<Props> = ({
  activeTab,
  serviceDate,
  serviceTime,
  advancePct,
  itemCount,
  subtotal,
  labor,
  transport,
  gst,
  discount,
  pcashApplied,
  total,
  gstVerified,
  companyName,
  gstNumber,
}) => (
  <div className="border-t pt-4">
    <h3 className="text-lg font-semibold text-black mb-4">Order Summary</h3>

    {/* service meta */}
    {activeTab === "services" && serviceDate && (
      <div className="flex justify-between text-sm mb-2">
        <span>Scheduled Date &amp; Time:</span>
        <span>
          {serviceDate} at {serviceTime}
        </span>
      </div>
    )}

    {activeTab === "services" && advancePct && (
      <div className="flex justify-between text-sm mb-2">
        +   <span>Advance Payment ({advancePct}%) – payable now</span>
+   <span>
+     ₹{((total * advancePct) / 100).toFixed(2)}
+   </span>
      </div>
    )}

    {gstVerified && (
      <div className="flex justify-between text-sm mb-2">
        <span>GST Registered Company:</span>
        <span>
          {companyName} ({gstNumber})
        </span>
      </div>
    )}

    {/* price lines */}
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Subtotal ({itemCount} items)</span>
        <span>₹{subtotal}</span>
      </div>

      {labor > 0 && (
        <div className="flex justify-between">
          <span>Labor Charges</span>
          <span>₹{labor}</span>
        </div>
      )}

      {transport > 0 && (
        <div className="flex justify-between">
          <span>Transport Charges</span>
          <span>₹{transport}</span>
        </div>
      )}

      <div className="flex justify-between">
        <span>GST (18%)</span>
        <span>₹{gst}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Coupon Discount</span>
          <span>-₹{discount}</span>
        </div>
      )}

      {pcashApplied > 0 && (
        <div className="flex justify-between text-green-600">
          <span>P‑Cash Applied</span>
          <span>-₹{pcashApplied}</span>
        </div>
      )}

      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>
    </div>
  </div>
);

export default OrderSummary;
