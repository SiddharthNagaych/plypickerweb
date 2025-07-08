// app/api/user/cards/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id).select("savedCards");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.savedCards || []);
  } catch (error) {
    console.error("Error fetching saved cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved cards" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newCard = {
      id: Date.now().toString(),
      ...body,
      isDefault: user.savedCards.length === 0
    };
    
    user.savedCards.push(newCard);
    await user.save();
    
    return NextResponse.json(newCard);
  } catch (error) {
    console.error("Error adding card:", error);
    return NextResponse.json(
      { error: "Failed to add card" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cardIndex = user.savedCards.findIndex(
      (card: any) => card.id === params.id
    );
    
    if (cardIndex === -1) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const [deletedCard] = user.savedCards.splice(cardIndex, 1);
    
    // If we deleted the default card and there are other cards,
    // set the first one as default
    if (deletedCard.isDefault && user.savedCards.length > 0) {
      user.savedCards[0].isDefault = true;
    }
    
    await user.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Set all cards to non-default first
    user.savedCards.forEach((card: any) => {
      card.isDefault = card.id === params.id;
    });
    
    await user.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting default card:", error);
    return NextResponse.json(
      { error: "Failed to set default card" },
      { status: 500 }
    );
  }
}