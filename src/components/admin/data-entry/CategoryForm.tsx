// components/admin/data-entry/CategoryForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

interface CategoryFormProps {
  city: string;
  type: "service" | "architecture";
}

export default function CategoryForm({ city, type }: CategoryFormProps) {
  const { register, handleSubmit, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/data-entry/taxonomy/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "category",
          data: { ...data, city }
        }),
      });
      
      if (res.ok) {
        reset();
        alert(`${type === "service" ? "Service" : "Architecture"} category saved!`);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Category Name</label>
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
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
      >
        {isLoading ? "Saving..." : "Save Category"}
      </button>
    </form>
  );
}