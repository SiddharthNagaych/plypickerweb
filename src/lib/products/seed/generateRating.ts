// /lib/products/seed/generateRating.ts
export function generateSystemRating() {
  return {
    rating: +(Math.random() * 2 + 3).toFixed(2), // 3.00-5.00
    count: Math.floor(10 + Math.random() * 490) // 10-500
  };
}