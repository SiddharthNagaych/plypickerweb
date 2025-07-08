import { NextResponse } from "next/server";
import {mongooseConnect} from "@/lib/mongooseConnect";
import Product from "@/models/products/Product";
import Category from "@/models/products/Category";
import Subcategory from "@/models/products/Subcategory";
import Group from "@/models/products/Group";
import Subgroup from "@/models/products/Subgroup";
import Brand from "@/models/products/Brand";

interface SuccessResponse {
  ok: true;
  message: string;
}

interface ErrorResponse {
  ok: false;
  error: string;
}

type IndexResponse = SuccessResponse | ErrorResponse;

export async function POST(): Promise<NextResponse<IndexResponse>> {
  await mongooseConnect();
  try {
  await Product.collection.dropIndex("product_id_1");
  console.log("✅ Dropped index: product_id_1");
} catch (err) {
  console.log("ℹ️ Index 'product_id_1' not found or already removed", err);
}


  try {
    console.log("Creating indexes...");

    // 🔍 Product Indexes
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ subcategory: 1 });
    await Product.collection.createIndex({ group: 1 });
    await Product.collection.createIndex({ subgroup: 1 });
    await Product.collection.createIndex({ brand: 1 });

    await Product.collection.createIndex({ price: 1 });
    await Product.collection.createIndex({ discounted_percent: -1 });
    await Product.collection.createIndex({ "desc.Colour": 1 });
    await Product.collection.createIndex({ filters: 1 });

    await Product.collection.createIndex({ plyid: 1 }, { unique: true });
   await Product.collection.createIndex({ slug: 1, city: 1 }, { unique: true });


    await Product.collection.createIndex({
      product_name: "text",
      product_description: "text",
    });

    await Product.collection.createIndex({ city: 1 }); // ➕ City index

    // 📁 Category Indexes
    await Category.collection.createIndex({ name: 1 });
    await Category.collection.createIndex({ city: 1 }); // ➕ City index

    // 📁 Subcategory Indexes
    await Subcategory.collection.createIndex({ name: 1, category: 1 });
    await Subcategory.collection.createIndex({ city: 1 }); // ➕ City index

    // 📁 Group Indexes
    await Group.collection.createIndex({ name: 1, category: 1, subcategory: 1 });
    await Group.collection.createIndex({ city: 1 }); // ➕ City index

    // 📁 Subgroup Indexes
    await Subgroup.collection.createIndex({
      name: 1,
      category: 1,
      subcategory: 1,
      group: 1,
    });
    await Subgroup.collection.createIndex({ city: 1 }); // ➕ City index

    // 🏷️ Brand Indexes
    await Brand.collection.createIndex({ Brand_name: 1 });
    await Brand.collection.createIndex({ Category: 1 });
    await Brand.collection.createIndex({ city: 1 }); // ➕ City index

    return NextResponse.json({
      ok: true,
      message: "✅ Indexes including `city` created successfully.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error creating indexes:", errorMessage);

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
