import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from 'fs';
import path from 'path';

/* ----------------------------  TYPES  ---------------------------- */
interface ServiceItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}
interface Address {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}
interface OrderForInvoice {
  _id: string;
  orderNumber: string;
  createdAt: Date | string;
  services: ServiceItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  gst: number;
  discount?: number;
  total: number;
  paymentStatus: string;
  remainingAmount?: number;
}

/* --------------------------  HELPERS  ---------------------------- */
// Use "Rs." instead of ₹ symbol to avoid WinAnsi encoding issues
const inr = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Map fancy glyphs → WinAnsi‑safe
const sanitize = (str: string) =>
  str
    .replace(/[\u2010-\u2015]/g, "-")  // hyphens/dashes
    .replace(/\u00A0/g, " ")          // NBSP
    .replace(/[\u2018\u2019]/g, "'")  // single quotes
    .replace(/[\u201C\u201D]/g, '"')  // double quotes
    .replace(/₹/g, "Rs.")             // Replace rupee symbol
    .replace(/[^\x20-\x7E]/g, "");    // Remove any non-ASCII chars

export async function createInvoiceBuffer(
  order: OrderForInvoice,
  logoBase64?: string // Optional logo parameter
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const draw = (
    txt: string,
    x: number,
    y: number,
    size = 10,
    f = font,
    opts: any = {}
  ) => page.drawText(sanitize(txt), { x, y, size, font: f, ...opts });

  const line = (x1: number, y1: number, x2: number, y2: number, w = 0.5) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w });

  // Draw border around entire page
  page.drawRectangle({ 
    x: 20, 
    y: 20, 
    width: 555, 
    height: 802, 
    borderWidth: 1.5,
    borderColor: rgb(0, 0, 0)
  });

  /* ---------------------- LOGO & COMPANY HEADER ---------------------- */
  let y = 812;
  
  // Load and embed logo image
  try {
    let logoImage;
    
    if (logoBase64) {
      // Option 2A: Using base64 string
      const logoBytes = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
      logoImage = await pdf.embedPng(logoBytes); // Use embedJpg() if it's a JPG
    } else {
      // Option 2B: If logo is in public folder
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdf.embedPng(logoBytes); // Use embedJpg() if it's a JPG
    }
    
    page.drawImage(logoImage, {
      x: 40,
      y: y - 35,
      width: 50,
      height: 30,
    });
  } catch (error) {
    // Fallback: draw placeholder if logo loading fails
    page.drawRectangle({ 
      x: 40, 
      y: y - 35, 
      width: 50, 
      height: 30, 
      borderWidth: 1,
      borderColor: rgb(0.7, 0.7, 0.7)
    });
    draw("LOGO", 55, y - 20, 8, bold);
  }
  
  // Company name next to logo
  draw("PLYPICKER SERVICES PVT. LTD.", 110, y - 5, 14, bold);
  y -= 20;
  draw("GSTIN: 27AAAAA9999Z1ZV", 110, y);
  y -= 12;
  draw("Baner Road, Pune - 411045, Maharashtra", 110, y);
  y -= 12;
  draw("Email: support@plypicker.in | Phone: +91-99999-99999", 110, y);

  /* ------------------ INVOICE META ------------------- */
  const meta = (label: string, val: string | number, row: number) => {
    draw(label, 360, 812 - row * 14, 9, bold);
    draw(String(val), 445, 812 - row * 14);
  };
  meta("Invoice #:", order.orderNumber, 0);
  meta("Invoice Date:", new Date(order.createdAt).toLocaleDateString("en-GB"), 1);
  meta("Place of Supply:", order.shippingAddress.state.toUpperCase(), 2);
  meta("Due Date:", new Date(order.createdAt).toLocaleDateString("en-GB"), 3);

  /* ------------------ BILL / SHIP TO ----------------- */
  y -= 35;
  line(40, y + 5, 555, y + 5); // Horizontal line separator
  y -= 10;
  
  draw("BILL TO:", 40, y, 10, bold);
  draw("SHIP TO:", 320, y, 10, bold);
  y -= 14;

  const addr = (a: Address, x: number, yy: number) => {
    draw(a.name, x, yy);
    draw(`Phone: ${a.phone}`, x, yy - 12);
    draw(`${a.addressLine1}${a.addressLine2 ? ", " + a.addressLine2 : ""}`, x, yy - 24);
    draw(`${a.city}, ${a.state}, ${a.pincode}`, x, yy - 36);
    draw(a.country, x, yy - 48);
  };
  addr(order.billingAddress, 40, y);
  addr(order.shippingAddress, 320, y);
  y -= 70;

  /* ------------------- ITEM TABLE ------------------- */
  line(40, y + 5, 555, y + 5); // Horizontal line separator
  y -= 10;
  
  const col = [40, 60, 330, 375, 420, 480, 555];
  const headY = y;
  page.drawRectangle({ x: 40, y: headY - 14, width: 515, height: 14, color: rgb(0.9, 0.9, 0.9) });
  ["#", "Item", "HSN/SAC", "Qty", "Taxable", "GST", "Amount"].forEach((h, i) =>
    draw(h, col[i] + 2, headY - 11, 9, bold)
  );
  y = headY - 26;

  order.services.forEach((s, i) => {
    const taxable = s.price * s.quantity;
    const gstRate = order.subtotal ? (order.gst / order.subtotal) * 100 : 0;
    const gstAmt = taxable * (gstRate / 100);
    const total = taxable + gstAmt;

    draw(String(i + 1), col[0] + 2, y);
    draw(s.name, col[1] + 2, y);
    draw("998717", col[2] + 2, y);
    draw(String(s.quantity), col[3] + 2, y);
    draw(inr(taxable), col[4] + 2, y);
    draw(inr(gstAmt), col[5] + 2, y);
    draw(inr(total), col[6] - 50, y);

    y -= 16;
  });

  // Draw table borders
  col.forEach((x) => line(x, headY - 14, x, y + 14));
  line(40, headY - 14, 555, headY - 14);
  line(40, y + 14, 555, y + 14);

  /* ------------------- TOTALS ------------------- */
  y -= 10;
  line(40, y + 5, 555, y + 5); // Horizontal line separator
  y -= 15;
  
  const right = (k: string, v: string, b = false) => {
    draw(k, 420, y, 10, b ? bold : font);
    draw(v, 500, y, 10, b ? bold : font);
    y -= 14;
  };
  right("Subtotal:", inr(order.subtotal));
  right("GST:", inr(order.gst));
  if (order.discount && order.discount > 0) right("Discount:", "-" + inr(order.discount));
  right("TOTAL:", inr(order.total), true);
  y -= 6;
  const paidAmount = order.total - (order.remainingAmount ?? 0);
  right("Paid:", inr(paidAmount));
  right("Remaining:", inr(order.remainingAmount ?? 0));
  y -= 20;

  /* ------------------ GST BREAK-UP ------------------ */
  line(40, y + 5, 555, y + 5); // Horizontal line separator
  y -= 15;
  
  draw("GST Break-up", 40, y, 10, bold);
  y -= 14;
  const gstCol = [40, 140, 260, 320, 420, 520];
  page.drawRectangle({ x: 40, y: y - 12, width: 515, height: 12, color: rgb(0.95, 0.95, 0.95) });
  ["HSN/SAC", "Taxable", "Rate", "IGST Amt", "Total Tax"].forEach((h, i) =>
    draw(h, gstCol[i] + 2, y - 6, 9, bold)
  );
  y -= 24;
  const rate = order.subtotal ? (order.gst / order.subtotal) * 100 : 0;
  draw("998717", gstCol[0] + 2, y);
  draw(inr(order.subtotal), gstCol[1] + 2, y);
  draw(rate.toFixed(0) + "%", gstCol[2] + 2, y);
  draw(inr(order.gst), gstCol[3] + 2, y);
  draw(inr(order.gst), gstCol[4] + 2, y);
  y -= 30;

  /* ---------------- QR CODE & SIGNATURE ---------------- */
  line(40, y + 5, 555, y + 5); // Horizontal line separator
  y -= 15;
  
  // QR Code placeholder
  page.drawRectangle({ x: 40, y: y - 80, width: 80, height: 80, borderWidth: 0.5 });
  draw("QR Code", 60, y - 45, 9);
  draw("Scan to Pay", 45, y - 90, 8);

  // Signature box
  page.drawRectangle({ x: 400, y: y - 60, width: 140, height: 60, borderWidth: 0.5 });
  draw("Authorised Signatory", 410, y - 15, 9);
  line(410, y - 45, 530, y - 45);

  y -= 100;

  /* ---------------- NOTES & T&C ---------------- */
  line(40, y + 5, 555, y + 5); // Horizontal line separator
  y -= 15;
  
  draw("Notes:", 40, y, 10, bold);
  draw("Thank you for choosing Plypicker Services!", 40, y - 12);

  draw("Terms & Conditions:", 320, y, 10, bold);
  [
    "1. Services once rendered cannot be refunded.",
    "2. Warranty, if any, as per manufacturer.",
    "3. Interest @24% p.a. on overdue invoices beyond 15 days.",
    "4. Subject to Pune Jurisdiction.",
  ].forEach((t, i) => draw(t, 320, y - 12 - i * 12, 8));

  /* ---------------- FOOTER ---------------- */
  line(40, 50, 555, 50);
  draw("Page 1 of 1   |   This is a system-generated invoice.", 180, 35, 8);

  return Buffer.from(await pdf.save());
}