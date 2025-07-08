import { NextResponse } from 'next/server';
import { mongooseConnect } from '@/lib/mongooseConnect';
import Product from '@/models/products/Product';
import { Types } from 'mongoose';

// Define ProductVariant interface first
interface ProductVariant {
  _id: Types.ObjectId;
  product_name: string;
  desc: {
    Box_Packing: string;
    Size: string;
    Colour: string;
    Material: string;
  };
  product_description: string;
  attributes: {
    var: string;
    color: string;
    images: string[];
  };
  filters: string[];
  laborPerFloor: number;
  price: number;
  discounted_price: number;
  discounted_percent: number;
}

interface BaseProduct {
  _id: Types.ObjectId;
  plyid: string;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
  category?: Types.ObjectId;
  subcategory?: Types.ObjectId;
  brand?: Types.ObjectId;
  product_name: string;
  slug: string;
  product_description: string;
  desc: {
    Box_Packing: string;
    Size: string;
    Colour: string;
    Material: string;
  };
  attributes: {
    images: string[];
    finish?: string;
  };
  filters: string[];
  price: number;
  discounted_price: number;
  discounted_percent: number;
  applicability: number;
  laborPerFloor: number;
  loadingUnloadingPrice: number;
  system_rating: {
    rating: number;
    count: number;
  };
  vars?: ProductVariant[];
  is_active: boolean;
  is_deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define populated fields
type PopulatedFields = {
  category?: { _id: Types.ObjectId; name: string };
  subcategory?: { _id: Types.ObjectId; name: string };
  brand?: { _id: Types.ObjectId; Brand_name: string };
};

// Combine them for the final product type
type PopulatedProduct = BaseProduct & PopulatedFields;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await mongooseConnect();
    const { id } = await params;

    // Fetch product with proper type casting
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('brand', 'Brand_name')
      .lean();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Type assertion with proper checks
    const typedProduct = product as unknown as PopulatedProduct;

    // Mock bank offers
    const bankOffers = [
      {
        id: 1,
        bank: 'HDFC Bank',
        offer: '10% Cashback up to ₹1000',
        code: 'HDFC10',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Build response
    const response = {
      ...typedProduct,
      _id: typedProduct._id.toString(),
      category: typedProduct.category ? {
        _id: typedProduct.category._id.toString(),
        name: typedProduct.category.name
      } : undefined,
      subcategory: typedProduct.subcategory ? {
        _id: typedProduct.subcategory._id.toString(),
        name: typedProduct.subcategory.name
      } : undefined,
      brand: typedProduct.brand ? {
        _id: typedProduct.brand._id.toString(),
        Brand_name: typedProduct.brand.Brand_name
      } : undefined,
      bankOffers,
      variants: typedProduct.vars?.map(v => ({
        _id: v._id.toString(),
        product_name: v.product_name,
        attributes: v.attributes,
        price: v.price,
        discounted_price: v.discounted_price
      })) || []
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}