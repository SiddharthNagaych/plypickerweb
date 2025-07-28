"use client";
import React from "react";
import { X } from "lucide-react";


export interface GstDetails {
  companyName: string;
  gstNumber: string;
  billingAddress: Address | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  details: GstDetails;
  onChange: (d: GstDetails) => void;
  onSelectBilling: () => void;
  onSave: () => void;      // already validated
}

const GstModal: React.FC<Props> = ({
  isOpen,
  onClose,
  details,
  onChange,
  onSelectBilling,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-[0px_2px_8px_0px_#00000033]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Enter GST Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input
              value={details.companyName}
              onChange={(e) => onChange({ ...details, companyName: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GST Number</label>
            <input
              value={details.gstNumber}
              onChange={(e) => onChange({ ...details, gstNumber: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="22AAAAA0000A1Z5"
              required
            />
          </div>

          {/* billing address picker */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Billing Address</h4>
            {details.billingAddress ? (
              <div className="bg-gray-50 p-3 rounded">
                <p>{details.billingAddress.addressLine1}</p>
                <p>
                  {details.billingAddress.city}, {details.billingAddress.state}
                </p>
                <p>{details.billingAddress.pincode}</p>
                <button
                  onClick={onSelectBilling}
                  className="text-[#FF7803] text-sm mt-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={onSelectBilling}
                className="w-full py-2 border border-dashed rounded text-[#FF7803]"
              >
                + Add Billing Address
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-[#FF7803] text-white rounded"
            >
              Save GST Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GstModal;
