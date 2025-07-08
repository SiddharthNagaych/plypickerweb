// /lib/products/seed/generatePlyId.ts
import Product from "@/models/products/Product";

export async function generatePlyId(): Promise<string> {
  let plyid: string;
  let exists = true;

  while (exists) {
    plyid = "PLY-" + Math.floor(100000 + Math.random() * 900000);
    const result = await Product.exists({ plyid });
    exists = !!result;
  }

  return plyid!;
}
