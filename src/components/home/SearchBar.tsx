"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 1) {
        fetch(`/api/product/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })
          .then((r) => r.json())
          .then((res) => {
            setResults(res?.products || []);
            setShowDropdown(true);
          })
          .catch((err) => {
            console.error("SearchBar fetch error:", err);
            setShowDropdown(false);
          });
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (productId: string) => {
    router.push(`/products?productId=${productId}`);
    setShowDropdown(false);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${query}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center border border-gray-300 rounded-md overflow-hidden shadow-sm"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="flex-grow px-4 py-2 focus:outline-none text-sm"
        />
        <button
          type="submit"
          className="bg-orange-500 text-white px-4 py-2 hover:bg-orange-600"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((p) => (
            <div
              key={p.id} // ✅ fix: use `id`, not `_id`
              onClick={() => handleSelect(p.id)}
              className="px-4 py-2 text-sm text-gray-800 hover:bg-orange-100 cursor-pointer"
            >
              {p.product_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
