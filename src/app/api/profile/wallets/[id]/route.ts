// app/api/user/wallets/route.ts
import { NextResponse } from "next/server";
import {auth} from "../../../../../../auth"
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id).select("savedWallets");
    return NextResponse.json(user.savedWallets || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  try {
    const user = await User.findById(session.user.id);
    const newWallet = {
      id: Date.now().toString(),
      ...body,
      isDefault: user.savedWallets.length === 0
    };
    
    user.savedWallets.push(newWallet);
    await user.save();
    
    return NextResponse.json(newWallet);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add wallet" },
      { status: 500 }
    );
  }
}



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