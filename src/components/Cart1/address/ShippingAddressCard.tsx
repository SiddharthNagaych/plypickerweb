"use client";
import React from "react";
import { MapPin, X } from "lucide-react";


interface Props {
  address: Address | null;
  onChangeClick: () => void;
}

const ShippingAddressCard: React.FC<Props> = ({ address, onChangeClick }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Shipping Address</h3>
        <button
          onClick={onChangeClick}
          className="text-[#FF7803] hover:underline text-sm"
        >
          {address ? "Change" : "Add"}
        </button>
      </div>

      {address ? (
        <div className="text-black">
          <p className="font-medium">{address.name}</p>
          <p className="text-sm">{address.phone}</p>
          <p className="mt-2">{address.addressLine1}</p>
          <p>
            {address.city}, {address.state} {address.pincode}
          </p>
          {address.distanceFromCenter && (
            <p className="text-xs text-gray-500 mt-1">
              {address.distanceFromCenter.toFixed(1)} km from center
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={onChangeClick}
          className="w-full py-3 border-2 border-dashed border-[#FF7803] rounded-lg text-[#FF7803] font-medium flex items-center justify-center gap-2"
        >
          <MapPin className="w-5 h-5" />
          Address
        </button>
      )}
    </div>
  );
};

export default ShippingAddressCard;
