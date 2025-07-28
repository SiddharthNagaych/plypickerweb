"use client";
import { useMemo } from "react";
import type { TransportType } from "@/components/Cart1/modifiers/TransportOptions";


interface Params {
  activeTab: "products" | "services";
  items: CartState["items"];
  services: CartState["services"];
  selectedAddress: Address | null;
  transport: string | null;
  transportCharges: Record<TransportType, number>;
  coupon: ICoupon | null;
  usePcash: boolean;
  pcashApplied: number;
  pcashBalance: number;
  maxPcashApplicable: number;
}

export const useOrderTotals = ({
  activeTab,
  items,
  services,
  selectedAddress,
  transport,
  transportCharges,
  coupon,
  usePcash,
  pcashApplied,
  pcashBalance,
  maxPcashApplicable,
}: Params) =>
  useMemo(() => {
    /* helper */
    const pcashAppliedAmount = usePcash
      ? Math.min(pcashApplied, pcashBalance, maxPcashApplicable)
      : 0;

    /* ---------- product branch ---------- */
    if (activeTab === "products") {
      const productSubtotal = items.reduce(
        (sum, it) =>
          sum + (it.productDiscountedPrice ?? it.productPrice) * it.quantity,
        0
      );

      const laborCharges = items.reduce((sum, it) => {
        if (it.includeLabor && it.laborPerFloor && it.laborFloors) {
          return sum + it.laborPerFloor * it.laborFloors;
        }
        return sum;
      }, 0);

      const transportCharge = selectedAddress
        ? transportCharges[transport as TransportType] || 0
        : 0;

      const subtotal = productSubtotal;
      const gst = Math.round((subtotal + laborCharges + transportCharge) * 0.18);
      const discount = coupon
        ? coupon.type === "percentage"
          ? Math.round((subtotal * coupon.discount) / 100)
          : coupon.discount
        : 0;

      const totalBeforePcash =
        subtotal + laborCharges + transportCharge + gst - discount;
      const total = Math.max(0, totalBeforePcash - pcashAppliedAmount);

      return {
        subtotal,
        laborCharges,
        transportCharge,
        gst,
        discount,
        pcashAppliedAmount,
        totalBeforePcash,
        total,
      };
    }

    /* ---------- service branch ---------- */
    const serviceSubtotal =
      services?.reduce((sum, s) => sum + s.price, 0) || 0;

    const subtotal = serviceSubtotal;
    const gst = Math.round(subtotal * 0.18);
    const discount = coupon
      ? coupon.type === "percentage"
        ? Math.round((subtotal * coupon.discount) / 100)
        : coupon.discount
      : 0;

    const totalBeforePcash = subtotal + gst - discount;
    const total = Math.max(0, totalBeforePcash - pcashAppliedAmount);

    return {
      subtotal,
      laborCharges: 0,
      transportCharge: 0,
      gst,
      discount,
      pcashAppliedAmount,
      totalBeforePcash,
      total,
    };
  }, [
    activeTab,
    items,
    services,
    selectedAddress,
    transport,
    transportCharges,
    coupon,
    usePcash,
    pcashApplied,
    pcashBalance,
    maxPcashApplicable,
  ]);
