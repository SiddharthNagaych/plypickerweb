// components/profile/Addresses.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Addresses() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch addresses from API instead of session
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await axios.get("/api/user/addresses");
        setAddresses(data);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (session?.user?.id) {
      fetchAddresses();
    }
  }, [session?.user?.id]);

  const handleEdit = (address: Address) => {
    setIsEditing(address.id || "new");
    setFormData(address);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let updatedAddresses;
      
      if (isEditing === "new") {
        // Add new address
        const { data } = await axios.post("/api/user/addresses", formData);
        updatedAddresses = [...addresses, data];
      } else {
        // Update existing address
        const { data } = await axios.put(`/api/user/addresses/${isEditing}`, formData);
        updatedAddresses = addresses.map(a => a.id === isEditing ? data : a);
      }

      setAddresses(updatedAddresses);
      setIsEditing(null);
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    try {
      await axios.delete(`/api/user/addresses/${id}`);
      const updatedAddresses = addresses.filter(a => a.id !== id);
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { data } = await axios.patch(`/api/user/addresses/${id}/default`);
      const updatedAddresses = addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      }));
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">My Addresses</h2>
        <button
          onClick={() => handleEdit({
            id: "new",
            name: "",
            phone: "",
            addressLine1: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            type: "HOME",
            isDefault: false
          })}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Add New Address
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {/* Form fields remain the same */}
          {/* ... */}
        </form>
      ) : addresses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">You have no saved addresses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-lg p-4 ${address.isDefault ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}
            >
              {/* Address display remains the same */}
              {/* ... */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}