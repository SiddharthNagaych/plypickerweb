"use client";
import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import ProductItem from "./ProductItem";
import ServiceItem from "./ServiceItem";

interface ItemsListProps {
  activeTab: "products" | "services";
}

/**
 * Decides which list to show + renders empty‑state placeholders.
 */
const ItemsList: React.FC<ItemsListProps> = ({ activeTab }) => {
  const { items, services } = useSelector((s: RootState) => s.cart);

  if (activeTab === "products") {
    if (items.length === 0)
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
          <img
            src="/placeholder-package.svg"
            alt=""
            className="w-16 h-16 mx-auto mb-4 opacity-30"
          />
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      );

    return (
      <>
        {items.map((item) => (
          <ProductItem key={`${item.productId}-${item.variantIndex}`} item={item} />
        ))}
      </>
    );
  }

  /** services **/
  if (!services || services.length === 0)
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
        <img
          src="/placeholder-wrench.svg"
          alt=""
          className="w-16 h-16 mx-auto mb-4 opacity-30"
        />
        <p className="text-gray-500">No services selected</p>
      </div>
    );

  return (
    <>
      {services.map((srv, idx) => (
        <ServiceItem key={idx} service={srv} />
      ))}
    </>
  );
};

export default ItemsList;
