
// app/api/user/upi/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import User from "@/models/User";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id);
    user.savedUPIs = user.savedUPIs.filter((upi: any) => upi.id !== params.id);
    await user.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete UPI ID" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id);
    user.savedUPIs.forEach((upi: any) => {
      upi.isDefault = upi.id === params.id;
    });
    await user.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to set default UPI ID" },
      { status: 500 }
    );
  }
}