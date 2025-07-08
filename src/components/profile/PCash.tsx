"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import clsx from "clsx";

interface PCashCredit {
  id: string;
  amount: number;
  reason?: string;
  source: string;
  createdAt: string;
  expiresAt?: string;
}

interface PCashConsumed {
  id: string;
  amount: number;
  usedFor: string; // e.g., product name or order ID
  usedAt: string;
}

export default function PCash() {
  const [tab, setTab] = useState<"credited" | "consumed" | "expiring">("credited");
  const [credited, setCredited] = useState<PCashCredit[]>([]);
  const [consumed, setConsumed] = useState<PCashConsumed[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<PCashCredit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/profile/pcash").then((res) => {
      setCredited(res.data.credited || []);
      setConsumed(res.data.consumed || []);
      setExpiringSoon(res.data.expiringSoon || []);
      setLoading(false);
    });
  }, []);

  const renderTable = () => {
    if (tab === "credited") {
      return (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Expires</th>
            </tr>
          </thead>
          <tbody>
            {credited.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-2">{entry.source}</td>
                <td className="px-4 py-2 text-green-600 font-medium">+₹{entry.amount}</td>
                <td className="px-4 py-2">{entry.reason || "—"}</td>
                <td className="px-4 py-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "No Expiry"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (tab === "consumed") {
      return (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Used For</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Used At</th>
            </tr>
          </thead>
          <tbody>
            {consumed.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-2">{entry.usedFor}</td>
                <td className="px-4 py-2 text-red-600 font-medium">-₹{entry.amount}</td>
                <td className="px-4 py-2">{new Date(entry.usedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (tab === "expiring") {
      return (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Expires On</th>
            </tr>
          </thead>
          <tbody>
            {expiringSoon.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-2">{entry.source}</td>
                <td className="px-4 py-2 text-orange-600 font-medium">₹{entry.amount}</td>
                <td className="px-4 py-2">{new Date(entry.expiresAt!).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  if (loading) return <div>Loading PCash history...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">PCash Activity</h2>

      {/* Tab Switch */}
      <div className="flex gap-3 border-b border-gray-200 pb-2">
        {["credited", "consumed", "expiring"].map((type) => (
          <button
            key={type}
            onClick={() => setTab(type as any)}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-md",
              tab === type
                ? "bg-orange-100 text-orange-600"
                : "hover:bg-gray-100 text-gray-700"
            )}
          >
            {type === "credited" && "Credited"}
            {type === "consumed" && "Consumed"}
            {type === "expiring" && "Expiring Soon"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">{renderTable()}</div>
    </div>
  );
}
