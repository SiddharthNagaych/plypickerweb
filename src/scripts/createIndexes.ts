// scripts/createIndexes.ts

import Product from "@/models/products/Product";
import { dbConnect } from "@/lib/dbConnect";

async function createIndexes() {
  await dbConnect();

  console.log("Connected to MongoDB. Creating indexes...");

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
  await Product.collection.createIndex({ slug: 1 }, { unique: true });

  await Product.collection.createIndex(
    { product_name: "text", product_description: "text" }
  );

  console.log("✅ Indexes created successfully.");
  process.exit(0);
}

createIndexes().catch((err) => {
  console.error("❌ Failed to create indexes:", err);
  process.exit(1);
});
