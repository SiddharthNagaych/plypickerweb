// app/api/admin/architecture/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ArchitectureService from "@/models/architecture/ArchitectureService";
import mongoose from "mongoose";

const allowedCities = ["Pune", "Mumbai", "Navi Mumbai"] as const;
type City = (typeof allowedCities)[number];

// Helper function for consistent logging
const logRequest = (message: string, data?: any) => {
  console.log(
    `[ArchitectureService] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
};

export async function POST(req: NextRequest) {
  await mongooseConnect();
  logRequest("POST request received");

  try {
    const body = await req.json();
    logRequest("Request body parsed", body);

    // Validate required fields
    if (!body.city || !allowedCities.includes(body.city)) {
      const errorMsg = "Valid city is required";
      logRequest(errorMsg, { receivedCity: body.city });
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    if (
      !body.serviceCategory ||
      !mongoose.Types.ObjectId.isValid(body.serviceCategory)
    ) {
      const errorMsg = "Valid service category is required";
      logRequest(errorMsg, { receivedCategory: body.serviceCategory });
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    if (
      !body.serviceSubcategory ||
      !mongoose.Types.ObjectId.isValid(body.serviceSubcategory)
    ) {
      const errorMsg = "Valid service subcategory is required";
      logRequest(errorMsg, { receivedSubcategory: body.serviceSubcategory });
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Master service name validation
    if (!body.serviceName && !body.baseServiceName) {
      const errorMsg = "Master service name is required";
      logRequest(errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    if (!body.unit || !["rft", "sft", "nos"].includes(body.unit)) {
      const errorMsg = "Valid unit is required";
      logRequest(errorMsg, { receivedUnit: body.unit });
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Validate variants - must have at least one
    const variants = body.vars || body.variants || [];
    if (!variants || variants.length === 0) {
      const errorMsg = "At least one variant is required";
      logRequest(errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Validate each variant
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
  

      if (!variant.serviceDescription) {
        const errorMsg = `Variant ${i + 1}: Service description is required`;
        logRequest(errorMsg, variant);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      if (!variant.variantName && !variant.attrs?.Variants) {
        const errorMsg = `Variant ${i + 1}: Variant name is required`;
        logRequest(errorMsg, variant);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      if (!variant.specs) {
        const errorMsg = `Variant ${i + 1}: Specifications are required`;
        logRequest(errorMsg, variant);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      // Check if variant has images
      const variantImages = variant.images || variant.attrs?.imgs || [];
      const processedImages = typeof variantImages === 'string'
        ? variantImages.split(',').map((img: string) => img.trim()).filter(Boolean)
        : variantImages;
      
      if (!processedImages || processedImages.length === 0) {
        const errorMsg = `Variant ${i + 1}: At least one image is required`;
        logRequest(errorMsg, variant);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
    }

    // Prepare the service data (clean variant-only structure)
    const serviceData = {
      city: body.city,
      serviceCategory: body.serviceCategory,
      serviceSubcategory: body.serviceSubcategory,
      serviceName: body.serviceName || body.baseServiceName, // Master service name only
      serviceDescription: body.serviceDescription || body.baseServiceDescription, // General description only
      unit: body.unit,
      // REMOVED: get_price_requested - now at variant level
      variants: variants.map((variant: any) => ({
      
        serviceDescription: variant.serviceDescription,
        variantName: variant.variantName || variant.attrs?.Variants || '',
        images: typeof variant.images === 'string'
          ? variant.images.split(',').map((img: string) => img.trim()).filter(Boolean)
          : variant.images || variant.attrs?.imgs || [],
        specs: variant.specs,
        get_price_requested: variant.get_price_requested || false, // MOVED HERE - variant level
        prices: variant.pricing?.map((price: any) => ({
          city: price.city || body.city,
          price: price.price && !isNaN(price.price) ? Number(price.price) : null,
          discountedPrice: price.discountedPrice && !isNaN(price.discountedPrice) 
            ? Number(price.discountedPrice) 
            : null,
          discountedPercent: price.discountedPercent && !isNaN(price.discountedPercent)
            ? Number(price.discountedPercent)
            : null
        })) || [{ city: body.city }],
        attrs: variant.attrs || {} // Flexible attributes
      })),
      order: body.order || 0,
      rating_and_review: body.rating_and_review || 4.2
    };
    
    logRequest("Processed service data before save", serviceData);

    const architectureService = new ArchitectureService(serviceData);
    await architectureService.save();
    logRequest("Service successfully saved", { _id: architectureService._id });

    return NextResponse.json(
      {
        _id: architectureService._id,
        message: "Architecture service created successfully",
        service: architectureService.toObject(),
      },
      { status: 201 }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Error saving architecture service:", error, err);
    logRequest("Error saving service", { error });
    
    // Better error handling for validation errors
    if (err instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await mongooseConnect();
  logRequest("GET request received");

  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const populate = searchParams.get("populate");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    logRequest("Query parameters", { city, category, subcategory, populate, limit, offset });

    const query: any = {};
    if (city) query.city = city;
    if (category) query.serviceCategory = category;
    if (subcategory) query.serviceSubcategory = subcategory;

    logRequest("Constructed query", query);

    let queryBuilder = ArchitectureService.find(query).sort({ order: 1, createdAt: -1 });

    // Add pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      queryBuilder = queryBuilder.limit(limitNum).skip(offsetNum);
    }

    if (populate === "true") {
      queryBuilder = queryBuilder
        .populate("serviceCategory", "name")
        .populate("serviceSubcategory", "name");
      logRequest("Population enabled for related documents");
    }

    const architectureServices = await queryBuilder.exec();
    logRequest(`Found ${architectureServices.length} services`);

    // Clean response format
    const responseData = architectureServices.map((service) => {
      const serviceObj = service.toObject();
      return {
        ...serviceObj,
        _id: service._id.toString(),
        serviceCategory: serviceObj.serviceCategory?.name || serviceObj.serviceCategory,
        serviceSubcategory: serviceObj.serviceSubcategory?.name || serviceObj.serviceSubcategory,
        // Ensure variants are properly formatted with get_price_requested
        variants: serviceObj.variants?.map((variant: any) => ({
          ...variant,
          images: variant.images || [],
          prices: variant.prices || [],
          get_price_requested: variant.get_price_requested || false // Ensure this field is included
        })) || []
      };
    });

    return NextResponse.json({
      services: responseData,
      count: responseData.length,
      message: "Architecture services fetched successfully"
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching architecture services:", error, err);
    logRequest("Error fetching services", { error });
    return NextResponse.json({ error }, { status: 500 });
  }
}