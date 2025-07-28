import Link from 'next/link';
import Image from 'next/image';

type Service = {
  _id: string;
  serviceName: string;
  serviceDescription: string;
  unit: string;
  price?: number;
  attrs: {
    imgs: string[];
  };
  vars?: Array<{
    attrs: {
      Variants: string;
      imgs: string[];
    };
    pricing: Array<{
      price?: number;
      discounted_price?: number;
    }>;
  }>;
};

export default async function ServiceCards({
  city,
  category,
}: {
  city: string;
  category?: string;
}) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/products`);
    url.searchParams.append('city', city);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('populate', 'true');

    const res = await fetch(url.toString(), { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }

    const services: Service[] = await res.json();

    if (!services || services.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No services found for this category</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {services.map((service) => {
          const firstVariant = service.vars?.[0];
          const displayImage = firstVariant?.attrs?.imgs?.[0] || service.attrs?.imgs?.[0];
          const displayPrice = firstVariant?.pricing?.[0]?.price || service.price;

          return (
            <Link
              href={`/services/${service._id}`}
              key={service._id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-all overflow-hidden border"
            >
              <div className="aspect-[4/3] relative w-full overflow-hidden">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={service.serviceName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800">{service.serviceName}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {service.serviceDescription}
                </p>
                {displayPrice && (
                  <div className="mt-3">
                    <span className="font-bold text-gray-900">
                      ₹{displayPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      /{service.unit}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error("Error loading services:", error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load services. Please try again later.</p>
      </div>
    );
  }
}