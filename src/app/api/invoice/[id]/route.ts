import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mongooseConnect } from "@/lib/mongooseConnect";
import Order from "@/models/Order";

// Helper function to wrap text
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

// Helper function to format date
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Helper function to format currency
function formatCurrency(amount: number | undefined | null): string {
  const safeAmount = amount || 0;
  return `Rs. ${safeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await mongooseConnect();

    const params = await context.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    // Colors
    const primaryBlue = rgb(0.13, 0.45, 0.85);
    const darkGray = rgb(0.3, 0.3, 0.3);
    const lightGray = rgb(0.7, 0.7, 0.7);
    const black = rgb(0, 0, 0);

    // Header Section
    // Company Logo and Name
    page.drawRectangle({
      x: 0,
      y: 770,
      width: 595,
      height: 70,
      color: rgb(0.97, 0.97, 0.97),
    });

    page.drawText("PLYPICKER", {
      x: 50,
      y: 810,
      size: 28,
      font: boldFont,
      color: primaryBlue,
    });

    page.drawText("Your Trusted E-commerce Partner", {
      x: 50,
      y: 785,
      size: 12,
      font,
      color: darkGray,
    });

    // Invoice Title and Order Details
    page.drawText("TAX INVOICE", {
      x: 400,
      y: 810,
      size: 18,
      font: boldFont,
      color: black,
    });

    page.drawText(`Order ID: ${order._id}`, {
      x: 400,
      y: 790,
      size: 10,
      font,
      color: darkGray,
    });

    page.drawText(`Date: ${formatDate(order.createdAt)}`, {
      x: 400,
      y: 775,
      size: 10,
      font,
      color: darkGray,
    });

    y = 750;

    // Order Status Badge
    const statusColors = {
      placed: rgb(0.2, 0.6, 0.9),
      processing: rgb(0.95, 0.6, 0.1),
      shipped: rgb(0.1, 0.7, 0.9),
      delivered: rgb(0.1, 0.7, 0.2),
      cancelled: rgb(0.9, 0.2, 0.2)
    };

    const statusColor = statusColors[order.orderStatus as keyof typeof statusColors] || rgb(0.5, 0.5, 0.5);
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: 80,
      height: 20,
      color: statusColor,
    });

    page.drawText(order.orderStatus.toUpperCase(), {
      x: 55,
      y: y,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 40;

    // Address Section
    const shipping = order.shippingAddress;
    const billing = order.billingAddress;

    // Draw section divider
    page.drawLine({
      start: { x: 50, y: y + 10 },
      end: { x: 545, y: y + 10 },
      thickness: 1,
      color: lightGray,
    });

    y -= 20;

    // Shipping Address
    page.drawText("SHIPPING ADDRESS", {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: darkGray,
    });

    // Billing Address
    page.drawText("BILLING ADDRESS", {
      x: 320,
      y,
      size: 12,
      font: boldFont,
      color: darkGray,
    });

    y -= 20;

    // Format addresses
    const formatAddress = (addr: any) => [
      addr.name,
      addr.addressLine1,
      `${addr.city}, ${addr.state} - ${addr.pincode}`,
      addr.phone,
      ...(addr.email ? [addr.email] : [])
    ];

    const shippingLines = formatAddress(shipping);
    const billingLines = formatAddress(billing);

    const maxLines = Math.max(shippingLines.length, billingLines.length);

    for (let i = 0; i < maxLines; i++) {
      if (shippingLines[i]) {
        page.drawText(shippingLines[i], {
          x: 50,
          y: y - (i * 15),
          size: 10,
          font: i === 0 ? boldFont : font,
          color: i === 0 ? black : darkGray,
        });
      }

      if (billingLines[i]) {
        page.drawText(billingLines[i], {
          x: 320,
          y: y - (i * 15),
          size: 10,
          font: i === 0 ? boldFont : font,
          color: i === 0 ? black : darkGray,
        });
      }
    }

    y -= (maxLines * 15) + 30;

    // Items Table Header
    page.drawLine({
      start: { x: 50, y: y + 10 },
      end: { x: 545, y: y + 10 },
      thickness: 1,
      color: lightGray,
    });

    y -= 10;

    page.drawText("ORDER DETAILS", {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: darkGray,
    });

    y -= 25;

    // Table Header Background
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: 495,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Table Headers
    const headers = [
      { text: "ITEM", x: 55 },
      { text: "QTY", x: 350 },
      { text: "RATE", x: 400 },
      { text: "AMOUNT", x: 480 }
    ];

    headers.forEach(header => {
      page.drawText(header.text, {
        x: header.x,
        y,
        size: 10,
        font: boldFont,
        color: darkGray,
      });
    });

    y -= 25;

    // Table Items
    let itemTotal = 0;
    order.items.forEach((item: any, index: number) => {
      const itemPrice = item.productDiscountedPrice || item.productPrice || 0;
      const itemQuantity = item.quantity || 1;
      const itemAmount = itemPrice * itemQuantity;
      itemTotal += itemAmount;

      // Alternate row background
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: y - 8,
          width: 495,
          height: 20,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Item name with wrapping
      const itemNameLines = wrapText(item.productName, 35);
      page.drawText(itemNameLines[0], {
        x: 55,
        y,
        size: 9,
        font,
        color: black,
      });

      if (itemNameLines.length > 1) {
        page.drawText(itemNameLines[1], {
          x: 55,
          y: y - 10,
          size: 8,
          font,
          color: darkGray,
        });
      }

      // Brand and description
      if (item.brand?.Brand_name) {
        page.drawText(item.brand.Brand_name, {
          x: 55,
          y: y - (itemNameLines.length > 1 ? 20 : 12),
          size: 8,
          font,
          color: darkGray,
        });
      }

      // Quantity
      page.drawText(itemQuantity.toString(), {
        x: 355,
        y,
        size: 10,
        font,
        color: black,
      });

      // Rate
      page.drawText(formatCurrency(itemPrice), {
        x: 405,
        y,
        size: 10,
        font,
        color: black,
      });

      // Amount
      page.drawText(formatCurrency(itemAmount), {
        x: 485,
        y,
        size: 10,
        font: boldFont,
        color: black,
      });

      y -= 35;
    });

    y -= 10;

    // Totals Section
    page.drawLine({
      start: { x: 350, y: y + 10 },
      end: { x: 545, y: y + 10 },
      thickness: 1,
      color: lightGray,
    });

    y -= 10;

    const totalsData = [
      { label: "Subtotal:", value: formatCurrency(order.subtotal || itemTotal) },
      { label: "Transport Charges:", value: formatCurrency(order.transportCharge || 0) },
      { label: "Labor Charges:", value: formatCurrency(order.laborCharges || 0) },
      { label: "GST (18%):", value: formatCurrency(order.gst || 0) },
      ...(order.discount && order.discount > 0 ? [{ label: "Discount:", value: `-${formatCurrency(order.discount)}` }] : []),
    ];

    totalsData.forEach((item, index) => {
      page.drawText(item.label, {
        x: 400,
        y,
        size: 10,
        font,
        color: darkGray,
      });

      page.drawText(item.value, {
        x: 485,
        y,
        size: 10,
        font,
        color: index === totalsData.length - 1 ? black : darkGray,
      });

      y -= 15;
    });

    // Final Total
    page.drawRectangle({
      x: 350,
      y: y - 5,
      width: 195,
      height: 25,
      color: primaryBlue,
    });

    page.drawText("TOTAL AMOUNT:", {
      x: 360,
      y,
      size: 12,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(formatCurrency(order.total), {
      x: 485,
      y,
      size: 12,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 40;

    // GST Details Section (if available)
    if (order.gstDetails && order.gstDetails.number) {
      page.drawLine({
        start: { x: 50, y: y + 10 },
        end: { x: 545, y: y + 10 },
        thickness: 1,
        color: lightGray,
      });

      y -= 10;

      page.drawText("GST DETAILS", {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: darkGray,
      });

      y -= 20;

      page.drawText(`Company Name: ${order.gstDetails.companyName || 'N/A'}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: black,
      });

      page.drawText(`GSTIN: ${order.gstDetails.number}`, {
        x: 50,
        y: y - 15,
        size: 10,
        font,
        color: black,
      });

      page.drawText(`Status: ${order.gstDetails.verified ? 'Verified' : 'Pending Verification'}`, {
        x: 50,
        y: y - 30,
        size: 10,
        font,
        color: order.gstDetails.verified ? rgb(0.1, 0.7, 0.2) : rgb(0.9, 0.6, 0.1),
      });

      y -= 50;
    }

    // Payment Information
    if (y > 100) {
      page.drawLine({
        start: { x: 50, y: y + 10 },
        end: { x: 545, y: y + 10 },
        thickness: 1,
        color: lightGray,
      });

      y -= 10;

      page.drawText("PAYMENT INFORMATION", {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: darkGray,
      });

      y -= 20;

      const paymentStatusColor = order.paymentStatus === 'paid' 
        ? rgb(0.1, 0.7, 0.2) 
        : order.paymentStatus === 'failed' 
        ? rgb(0.9, 0.2, 0.2) 
        : rgb(0.9, 0.6, 0.1);

      page.drawText(`Payment Status: ${order.paymentStatus.toUpperCase()}`, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: paymentStatusColor,
      });

      if (order.coupon) {
        page.drawText(`Coupon Applied: ${order.coupon.code} (-${formatCurrency(order.coupon.discount)})`, {
          x: 50,
          y: y - 15,
          size: 10,
          font,
          color: rgb(0.1, 0.7, 0.2),
        });
      }
    }

    // Footer
    const footerY = 50;
    page.drawLine({
      start: { x: 50, y: footerY + 20 },
      end: { x: 545, y: footerY + 20 },
      thickness: 0.5,
      color: lightGray,
    });

    page.drawText("Thank you for shopping with Plypicker!", {
      x: 50,
      y: footerY,
      size: 10,
      font,
      color: darkGray,
    });

    page.drawText(`Generated on: ${formatDate(new Date())}`, {
      x: 400,
      y: footerY,
      size: 8,
      font,
      color: lightGray,
    });

    // Save and return PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order._id}.pdf`,
      },
    });

  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}