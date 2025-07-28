// Create this temporarily as: app/api/debug/categories/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "Pune";
    
    // This should help debug what your actual API endpoint returns
    const host = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${host}/api/admin/data-entry/taxonomy/service?city=${city}`);
    
    if (!res.ok) {
      return NextResponse.json({ error: `API returned ${res.status}` }, { status: 500 });
    }
    
    const data = await res.json();
    
    // Debug the structure
    console.log("Raw API Response:", JSON.stringify(data, null, 2));
    
    if (data.categories) {
      console.log("Categories found:", data.categories.length);
      data.categories.forEach((cat: any, index: number) => {
        console.log(`Category ${index}:`, {
          name: cat.name,
          slug: cat.slug,
          hasSlug: !!cat.slug,
          _id: cat._id
        });
      });
    }
    
    return NextResponse.json({
      message: "Debug info logged to console",
      categoriesCount: data.categories?.length || 0,
      firstCategory: data.categories?.[0] || null,
      allSlugs: data.categories?.map((cat: any) => cat.slug) || []
    });
  } catch (error) {
    console.error("Debug API Error:", error);
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}