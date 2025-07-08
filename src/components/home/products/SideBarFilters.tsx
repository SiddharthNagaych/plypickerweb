"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Range } from "react-range";

// Define proper types
type BrandFilter = {
  id: string;
  name: string;
  count?: number;
};

type ColorFilter = {
  value: string;
  count: number;
};

type PriceRange = {
  min: number;
  max: number;
};

interface SidebarFiltersProps {
  brands: BrandFilter[];
  facets?: {
    colors?: ColorFilter[];
    price?: PriceRange;
    discount?: PriceRange;
  };
  loading?: boolean; // Loading state for brands
}

const colorOptions = [
  { name: "Red", value: "Red", hex: "#EF4444" },
  { name: "Blue", value: "Blue", hex: "#3B82F6" },
  { name: "Brown", value: "Brown", hex: "#92400E" },
  { name: "Natural", value: "Natural", hex: "#D4A574" },
  { name: "White", value: "White", hex: "#FFFFFF" },
  { name: "Black", value: "Black", hex: "#000000" },
];

export default function SidebarFilters({ 
  brands = [], 
  facets, 
  loading = false 
}: SidebarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Get current filter values
  const subgroupId = searchParams.get("subgroupId") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const subcategoryId = searchParams.get("subcategoryId") || "";
  const groupId = searchParams.get("groupId") || "";
  
  const [color, setColor] = useState(searchParams.get("color") || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.getAll("brandId")
  );

  // Use facets for range if available, otherwise use defaults
  const defaultMinPrice = facets?.price?.min || 0;
  const defaultMaxPrice = facets?.price?.max || 100000;
  const defaultMinDiscount = facets?.discount?.min || 0;
  const defaultMaxDiscount = facets?.discount?.max || 100;

  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice") || defaultMinPrice),
    Number(searchParams.get("maxPrice") || defaultMaxPrice),
  ]);

  const [discountRange, setDiscountRange] = useState<[number, number]>([
    Number(searchParams.get("minDiscount") || defaultMinDiscount),
    Number(searchParams.get("maxDiscount") || defaultMaxDiscount),
  ]);

  // Debug: Log brands to see what we're receiving
  useEffect(() => {
    console.log('Brands received in SidebarFilters:', brands);
    console.log('Facets received:', facets);
    console.log('Loading state:', loading);
  }, [brands, facets, loading]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    // Preserve taxonomy parameters
    if (categoryId) params.set("categoryId", categoryId);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (groupId) params.set("groupId", groupId);
    if (subgroupId) params.set("subgroupId", subgroupId);

    // Add filter parameters
    if (color) params.set("color", color);
    selectedBrands.forEach((brandId) => params.append("brandId", brandId));
    
    if (priceRange[0] > defaultMinPrice) {
      params.set("minPrice", priceRange[0].toString());
    }
    if (priceRange[1] < defaultMaxPrice) {
      params.set("maxPrice", priceRange[1].toString());
    }
    if (discountRange[0] > defaultMinDiscount) {
      params.set("minDiscount", discountRange[0].toString());
    }
    if (discountRange[1] < defaultMaxDiscount) {
      params.set("maxDiscount", discountRange[1].toString());
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [
    color,
    selectedBrands,
    priceRange,
    discountRange,
    categoryId,
    subcategoryId,
    groupId,
    subgroupId,
    router,
    pathname,
    defaultMinPrice,
    defaultMaxPrice,
    defaultMinDiscount,
    defaultMaxDiscount,
  ]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const clearAll = () => {
    setColor("");
    setSelectedBrands([]);
    setPriceRange([defaultMinPrice, defaultMaxPrice]);
    setDiscountRange([defaultMinDiscount, defaultMaxDiscount]);
  };

  const hasActiveFilters = color || selectedBrands.length > 0 || 
    priceRange[0] > defaultMinPrice || priceRange[1] < defaultMaxPrice ||
    discountRange[0] > defaultMinDiscount || discountRange[1] < defaultMaxDiscount;



  return (
    <div className="bg-white p-4 rounded-lg shadow-sm  ">
      {/* Header */}
      <div className="flex justify-between items-center pb-4">
      
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-[#C15364] hover:text-[#b24b5c] font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Brand Filter */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-base">Brand</h3>
        
        {loading ? (
          // Loading skeleton for brands
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="w-8 h-4 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {brands.map((brand) => (
              <div key={brand.id}>
                {/* Checkbox for multi-select filtering */}
                <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={() =>
                      setSelectedBrands((prev) =>
                        prev.includes(brand.id)
                          ? prev.filter((id) => id !== brand.id)
                          : [...prev, brand.id]
                      )
                    }
                    className="w-4 h-4 text-[#C15364] border-gray-300 rounded focus:ring-[#C15364] focus:ring-2"
                  />
                  <span className="text-gray-700 flex-1">{brand.name}</span>
                  {brand.count && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {brand.count}
                    </span>
                  )}
                </label>
                
              
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No brands available
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-base">Color</h3>
        <div className="space-y-3">
          {colorOptions.map((colorOption) => (
            <label
              key={colorOption.value}
              className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <input
                type="radio"
                name="color"
                checked={color === colorOption.value}
                onChange={() => setColor(colorOption.value)}
                className="w-4 h-4 text-[#C15364] border-gray-300 focus:ring-[#C15364] focus:ring-2"
              />
              <span
                className="inline-block w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: colorOption.hex }}
              />
              <span className="text-gray-700 flex-1">{colorOption.name}</span>
            </label>
          ))}
          {color && (
            <button
              onClick={() => setColor("")}
              className="text-xs text-[#C15364] hover:text-[#b24b5c] ml-8"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-base">Price Range</h3>
        <div className="px-2">
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span className="font-medium">{formatCurrency(priceRange[0])}</span>
            <span className="font-medium">{formatCurrency(priceRange[1])}</span>
          </div>
          <Range
            values={priceRange}
            step={1000}
            min={defaultMinPrice}
            max={defaultMaxPrice}
            onChange={(values) => setPriceRange(values as [number, number])}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className="h-2 bg-gray-200 rounded-full"
                style={{
                  ...props.style,
                  background: `linear-gradient(to right, 
                    #e5e7eb 0%, 
                    #e5e7eb ${((priceRange[0] - defaultMinPrice) / (defaultMaxPrice - defaultMinPrice)) * 100}%, 
                    #C15364 ${((priceRange[0] - defaultMinPrice) / (defaultMaxPrice - defaultMinPrice)) * 100}%, 
                    #C15364 ${((priceRange[1] - defaultMinPrice) / (defaultMaxPrice - defaultMinPrice)) * 100}%, 
                    #e5e7eb ${((priceRange[1] - defaultMinPrice) / (defaultMaxPrice - defaultMinPrice)) * 100}%, 
                    #e5e7eb 100%)`,
                }}
              >
                {children}
              </div>
            )}
            renderThumb={({ props }) => {
              const { key, ...restProps } = props;
              return (
                <div
                  key={key}
                  {...restProps}
                  className="h-5 w-5 bg-white border-2 border-[#C15364] rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#C15364] focus:ring-opacity-50"
                />
              );
            }}
          />
        </div>
      </div>

      {/* Discount Range Filter */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-base">Discount Range</h3>
        <div className="px-2">
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span className="font-medium">{discountRange[0]}%</span>
            <span className="font-medium">{discountRange[1]}%</span>
          </div>
          <Range
            values={discountRange}
            step={5}
            min={defaultMinDiscount}
            max={defaultMaxDiscount}
            onChange={(values) => setDiscountRange(values as [number, number])}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className="h-2 bg-gray-200 rounded-full"
                style={{
                  ...props.style,
                  background: `linear-gradient(to right, 
                    #e5e7eb 0%, 
                    #e5e7eb ${((discountRange[0] - defaultMinDiscount) / (defaultMaxDiscount - defaultMinDiscount)) * 100}%, 
                    #C15364 ${((discountRange[0] - defaultMinDiscount) / (defaultMaxDiscount - defaultMinDiscount)) * 100}%, 
                    #C15364 ${((discountRange[1] - defaultMinDiscount) / (defaultMaxDiscount - defaultMinDiscount)) * 100}%, 
                    #e5e7eb ${((discountRange[1] - defaultMinDiscount) / (defaultMaxDiscount - defaultMinDiscount)) * 100}%, 
                    #e5e7eb 100%)`,
                }}
              >
                {children}
              </div>
            )}
            renderThumb={({ props }) => {
              const { key, ...restProps } = props;
              return (
                <div
                  key={key}
                  {...restProps}
                  className="h-5 w-5 bg-white border-2 border-[#C15364] rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#C15364] focus:ring-opacity-50"
                />
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}