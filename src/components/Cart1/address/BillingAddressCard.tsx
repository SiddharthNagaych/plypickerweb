"use client";
import React from "react";


interface Props {
  gstVerified: boolean;
  companyName: string;
  gstNumber: string;
  useShippingAsBilling: boolean;
  billingAddress: Address | null;
  onToggleSame: (checked: boolean) => void;
  onAddOrChange: () => void;
}

const BillingAddressCard: React.FC<Props> = ({
  gstVerified,
  companyName,
  gstNumber,
  useShippingAsBilling,
  billingAddress,
  onToggleSame,
  onAddOrChange,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Billing Address</h3>
        {!gstVerified && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sameAsShipping"
              checked={useShippingAsBilling}
              onChange={(e) => onToggleSame(e.target.checked)}
              className="w-4 h-4 text-[#FF7803] focus:ring-[#FF7803]"
            />
            <label htmlFor="sameAsShipping" className="text-sm">
              Same as shipping
            </label>
          </div>
        )}
      </div>

      {/* GST verified override */}
      {gstVerified ? (
        <div className="text-black bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-blue-600 font-medium text-sm">
            GST Registered Company
          </span>
          <p className="font-medium">{companyName}</p>
          <p className="text-xs text-gray-600">GST: {gstNumber}</p>
          <p className="text-xs text-blue-600 mt-2">
            GST billing address cannot be changed
          </p>
        </div>
      ) : useShippingAsBilling ? (
        <p className="text-sm text-gray-500">Using shipping address</p>
      ) : billingAddress ? (
        <>
          <div className="text-black">
            <p className="font-medium">{billingAddress.name}</p>
            <p className="text-sm">{billingAddress.phone}</p>
            <p className="mt-2">{billingAddress.addressLine1}</p>
            <p>
              {billingAddress.city}, {billingAddress.state}{" "}
              {billingAddress.pincode}
            </p>
            <button
              onClick={onAddOrChange}
              className="text-[#FF7803] text-sm mt-2 hover:underline"
            >
              Change Billing Address
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={onAddOrChange}
          className="w-full py-2 border border-dashed rounded text-[#FF7803]"
        >
          + Add Billing Address
        </button>
      )}
    </div>
  );
};

export default BillingAddressCard;
