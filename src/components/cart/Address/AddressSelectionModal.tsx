"use client";
import React from "react";
import { X, MapPin, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { setSelectedAddress } from "@/store/cartSlice";
import { useDispatch } from "react-redux";

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddress: any;
  onSelectAddress: (address: any) => void;
  onAddNewAddress: () => void;
  onRemoveAddress: (addressId: string) => void;
  onUseCurrentLocation?: () => void | Promise<void>; // Updated to accept both
  addresses: any[];
  mode?: 'shipping' | 'billing';
}

const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedAddress,
  onSelectAddress,
  onAddNewAddress,
  onRemoveAddress,
  addresses,
  mode,
  onUseCurrentLocation,
}) => {
  const dispatch = useDispatch();
  const { data: session } = useSession();

  if (!isOpen) return null;

  const handleSelectAddress = (address: any) => {
    if (mode === 'shipping') {
      dispatch(setSelectedAddress(address));
    }
    onSelectAddress(address);
  };

  const title = mode === 'shipping' 
    ? 'Select Delivery Address' 
    : 'Select Billing Address';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-[0px_2px_8px_0px_#00000033]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'shipping' && (
            <button
              onClick={onUseCurrentLocation} // This will open the map modal
              className="flex items-center w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <MapPin className="w-5 h-5 text-[#FF7803] mr-3" />
              <span>Use Current Location</span>
            </button>
          )}

          {addresses.map((address) => (
            <div
              key={address._id}
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedAddress?.id === address._id
                  ? "border-[#FF7803] bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between">
                <div onClick={() => handleSelectAddress(address)}>
                  <p className="font-medium">{address.name}</p>
                  <p className="text-sm">{address.phone}</p>
                  <p className="mt-2 text-sm">{address.addressLine1}</p>
                  <p className="text-sm">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  {mode === 'shipping' && address.distanceFromCenter && (
                    <p className="text-xs text-gray-500 mt-1">
                      {address.distanceFromCenter.toFixed(1)} km from center
                    </p>
                  )}
                </div>
                {session?.user?.id && (
                  <button
                    onClick={() => onRemoveAddress(address._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={onAddNewAddress}
            className="flex items-center w-full p-4 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-5 h-5 text-[#FF7803] mr-3" />
            <span>Add New Address</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressSelectionModal;