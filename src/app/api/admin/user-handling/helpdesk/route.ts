// File: /app/api/admin/helpdesk/route.ts
import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import HelpDeskTicket from "@/models/HelpTicket";

// GET: List all help desk tickets with optional filters
export async function GET(request: Request) {
  await mongooseConnect();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const query: any = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const tickets = await HelpDeskTicket.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ tickets });
}

// PATCH: Update ticket status or add labels
export async function PATCH(request: Request) {
  await mongooseConnect();

  const body = await request.json();
  const { ticketId, status, labels } = body;

  if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });

  const update: any = {};
  if (status) update.status = status;
  if (labels) update.labels = labels;

  const updated = await HelpDeskTicket.findByIdAndUpdate(ticketId, update, { new: true });
  return NextResponse.json({ updated });
}
