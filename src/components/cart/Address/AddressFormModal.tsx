"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { calculateDistance } from "@/utils/distanceCalculator";

const CENTER_PUNE = { lat: 18.5204, lng: 73.8567 };

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (address: any) => void;
  initialData?: any;
  mode?: 'shipping' | 'billing';
}

const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    addressLine1: initialData?.addressLine1 || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    pincode: initialData?.pincode || "",
    type: initialData?.type || "HOME",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceFromCenter, setDistanceFromCenter] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCoordinatesFromPincode = async (pincode: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  useEffect(() => {
    const calculateDistanceForPincode = async () => {
      if (formData.pincode.length === 6) {
        setLoading(true);
        setError(null);
        
        try {
          const location = await getCoordinatesFromPincode(formData.pincode);
          if (location) {
            const dist = await calculateDistance(
              CENTER_PUNE,
              location,
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
            );
            setDistanceFromCenter(dist);
          } else {
            setError("Could not find location for this pincode");
            setDistanceFromCenter(null);
          }
        } catch (err) {
          console.error("Distance calculation error:", err);
          setError("Failed to calculate distance");
          setDistanceFromCenter(null);
        } finally {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      if (formData.pincode.length === 6) {
        calculateDistanceForPincode();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.pincode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const location = await getCoordinatesFromPincode(formData.pincode);
    const addressData = {
      ...formData,
      country: "India",
      isDefault: false,
      distanceFromCenter: distanceFromCenter || 0,
      coordinates: location || null
    };
    
    onSubmit(addressData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-[0px_2px_8px_0px_#00000033]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add New Address</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number*
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[6-9]\d{9}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode*
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              pattern="\d{6}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
            />
            {loading && formData.pincode.length === 6 && (
              <p className="text-xs text-gray-500 mt-1">Calculating distance...</p>
            )}
            {distanceFromCenter !== null && !loading && (
              <p className="text-xs text-gray-500 mt-1">
                {distanceFromCenter.toFixed(1)} km from center of Pune
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address (House no., Building, Street, Area)*
            </label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locality/Town*
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State*
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7803]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Type*
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="HOME"
                  checked={formData.type === "HOME"}
                  onChange={handleChange}
                  className="mr-2 text-[#FF7803]"
                />
                Home
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="OFFICE"
                  checked={formData.type === "OFFICE"}
                  onChange={handleChange}
                  className="mr-2 text-[#FF7803]"
                />
                Office
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="OTHER"
                  checked={formData.type === "OTHER"}
                  onChange={handleChange}
                  className="mr-2 text-[#FF7803]"
                />
                Other
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#FF7803] text-white rounded-lg hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? "Processing..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressFormModal;