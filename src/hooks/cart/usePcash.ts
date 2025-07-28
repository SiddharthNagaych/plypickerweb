"use client";
import { useCallback, useEffect, useState } from "react";

interface Result {
  balance: number;
  maxApplicable: number;
  loading: boolean;
  error: string | null;
  /** call again to refresh */
  refetch: () => Promise<void>;
}

/**
 * Loads the user's P‑Cash balance and max‑applicable value.
 * Automatically runs on mount; exposes `refetch()` for manual refresh.
 */
export const usePcashBalance  = (enabled: boolean): Result => {
  const [balance, setBalance] = useState(0);
  const [maxApplicable, setMaxApplicable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/pcash");
      if (!res.ok) throw new Error("Failed to fetch P‑Cash");
      const data = await res.json();
      setBalance(data.balance);
      setMaxApplicable(data.maxApplicable);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  /* run once when enabled flips true */
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    maxApplicable,
    loading,
    error,
    refetch: fetchBalance,
  };
};
