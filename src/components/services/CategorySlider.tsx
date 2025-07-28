// app/services/CategorySlider.tsx
import Link from 'next/link';
import Image from 'next/image';

type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  city: string;
};

const CITY = "Pune"; // You can later get this from context/auth

export default async function CategorySlider() {


  const res = await fetch("/api/admin/data-entry/taxonomy/?city=Pune");

  if (!res.ok) {
    console.error("Failed to fetch categories");
    return <div className="text-red-500">Failed to load categories</div>;
  }

  const { categories }: { categories: Category[] } = await res.json();

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex space-x-4 px-4">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/services?category=${cat._id}`}
            className="flex flex-col items-center min-w-[120px]"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-500 text-xs">No image</span>
              )}
            </div>
            <span className="mt-2 text-sm font-medium text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
