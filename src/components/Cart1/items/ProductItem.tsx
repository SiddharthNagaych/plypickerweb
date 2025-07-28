"use client";
import React from "react";
import { useDispatch } from "react-redux";
import {
  updateQuantity,
  toggleLabor,
  updateLaborFloors,
  removeItem,
} from "@/store/cartSlice";
import { Plus, Minus, Wrench, Heart } from "lucide-react";

type ProductCartItem = ReturnType<typeof buildType>; // <- cheat to avoid huge TS interface
const buildType = () => ({}) as any;                 // remove later if you have types

interface Props {
  item: ProductCartItem;
}

/**
 * Single product row (same look & feel as before).
 */
const ProductItem: React.FC<Props> = ({ item }) => {
  const dispatch = useDispatch();

  return (
    <div className="bg-white p-6 rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
      <div className="flex gap-4">
        <img
          src={item.productImage || "/placeholder.jpg"}
          alt={item.productName}
          className="w-20 h-20 object-cover rounded"
        />

        <div className="flex-1">
          <h4 className="font-medium text-black mb-1">{item.productName}</h4>
          {item.desc?.Size && (
            <p className="text-sm text-gray-600 mb-1">Size: {item.desc.Size}</p>
          )}
          {item.brand?.Brand_name && (
            <p className="text-sm text-gray-600 mb-1">
              Brand: {item.brand.Brand_name}
            </p>
          )}
          <p className="text-sm text-gray-600">{item.productDescription}</p>
        </div>

        {/* price */}
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[#FF7803]">
              ₹{item.productDiscountedPrice ?? item.productPrice}
            </span>
            {item.productDiscountedPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{item.productPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* divider */}
      <hr className="my-4" />

      {/* quantity & labor */}
      <div className="flex flex-col gap-3">
        {/* qty */}
        <div className="flex items-center justify-between bg-[#787878] rounded-lg px-4 py-1 w-50">
          <span className="text-sm text-white">Quantity:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                item.quantity > 1 &&
                dispatch(
                  updateQuantity({
                    productId: item.productId,
                    variantIndex: item.variantIndex,
                    quantity: item.quantity - 1,
                  })
                )
              }
              className="text-white p-1 rounded-full"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium text-white">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                dispatch(
                  updateQuantity({
                    productId: item.productId,
                    variantIndex: item.variantIndex,
                    quantity: item.quantity + 1,
                  })
                )
              }
              className="text-white p-1 rounded-full"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* labor slider */}
        {item.laborPerFloor && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.includeLabor}
                    onChange={() =>
                      dispatch(
                        toggleLabor({
                          productId: item.productId,
                          variantIndex: item.variantIndex,
                          includeLabor: !item.includeLabor,
                        })
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#ACACAC] rounded-full peer peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
                <span className="text-sm font-medium">Include Labor</span>
                <Wrench className="w-4 h-4 text-gray-500" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    dispatch(
                      removeItem({
                        productId: item.productId,
                        variantIndex: item.variantIndex,
                      })
                    )
                  }
                  className="text-black hover:text-red-600 text-sm"
                >
                  Remove
                </button>
                <button className="text-red-500 hover:text-red-700">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* floors picker */}
            {item.includeLabor && (
              <div className="flex items-center gap-4 bg-[#787878] rounded-lg px-4 py-1 w-50">
                <span className="text-sm text-white">Floors:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      dispatch(
                        updateLaborFloors({
                          productId: item.productId,
                          variantIndex: item.variantIndex,
                          floors: Math.max(1, (item.laborFloors || 1) - 1),
                        })
                      )
                    }
                    className="text-white p-1 rounded-full"
                    disabled={(item.laborFloors || 1) <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-white">
                    {item.laborFloors || 1}
                  </span>
                  <button
                    onClick={() =>
                      dispatch(
                        updateLaborFloors({
                          productId: item.productId,
                          variantIndex: item.variantIndex,
                          floors: (item.laborFloors || 1) + 1,
                        })
                      )
                    }
                    className="text-white p-1 rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductItem;
