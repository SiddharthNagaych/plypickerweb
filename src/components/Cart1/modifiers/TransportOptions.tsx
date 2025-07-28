"use client";
import React from "react";
import { Truck } from "lucide-react";

export type TransportType = "bike" | "three_wheeler" | "tempo" | "pickup";

export interface TransportOption {
  id: TransportType;
  name: string;
  time: string;
  price: number;
}

interface Props {
  options: TransportOption[];
  selectedId: TransportType | null;
  onSelect: (id: TransportType) => void;
}

const TransportOptions: React.FC<Props> = ({ options, selectedId, onSelect }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-black mb-3">
        Transport Options
      </h3>
      <div className="space-y-2">
        {options.map((o) => (
          <div
            key={o.id}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedId === o.id
                ? "border-[#FF7803] bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onSelect(o.id)}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-[#FF7803]" />
              <div>
                <div className="font-medium text-black">{o.name}</div>
                <div className="text-sm text-gray-600">{o.time}</div>
              </div>
            </div>
            <div className="font-semibold text-[#FF7803]">₹{o.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportOptions;
