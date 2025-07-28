"use client";
import React from "react";
import Image from "next/image";

export type CheckoutStep = "cart" | "checkout" | "payment";

interface ProgressBarProps {
  currentStep: CheckoutStep;
}

const steps = [
  { id: "cart", name: "Cart", icon: "/carticon.png" },
  { id: "checkout", name: "Checkout", icon: "/checkouticon.png" },
  { id: "payment", name: "Payment", icon: "/truckicon.png" },
] as const;

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          {/* icon + label */}
          <div className="flex flex-col items-center">
            <Image
              src={step.icon}
              alt={step.name}
              width={24}
              height={24}
              loading="lazy"
              unoptimized
            />
            <span className="text-xs mt-2 text-black font-medium">
              {step.name}
            </span>
          </div>
          {/* connector line */}
          {idx < steps.length - 1 && (
            <div
              className={`w-36 h-0.5 mx-4 ${
                idx < currentIdx ? "bg-blue-700" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressBar;
