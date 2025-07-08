// components/profile/SavedWallet.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface Wallet {
  id: string;
  provider: string;
  maskedAccount: string;
  isDefault: boolean;
  type: 'wallet' | 'bnpl';
}

export default function SavedWallet() {
  const { data: session } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: "paytm",
    account: "",
    type: "wallet" as 'wallet' | 'bnpl'
  });
  const [error, setError] = useState("");

  const fetchWallets = async () => {
    try {
      const { data } = await axios.get("/api/profile/wallets");
      setWallets(data);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      setError("Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.account.length < 4) {
      setError("Please enter a valid account number");
      return;
    }

    try {
      const { data } = await axios.post("/api/profile/wallets", {
        provider: formData.provider,
        maskedAccount: `****${formData.account.slice(-4)}`,
        type: formData.type
      });
      
      setWallets([...wallets, data]);
      setShowAddForm(false);
      setFormData({
        provider: "paytm",
        account: "",
        type: "wallet"
      });
    } catch (error) {
      setError("Failed to add wallet");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wallet?")) return;
    
    try {
      await axios.delete(`/api/profile/wallets/${id}`);
      setWallets(wallets.filter(wallet => wallet.id !== id));
    } catch (error) {
      setError("Failed to delete wallet");
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axios.patch(`/api/profile/wallets/${id}/default`);
      setWallets(wallets.map(wallet => ({
        ...wallet,
        isDefault: wallet.id === id
      })));
    } catch (error) {
      setError("Failed to set default wallet");
      console.error(error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchWallets();
    }
  }, [session]);

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading wallets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Saved Wallets & BNPL</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Add New
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Wallet/BNPL</h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData, 
                    type: e.target.value as 'wallet' | 'bnpl'
                  })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="wallet">Digital Wallet</option>
                  <option value="bnpl">Buy Now Pay Later</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="paytm">Paytm</option>
                  <option value="amazonpay">Amazon Pay</option>
                  <option value="mobikwik">MobiKwik</option>
                  <option value="simpl">Simpl</option>
                  <option value="lazypay">LazyPay</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.type === 'wallet' ? 'Wallet Number' : 'Registered Mobile'}
                </label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => setFormData({...formData, account: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder={formData.type === 'wallet' ? 'Wallet number' : 'Registered mobile'}
                  required
                />
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
                  Save
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

      {wallets.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No saved wallets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`border rounded-lg p-4 ${wallet.isDefault ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 capitalize">
                    {wallet.provider} {wallet.type.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {wallet.maskedAccount}
                  </p>
                </div>
                {wallet.isDefault && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full h-fit">
                    Default
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                {!wallet.isDefault && (
                  <button
                    onClick={() => handleSetDefault(wallet.id)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(wallet.id)}
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