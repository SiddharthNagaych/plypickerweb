"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

// Enums
const cityList = ["Pune", "Mumbai", "Navi Mumbai"] as const;
const unitList = ["rft", "sft", "nos"] as const;

const CityEnum = z.enum(cityList);
const UnitEnum = z.enum(unitList);

// Schema
const PriceSchema = z.object({
  city: CityEnum,
  price: z.number().optional(),
  discounted_price: z.number().optional(),
  discounted_percent: z.number().optional(),
});

const VariantSchema = z.object({
  serviceName: z.string(),
  serviceDescription: z.string(),
  attrs: z.object({
    Variants: z.string(),
    imgs: z.array(z.string().url()).optional(),
  }),
  price: z.number().optional(),
  discounted_price: z.array(PriceSchema).optional(),
  discounted_percent: z.number().optional(),
});

const ArchitectureSchema = z.object({
  city: CityEnum,
  serviceCategory: z.string(),
  serviceSubcategory: z.string(),
  serviceName: z.string(),
  serviceDescription: z.string(),
  order: z.number(),
  unit: UnitEnum,
  attrs: z.object({
    imgs: z.array(z.string().url()),
  }),
  rating_and_review: z.number(),
  get_price_requested: z.boolean(),
  vars: z.array(VariantSchema),
}).strict();

type ArchitectureFormData = z.infer<typeof ArchitectureSchema>;

interface ArchitectureFormProps {
  city: z.infer<typeof CityEnum>;
  onSaved: () => void;
}

export default function ArchitectureFormComponent({ city, onSaved }: ArchitectureFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    watch,
  } = useForm<ArchitectureFormData>({
    resolver: zodResolver(ArchitectureSchema),
    defaultValues: {
      city,
      unit: "sft",
      serviceCategory: "",
      serviceSubcategory: "",
      serviceName: "",
      serviceDescription: "",
      order: 0,
      attrs: { imgs: [] },
      rating_and_review: 4.5,
      get_price_requested: false,
      vars: [],
    },
  });

  useEffect(() => {
    setValue("city", city);
  }, [city, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "vars",
  });

  const onSubmit = async (data: ArchitectureFormData) => {
    const res = await fetch("/api/admin/architecture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("✅ Architecture service saved!");
      reset();
      onSaved();
    } else {
      const err = await res.json();
      alert("❌ Error: " + err.error);
    }
  };

  const json = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 border rounded shadow">
      <h2 className="text-2xl font-semibold text-orange-600 mb-4">🏛️ Architecture Service Upload</h2>

      {/* City + Unit */}
      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block font-medium mb-1">City</label>
          <select {...register("city")} className="w-full border px-3 py-2 rounded">
            {cityList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="w-1/2">
          <label className="block font-medium mb-1">Unit</label>
          <select {...register("unit")} className="w-full border px-3 py-2 rounded">
            {unitList.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Basic Fields */}
      <input {...register("serviceCategory")} placeholder="Service Category" className="w-full border px-3 py-2 rounded" required />
      <input {...register("serviceSubcategory")} placeholder="Service Subcategory" className="w-full border px-3 py-2 rounded" required />
      <input {...register("serviceName")} placeholder="Service Name" className="w-full border px-3 py-2 rounded" required />
      <textarea {...register("serviceDescription")} placeholder="Service Description" className="w-full border px-3 py-2 rounded" rows={3} />
      <input {...register("order", { valueAsNumber: true })} type="number" placeholder="Order" className="w-full border px-3 py-2 rounded" />

      {/* Images */}
      <textarea
        placeholder="Main Image URLs (comma separated)"
        className="w-full border px-3 py-2 rounded"
        onBlur={(e) =>
          setValue("attrs.imgs", e.target.value.split(",").map((url) => url.trim()))
        }
      />

      {/* Checkbox */}
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("get_price_requested")} />
        Get Price Requested
      </label>

      {/* Variants */}
      <div>
        <h3 className="text-lg font-semibold mt-6 mb-2">Variants</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 mb-4 rounded space-y-2">
            <input {...register(`vars.${index}.serviceName`)} placeholder="Variant Name" className="w-full border px-3 py-2 rounded" />
            <textarea {...register(`vars.${index}.serviceDescription`)} placeholder="Variant Description" className="w-full border px-3 py-2 rounded" />
            <input {...register(`vars.${index}.attrs.Variants`)} placeholder="Variant Attributes" className="w-full border px-3 py-2 rounded" />
            <textarea
              placeholder="Variant Image URLs (comma separated)"
              onBlur={(e) =>
                setValue(`vars.${index}.attrs.imgs`, e.target.value.split(",").map((url) => url.trim()))
              }
              className="w-full border px-3 py-2 rounded"
            />
            <input type="number" placeholder="Base Price" {...register(`vars.${index}.price`, { valueAsNumber: true })} className="w-full border px-3 py-2 rounded" />

            <textarea
              placeholder='Discounted Prices JSON [{"city":"Pune","price":100}]'
              className="w-full border px-3 py-2 rounded"
              rows={3}
              onBlur={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setValue(`vars.${index}.discounted_price`, parsed);
                } catch {
                  alert("❌ Invalid JSON in discounted_price field.");
                }
              }}
            />

            <input
              type="number"
              placeholder="Discount %"
              {...register(`vars.${index}.discounted_percent`, { valueAsNumber: true })}
              className="w-full border px-3 py-2 rounded"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-600 underline"
            >
              ❌ Remove Variant
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            append({
              serviceName: "",
              serviceDescription: "",
              attrs: { Variants: "", imgs: [] },
            })
          }
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          ➕ Add Variant
        </button>
      </div>

      <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded">
        🚀 Save Architecture Service
      </button>

      <div className="bg-gray-100 p-4 mt-6 rounded font-mono text-xs whitespace-pre-wrap">
        <pre>{JSON.stringify(json, null, 2)}</pre>
      </div>
    </form>
  );
}
