// app/admin/page.tsx
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BulkProductUploadComponent } from "@/components/admin/data-entry/BulkProductUploadComponent";
import ArchitectureForm from "@/components/admin/data-entry/ArchitectureForm";
import ServiceForm from "@/components/admin/data-entry/ServiceForm";

import React, { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { ProductFormComponent } from "@/components/admin/data-entry/ProductForm";
import {
  cities,
  City,
  Taxonomy,
  CategoryFormData,
  SubcategoryFormData,
  GroupFormData,
  SubgroupFormData,
  BrandFormData,
  CategorySchema,
  SubcategorySchema,
  GroupSchema,
  SubgroupSchema,
  BrandSchema,
} from "./types/admin";
import TaxonomyManager from "@/components/admin/data-entry/TaxonomyManager";

// Type definitions

// API response types
interface ApiResponse {
  ok?: boolean;
  error?: string;
}

// POST utility with proper typing
const post = async (
  url: string,
  data: Record<string, unknown>
): Promise<ApiResponse> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export default function AdminPanel() {
  const [city, setCity] = useState<City>("Pune");
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    categories: [],
    subcategories: [],
    groups: [],
    subgroups: [],
    brands: [],
  });

  function CouponCreateForm({ taxonomy }: { taxonomy: Taxonomy }) {
    const form = useForm({
      defaultValues: {
        code: "",
        discount: 0,
        type: "percentage",
        minOrder: 0,
        validUntil: "",
        assignedTo: "",
        category: "",
        subcategory: "",
        group: "",
        subgroup: "",
        phoneNumbers: "", // Add this line
      },
    });

    const {
      register,
      handleSubmit,
      watch,
      reset,
      formState: { errors },
    } = form;

    const selectedCategory = watch("category");
    const selectedSubcategory = watch("subcategory");

    const onSubmit = async (data: any) => {
      const payload = {
        ...data,
        phoneNumbers: data.phoneNumbers.split(",").map((p: string) => p.trim()),
      };

      const res = await fetch("/api/profile/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Coupon created!");
        reset();
      } else {
        alert(result.error || "Failed to create coupon");
      }
    };

    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border p-4 rounded space-y-4 shadow"
      >
        <h2 className="text-xl font-semibold text-orange-600">Create Coupon</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            {...register("code")}
            placeholder="Coupon Code"
            className="border p-2 rounded"
          />
          <input
            type="number"
            {...register("discount")}
            placeholder="Discount Value"
            className="border p-2 rounded"
          />
          <select {...register("type")} className="border p-2 rounded">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
          <input
            type="number"
            {...register("minOrder")}
            placeholder="Min Order Amount"
            className="border p-2 rounded"
          />
          <input
            type="date"
            {...register("validUntil")}
            className="border p-2 rounded"
          />
          <input
            {...register("phoneNumbers")}
            placeholder="Mobile Numbers (comma separated)"
            className="border p-2 rounded"
          />

          <select {...register("category")} className="border p-2 rounded">
            <option value="">Select Category</option>
            {taxonomy.categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select {...register("subcategory")} className="border p-2 rounded">
            <option value="">(Optional) Select Subcategory</option>
            {taxonomy.subcategories
              .filter((s) => s.category === selectedCategory)
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
          </select>
          <select {...register("group")} className="border p-2 rounded">
            <option value="">(Optional) Select Group</option>
            {taxonomy.groups
              .filter((g) => g.subcategory === selectedSubcategory)
              .map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
          </select>
          <select {...register("subgroup")} className="border p-2 rounded">
            <option value="">(Optional) Select Subgroup</option>
            {taxonomy.subgroups
              .filter((sg) => sg.group === watch("group"))
              .map((sg) => (
                <option key={sg._id} value={sg._id}>
                  {sg.name}
                </option>
              ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Coupon
        </button>
      </form>
    );
  }

  function PCashCreditForm() {
    const form = useForm({
      defaultValues: {
        phoneNumbers: "", // comma-separated phone numbers (required)
        amount: "",
        reason: "",
        expiresAt: "", // ISO string or blank
      },
    });

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = form;

    const onSubmit = async (data: any) => {
      // Validate at least one phone number is provided
      if (!data.phoneNumbers.trim()) {
        alert("Please enter at least one phone number");
        return;
      }

      const payload = {
        phoneNumbers: data.phoneNumbers.split(",").map((p: string) => p.trim()),
        amount: Number(data.amount),
        reason: data.reason,
        expiresAt: data.expiresAt || undefined,
      };

      try {
        const res = await fetch("/api/profile/pcash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (res.ok) {
          alert(`PCash credited to ${payload.phoneNumbers.length} user(s)!`);
          reset();
        } else {
          alert(result.error || "Failed to credit PCash");
        }
      } catch (error) {
        console.error("PCash credit error:", error);
        alert("Failed to connect to server");
      }
    };

    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border p-4 rounded space-y-4 shadow"
      >
        <h2 className="text-xl font-semibold text-orange-600">Credit PCash</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <input
              {...register("phoneNumbers", { required: true })}
              placeholder="Mobile Numbers (comma separated)"
              className={clsx(
                "border p-2 rounded w-full",
                errors.phoneNumbers && "border-red-500"
              )}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter one or more phone numbers separated by commas
            </p>
          </div>

          <input
            type="number"
            {...register("amount", { required: true, min: 1 })}
            placeholder="Amount (₹)"
            className={clsx(
              "border p-2 rounded",
              errors.amount && "border-red-500"
            )}
          />

          <select
            {...register("reason", { required: true })}
            className={clsx(
              "border p-2 rounded",
              errors.reason && "border-red-500"
            )}
          >
            <option value="">Select Reason</option>
            <option value="return_refund">Return / Refund</option>
            <option value="referral">Referral</option>
            <option value="promotion">Promotion</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            {...register("expiresAt")}
            className="border p-2 rounded"
            min={new Date().toISOString().split("T")[0]} // Today's date
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Credit PCash
        </button>
      </form>
    );
  }

  const refetchTaxonomy = useCallback(async () => {
    const res = await fetch(`/api/admin/data-entry/taxonomy?city=${city}`);
    const data: Taxonomy = await res.json();
    setTaxonomy(data);
  }, [city]);

  useEffect(() => {
    refetchTaxonomy();
  }, [refetchTaxonomy]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12 bg-gray-50">
      <h1 className="text-3xl font-bold text-orange-700">
        🛠️ Ply Picker Admin Panel
      </h1>

      {/* City Selection */}
      <div className="flex items-center space-x-4">
        <label className="font-medium">City:</label>
        <select
          className="border p-2 rounded"
          value={city}
          onChange={(e) => setCity(e.target.value as City)}
        >
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Taxonomy Forms */}
      <CategoryForm city={city} taxonomy={taxonomy} />
      <SubcategoryForm city={city} taxonomy={taxonomy} />
      <GroupForm city={city} taxonomy={taxonomy} />
      <SubgroupForm city={city} taxonomy={taxonomy} />
      <BrandForm city={city} taxonomy={taxonomy} />

      {/* Product Form */}
      <ProductFormComponent
        city={city}
        taxonomy={taxonomy}
        onSaved={refetchTaxonomy}
      />

      {/* Bulk Product Upload */}
      <BulkProductUploadComponent
        city={city}
        taxonomy={taxonomy}
        onUploaded={refetchTaxonomy}
      />
       {/* Service Taxonomy Management */}
      <TaxonomyManager city={city} type="service" />

      {/* Architecture Taxonomy Management */}
      <TaxonomyManager city={city} type="architecture" />


      {/* Architecture Quote Form */}
      <ArchitectureForm city={city} onSaved={refetchTaxonomy} />

      {/* Service Entry Form */}
      <ServiceForm city={city} onSaved={refetchTaxonomy} />
      <PCashCreditForm />
      <CouponCreateForm taxonomy={taxonomy} />
    </div>
  );
}

// Category Form Component
function CategoryForm({ city }: { city: City; taxonomy: Taxonomy }) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { city, name: "", category_image: "" },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const values = watch();

  useEffect(() => {
    setValue("city", city);
  }, [city, setValue]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    const payload = { type: "category", items: [data] };
    const res = await post("/api/admin/data-entry/taxonomyBulk", payload);
    if (res.ok) {
      alert("Category saved!");
      form.reset({ city, name: "", category_image: "" });
    } else {
      alert(res.error || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border p-4 rounded space-y-4 shadow"
    >
      <h2 className="text-xl font-semibold text-orange-600">Category</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("name")}
          placeholder="Category Name"
          className={clsx(
            "border p-2 rounded",
            errors.name && "border-red-500"
          )}
        />
        <input
          {...register("category_image")}
          placeholder="Image URL (optional)"
          className="border p-2 rounded"
        />
      </div>
      <pre className="bg-gray-50 p-2 rounded text-sm">
        {JSON.stringify(values, null, 2)}
      </pre>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Category
      </button>
    </form>
  );
}

// Subcategory Form Component
function SubcategoryForm({
  city,
  taxonomy,
}: {
  city: City;
  taxonomy: Taxonomy;
}) {
  const form = useForm<SubcategoryFormData>({
    resolver: zodResolver(SubcategorySchema),
    defaultValues: { city, name: "", category: "", image: "" },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const values = watch();

  useEffect(() => {
    setValue("city", city);
  }, [city, setValue]);

  const onSubmit: SubmitHandler<SubcategoryFormData> = async (data) => {
    const payload = { type: "subcategory", items: [data] };
    const res = await post("/api/admin/data-entry/taxonomyBulk", payload);
    if (res.ok) {
      alert("Subcategory saved!");
      form.reset({ city, name: "", category: "", image: "" });
    } else {
      alert(res.error || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border p-4 rounded space-y-4 shadow"
    >
      <h2 className="text-xl font-semibold text-orange-600">Subcategory</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("name")}
          placeholder="Subcategory Name"
          className={clsx(
            "border p-2 rounded",
            errors.name && "border-red-500"
          )}
        />
        <select
          {...register("category")}
          className={clsx(
            "border p-2 rounded",
            errors.category && "border-red-500"
          )}
        >
          <option value="">Select Category</option>
          {taxonomy.categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          {...register("image")}
          placeholder="Image URL (optional)"
          className="border p-2 rounded"
        />
      </div>
      <pre className="bg-gray-50 p-2 rounded text-sm">
        {JSON.stringify(values, null, 2)}
      </pre>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Subcategory
      </button>
    </form>
  );
}

// Group Form Component
function GroupForm({ city, taxonomy }: { city: City; taxonomy: Taxonomy }) {
  const form = useForm<GroupFormData>({
    resolver: zodResolver(GroupSchema),
    defaultValues: {
      city,
      name: "",
      category: "",
      subcategory: "",
      category_image: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const values = watch();
  const selectedCategory = watch("category");

  useEffect(() => {
    setValue("city", city);
  }, [city, setValue]);

  const onSubmit: SubmitHandler<GroupFormData> = async (data) => {
    const payload = { type: "group", items: [data] };
    const res = await post("/api/admin/data-entry/taxonomyBulk", payload);
    if (res.ok) {
      alert("Group saved!");
      form.reset({
        city,
        name: "",
        category: "",
        subcategory: "",
        category_image: "",
      });
    } else {
      alert(res.error || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border p-4 rounded space-y-4 shadow"
    >
      <h2 className="text-xl font-semibold text-orange-600">Group</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("name")}
          placeholder="Group Name"
          className={clsx(
            "border p-2 rounded",
            errors.name && "border-red-500"
          )}
        />
        <select
          {...register("category")}
          className={clsx(
            "border p-2 rounded",
            errors.category && "border-red-500"
          )}
        >
          <option value="">Select Category</option>
          {taxonomy.categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select {...register("subcategory")} className="border p-2 rounded">
          <option value="">(Optional) Select Subcategory</option>
          {taxonomy.subcategories
            .filter((s) => s.category === selectedCategory)
            .map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
        </select>
        <input
          {...register("category_image")}
          placeholder="Image URL (optional)"
          className="border p-2 rounded"
        />
      </div>
      <pre className="bg-gray-50 p-2 rounded text-sm">
        {JSON.stringify(values, null, 2)}
      </pre>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Group
      </button>
    </form>
  );
}

// Subgroup Form Component
function SubgroupForm({ city, taxonomy }: { city: City; taxonomy: Taxonomy }) {
  const form = useForm<SubgroupFormData>({
    resolver: zodResolver(SubgroupSchema),
    defaultValues: {
      city,
      name: "",
      category: "",
      subcategory: "",
      group: "",
      category_image: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const values = watch();
  const selectedCategory = watch("category");
  const selectedSubcategory = watch("subcategory");

  useEffect(() => {
    setValue("city", city);
  }, [city, setValue]);

  const onSubmit: SubmitHandler<SubgroupFormData> = async (data) => {
    const payload = { type: "subgroup", items: [data] };
    const res = await post("/api/admin/data-entry/taxonomyBulk", payload);
    if (res.ok) {
      alert("Subgroup saved!");
      form.reset({
        city,
        name: "",
        category: "",
        subcategory: "",
        group: "",
        category_image: "",
      });
    } else {
      alert(res.error || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border p-4 rounded space-y-4 shadow"
    >
      <h2 className="text-xl font-semibold text-orange-600">Subgroup</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("name")}
          placeholder="Subgroup Name"
          className={clsx(
            "border p-2 rounded",
            errors.name && "border-red-500"
          )}
        />
        <select
          {...register("category")}
          className={clsx(
            "border p-2 rounded",
            errors.category && "border-red-500"
          )}
        >
          <option value="">Select Category</option>
          {taxonomy.categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select {...register("subcategory")} className="border p-2 rounded">
          <option value="">(Optional) Select Subcategory</option>
          {taxonomy.subcategories
            .filter((s) => s.category === selectedCategory)
            .map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
        </select>
        <select {...register("group")} className="border p-2 rounded">
          <option value="">(Optional) Select Group</option>
          {taxonomy.groups
            .filter((g) => g.subcategory === selectedSubcategory)
            .map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
        </select>
        <input
          {...register("category_image")}
          placeholder="Image URL (optional)"
          className="border p-2 rounded"
        />
      </div>
      <pre className="bg-gray-50 p-2 rounded text-sm">
        {JSON.stringify(values, null, 2)}
      </pre>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Subgroup
      </button>
    </form>
  );
}

// Brand Form Component
function BrandForm({ city, taxonomy }: { city: City; taxonomy: Taxonomy }) {
  const form = useForm<BrandFormData>({
    resolver: zodResolver(BrandSchema),
    defaultValues: { city, Brand_name: "", Category: "" },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const values = watch();

  useEffect(() => {
    setValue("city", city);
  }, [city, setValue]);

  const onSubmit: SubmitHandler<BrandFormData> = async (data) => {
    const payload = { type: "brand", items: [data] };
    const res = await post("/api/admin/data-entry/taxonomyBulk", payload);
    if (res.ok) {
      alert("Brand saved!");
      form.reset({ city, Brand_name: "", Category: "" });
    } else {
      alert(res.error || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border p-4 rounded space-y-4 shadow"
    >
      <h2 className="text-xl font-semibold text-orange-600">Brand</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("Brand_name")}
          placeholder="Brand Name"
          className={clsx(
            "border p-2 rounded",
            errors.Brand_name && "border-red-500"
          )}
        />
        <select
          {...register("Category")}
          className={clsx(
            "border p-2 rounded",
            errors.Category && "border-red-500"
          )}
        >
          <option value="">Select Category</option>
          {taxonomy.categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <pre className="bg-gray-50 p-2 rounded text-sm">
        {JSON.stringify(values, null, 2)}
      </pre>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Brand
      </button>
    </form>
  );
}
