// app/api/product/search/route.ts

import { NextResponse } from 'next/server';
import { mongooseConnect } from '@/lib/mongooseConnect';
import ProductModel from '@/models/products/Product';
import CategoryModel from '@/models/products/Category';
import SubcategoryModel from '@/models/products/Subcategory';
import GroupModel from '@/models/products/Group';
import SubgroupModel from '@/models/products/Subgroup';
import BrandModel from '@/models/products/Brand';

function buildHref(level: string, id: string): string {
  return `/products?${level}Id=${id}`;
}

export async function GET(req: Request) {
  try {
    await mongooseConnect();
    const url = new URL(req.url);
    
    // Extract parameters
    const city = url.searchParams.get('city') ?? 'Pune';
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '12', 10);

    // Build filter object
    const filter: any = { city };
    const breadcrumb: Breadcrumb[] = [];

    // Helper to add breadcrumb
    const addCrumb = (level: string, doc: any) => {
      breadcrumb.push({
        level: level as any,
        id: doc._id.toString(),
        name: doc.name,
        href: buildHref(level, doc._id.toString()),
      });
    };

    // Category is mandatory
    const categoryId = url.searchParams.get('categoryId');
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    filter.category = categoryId;
    const category = await CategoryModel.findById(categoryId).lean();
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    addCrumb('category', category);

    // Optional deeper levels
    const subcategoryId = url.searchParams.get('subcategoryId');
    if (subcategoryId) {
      filter.subcategory = subcategoryId;
      const subcategory = await SubcategoryModel.findById(subcategoryId).lean();
      if (subcategory) addCrumb('subcategory', subcategory);
    }

    const groupId = url.searchParams.get('groupId');
    if (groupId) {
      filter.group = groupId;
      const group = await GroupModel.findById(groupId).lean();
      if (group) addCrumb('group', group);
    }

    const subgroupId = url.searchParams.get('subgroupId');
    if (subgroupId) {
      filter.subgroup = subgroupId;
      const subgroup = await SubgroupModel.findById(subgroupId).lean();
      if (subgroup) addCrumb('subgroup', subgroup);
    }

    // Brand filter
    const brandIds = url.searchParams.getAll('brandId');
    if (brandIds.length > 0) {
      filter.brand = { $in: brandIds };
    }

    // Color filter
    const color = url.searchParams.get('color');
    if (color) {
      filter['vars.attributes.color'] = color;
    }

    // Price range filter
    const minPrice = parseFloat(url.searchParams.get('minPrice') ?? '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') ?? 'Infinity');
    if (minPrice > 0 || maxPrice !== Infinity) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { discounted_price: { $gte: minPrice, $lte: maxPrice } },
          { 'vars.discounted_price': { $gte: minPrice, $lte: maxPrice } },
        ],
      });
    }

    // Discount range filter
    const minDiscount = parseFloat(url.searchParams.get('minDiscount') ?? '0');
    const maxDiscount = parseFloat(url.searchParams.get('maxDiscount') ?? '100');
    if (minDiscount > 0 || maxDiscount < 100) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { discounted_percent: { $gte: minDiscount, $lte: maxDiscount } },
          { 'vars.discounted_percent': { $gte: minDiscount, $lte: maxDiscount } },
        ],
      });
    }

    // Get total count
    const total = await ProductModel.countDocuments(filter);

    // Fetch products with brand info
    const products = await ProductModel.find(filter)
      .populate('brand', 'Brand_name')
      .skip((page - 1) * limit)
      .limit(limit)
      .select('product_name image price discounted_price discounted_percent system_rating vars brand')
      .lean();

    // Transform products to match frontend expectations
    const transformedProducts = products.map((product: any) => ({
      id: product._id.toString(),
      product_name: product.product_name,
      image: product.image,
      price: product.price,
      discounted_price: product.discounted_price,
      discounted_percent: product.discounted_percent,
      brandId: product.brand?._id?.toString(),
      brandName: product.brand?.Brand_name,
      system_rating: product.system_rating || { rating: 0, count: 0 }, // Aligned with new system
    }));

    // Generate facets
    const facetAgg = await ProductModel.aggregate([
      { $match: filter },
      {
        $facet: {
          brands: [
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brandInfo' } },
            { $unwind: '$brandInfo' },
            { $project: { id: '$_id', name: '$brandInfo.Brand_name', count: 1 } }
          ],
          colors: [
            { $unwind: '$vars' },
            { $group: { _id: '$vars.attributes.color', count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $project: { value: '$_id', count: 1, _id: 0 } }
          ],
          priceStats: [
            {
              $group: {
                _id: null,
                min: { $min: '$discounted_price' },
                max: { $max: '$discounted_price' }
              }
            }
          ],
          discountStats: [
            {
              $group: {
                _id: null,
                min: { $min: '$discounted_percent' },
                max: { $max: '$discounted_percent' }
              }
            }
          ]
        }
      }
    ]);

    const facets = {
      brands: facetAgg[0]?.brands || [],
      colors: facetAgg[0]?.colors || [],
      price: facetAgg[0]?.priceStats?.[0] || { min: 0, max: 100000 },
      discount: facetAgg[0]?.discountStats?.[0] || { min: 0, max: 100 },
    };

    const response = {
      results: transformedProducts,
      total,
      facets,
      breadcrumbs: breadcrumb,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Type definitions (add these to your types file)
interface Breadcrumb {
  level: 'category' | 'subcategory' | 'group' | 'subgroup';
  id: string;
  name: string;
  href: string;
}

interface ProductListResponse {
  results: ProductCardData[];
  total: number;
  facets: {
    brands: Array<{ id: string; name: string; count: number }>;
    colors: Array<{ value: string; count: number }>;
    price: { min: number; max: number };
    discount: { min: number; max: number };
  };
  breadcrumbs: Breadcrumb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductCardData {
  id: string;
  product_name: string;
  image: string;
  price: number;
  discounted_price: number;
  discounted_percent: number;
  brandId?: string;
  brandName?: string;
  system_rating: {
    rating: number;
    count: number;
  };
}