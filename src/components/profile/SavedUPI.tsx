// components/profile/SavedUPI.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface UPI {
  id: string;
  upiId: string;
  provider: string;
  isDefault: boolean;
}

export default function SavedUPI() {
  const { data: session } = useSession();
  const [upis, setUpis] = useState<UPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    upiId: "",
    provider: "gpay" // Default provider
  });
  const [error, setError] = useState("");

  const fetchUPIs = async () => {
    try {
      const { data } = await axios.get("/api/profile/upi");
      setUpis(data);
    } catch (error) {
      console.error("Error fetching UPI IDs:", error);
      setError("Failed to load UPI IDs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUPI = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.upiId.includes("@")) {
      setError("Please enter a valid UPI ID (must contain @)");
      return;
    }

    try {
      const { data } = await axios.post("/api/profile/upi", formData);
      setUpis([...upis, data]);
      setShowAddForm(false);
      setFormData({ upiId: "", provider: "gpay" });
    } catch (error) {
      setError("Failed to add UPI ID");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this UPI ID?")) return;
    
    try {
      await axios.delete(`/api/profile/upi/${id}`);
      setUpis(upis.filter(upi => upi.id !== id));
    } catch (error) {
      setError("Failed to delete UPI ID");
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axios.patch(`/api/profile/upi/${id}/default`);
      setUpis(upis.map(upi => ({
        ...upi,
        isDefault: upi.id === id
      })));
    } catch (error) {
      setError("Failed to set default UPI ID");
      console.error(error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUPIs();
    }
  }, [session]);

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading UPI IDs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Saved UPI IDs</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Add New UPI ID
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add UPI ID</h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleAddUPI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">UPI ID</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="username@upi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="gpay">Google Pay</option>
                  <option value="paytm">Paytm</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="amazonpay">Amazon Pay</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Save UPI ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && !showAddForm && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      {upis.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No UPI IDs saved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upis.map((upi) => (
            <div
              key={upi.id}
              className={`border rounded-lg p-4 ${upi.isDefault ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-800">
                  {upi.upiId}
                </h3>
                {upi.isDefault && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {upi.provider.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              
              <div className="flex gap-2 mt-4">
                {!upi.isDefault && (
                  <button
                    onClick={() => handleSetDefault(upi.id)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(upi.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}