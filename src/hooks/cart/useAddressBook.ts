"use client";
import { useCallback, useEffect, useState } from "react";

export interface Address {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: string;
  distanceFromCenter?: number;
  coordinates?: { lat: number; lng: number };
  isDefault?: boolean;
  userId?: string;
}
interface Result {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  addAddress: (a: Omit<Address, "_id">) => Promise<Address | null>;
  removeAddress: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useAddressBook = (enabled: boolean): Result => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** GET /api/address */
  const fetchAddresses = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/address");
      if (!res.ok) throw new Error("Failed to fetch addresses");
      setAddresses(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  /** POST /api/address */
  const addAddress = useCallback(
    async (addr: Omit<Address, "_id">) => {
      try {
        const res = await fetch("/api/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addr),
        });
        if (!res.ok) throw new Error("Could not save address");
        const saved = await res.json();
        setAddresses((prev) => [...prev, saved]);
        return saved;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    []
  );

  /** DELETE /api/address/:id */
  const removeAddress = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/address/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return {
    addresses,
    loading,
    error,
    addAddress,
    removeAddress,
    refetch: fetchAddresses,
  };
};