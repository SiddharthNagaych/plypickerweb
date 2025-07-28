import { NextResponse } from 'next/server';
import {auth} from "../../../../auth";
import Address from '@/models/Address';
import { mongooseConnect } from '@/lib/mongooseConnect';
import mongoose from "mongoose";
import { getLoggedInUser } from '@/lib/getLoggedInUser';
// GET endpoint
export async function GET(request: Request) {
  await mongooseConnect();
  const userId = await getLoggedInUser({ headers: request.headers });
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const addresses = await Address.find({ userId: userId });
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching addresses' }, { status: 500 });
  }
}

// Update your POST endpoint with these improvements:
export async function POST(request: Request) {
  try {
    await mongooseConnect();
    // const session = await auth();
    const userId = await getLoggedInUser({ headers: request.headers });

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    if (!userId) {  
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Ensure required fields are present
    const requiredFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    // Create address with proper typing
    const addressData = {
      userId: new mongoose.Types.ObjectId(userId),
      name: body.name,
      phone: body.phone,
      addressType: body.addressType || 'SHIPPING',
      locationType: body.locationType || 'HOME',
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      landmark: body.landmark,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country || 'India',
      coordinates: body.coordinates,
      distanceFromCenter: body.distanceFromCenter,
      companyName: body.companyName,
      gstNumber: body.gstNumber,
      isDefault: body.isDefault || false,
      isActive: body.isActive !== false // default to true if not specified
    };

    const newAddress = new Address(addressData);
    await newAddress.save();

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error('Address creation error:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}