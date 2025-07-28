"use client";
import React from "react";

interface Props {
  balance: number;
  usePcash: boolean;
  maxApplicable: number;
  applied: number;
  onToggle: (v: boolean) => void;
  onChangeAmount: (amt: number) => void;
}

const PcashBox: React.FC<Props> = ({
  balance,
  usePcash,
  maxApplicable,
  applied,
  onToggle,
  onChangeAmount,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-black">P‑Cash</h3>
        <span className="text-sm text-gray-600">Balance: ₹{balance}</span>
      </div>

      {balance > 0 && (
        <>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="usePcash"
              checked={usePcash}
              onChange={(e) => onToggle(e.target.checked)}
              className="w-4 h-4 text-[#FF7803] focus:ring-[#FF7803]"
            />
            <label htmlFor="usePcash" className="text-sm text-black">
              Use P‑Cash (Max: ₹{maxApplicable})
            </label>
          </div>

          {usePcash && (
            <div className="mt-3">
              <input
                type="number"
                value={applied}
                onChange={(e) => onChangeAmount(Number(e.target.value))}
                max={Math.min(balance, maxApplicable)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PcashBox;
