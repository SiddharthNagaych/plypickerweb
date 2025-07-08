// app/api/user/addresses/[id]/default/route.ts
import { NextResponse } from "next/server";
import {auth} from "../../../../../../../auth"
import { mongooseConnect } from "@/lib/mongooseConnect";
import User from "@/models/User";

export async function PATCH(
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

    // First unset any existing default
    await User.updateOne(
      { _id: session.user.id, "addresses.isDefault": true },
      { $set: { "addresses.$.isDefault": false } }
    );

    // Then set the new default
    const user = await User.findOneAndUpdate(
      { _id: session.user.id, "addresses._id": id },
      { $set: { "addresses.$.isDefault": true } },
      { new: true }
    ).select("addresses");

    if (!user) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json(user.addresses);
  } catch (error) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      { error: "Failed to set default address" },
      { status: 500 }
    );
  }
}