// app/api/admin/services/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Service from "@/models/services/Services";
import mongoose from "mongoose";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = typeof allowedCities[number];

export async function POST(req: NextRequest) {
  await mongooseConnect();

  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.city || !allowedCities.includes(body.city)) {
      return NextResponse.json(
        { error: "Valid city is required" },
        { status: 400 }
      );
    }

    if (!body.serviceCategory || !mongoose.Types.ObjectId.isValid(body.serviceCategory)) {
      return NextResponse.json(
        { error: "Valid service category is required" },
        { status: 400 }
      );
    }

    if (!body.serviceSubcategory || !mongoose.Types.ObjectId.isValid(body.serviceSubcategory)) {
      return NextResponse.json(
        { error: "Valid service subcategory is required" },
        { status: 400 }
      );
    }

    if (!body.serviceName) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    if (!body.serviceDescription) {
      return NextResponse.json(
        { error: "Service description is required" },
        { status: 400 }
      );
    }

    if (!body.unit || !["rft", "sft", "nos"].includes(body.unit)) {
      return NextResponse.json(
        { error: "Valid unit is required" },
        { status: 400 }
      );
    }

    // Validate variants (now required)
    if (!body.vars || !Array.isArray(body.vars) || body.vars.length === 0) {
      return NextResponse.json(
        { error: "At least one variant is required" },
        { status: 400 }
      );
    }

    // Process and validate variants
    const processedVariants = body.vars.map((variant: any, index: number) => {
      // Validate required variant fields
      if (!variant.serviceName) {
        throw new Error(`Variant ${index + 1}: Service name is required`);
      }
      if (!variant.serviceDescription) {
        throw new Error(`Variant ${index + 1}: Service description is required`);
      }
      if (!variant.variantName) {
        throw new Error(`Variant ${index + 1}: Variant name is required`);
      }
      if (!variant.specs) {
        throw new Error(`Variant ${index + 1}: Specifications are required`);
      }

      // Process images - ensure it's an array and has at least one image
      let images: string[] = [];
      if (Array.isArray(variant.images)) {
        images = variant.images.filter((img: string) => img && img.trim());
      } else if (typeof variant.images === 'string') {
        images = variant.images.split(',')
          .map((img: string) => img.trim())
          .filter((img: string) => img);
      }
      
      if (images.length === 0) {
        throw new Error(`Variant ${index + 1}: At least one image is required`);
      }

      // Process pricing - ensure at least one price entry
      let pricing = [];
      if (variant.pricing && Array.isArray(variant.pricing)) {
        pricing = variant.pricing.map((price: any) => ({
          city: price.city || body.city,
          price: price.price ? Number(price.price) : undefined,
          discounted_price: price.discounted_price ? Number(price.discounted_price) : undefined,
          discounted_percent: price.discounted_percent ? Number(price.discounted_percent) : undefined
        }));
      } else {
        // Default pricing entry if none provided
        pricing = [{ city: body.city }];
      }

      if (pricing.length === 0) {
        throw new Error(`Variant ${index + 1}: At least one pricing entry is required`);
      }

      return {
        serviceName: variant.serviceName,
        serviceDescription: variant.serviceDescription,
        variantName: variant.variantName,
        specs: variant.specs,
        images: images,
        pricing: pricing,
        get_price_requested: variant.get_price_requested || false, // MOVED HERE - variant level control
        attrs: {
          deliveryTime: variant.attrs?.deliveryTime || variant.deliveryTime,
          revisions: variant.attrs?.revisions || variant.revisions,
          // Include any other flexible attributes
          ...variant.attrs
        }
      };
    });

    // Create service object according to new schema
    const serviceData = {
      city: body.city,
      serviceCategory: body.serviceCategory,
      serviceSubcategory: body.serviceSubcategory,
      serviceName: body.serviceName, // Master service name
      serviceDescription: body.serviceDescription, // General description
      unit: body.unit,
      order: body.order || 0,
      rating_and_review: body.rating_and_review || 4.2,
      vars: processedVariants
      // REMOVED: get_price_requested - now at variant level only
    };

    const service = new Service(serviceData);
    await service.save();

    return NextResponse.json({
      _id: service._id,
      message: "Service created successfully",
      ...service.toObject(),
    }, { status: 201 });

  } catch (err) {
    console.error("Error saving service:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  await mongooseConnect();

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const populate = searchParams.get("populate");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  try {
    const query: any = {};
    if (city) query.city = city;
    if (category) query.serviceCategory = category;
    if (subcategory) query.serviceSubcategory = subcategory;

    let queryBuilder = Service.find(query).sort({ order: 1, createdAt: -1 });

    // Add pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      queryBuilder = queryBuilder.limit(limitNum).skip(offsetNum);
    }

    if (populate === 'true') {
      queryBuilder = queryBuilder
        .populate('serviceCategory', 'name')
        .populate('serviceSubcategory', 'name');
    }

    const services = await queryBuilder.exec();

    // Clean response format - ensure get_price_requested is included at variant level
    const responseData = services.map(service => {
      const serviceObj = service.toObject();
      
      return {
        ...serviceObj,
        _id: service._id.toString(),
        serviceCategory: serviceObj.serviceCategory?.name || serviceObj.serviceCategory,
        serviceSubcategory: serviceObj.serviceSubcategory?.name || serviceObj.serviceSubcategory,
        // Ensure variants are properly formatted with get_price_requested at variant level
        vars: serviceObj.vars?.map((variant: any) => ({
          ...variant,
          images: variant.images || [],
          pricing: variant.pricing || [],
          get_price_requested: variant.get_price_requested || false // Ensure this field is included at variant level
        })) || []
      };
    });

    return NextResponse.json({
      services: responseData,
      count: responseData.length,
      message: "Services fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching services:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}