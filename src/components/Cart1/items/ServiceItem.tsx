"use client";
import React from "react";
import { useDispatch } from "react-redux";
import { removeService } from "@/store/cartSlice";
import { Wrench } from "lucide-react";

interface Props {
  service: any; // replace with proper Service type if you have one
}

/**
 * Single service row.
 */
const ServiceItem: React.FC<Props> = ({ service }) => {
  const dispatch = useDispatch();

  return (
    <div className="bg-white p-6 rounded-lg shadow-[0px_2px_8px_0px_#00000033]">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
          <Wrench className="w-8 h-8 text-gray-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-black mb-1">{service.name}</h4>
          <p className="text-sm text-gray-600">{service.description}</p>
        </div>
        <div className="text-right">
          <span className="font-semibold text-[#FF7803]">₹{service.price}</span>
        </div>
        <button
          onClick={() => dispatch(removeService(service.id))}
          className="text-sm text-red-500 hover:text-red-700 ml-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default ServiceItem;
