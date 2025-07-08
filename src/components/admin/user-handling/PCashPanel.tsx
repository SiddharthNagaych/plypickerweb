"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "axios";

interface PCashRecord {
  _id: string;
  userId: string;
  type: "credited" | "consumed";
  amount: number;
  reason?: string;
  productId?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function PCashPanel() {
  const [tab, setTab] = useState("credited");
  const [records, setRecords] = useState<PCashRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [tab]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/user-handling/pcash");
      const filtered = res.data.records.filter((r: PCashRecord) =>
        tab === "expiring"
          ? r.expiresAt && new Date(r.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : r.type === tab
      );
      setRecords(filtered);
    } catch (err) {
      console.error("Failed to fetch PCash", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">PCash Management</h1>
      <Tabs defaultValue="credited" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="credited">Credited</TabsTrigger>
          <TabsTrigger value="consumed">Consumed</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="credited">
          <RecordList records={records} loading={loading} />
        </TabsContent>
        <TabsContent value="consumed">
          <RecordList records={records} loading={loading} />
        </TabsContent>
        <TabsContent value="expiring">
          <RecordList records={records} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecordList({ records, loading }: { records: PCashRecord[]; loading: boolean }) {
  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!records.length) return <div className="text-gray-500">No records found.</div>;

  return (
    <div className="grid gap-4 mt-4">
      {records.map((r) => (
        <Card key={r._id} className="border p-4 text-sm">
          <CardContent className="p-0">
            <div><strong>User:</strong> {r.userId}</div>
            <div><strong>Amount:</strong> ₹{r.amount}</div>
            {r.reason && <div><strong>Reason:</strong> {r.reason}</div>}
            {r.productId && <div><strong>Product:</strong> {r.productId}</div>}
            {r.expiresAt && <div><strong>Expires At:</strong> {new Date(r.expiresAt).toLocaleDateString()}</div>}
            <div><strong>Date:</strong> {new Date(r.createdAt).toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
