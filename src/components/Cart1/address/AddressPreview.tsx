"use client";
import React from "react";
import { X } from "lucide-react";


interface Props {
  address: Address;
  onClear: () => void;
}

const AddressPreview: React.FC<Props> = ({ address, onClear }) => (
  <div className="p-4 border rounded-lg mb-6 bg-white shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-medium">{address.name}</h4>
        <p className="text-sm text-gray-600">{address.addressLine1}</p>
        <p className="text-sm text-gray-600">
          {address.city}, {address.state} – {address.pincode}
        </p>
        <p className="text-sm text-gray-600">Phone: {address.phone}</p>
      </div>
      <button
        onClick={onClear}
        className="text-gray-500 hover:text-red-500 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default AddressPreview;
