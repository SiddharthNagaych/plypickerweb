"use client";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCity } from "@/components/home/common/context/CityContext";

type Category = {
  id: string;
  name: string;
  category_image: string;
};

type Service = {
  id: string;
  name: string;
  image: string;
  slug: string;
};

type Architecture = {
  id: string;
  name: string;
  image: string;
  slug: string;
};

export default function HeroSection() {
  const [tab, setTab] = useState("product");
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { city } = useCity(); // Fixed: destructure city from useCity

  const fetchData = async (currentTab: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data for tab: ${currentTab}, city: ${city}`); // Debug log
      
      const response = await fetch(`/api/home/hero?city=${encodeURIComponent(city)}&tab=${currentTab}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log

      if (currentTab === "product" && data.categories) {
        console.log('Setting categories:', data.categories); // Debug log
        setCategories(data.categories);
      } else if (currentTab === "services" && data.services) {
        console.log('Setting services:', data.services); // Debug log
        setServices(data.services);
      } else if (currentTab === "architecture" && data.architecture) {
        console.log('Setting architectures:', data.architecture); // Debug log
        setArchitectures(data.architecture);
      } else {
        console.warn('No data found for tab:', currentTab, 'Response:', data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('City changed:', city); // Debug log
    if (city) {
      fetchData(tab);
    }
  }, [tab, city]); // Added city as dependency

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams({ categoryId });
    router.push(`/products?${params.toString()}`);
  };

  const handleServiceClick = (serviceSlug: string) => {
    router.push(`/services/${serviceSlug}`);
  };

  const handleArchitectureClick = (archSlug: string) => {
    router.push(`/architecture/${archSlug}`);
  };

  // Stylish skeleton card component
  const SkeletonCard = () => (
    <div className="flex-shrink-0 w-[191px] rounded-lg overflow-hidden">
      <Skeleton className="w-[191px] h-[295px] rounded-md bg-gradient-to-br from-gray-100 to-gray-200" />
      <Skeleton className="h-4 w-3/4 mx-auto mt-2 bg-gradient-to-r from-gray-100 to-gray-200" />
    </div>
  );

  // Horizontal skeleton loader
  const HorizontalSkeletonLoader = ({ count = 8 }: { count?: number }) => (
    <div className="flex overflow-x-auto gap-4 px-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  // Card component for products
  const ProductCard = ({ item, onClick }: { item: Category; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[191px] rounded-lg overflow-hidden border hover:shadow-md transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div className="relative w-[191px] h-[295px]">
        <Image
          src={item.category_image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="text-sm font-medium text-center py-2">
        {item.name}
      </div>
    </button>
  );

  // Card component for services
  const ServiceCard = ({ item, onClick }: { item: Service; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[191px] rounded-lg overflow-hidden border hover:shadow-md transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div className="relative w-[191px] h-[295px]">
        <Image
          src={item.image || "/placeholder-service.jpg"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="text-sm font-medium text-center py-2">
        {item.name}
      </div>
    </button>
  );

  // Card component for architecture
  const ArchitectureCard = ({ item, onClick }: { item: Architecture; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[191px] rounded-lg overflow-hidden border hover:shadow-md transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div className="relative w-[191px] h-[295px]">
        <Image
          src={item.image || "/placeholder-architecture.jpg"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="text-sm font-medium text-center py-2">
        {item.name}
      </div>
    </button>
  );

  // // Debug component to show current state
  // const DebugInfo = () => (
  //   <div className="bg-gray-100 p-4 rounded-lg mb-4 text-sm">
  //     <p><strong>Current City:</strong> {city}</p>
  //     <p><strong>Current Tab:</strong> {tab}</p>
  //     <p><strong>Loading:</strong> {loading.toString()}</p>
  //     <p><strong>Error:</strong> {error || 'None'}</p>
  //     <p><strong>Categories Count:</strong> {categories.length}</p>
  //     <p><strong>Services Count:</strong> {services.length}</p>
  //     <p><strong>Architectures Count:</strong> {architectures.length}</p>
  //   </div>
  // );

  return (
    <section className="w-full bg-white py-10 px-4 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto text-center">
        {/* Debug info - Remove this in production */}
        {/* {process.env.NODE_ENV === 'development' && <DebugInfo />} */}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mx-auto mb-8 flex justify-center space-x-4">
            <TabsTrigger
              value="product"
              className="data-[state=active]:text-white data-[state=active]:bg-[#FF7803]"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="data-[state=active]:text-white data-[state=active]:bg-[#FF7803]"
            >
              Services
            </TabsTrigger>
            <TabsTrigger
              value="architecture"
              className="data-[state=active]:text-white data-[state=active]:bg-[#FF7803]"
            >
              Architecture & Interior
            </TabsTrigger>
          </TabsList>

          {/* Product Tab */}
          <TabsContent value="product">
            {loading ? (
              <HorizontalSkeletonLoader count={8} />
            ) : (
              <div className="flex overflow-x-auto gap-4 px-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <ProductCard
                      key={cat.id}
                      item={cat}
                      onClick={() => handleCategoryClick(cat.id)}
                    />
                  ))
                ) : (
                  <div className="text-gray-700 text-center py-10 w-full">
                    <p>No product categories available for this city.</p>
                    <p className="text-sm text-gray-500 mt-2">City: {city}, Tab: {tab}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            {loading ? (
              <HorizontalSkeletonLoader count={8} />
            ) : (
              <div className="flex overflow-x-auto gap-4 px-2">
                {services.length > 0 ? (
                  services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      item={service}
                      onClick={() => handleServiceClick(service.slug)}
                    />
                  ))
                ) : (
                  <div className="text-gray-700 text-center py-10 w-full">
                    <p>No services available for this city.</p>
                    <p className="text-sm text-gray-500 mt-2">City: {city}, Tab: {tab}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture">
            {loading ? (
              <HorizontalSkeletonLoader count={8} />
            ) : (
              <div className="flex overflow-x-auto gap-4 px-2">
                {architectures.length > 0 ? (
                  architectures.map((arch) => (
                    <ArchitectureCard
                      key={arch.id}
                      item={arch}
                      onClick={() => handleArchitectureClick(arch.slug)}
                    />
                  ))
                ) : (
                  <div className="text-gray-700 text-center py-10 w-full">
                    <p>No architecture & interior services available for this city.</p>
                    <p className="text-sm text-gray-500 mt-2">City: {city}, Tab: {tab}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}