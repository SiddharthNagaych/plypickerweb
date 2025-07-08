
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Coupon {
  _id?: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minOrder: number;
  validUntil?: string;
  userIds: string[];
  categoryId?: string;
  subcategoryId?: string;
  groupId?: string;
  subgroupId?: string;
}

export default function CouponsPanel() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: "",
    discount: 0,
    type: "fixed",
    minOrder: 0,
    userIds: [],
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const res = await axios.get("/api/admin/user-handling/coupons");
      setCoupons(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setCoupons([]);
    }
  }

  async function handleCreateCoupon() {
    try {
      await axios.post("/api/admin/coupons", newCoupon);
      setNewCoupon({ code: "", discount: 0, type: "fixed", minOrder: 0, userIds: [] });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to create coupon:", error);
    }
  }

  async function handleDeleteCoupon(id: string) {
    try {
      await axios.delete(`/api/admin/coupons?id=${id}`);
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
  }

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Manage Coupons</h2>

      <Card className="p-4">
        <CardContent className="space-y-4">
          <Input
            placeholder="Coupon Code"
            value={newCoupon.code || ""}
            onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value }))}
          />
          <Input
            placeholder="Discount (₹ or %)"
            type="number"
            value={newCoupon.discount || 0}
            onChange={(e) => setNewCoupon((prev) => ({ ...prev, discount: Number(e.target.value) }))}
          />
          <select
            value={newCoupon.type}
            onChange={(e) => setNewCoupon((prev) => ({ ...prev, type: e.target.value as any }))}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
          </select>
          <Input
            placeholder="Minimum Order Amount"
            type="number"
            value={newCoupon.minOrder || 0}
            onChange={(e) => setNewCoupon((prev) => ({ ...prev, minOrder: Number(e.target.value) }))}
          />
          <Input
            placeholder="User IDs (comma-separated)"
            value={newCoupon.userIds?.join(",") || ""}
            onChange={(e) =>
              setNewCoupon((prev) => ({ ...prev, userIds: e.target.value.split(",") }))
            }
          />
          <Button onClick={handleCreateCoupon}>Create Coupon</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <Card key={coupon._id} className="p-4">
            <CardContent className="space-y-2">
              <p><strong>Code:</strong> {coupon.code}</p>
              <p><strong>Discount:</strong> {coupon.discount} {coupon.type === "percentage" ? "%" : "₹"}</p>
              <p><strong>Min Order:</strong> ₹{coupon.minOrder}</p>
              <p><strong>Users:</strong> {coupon.userIds?.length}</p>
              <Button variant="destructive" onClick={() => handleDeleteCoupon(coupon._id!)}>Delete</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
