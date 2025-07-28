// components/admin/data-entry/TaxonomyManager.tsx
"use client";

import { useState } from "react";

import CategoryForm from "./CategoryForm";
import SubcategoryForm from "./SubcategoryForm";

interface TaxonomyManagerProps {
  city: string;
  type: "service" | "architecture";
}

export default function TaxonomyManager({ city, type }: TaxonomyManagerProps) {
  const [activeTab, setActiveTab] = useState<"category" | "subcategory">("category");

  return (
    <div className="bg-white border p-4 rounded space-y-4 shadow">
      <h2 className="text-xl font-semibold text-orange-600">
        {type === "service" ? "Service" : "Architecture"} Taxonomy
      </h2>
      
      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${activeTab === "category" ? "border-b-2 border-orange-500" : ""}`}
          onClick={() => setActiveTab("category")}
        >
          Categories
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "subcategory" ? "border-b-2 border-orange-500" : ""}`}
          onClick={() => setActiveTab("subcategory")}
        >
          Subcategories
        </button>
      </div>

      {activeTab === "category" ? (
        <CategoryForm city={city} type={type} />
      ) : (
        <SubcategoryForm city={city} type={type} />
      )}
    </div>
  );
}