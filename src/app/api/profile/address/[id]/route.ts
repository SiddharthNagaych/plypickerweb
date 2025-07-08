// app/api/user/addresses/[id]/route.ts
import { NextResponse } from "next/server";
import {auth} from "../../../../../../auth"
import { mongooseConnect } from "@/lib/mongooseConnect";
import User from "@/models/User";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    await mongooseConnect();

    // If setting as default, first unset any existing default
    if (body.isDefault) {
      await User.updateOne(
        { _id: session.user.id, "addresses.isDefault": true },
        { $set: { "addresses.$.isDefault": false } }
      );
    }

    const user = await User.findOneAndUpdate(
      { _id: session.user.id, "addresses._id": id },
      { $set: { "addresses.$": body } },
      { new: true }
    ).select("addresses");

    if (!user) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json(user.addresses);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// app/api/user/addresses/[id]/route.ts
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    await mongooseConnect();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { addresses: { _id: id } } },
      { new: true }
    ).select("addresses");

    return NextResponse.json(user?.addresses || []);
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}