// components/products/ProductCardSkeleton.tsx
export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse border rounded-lg p-4">
      <div className="bg-gray-200 h-32 w-full mb-2 rounded" />
      <div className="bg-gray-200 h-4 w-3/4 mb-1 rounded" />
      <div className="bg-gray-200 h-4 w-1/2 rounded" />
    </div>
  );
}
