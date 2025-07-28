import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongooseConnect";
import ServiceOrder from "@/models/OrderService";
import { Types } from "mongoose";
import { createInvoiceBuffer } from "@/utils/invoice/serviceInvoiceGenerator";


export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await mongooseConnect();
   const { id: orderId } = await params;


    if (!Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = (await ServiceOrder.findById(orderId).lean({ virtuals: true })) as IServiceOrder | null;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdfBuffer = await createInvoiceBuffer(order);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order._id}.pdf`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
