import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import mongoose from "mongoose";
import { auth } from "../../../../../auth";
import ArchitectureService from "@/models/architecture/ArchitectureService";
import ArchitecturePriceRequest from "@/models/architecture/ArchitecturePriceRequest";

export async function POST(req: NextRequest) {
  await mongooseConnect();

  try {
    const body = await req.json();
    const { serviceId, city, variant } = body;

    // Basic validation
    if (!serviceId || !city || !variant) {
      return NextResponse.json(
        { error: "Missing required fields: serviceId, city, and variant are required" },
        { status: 400 }
      );
    }

    // Validate serviceId format
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json(
        { error: "Invalid serviceId format" },
        { status: 400 }
      );
    }

    // Check if the service exists
    const service = await ArchitectureService.findById(serviceId);
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Find the specific variant
    const serviceVariant = service.variants?.find(
      (v: any) => v.variantName === variant
    );

    if (!serviceVariant) {
      return NextResponse.json(
        { error: "Variant not found in service" },
        { status: 404 }
      );
    }

    // Check if user is authenticated
    const session = await auth();

    let requestData: any = {
      serviceId: new mongoose.Types.ObjectId(serviceId),
      city,
      variant,
      variantId: serviceVariant._id?.toString() || variant,
      requestedAt: new Date(),
    };

    if (session?.user) {
      // Authenticated user
      requestData.userId = new mongoose.Types.ObjectId(session.user.id);
      requestData.userName = session.user.name;
      requestData.userPhone = session.user.phone;
      requestData.userEmail = session.user.email;

      // Check for duplicate request from same user for same variant
      const existingRequest = await ArchitecturePriceRequest.findOne({
        serviceId: requestData.serviceId,
        variant,
        userId: requestData.userId,
        status: "pending",
      });

      if (existingRequest) {
        return NextResponse.json({
          success: true,
          message: "Price request already exists for this variant",
          requestId: existingRequest._id,
          duplicate: true,
        });
      }
    } else {
      // Anonymous user
      requestData.userName = "Anonymous User";
    }

    const newRequest = new ArchitecturePriceRequest(requestData);
    await newRequest.save();

    // Update the variant's get_price_requested flag
    await ArchitectureService.updateOne(
      {
        _id: serviceId,
        "variants.variantName": variant
      },
      {
        $set: { "variants.$.get_price_requested": true }
      }
    );

    console.log("New architecture price request created:", {
      requestId: newRequest._id,
      serviceId,
      variant,
      userId: session?.user?.id || "anonymous",
    });

    return NextResponse.json({
      success: true,
      requestId: newRequest._id,
      message: "Price request submitted successfully",
      estimatedResponseTime: "2 hours",
      status: "pending",
    });

  } catch (error) {
    console.error("Architecture price request error:", error);

    // Handle specific mongoose errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  await mongooseConnect();

  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const variant = searchParams.get("variant");
    const requestId = searchParams.get("requestId");

    const session = await auth();

    let query: any = {};

    if (requestId) {
      query._id = requestId;
    } else if (serviceId && variant) {
      query.serviceId = serviceId;
      query.variant = variant;

      if (session?.user) {
        query.userId = session.user.id;
      }
    } else {
      return NextResponse.json(
        { error: "Either requestId or both serviceId and variant are required" },
        { status: 400 }
      );
    }

    const request = await ArchitecturePriceRequest.findOne(query)
      .populate("serviceId", "serviceName")
      .sort({ createdAt: -1 });

    if (!request) {
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        _id: request._id,
        serviceId: request.serviceId,
        variant: request.variant,
        status: request.status,
        requestedAt: request.requestedAt,
        completedAt: request.completedAt,
        finalPrice: request.finalPrice,
        estimatedResponseTime: request.status === "pending" ? "2 hours" : null,
      },
    });

  } catch (error) {
    console.error("Get architecture price request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await mongooseConnect();

  try {
    const body = await req.json();
    const { requestId, finalPrice, status } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (finalPrice !== undefined) {
      updateData.finalPrice = Number(finalPrice);
    }

    if (status) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();
      }
    }

    const updatedRequest = await ArchitecturePriceRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    // If completed, update the service variant with the final price
    if (status === "completed" && finalPrice) {
      await ArchitectureService.updateOne(
        {
          _id: updatedRequest.serviceId,
          "variants.variantName": updatedRequest.variant
        },
        {
          $set: {
            "variants.$.prices.$[elem].price": finalPrice,
            "variants.$.get_price_requested": false
          }
        },
        {
          arrayFilters: [{ "elem.city": updatedRequest.city }]
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Price request updated successfully",
      request: updatedRequest,
    });

  } catch (error) {
    console.error("Update architecture price request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
