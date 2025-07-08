// app/api/help/tickets/route.ts
import { NextResponse } from "next/server";
import HelpTicket from "@/models/HelpTicket";
import { Types } from "mongoose";
import { auth } from "../../../../../auth";

interface LeanHelpTicket {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  issueType?: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  attachment?: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await HelpTicket.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean<LeanHelpTicket[]>();

    const response = tickets.map(ticket => ({
      ...ticket,
      _id: ticket._id.toString(),
      userId: ticket.userId.toString(),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString()
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const ticket = new HelpTicket({
      userId: new Types.ObjectId(session.user.id),
      ...body,
      status: "open" as const
    });

    await ticket.save();
    
    const response = {
      ...ticket.toObject(),
      _id: ticket._id.toString(),
      userId: ticket.userId.toString(),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}