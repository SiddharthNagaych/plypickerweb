import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    product_name: string;
    image?: string;
    price: number;
    discounted_price: number;
    discounted_percent: number;
    brandName?: string;
    system_rating?: {
      rating: number;
      count: number;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    id,
    product_name,
    image,
    price,
    discounted_price,
    discounted_percent,
    brandName,
    system_rating,
  } = product;

  const hasDiscount = discounted_percent > 0;
  const displayPrice = hasDiscount ? discounted_price : price;
  const rating = system_rating?.rating || 0;
  const reviewCount = system_rating?.count || 0;

  return (
    <Link 
      href={`/products/${id}`} 
      className="block w-full"
    >
      {/* Image Card */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-md mb-3">
        <Image
          src={image || '/placeholder.jpg'}
          alt={product_name}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Product Details */}
      <div className="w-full px-1">
        {/* Brand Name */}
        {brandName && (
          <p className="text-xs font-medium text-gray-500 mb-1">{brandName}</p>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium line-clamp-2 mb-2">{product_name}</h3>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i}
                  className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-600">
              ({reviewCount.toLocaleString('en-IN')})
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#C15364]">
            ₹{displayPrice.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs line-through text-gray-400">
                ₹{price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                {discounted_percent}% off
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}