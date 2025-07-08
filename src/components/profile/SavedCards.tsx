// components/profile/SavedCards.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface Card {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

export default function SavedCards() {
  const { data: session, update } = useSession();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });

  const fetchCards = async () => {
    try {
      const { data } = await axios.get("/api/profile/cards");
      setCards(data);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setIsLoading(false);
    }
  };
    useEffect(() => {
    fetchCards();
  }, []);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/profile/cards", {
        last4: formData.number.slice(-4),
        brand: getCardBrand(formData.number),
        expiry: formData.expiry,
        name: formData.name
      });
      
      setCards([...cards, data]);
      await update();
      setShowAddForm(false);
      setFormData({
        number: "",
        expiry: "",
        cvv: "",
        name: ""
      });
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const getCardBrand = (number: string) => {
    // Simple card brand detection
    if (/^4/.test(number)) return "Visa";
    if (/^5[1-5]/.test(number)) return "Mastercard";
    if (/^3[47]/.test(number)) return "American Express";
    return "Other";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    
    try {
      await axios.delete(`/api/profile/cards/${id}`);
      setCards(cards.filter(card => card.id !== id));
      await update();
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axios.patch(`/api/profile/cards/${id}/default`);
      const updatedCards = cards.map(card => ({
        ...card,
        isDefault: card.id === id
      }));
      setCards(updatedCards);
      await update();
    } catch (error) {
      console.error("Error setting default card:", error);
    }
  };

  if (isLoading) {
    return <div>Loading your saved cards...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Saved Cards</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Add New Card
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add New Card</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="4242 4242 4242 4242"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry</label>
                  <input
                    type="text"
                    value={formData.expiry}
                    onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="123"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="John Doe"
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
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No saved cards found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`border rounded-lg p-4 ${card.isDefault ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-800">
                  {card.brand} **** **** **** {card.last4}
                </h3>
                {card.isDefault && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">Expires {card.expiry}</p>
              
              <div className="flex gap-2 mt-4">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(card.id)}
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