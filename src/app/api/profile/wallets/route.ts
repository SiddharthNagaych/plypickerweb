
// app/api/user/wallets/[id]/route.ts
import { NextResponse } from "next/server";
import {auth} from "../../../../../auth"
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
    user.savedWallets = user.savedWallets.filter((wallet: any) => wallet.id !== params.id);
    await user.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete wallet" },
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
    user.savedWallets.forEach((wallet: any) => {
      wallet.isDefault = wallet.id === params.id;
    });
    await user.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to set default wallet" },
      { status: 500 }
    );
  }
}
