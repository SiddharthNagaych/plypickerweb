// app/services/page.tsx
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";

type Service = {
  _id: string;
  serviceName: string;
  attrs?: {
    imgs?: string[];
  };
};

const CITY = "Pune";

export default async function ServiceListPage() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/services/?city=${CITY}`
  );

  const { services }: { services: Service[] } = await res.json();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Home Services in {CITY}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {services.map((service) => (
          <Link
            key={service._id}
            href={`/services/${service._id}`} // ✅ correct link to detail page
            className="bg-white rounded-lg shadow hover:shadow-md transition-all border"
          >
            <div className="aspect-[4/3] relative w-full overflow-hidden rounded-t-lg">
              {service.attrs?.imgs?.[0] ? (
                <Image
                  src={service.attrs.imgs[0]}
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
            <div className="p-2 text-center text-sm font-medium text-gray-800">
              {service.serviceName}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
