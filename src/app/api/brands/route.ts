// Solution 1: Type assertion (simplest fix)
import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Brand from "@/models/products/Brand";
import { Types } from "mongoose";

export async function GET() {
  await mongooseConnect();
  
  const brands = await Brand.find({}, { _id: 1, Brand_name: 1 })
    .sort({ Brand_name: 1 })
    .lean();
  
  return NextResponse.json({ 
    brands: brands.map(b => ({ 
      id: (b._id as Types.ObjectId).toString(), 
      name: b.Brand_name 
    })) 
  });
}