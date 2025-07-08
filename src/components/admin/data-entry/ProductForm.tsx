"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import React from "react";

// ---------------------- Types ----------------------
const cities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
const CityEnum = z.enum(cities);

const ProductSchema = z.object({
  product_name: z.string().nonempty(),
  product_description: z.string(),
  desc: z.object({
    Box_Packing: z.string(),
    Size: z.string(),
    Colour: z.string(),
    Material: z.string(),
  }),
  attributes: z.object({
    images: z.array(z.string().url()),
    finish: z.string().optional(),
  }),
  price: z.number(),
  discounted_price: z.number(),
  applicability: z.union([z.literal(1), z.literal(2)]),
  laborPerFloor: z.number().optional(),
  loadingUnloadingPrice: z.number().optional(),
  category: z.string(),
  subcategory: z.string(),
  group: z.string().optional(),
  subgroup: z.string().optional(),
  brand: z.string(),
  city: CityEnum,
  vars: z
    .array(
      z.object({
        product_name: z.string(),
        desc: z.object({
          Box_Packing: z.string(),
          Size: z.string(),
          Colour: z.string(),
          Material: z.string(),
        }),
        attributes: z.object({
          var: z.string(),
          color: z.string(),
          images: z.array(z.string().url()),
        }),
        price: z.number(),
        discounted_price: z.number(),
        discounted_percent: z.number(),
        laborPerFloor: z.number(),
      })
    )
    .optional(),
});

type ProductForm = z.infer<typeof ProductSchema>;

type TaxonomyItem = { 
  _id: string; 
  name: string; 
  category?: string; 
  subcategory?: string; 
  group?: string; 
};

type BrandItem = { 
  _id: string; 
  Brand_name: string; 
};

type Taxonomy = {
  categories: TaxonomyItem[];
  subcategories: TaxonomyItem[];
  groups: TaxonomyItem[];
  subgroups: TaxonomyItem[];
  brands: BrandItem[];
};

type ProductFormComponentProps = {
  city: (typeof cities)[number];
  taxonomy: Taxonomy;
  onSaved: () => void;
};

// ---------------------- Helper ----------------------
const post = async <T,>(url: string, data: T) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ---------------------- Component ----------------------
export function ProductFormComponent({ city, taxonomy, onSaved }: ProductFormComponentProps) {
  const form = useForm<ProductForm>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      city,
      attributes: { images: [] },
      desc: { Box_Packing: "", Size: "", Colour: "", Material: "" },
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: "vars" });
  const values = watch();
  const imageList = watch("attributes.images") || [];
  const json = JSON.stringify(values, null, 2);

  const onSubmit = async (data: ProductForm) => {
    const res = await post<ProductForm>("/api/admin/product", data);
    if (res.ok) {
      alert("Product saved");
      reset();
      onSaved();
    } else {
      alert(res.error || "Failed to save");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        console.error("Form validation errors:", formErrors);
      })}
    >

      <h2 className="text-2xl font-semibold text-orange-700">Product</h2>

      <div className="grid grid-cols-2 gap-4">
        <input {...register("product_name")} placeholder="Product Name" className="border p-2 rounded" />

        <div className="col-span-2">
          <label className="block font-medium mb-1">Product Description</label>
          <textarea
            {...register("product_description")}
            placeholder="Enter product description"
            rows={6}
            className={clsx("w-full border p-2 rounded", errors.product_description && "border-red-500")}
          />
        </div>

        {/* Main Product Description */}
        <input {...register("desc.Box_Packing")} placeholder="Box Packing" className="border p-2 rounded" />
        <input {...register("desc.Size")} placeholder="Size" className="border p-2 rounded" />
        <input {...register("desc.Colour")} placeholder="Colour" className="border p-2 rounded" />
        <input {...register("desc.Material")} placeholder="Material" className="border p-2 rounded" />

        <input {...register("price", { valueAsNumber: true })} placeholder="Price" className="border p-2 rounded" />
        <input
          {...register("discounted_price", { valueAsNumber: true })}
          placeholder="Discounted Price"
          className="border p-2 rounded"
        />

        <select {...register("applicability", { valueAsNumber: true })} className="border p-2 rounded">
          <option value="">Select Applicability</option>
          <option value={1}>Floor-wise</option>
          <option value={2}>One-time</option>
        </select>

        <input
          {...register("laborPerFloor", { valueAsNumber: true })}
          placeholder="Labor/ Floor"
          className="border p-2 rounded"
        />
        <input
          {...register("loadingUnloadingPrice", { valueAsNumber: true })}
          placeholder="Loading/Unloading"
          className="border p-2 rounded"
        />

        {/* Main Product Image URLS */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Product Images</label>
          {imageList.map((_, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                {...register(`attributes.images.${index}` as const)}
                placeholder={`Image URL ${index + 1}`}
                className="border p-2 rounded w-full"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = [...imageList];
                  updated.splice(index, 1);
                  setValue("attributes.images", updated);
                }}
                className="text-red-500"
              >
                ❌
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setValue("attributes.images", [...imageList, ""])}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            ➕ Add Image
          </button>
        </div>

        {/* Taxonomy Dropdowns */}
        <select {...register("category")} className="border p-2 rounded">
          <option value="">Select Category</option>
          {taxonomy.categories.map((c: TaxonomyItem) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select {...register("subcategory")} className="border p-2 rounded">
          <option value="">Select Subcategory</option>
          {taxonomy.subcategories
            .filter((s: TaxonomyItem) => s.category === values.category)
            .map((s: TaxonomyItem) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
        </select>

        {taxonomy.groups.filter((g: TaxonomyItem) => g.subcategory === watch("subcategory")).length > 0 && (
          <select {...register("group")} className="border p-2 rounded">
            <option value="">Select Group (optional)</option>
            {taxonomy.groups
              .filter((g: TaxonomyItem) => g.subcategory === watch("subcategory"))
              .map((g: TaxonomyItem) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
          </select>
        )}

        {taxonomy.subgroups.filter((sg: TaxonomyItem) => sg.group === watch("group")).length > 0 && (
          <select {...register("subgroup")} className="border p-2 rounded">
            <option value="">Select Subgroup (optional)</option>
            {taxonomy.subgroups
              .filter((sg: TaxonomyItem) => sg.group === watch("group"))
              .map((sg: TaxonomyItem) => (
                <option key={sg._id} value={sg._id}>
                  {sg.name}
                </option>
              ))}
          </select>
        )}

        <select {...register("brand")} className="border p-2 rounded">
          <option value="">Select Brand</option>
          {taxonomy.brands.map((b: BrandItem) => (
            <option key={b._id} value={b._id}>
              {b.Brand_name}
            </option>
          ))}
        </select>
      </div>

      {/* Variants Section */}
      <div>
        <h3 className="text-lg font-semibold mt-6">Variants</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded p-4 mb-4">
            <input {...register(`vars.${index}.product_name` as const)} placeholder="Variant Name" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.desc.Box_Packing` as const)} placeholder="Box Packing" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.desc.Size` as const)} placeholder="Size" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.desc.Colour` as const)} placeholder="Colour" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.desc.Material` as const)} placeholder="Material" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.attributes.var` as const)} placeholder="Variant" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.attributes.color` as const)} placeholder="Color" className="border p-2 rounded mb-2 w-full" />
            <input {...register(`vars.${index}.attributes.images.0` as const)} placeholder="Image URL" className="border p-2 rounded mb-2 w-full" />
            <input type="number" {...register(`vars.${index}.price` as const)} placeholder="Price" className="border p-2 rounded mb-2 w-full" />
            <input type="number" {...register(`vars.${index}.discounted_price` as const)} placeholder="Discounted Price" className="border p-2 rounded mb-2 w-full" />
            <input type="number" {...register(`vars.${index}.discounted_percent` as const)} placeholder="Discount %" className="border p-2 rounded mb-2 w-full" />
            <input type="number" {...register(`vars.${index}.laborPerFloor` as const)} placeholder="Labor/Floor" className="border p-2 rounded mb-2 w-full" />
            <button type="button" onClick={() => remove(index)} className="text-red-500 mt-2">❌ Remove Variant</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            append({
              product_name: "",
              desc: { Box_Packing: "", Size: "", Colour: "", Material: "" },
              attributes: { var: "", color: "", images: [""] },
              price: 0,
              discounted_price: 0,
              discounted_percent: 0,
              laborPerFloor: 0,
            })
          }
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          ➕ Add Variant
        </button>
      </div>

      <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">{json}</pre>

      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">✅ Save Product</button>
    </form>
  );
}