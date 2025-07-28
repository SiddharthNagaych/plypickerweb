import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ArchitecturePriceRequest from "@/models/architecture/ArchitecturePriceRequest";
import ArchitectureService from "@/models/architecture/ArchitectureService";
import { auth } from "../../../../../auth";
import { Types } from "mongoose";
import mongoose from "mongoose";

// Define interfaces for better type safety
interface IPrice {
  city: string;
  price?: number;
  discountedPrice?: number;
  discountedPercent?: number;
}

interface IServiceVariant {
  _id: Types.ObjectId;
  variantName: string;
  serviceName: string;
  serviceDescription: string;
  images: string[];
  specs: string;
  prices: IPrice[];
  get_price_requested?: boolean;
  attrs?: {
    deliveryTime?: string;
    revisions?: string;
    [key: string]: any;
  };
}

interface IPriceRequestPayload {
  serviceId: string;
  city: string;
  variantName?: string;
  variantId?: string;
  userId?: string;
}

interface IUpdatePriceRequestPayload {
  requestId: string;
  finalPrice: number;
  status: "pending" | "completed" | "expired";
  completedBy?: string;
}

interface IPriceRequestResponse {
  success: boolean;
  requestId: string;
  variantId: string;
  message: string;
  estimatedResponseTime: string;
  status: string;
  duplicate?: boolean;
}

interface IAvailableVariant {
  id: string;
  name: string;
}

interface IErrorResponse {
  error: string;
  details?: string[];
  availableVariants?: IAvailableVariant[];
}

interface IGetPriceRequestParams {
  serviceId: string | null;
  variantId: string | null;
  variantName: string | null;
  userId: string | null;
}

interface IGetPriceRequestResponse {
  success: boolean;
  request: {
    _id: string;
    variantId: string;
    variantName: string;
    status: string;
    finalPrice?: number;
    requestedAt: Date;
    completedAt?: Date;
    city: string;
    serviceName?: string;
  };
}

interface IUpdatePriceRequestResponse {
  success: boolean;
  message: string;
  request: {
    _id: string;
    status: string;
    finalPrice?: number;
    completedAt?: Date;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse<IPriceRequestResponse | IErrorResponse>> {
  await mongooseConnect();

  try {
    console.log("=== INCOMING PRICE REQUEST ===");
    const rawBody = await req.text();
    const body: IPriceRequestPayload = JSON.parse(rawBody);
    console.log("Parsed request body:", body);

    const { serviceId, city, variantName, variantId } = body;

    // Validation
    if (!serviceId || !city || (!variantId && !variantName)) {
      console.error("Validation failed - missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: serviceId, city, and either variantId or variantName are required" },
        { status: 400 }
      );
    }

    // Check service exists
    console.log("Looking for service with ID:", serviceId);
    const service = await ArchitectureService.findById(serviceId);
    if (!service) {
      console.error("Service not found with ID:", serviceId);
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Find variant by ID if provided, otherwise fall back to name
    console.log("Looking for variant:", variantId || variantName, "in service:", service._id);
    let variant: IServiceVariant | undefined;
    
    if (variantId) {
      variant = service.variants.find((v: IServiceVariant) => 
        v._id && v._id.toString() === variantId
      );
    } else if (variantName) {
      variant = service.variants.find((v: IServiceVariant) => 
        v.variantName === variantName
      );
    }

    if (!variant) {
      console.error("Variant not found:", variantId || variantName, "in service variants");
      return NextResponse.json(
        { 
          error: "Variant not found in service",
          availableVariants: service.variants.map((v: IServiceVariant) => ({
            id: v._id.toString(),
            name: v.variantName
          }))
        },
        { status: 404 }
      );
    }

    // Get user session
    console.log("Getting user session...");
    const session = await auth();
    const user = session?.user;
    console.log("User session:", user);

    // Check for existing request (now using variantId if available)
    if (user?.id) {
      console.log("Checking for existing price requests for user:", user.id);
      const existingRequest = await ArchitecturePriceRequest.findOne({
        serviceId,
        $or: [
          { variantId: variant._id.toString() },
          { variantName: variant.variantName }
        ],
        userId: user.id,
        status: "pending"
      });

      if (existingRequest) {
        console.log("Found existing price request:", existingRequest._id);
        return NextResponse.json({
          success: true,
          duplicate: true,
          requestId: existingRequest._id.toString(),
          variantId: variant._id.toString(),
          message: "Price request already exists for this variant",
          estimatedResponseTime: "2 hours",
          status: "pending",
        });
      }
    }

    // Create new request with both ID and name
    console.log("Creating new price request...");
    const newRequest = new ArchitecturePriceRequest({
      serviceId,
      serviceName: service.serviceName,
      city,
      variantId: variant._id.toString(),
      variantName: variant.variantName,
      variantImage: variant.images?.[0] || null,
      userId: user?.id,
      userName: user?.name || "Anonymous",
      userPhone: user?.phone,
      userEmail: user?.email,
      status: "pending",
      requestedAt: new Date(),
      createdAt: new Date(),
      type: "architecture"
    });

    await newRequest.save();
    console.log("New price request created:", newRequest);

    // Update service variant flag using ID
    console.log("Updating service variant flag...");
    const updateResult = await ArchitectureService.updateOne(
      { 
        _id: serviceId, 
        "variants._id": variant._id 
      },
      { 
        $set: { "variants.$.get_price_requested": true } 
      }
    );
    console.log("Update result:", updateResult);

    return NextResponse.json({
      success: true,
      requestId: newRequest._id.toString(),
      variantId: variant._id.toString(),
      message: "Price request submitted successfully",
      estimatedResponseTime: "2 hours",
      status: "pending",
    });

  } catch (error) {
    console.error("Price request error:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map((e: any) => e.message);
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

export async function GET(req: NextRequest): Promise<NextResponse<IGetPriceRequestResponse | IErrorResponse>> {
  await mongooseConnect();

  try {
    const { searchParams } = new URL(req.url);
    const params: IGetPriceRequestParams = {
      serviceId: searchParams.get("serviceId"),
      variantId: searchParams.get("variantId"),
      variantName: searchParams.get("variantName"),
      userId: searchParams.get("userId")
    };

    console.log("GET price request params:", params);

    if (!params.serviceId || !params.userId || (!params.variantId && !params.variantName)) {
      return NextResponse.json(
        { error: "Missing required parameters: serviceId, userId, and either variantId or variantName" },
        { status: 400 }
      );
    }

    // Find request by ID if available, otherwise by name
    const request = await ArchitecturePriceRequest.findOne({
      serviceId: params.serviceId,
      userId: params.userId,
      $or: [
        { variantId: params.variantId },
        { variantName: params.variantName }
      ]
    }).sort({ createdAt: -1 });

    if (!request) {
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    const response: IGetPriceRequestResponse = {
      success: true,
      request: {
        _id: request._id.toString(),
        variantId: request.variantId,
        variantName: request.variantName,
        status: request.status,
        finalPrice: request.finalPrice,
        requestedAt: request.requestedAt,
        completedAt: request.completedAt,
        city: request.city,
        serviceName: request.serviceName
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Get price request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<IUpdatePriceRequestResponse | IErrorResponse>> {
  await mongooseConnect();

  try {
    console.log("=== UPDATING PRICE REQUEST ===");
    const rawBody = await req.text();
    const body: IUpdatePriceRequestPayload = JSON.parse(rawBody);
    console.log("Update request body:", body);

    const { requestId, finalPrice, status } = body;

    // Validation
    if (!requestId || !finalPrice || finalPrice <= 0) {
      console.error("Validation failed - missing required fields or invalid price");
      return NextResponse.json(
        { error: "Missing required fields: requestId and valid finalPrice are required" },
        { status: 400 }
      );
    }

    if (!["pending", "completed", "expired"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'completed', or 'expired'" },
        { status: 400 }
      );
    }

    // Get admin user session for authorization
    const session = await auth();
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the existing request
    console.log("Looking for price request with ID:", requestId);
    const existingRequest = await ArchitecturePriceRequest.findById(requestId);
    
    if (!existingRequest) {
      console.error("Price request not found with ID:", requestId);
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      finalPrice,
      status,
      completedBy: user.id
    };

    // Set completion timestamp if status is completed
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    // Update the price request
    console.log("Updating price request with data:", updateData);
    const updatedRequest = await ArchitecturePriceRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Failed to update price request" },
        { status: 500 }
      );
    }

    // Update the service variant if needed
    if (status === "completed" && existingRequest.serviceId && existingRequest.variantId) {
      console.log("Updating service variant status...");
      
      try {
        await ArchitectureService.updateOne(
          { 
            _id: existingRequest.serviceId, 
            "variants._id": existingRequest.variantId 
          },
          { 
            $set: { 
              "variants.$.get_price_requested": false,
              "variants.$.lastPriceUpdate": new Date()
            } 
          }
        );
        console.log("Service variant updated successfully");
      } catch (serviceUpdateError) {
        console.error("Failed to update service variant:", serviceUpdateError);
        // Continue execution as the main price request update was successful
      }
    }

    console.log("Price request updated successfully:", updatedRequest._id);

    const response: IUpdatePriceRequestResponse = {
      success: true,
      message: "Price request updated successfully",
      request: {
        _id: updatedRequest._id.toString(),
        status: updatedRequest.status,
        finalPrice: updatedRequest.finalPrice,
        completedAt: updatedRequest.completedAt
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Update price request error:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map((e: any) => e.message);
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

// DELETE method to remove price requests (admin only)
export async function DELETE(req: NextRequest): Promise<NextResponse<{ success: boolean; message: string } | IErrorResponse>> {
  await mongooseConnect();

  try {
    console.log("=== DELETING PRICE REQUEST ===");
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing required parameter: requestId" },
        { status: 400 }
      );
    }

    // Get admin user session for authorization
    const session = await auth();
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find and delete the request
    const deletedRequest = await ArchitecturePriceRequest.findByIdAndDelete(requestId);
    
    if (!deletedRequest) {
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    // Update service variant flag if needed
    if (deletedRequest.serviceId && deletedRequest.variantId) {
      try {
        await ArchitectureService.updateOne(
          { 
            _id: deletedRequest.serviceId, 
            "variants._id": deletedRequest.variantId 
          },
          { 
            $set: { "variants.$.get_price_requested": false } 
          }
        );
      } catch (serviceUpdateError) {
        console.error("Failed to update service variant after deletion:", serviceUpdateError);
      }
    }

    console.log("Price request deleted successfully:", requestId);

    return NextResponse.json({
      success: true,
      message: "Price request deleted successfully"
    });

  } catch (error) {
    console.error("Delete price request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}