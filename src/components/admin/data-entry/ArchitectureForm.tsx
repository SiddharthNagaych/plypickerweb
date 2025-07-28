"use client";

import { useForm, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { ObjectId } from 'bson'; // Added for ID generation
import {
  IArchitectureCategory,
  IArchitectureSubcategory,
} from "../../../../types/architecture";

interface ArchitectureFormProps {
  city: string;
  onSaved: () => void;
}

interface VariantForm {
 

  serviceDescription: string;
  variantName: string;
  images: string;
  specs: string;
  get_price_requested: boolean;
  prices: {
    city: string;
    price?: number;
    discountedPrice?: number;
    discountedPercent?: number;
  }[];
}

interface FormData {
  serviceCategory: string;
  serviceSubcategory: string;
  baseServiceName: string;
  baseServiceDescription: string;
  unit: "rft" | "sft" | "nos";
  variants: VariantForm[];
}

// Helper function remains the same
const getObjectIdString = (id: unknown): string => {
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && "toString" in id) {
    return (id as { toString: () => string }).toString();
  }
  return "";
};

export default function ArchitectureForm({
  city,
  onSaved,
}: ArchitectureFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      variants: [],
    },
  });

  const [categories, setCategories] = useState<IArchitectureCategory[]>([]);
  const [subcategories, setSubcategories] = useState<IArchitectureSubcategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [variantCount, setVariantCount] = useState(0);

  const selectedCategory = watch("serviceCategory");
  const variants = watch("variants");

  useEffect(() => {
    fetchTaxonomy();
  }, [city]);

  const fetchTaxonomy = async () => {
    try {
      const res = await fetch(`/api/admin/data-entry/architecture/taxonomy?city=${city}`);
      const data = await res.json();
      setCategories(data.categories || []);
      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error("Error fetching taxonomy:", error);
    }
  };

  const addVariant = () => {
    setVariantCount(prev => prev + 1);
    setValue("variants", [
      ...variants,
      {
       
       
        serviceDescription: "",
        variantName: "",
        images: "",
        specs: "",
        get_price_requested: false,
        prices: [{ city }]
      }
    ]);
  };

  const removeVariant = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setValue("variants", updatedVariants);
    setVariantCount(prev => prev - 1);
  };

  const handlePriceChange = (variantIndex: number, priceValue: string) => {
    const hasPrice = priceValue && parseFloat(priceValue) > 0;
    setValue(`variants.${variantIndex}.get_price_requested`, !hasPrice);
  };

  const onSubmit = async (data: FormData) => {
    if (!data.variants || data.variants.length === 0) {
      alert("Please add at least one variant!");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        city,
        serviceCategory: data.serviceCategory,
        serviceSubcategory: data.serviceSubcategory,
        serviceName: data.baseServiceName,
        serviceDescription: data.baseServiceDescription,
        unit: data.unit,
        variants: data.variants.map(variant => ({
      
         
          serviceDescription: variant.serviceDescription,
          variantName: variant.variantName,
          specs: variant.specs,
          get_price_requested: variant.get_price_requested,
          images: variant.images.split(',').map(img => img.trim()).filter(img => img),
          prices: variant.prices.map(price => ({
            city: price.city,
            price: price.price,
            discountedPrice: price.discountedPrice,
            discountedPercent: price.discountedPercent
          }))
        }))
      };

      const res = await fetch("/api/admin/data-entry/architecture/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        reset();
        setVariantCount(0);
        onSaved();
        alert("Architecture service saved successfully!");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || 'Failed to save service'}`);
      }
    } catch (error) {
      console.error("Error saving architecture service:", error);
      alert("Error saving service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border p-4 rounded space-y-4 shadow"
    >
      <h2 className="text-xl font-semibold text-orange-600">
        Architecture Service Entry
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            {...register("serviceCategory", { required: true })}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={getObjectIdString(cat._id)} value={getObjectIdString(cat._id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subcategory *
          </label>
          <select
            {...register("serviceSubcategory", { required: true })}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">Select Subcategory</option>
            {subcategories
              .filter((sub) => {
                const subCatParentId =
                  typeof sub.category === "object" && "_id" in sub.category
                    ? getObjectIdString((sub.category as any)._id)
                    : getObjectIdString(sub.category);
                return subCatParentId === selectedCategory;
              })
              .map((sub) => (
                <option
                  key={getObjectIdString(sub._id)}
                  value={getObjectIdString(sub._id)}
                >
                  {sub.name}
                </option>
              ))}
          </select>
        </div>

        {/* Master Service Name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Master Service Name *
          </label>
          <input
            {...register("baseServiceName", { required: true })}
            placeholder="e.g., Architecture Design Services"
            className="mt-1 block w-full border rounded-md p-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            This is the main service title (specific details go in variants)
          </p>
        </div>

        {/* General Description */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            General Service Description *
          </label>
          <textarea
            {...register("baseServiceDescription", { required: true })}
            placeholder="General overview of the architecture service offerings..."
            className="mt-1 block w-full border rounded-md p-2"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            General description (specific details go in variants)
          </p>
        </div>

        {/* Unit Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unit *
          </label>
          <select
            {...register("unit", { required: true })}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="rft">Running Feet</option>
            <option value="sft">Square Feet</option>
            <option value="nos">Numbers</option>
          </select>
        </div>
      </div>

      {/* Variants Section */}
      <div className="mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Service Variants * 
            <span className="text-sm font-normal text-gray-500 ml-2">
              (All pricing, images, and specs are defined here)
            </span>
          </h3>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Variant
          </button>
        </div>

        {variants?.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ You must add at least one variant. Each variant contains its own images, pricing, and specifications.
            </p>
          </div>
        )}

        {variants?.map((variant, index) => (
          <div key={index} className="mt-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-800">Variant #{index + 1}</h4>
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Variant Name *</label>
                <input
                  {...register(`variants.${index}.variantName`, { required: true })}
                  placeholder="e.g., Basic Package, Premium Package"
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

            

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Variant Description *</label>
                <textarea
                  {...register(`variants.${index}.serviceDescription`, { required: true })}
                  placeholder="Detailed description of this specific variant..."
                  className="mt-1 block w-full border rounded-md p-2"
                  rows={2}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Variant Images *</label>
                <input
                  {...register(`variants.${index}.images`, { required: true })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  className="mt-1 block w-full border rounded-md p-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter multiple image URLs separated by commas (each variant needs its own images)
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Variant Specifications *</label>
                <textarea
                  {...register(`variants.${index}.specs`, { required: true })}
                  placeholder="e.g., 2D Floor Plans, Basic Elevations, Room Layout, 2 free revisions..."
                  className="mt-1 block w-full border rounded-md p-2"
                  rows={2}
                />
              </div>

              {/* UPDATED PRICING SECTION */}
              <div className="col-span-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    {...register(`variants.${index}.get_price_requested`)}
                    className="mr-2"
                    id={`get-price-${index}`}
                  />
                  <label htmlFor={`get-price-${index}`} className="text-sm font-medium text-gray-700">
                    Requires Price Request (Quote-based pricing)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Check this if this variant needs custom pricing. Leave unchecked for fixed pricing.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price per {watch("unit") || "unit"}
                  {watch(`variants.${index}.get_price_requested`) && 
                    <span className="text-orange-600"> (will be ignored - quote needed)</span>
                  }
                </label>
                <input
                  type="number"
                  {...register(`variants.${index}.prices.0.price`, { min: 0 })}
                  className="mt-1 block w-full border rounded-md p-2"
                  step="0.01"
                  placeholder={watch(`variants.${index}.get_price_requested`) ? "Price request needed" : "Enter fixed price"}
                  disabled={watch(`variants.${index}.get_price_requested`)}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discounted Price
                  {watch(`variants.${index}.get_price_requested`) && 
                    <span className="text-orange-600"> (will be ignored)</span>
                  }
                </label>
                <input
                  type="number"
                  {...register(`variants.${index}.prices.0.discountedPrice`, { min: 0 })}
                  className="mt-1 block w-full border rounded-md p-2"
                  step="0.01"
                  placeholder="Optional"
                  disabled={watch(`variants.${index}.get_price_requested`)}
                />
              </div>

              {/* Visual indicator */}
              {watch(`variants.${index}.get_price_requested`) && (
                <div className="col-span-2 p-2 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm text-orange-800">
                    📋 This variant will show "Get Price" button instead of "Add to Cart"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-600">
          {variants?.length || 0} variant(s) added
        </div>
        <button
          type="submit"
          disabled={isLoading || !variants?.length}
          className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save Architecture Service"}
        </button>
      </div>
    </form>
  );
}