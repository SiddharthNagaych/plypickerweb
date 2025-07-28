// app/api/helpdesk/[id]/route.ts (GET detail, POST reply)
import { NextRequest, NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Ticket from "@/models/Ticket";
import {auth} from "../../../../../auth"

export async function GET(_: NextRequest, { params }: { params: { id: string }}) {
  await mongooseConnect();
  const ticket = await Ticket.findById(params.id);
  return NextResponse.json(ticket);
}

export async function POST(req: NextRequest, { params }: { params:{ id:string }}) {
  const session = await auth();
  const body = await req.json();
  await mongooseConnect();
  const update = {
    $push: { messages: {
      from: "user",
      text: body.message,
      files: body.files,
    }},
    $set: { status: "in_progress", updatedAt: new Date() }
  };
  const ticket = await Ticket.findByIdAndUpdate(params.id, update, { new: true });
  return NextResponse.json(ticket);
}
