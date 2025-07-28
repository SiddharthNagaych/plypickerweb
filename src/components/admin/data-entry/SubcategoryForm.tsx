// components/admin/data-entry/SubcategoryForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";

interface SubcategoryFormProps {
  city: string;
  type: "service" | "architecture";
}

interface Category {
  _id: string;
  name: string;
}

export default function SubcategoryForm({ city, type }: SubcategoryFormProps) {
  const { register, handleSubmit, reset, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Fetch categories when city or type changes
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(`/api/admin/data-entry/taxonomy/${type}?city=${city}`);
        const data = await res.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [city, type]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/data-entry/taxonomy/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "subcategory",
          data: { 
            ...data, 
            city,
            category: data.category // This is the parent category ID
          }
        }),
      });
      
      if (res.ok) {
        reset();
        alert(`${type === "service" ? "Service" : "Architecture"} subcategory saved!`);
      }
    } catch (error) {
      console.error("Error saving subcategory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Parent Category</label>
        <select
          {...register("category", { required: true })}
          className="mt-1 block w-full border rounded-md p-2"
          disabled={isLoadingCategories}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        {isLoadingCategories && (
          <p className="text-sm text-gray-500">Loading categories...</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Subcategory Name</label>
        <input
          {...register("name", { required: true })}
          className="mt-1 block w-full border rounded-md p-2"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL (optional)</label>
        <input
          {...register("image")}
          className="mt-1 block w-full border rounded-md p-2"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || isLoadingCategories}
        className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
      >
        {isLoading ? "Saving..." : "Save Subcategory"}
      </button>
    </form>
  );
}