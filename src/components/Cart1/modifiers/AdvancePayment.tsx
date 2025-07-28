"use client";
import React from "react";

interface Props {
  subtotal: number;
  selectedPct: number | null;   // 10 | 50 | 100 | null
  onSelect: (pct: 10 | 50 | 100) => void;
}

const tiers: (10 | 50 | 100)[] = [10, 50, 100];

const AdvancePayment: React.FC<Props> = ({ subtotal, selectedPct, onSelect }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
    <h3 className="text-lg font-semibold text-black mb-3">Advance Payment</h3>
    <div className="grid grid-cols-3 gap-2">
      {tiers.map((pct) => (
        <button
          key={pct}
          onClick={() => onSelect(pct)}
          className={`p-3 border rounded-lg text-center ${
            selectedPct === pct
              ? "border-[#FF7803] bg-orange-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="font-medium">{pct === 100 ? "Full" : `${pct}%`}</div>
          <div className="text-xs text-gray-600">
            ₹{((subtotal * pct) / 100).toFixed(2)}
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default AdvancePayment;
