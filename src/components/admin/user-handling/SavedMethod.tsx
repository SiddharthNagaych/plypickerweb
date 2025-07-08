"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Updated imports
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SavedCard {
  _id: string;
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
  createdAt: string;
}

interface SavedUPI {
  _id: string;
  upiId: string;
  label?: string;
  createdAt: string;
}

interface SavedBank {
  _id: string;
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
  createdAt: string;
}

export default function SavedMethodsPanel() {
  const [activeTab, setActiveTab] = useState("cards");
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [upis, setUpis] = useState<SavedUPI[]>([]);
  const [banks, setBanks] = useState<SavedBank[]>([]);

  useEffect(() => {
    fetch("/api/admin/saved-methods")
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards || []);
        setUpis(data.upis || []);
        setBanks(data.banks || []);
      });
  }, []);

  const handleDelete = async (type: string, id: string) => {
    await fetch(`/api/admin/user-handling/saved-methods/${type}/${id}`, { method: "DELETE" });
    if (type === "cards") setCards((prev) => prev.filter((c) => c._id !== id));
    if (type === "upis") setUpis((prev) => prev.filter((u) => u._id !== id));
    if (type === "banks") setBanks((prev) => prev.filter((b) => b._id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Saved Payment Methods</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="upis">UPIs</TabsTrigger>
          <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards">
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {cards.map((card) => (
              <Card key={card._id} className="flex justify-between items-center p-4">
                <div>
                  <p className="font-medium">{card.brand.toUpperCase()} ****{card.last4}</p>
                  <p className="text-xs text-gray-500">Exp: {card.expiry}</p>
                  <p className="text-xs text-gray-400">Holder: {card.cardholderName}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDelete("cards", card._id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="upis">
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {upis.map((upi) => (
              <Card key={upi._id} className="flex justify-between items-center p-4">
                <div>
                  <p className="font-medium">{upi.upiId}</p>
                  <p className="text-xs text-gray-400">{upi.label}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDelete("upis", upi._id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="banks">
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {banks.map((bank) => (
              <Card key={bank._id} className="flex justify-between items-center p-4">
                <div>
                  <p className="font-medium">{bank.bankName}</p>
                  <p className="text-xs text-gray-500">A/C ****{bank.accountNumber.slice(-4)}</p>
                  <p className="text-xs text-gray-400">IFSC: {bank.ifsc}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDelete("banks", bank._id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}