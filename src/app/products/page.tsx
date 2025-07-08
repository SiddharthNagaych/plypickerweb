'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import SidebarFilters from '@/components/home/products/SideBarFilters';
import ProductCard from '@/components/home/products/ProductCard';
import ProductCardSkeleton from '@/components/home/products/ProductCardSkeleton';

type Product = {
  id: string;
  product_name: string;
  image?: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  brandId?: string;
  brandName?: string;
  system_rating?: {
    rating: number;
    count: number;
  };
  attrs?: Record<string, unknown>;
  desc?: Record<string, unknown>;
  vars?: Record<string, unknown>;
};

type BrandFilter = {
  id: string;
  name: string;
  count?: number;
};

type ProductFacets = {
  brands: BrandFilter[];
  colors: Array<{ value: string; count: number }>;
  price: { min: number; max: number };
  discount: { min: number; max: number };
};

function ProductContent() {
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<ProductFacets>({
    brands: [],
    colors: [],
    price: { min: 0, max: 100000 },
    discount: { min: 0, max: 100 }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [filterSignature, setFilterSignature] = useState<string>('');
  const [allBrands, setAllBrands] = useState<BrandFilter[]>([]);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(true);
  
  const limit = 12;

  // Extract relevant search params
  const categoryId = searchParams.get('categoryId') || '';
  const subcategoryId = searchParams.get('subcategoryId') || '';
  const groupId = searchParams.get('groupId') || '';
  const subgroupId = searchParams.get('subgroupId') || '';
  const brandId = searchParams.get('brandId') || '';
  const searchParamString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    if (searchParamString !== filterSignature) {
      setFilterSignature(searchParamString);
      setPage(1);
    }
  }, [searchParamString, filterSignature]);

  // Fetch all brands on mount
  useEffect(() => {
    const fetchAllBrands = async () => {
      setBrandsLoading(true);
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        setAllBrands(data.brands || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setBrandsLoading(false);
      }
    };

    fetchAllBrands();
  }, []);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    
    if (categoryId) params.set('categoryId', categoryId);
    if (subcategoryId) params.set('subcategoryId', subcategoryId);
    if (groupId) params.set('groupId', groupId);
    if (subgroupId) params.set('subgroupId', subgroupId);
    
    const brandIds = searchParams.getAll('brandId');
    brandIds.forEach(id => params.append('brandId', id));
    
    ['color', 'minPrice', 'maxPrice', 'minDiscount', 'maxDiscount'].forEach(key => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    return params;
  }, [searchParams, page, categoryId, subcategoryId, groupId, subgroupId]);

  const queryString = useMemo(() => queryParams.toString(), [queryParams]);
  const hasValidParams = categoryId || subcategoryId || groupId || subgroupId || brandId;

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      if (!hasValidParams) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/products?${queryString}`);
        const data = await response.json();

        if (response.ok) {
          const newProducts = data.results || [];
          setProducts(prev => page === 1 ? newProducts : [...prev, ...newProducts]);
          
          if (page === 1) {
            setTotal(data.total || 0);
            setFacets(data.facets || facets);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [queryString, page, hasValidParams]);

  const loadMore = () => setPage(prev => prev + 1);

  if (!hasValidParams) {
    return (
      <div className="flex gap-6  py-6">
        <aside className="w-1/4 min-w-[280px]">
          <div className="sticky ">
            <SidebarFilters 
              brands={allBrands} 
              facets={facets}
              loading={brandsLoading}
            />
          </div>
        </aside>
        
        <main className="flex-1">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Category or Brand</h2>
              <p className="text-gray-600">Browse products by selecting a category or brand</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex gap-6 w-full px-4 py-6">
      <aside className="w-1/4 min-w-[280px]">
        <div className="sticky top-4">
          <SidebarFilters 
            brands={allBrands.length > 0 ? allBrands : facets.brands} 
            facets={facets}
            loading={brandsLoading}
          />
        </div>
      </aside>

      <main className="flex-1">
          <div className="bg-white rounded-xl shadow-md p-6 w-full">
        {loading && page === 1 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => window.location.href = window.location.pathname}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-[#C15364] hover:bg-[#b24b5c]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    // Ensure system_rating is properly structured
                    system_rating: product.system_rating || { rating: 0, count: 0 }
                  }} 
                />
              ))}
            </div>
            
            {products.length < total && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={
      <div className="flex gap-6 max-w-7xl  py-6">
        <aside className="w-1/4 min-w-[280px]">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    }>
      <ProductContent />
    </Suspense>
  );
}