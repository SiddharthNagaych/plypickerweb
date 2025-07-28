"use client";
import { useCallback, useState } from "react";
//@ts-ignore
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";

type PayKind = "product" | "service";


interface ProductPayload {
  items: any[];
  subtotal: number;
  laborCharges: number;
  transportCharge: number;
  gst: number;
  discount: number;
  total: number;
  customer: {
    id: string;
    email: string;
    phone: string;
    name: string;
  };
  shippingAddress: Address;
  billingAddress: Address | null;
}

interface ServicePayload {
  userId: string;
  services: any[];              // mapped from cart
  shippingAddress: Address;
  billingAddress: Address | null;
  subtotal: number;
  gst: number;
  total: number;
  discount: number;
  scheduledDate: string;        // "2025‑07‑31"
  scheduledTime: string;        // "02:00 PM"
  advancePayment: {             // exactly what API expects
    percentage: number;
    amount: number;
  };
  gstDetails?: any;
}


interface Result {
  paying: boolean;
  error: string | null;
  payProduct: (p: ProductPayload) => Promise<boolean>;
  payService: (p: ServicePayload) => Promise<boolean>;
}

export const usePayment = (): Result => {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* helper: POST then launch Cashfree */
  const createAndPay = useCallback(
    async (kind: PayKind, body: any): Promise<boolean> => {
      setPaying(true);
      setError(null);
      try {
        const url =
          kind === "product"
            ? "/api/payment/createSession"
            : "/api/payment/createServiceSession";

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Server error");

        if (!data.payment_session_id)
          throw new Error("Missing payment session id");

        /* load SDK lazily */
        const cashfree = await loadCashfree({
          mode:
            process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
              ? "production"
              : "sandbox",
        });

        await cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_self",
        });

        return true; // success
      } catch (err: any) {
        setError(err.message || "Payment failed");
        console.error(err);
        return false;
      } finally {
        setPaying(false);
      }
    },
    []
  );

  /* public wrappers */
const payProduct = useCallback(
  async ({
    items,
    subtotal,
    laborCharges,
    transportCharge,
    gst,
    discount,
    total,
    customer,
    shippingAddress,
    billingAddress,
  }: {
    items: any[];
    subtotal: number;
    laborCharges: number;
    transportCharge: number;
    gst: number;
    discount: number;
    total: number;
    customer: {
      id: string;
      email: string;
      phone: string;
      name: string;
    };
    shippingAddress: Address;
    billingAddress: Address | null;
  }) =>
    createAndPay("product", {
      amount: total,
      customer: {
        customer_id: customer.id,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_name: customer.name,
      },
      items: items.map((it) => ({
        product_id: it.productId,
        name: it.productName,
        quantity: it.quantity,
        unit_price: it.productDiscountedPrice ?? it.productPrice,
      })),
      shipping_address: {
        ...shippingAddress,
        type: "HOME",
      },
      billing_address: billingAddress
        ? { ...billingAddress, type: "BILLING" }
        : null,
      order_meta: {
        return_url: `${window.location.origin}/payment/success?order_id={order_id}`,
        notify_url: `${window.location.origin}/api/payment/webhook`,
      },
      payment_methods: "cc,dc,upi",
      subtotal,
      laborCharges,
      transportCharge,
      gst,
      discount,
      total,
    }),
  [createAndPay]
);


const payService = useCallback(
  async ({
    userId,
    services,
    shippingAddress,
    billingAddress,
    subtotal,
    gst,
    discount,
    total,
    scheduledDate,
    scheduledTime,
    advancePayment,
    gstDetails,
  }: ServicePayload) =>
    createAndPay("service", {
      userId,
      services,
      shippingAddress,
      billingAddress,
      subtotal,
      gst,
      discount,
      total,
      scheduledDate,
      scheduledTime,
      advancePayment, // { percentage, amount }
      gstDetails,
    }),
  [createAndPay]
);



  return { paying, error, payProduct, payService };
};
