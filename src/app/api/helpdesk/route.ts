// app/api/helpdesk/route.ts (POST + GET list)
import { NextRequest, NextResponse } from "next/server";
import {auth} from "../../../../auth"
import { mongooseConnect } from "@/lib/mongooseConnect";
import Ticket from "@/models/Ticket";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  await mongooseConnect();
  const data = await Ticket.find({ userId: session.user.id })
                           .sort({ updatedAt: -1 })
                           .select("subject category status createdAt");
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Auth" }, { status: 403 });

  const body = await req.json();
  await mongooseConnect();
  const ticket = await Ticket.create({
    userId:  session.user.id,
    subject: body.subject,
    category: body.category,
    status:  "open",
    messages: [{
      from: "user",
      text: body.message,
      files: body.files,          // [{url,name}, …]
    }],
  });
  return NextResponse.json(ticket);
}
