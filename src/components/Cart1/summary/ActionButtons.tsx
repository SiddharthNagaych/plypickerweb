"use client";
import React from "react";
import { ShoppingCart } from "lucide-react";

export type CheckoutStep = "cart" | "checkout" | "payment";
export type TabType = "products" | "services";

interface Props {
  currentStep: CheckoutStep;
  activeTab: TabType;

  /* disable flags */
  isCartEmpty: boolean;
  canContinueToPayment: boolean;   // false → button disabled
  canPay: boolean;                 // false → Pay Now disabled
  isProcessingPayment: boolean;

  /* handlers */
  onProceedToCheckout: () => void;
  onBackToCart: () => void;
  onContinueToPayment: () => void;
  onPay: () => void;
}

const ActionButtons: React.FC<Props> = ({
  currentStep,
  activeTab,
  isCartEmpty,
  canContinueToPayment,
  canPay,
  isProcessingPayment,
  onProceedToCheckout,
  onBackToCart,
  onContinueToPayment,
  onPay,
}) => {
  /* Cart step */
  if (currentStep === "cart") {
    return (
      <button
        onClick={onProceedToCheckout}
        disabled={isCartEmpty}
        className={`w-full py-3 rounded-lg font-semibold ${
          isCartEmpty
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[#FF7803] text-white hover:bg-orange-600"
        }`}
      >
        Proceed to Checkout
      </button>
    );
  }

  /* Checkout step */
  if (currentStep === "checkout") {
    return (
      <div className="flex gap-3">
        <button
          onClick={onBackToCart}
          className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to Cart
        </button>
        <button
          onClick={onContinueToPayment}
          disabled={!canContinueToPayment}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            canContinueToPayment
              ? "bg-[#FF7803] text-white hover:bg-orange-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue to Payment
        </button>
      </div>
    );
  }

  /* Payment step */
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onPay}
        disabled={!canPay || isProcessingPayment}
        className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
          !canPay || isProcessingPayment
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[#FF7803] text-white hover:bg-orange-600"
        }`}
      >
        {isProcessingPayment ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            {activeTab === "services" ? "Pay Advance" : "Pay Now"}
          </>
        )}
      </button>
      <button
        onClick={onBackToCart}
        className="w-full py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
      >
        Back to Checkout
      </button>
    </div>
  );
};

export default ActionButtons;
