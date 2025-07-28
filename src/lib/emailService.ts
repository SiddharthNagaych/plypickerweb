/* ------------------------------------------------------------------ */
/*  emailService.ts – customer‑facing e‑mails for product & service   */
/* ------------------------------------------------------------------ */
import nodemailer from "nodemailer";

/* ──────────────── 1. Shared types ──────────────── */
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  discountedPrice?: number;
  quantity: number;
  image?: string;
  specifications?: Record<string, unknown>;
}
interface OrderAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  type?: string;
}
interface GstDetails  { companyName: string; gstNumber: string }
interface PaymentDetails { mode?: string; amount: number; transactionId: string; time?: Date }

interface OrderBase {
  _id: string;
  type: "product" | "service";
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  total: number;
  paymentDetails?: PaymentDetails;
  gstDetails?: GstDetails;
  orderStatus?: string;
}
interface ProductOrder extends OrderBase { items: OrderItem[]; type: "product" }
interface ServiceOrder extends OrderBase {
  type: "service";
  services: Array<{ name: string; description: string; price: number; duration?: string; technicianRequired?: boolean }>;
  scheduledDate: Date;
  scheduledTime: string;
  advancePayment?: { percentage: number; amount: number };
  finalPayment?:   { amount: number };
}

/* ──────────────── 2. Brand palette / theming ──────────────── */
const brand = {
  name : "PlyApp",
  logo : "https://i.ibb.co/LdgRrxrZ/plyimg.jpg",   // TODO: replace with real logo
  prim : "#FF7A00",
  light: "#FFF6ED",
  text : "#212121",
  sub  : "#6C757D",
};

/* ──────────────── 3. Public helper ──────────────── */
export async function sendOrderConfirmationEmail(opts: {
  order: ProductOrder | ServiceOrder;
  paymentType?: "advance" | "full";
  amountPaid?:  number;
  customerEmail?: string;
}) {
  const { order, paymentType = "full", amountPaid = order.total, customerEmail } = opts;
  const emailTo = customerEmail || order.shippingAddress.email;
  if (!emailTo) return console.log("❕ No e‑mail on order", order._id);

  const tx = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  if (order.type === "product") {
    await emailProduct(tx, emailTo, order);
  } else {
    await emailService(tx, emailTo, order, paymentType, amountPaid);
  }

  console.log("📧 Order mail sent →", emailTo);
}

/* ──────────────── 4. Product‑order template ──────────────── */
async function emailProduct(
  tx: nodemailer.Transporter,
  to: string,
  order: ProductOrder
) {
  const rows = order.items.map(it => {
    const full = Number(it.price ?? 0);
    const disc = Number(it.discountedPrice ?? full);
    return `
      <tr>
        <td style="padding:8px 6px;">
          ${it.name}<br>
          <span style="font-size:12px;color:${brand.sub};">× ${it.quantity}</span>
        </td>
        <td style="padding:8px 6px;text-align:right;">
          ₹${disc.toLocaleString("en-IN")}
          ${disc !== full
            ? `<span style="text-decoration:line-through;color:${brand.sub};font-size:12px;">₹${full.toLocaleString("en-IN")}</span>`
            : ""}
        </td>
      </tr>`;
  }).join("");

  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:20px;">Thanks for your order!</h2>
    <p style="margin:0 0 12px;color:${brand.sub};font-size:14px;">
      Order #${order._id} • ${order.orderStatus ?? "confirmed"}
    </p>

    <table width="100%" style="border-collapse:collapse;font-size:14px;">
      ${rows}
      <tr><td colspan="2" style="border-bottom:1px solid #eee;"></td></tr>
      <tr>
        <td style="padding:12px 6px;font-weight:600;">Total Paid</td>
        <td style="padding:12px 6px;text-align:right;font-weight:600;">
          ₹${order.total.toLocaleString("en-IN")}
        </td>
      </tr>
    </table>

    ${paymentMeta(order.paymentDetails)}
    ${addressBlocks(order.shippingAddress, order.billingAddress)}
    ${order.gstDetails ? gstBlock(order.gstDetails) : ""}
  `);

  await tx.sendMail({
    from: `"${process.env.MAIL_SENDER_NAME || brand.name}" <${process.env.MAIL_USER}>`,
    to,
    subject: `Your ${brand.name} order • #${order._id}`,
    html,
  });
}

/* ──────────────── 5. Service‑booking template ──────────────── */
async function emailService(
  tx: nodemailer.Transporter,
  to: string,
  order: ServiceOrder,
  payType: "advance" | "full",
  paid: number
) {
  const rows = order.services.map(s => `
    <tr>
      <td style="padding:8px 6px;">${s.name}</td>
      <td style="padding:8px 6px;text-align:right;">₹${s.price}</td>
    </tr>`).join("");

  const balance = order.total - paid;

  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:20px;">
      Service booking ${payType === "advance" ? "confirmed" : "completed"}
    </h2>
    <p style="margin:0 0 12px;color:${brand.sub};font-size:14px;">
      Booking #${order._id} • ${order.orderStatus ?? "confirmed"}
    </p>

    <table width="100%" style="border-collapse:collapse;font-size:14px;">
      ${rows}
      <tr><td colspan="2" style="border-bottom:1px solid #eee;"></td></tr>

      <tr>
        <td style="padding:10px 6px;">${payType === "advance" ? "Advance paid" : "Amount paid"}</td>
        <td style="padding:10px 6px;text-align:right;">₹${paid}</td>
      </tr>
      ${payType === "advance" ? `
        <tr>
          <td style="padding:6px;">Balance due</td>
          <td style="padding:6px;text-align:right;">₹${balance}</td>
        </tr>` : ""}

      <tr>
        <td style="padding:10px 6px;font-weight:600;">Total value</td>
        <td style="padding:10px 6px;text-align:right;font-weight:600;">₹${order.total}</td>
      </tr>
    </table>

    <p style="font-size:13px;margin-top:12px;">
      <strong>Scheduled:</strong>
      ${new Date(order.scheduledDate).toLocaleDateString()} • ${order.scheduledTime}
    </p>

    ${addressBlocks(order.shippingAddress, order.billingAddress)}

    <div style="font-size:13px;background:#ffffff;border-radius:12px;padding:16px;margin-top:16px;">
      ${payType === "advance"
        ? `Our team will collect the remaining ₹${balance} after the service.`
        : `Thank you for the full payment. We’ll see you on the scheduled date!`}
    </div>

    ${order.gstDetails ? gstBlock(order.gstDetails) : ""}
  `);

  await tx.sendMail({
    from: `"${process.env.MAIL_SENDER_NAME || brand.name}" <${process.env.MAIL_USER}>`,
    to,
    subject: `Your ${brand.name} service booking • #${order._id}`,
    html,
  });
}

/* ──────────────── 6. HTML helper snippets ──────────────── */
const wrap = (inner: string) => `
  <div style="font-family:Inter,Arial,sans-serif;background:${brand.light};
              padding:24px;color:${brand.text};max-width:600px;margin:auto;">
    <div style="text-align:center;margin-bottom:20px;">
      <img src="${brand.logo}" alt="${brand.name}" style="height:40px">
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;">
      ${inner}
    </div>
    <p style="font-size:12px;color:${brand.sub};text-align:center;margin-top:28px;">
      Need help? Reply to this mail or visit Support inside the app.
    </p>
  </div>`;

const paymentMeta = (p?: PaymentDetails) =>
  p?.mode
    ? `<p style="font-size:12px;color:${brand.sub};margin-top:8px;">
         Paid via ${String(p.mode).toUpperCase()} • Txn ID ${p.transactionId}
       </p>`
    : "";

function addressBlocks(ship: OrderAddress, bill: OrderAddress) {
  return `
    <table width="100%" style="margin:20px 0;border-collapse:collapse;">
      <tr>
        ${addrCell("Shipping Address", ship)}
        ${addrCell("Billing Address",  bill)}
      </tr>
    </table>`;
}
function addrCell(label: string, a: OrderAddress) {
  return `
    <td style="width:50%;padding:0 6px;vertical-align:top;">
      <div style="background:${brand.light};border-radius:12px;padding:16px;margin-top:12px;">
        <span style="font-weight:600;font-size:14px;">${label}</span><br>
        <span style="font-size:13px;">
          ${a.name}<br>${a.phone}<br>
          ${a.addressLine1}<br>
          ${a.city}, ${a.state} ${a.pincode}
        </span>
      </div>
    </td>`;
}
function gstBlock(g: GstDetails) {
  return `
    <div style="background:#f8d7da;padding:12px;border-radius:12px;margin-top:18px;">
      <strong>GST Details</strong><br>
      ${g.companyName}<br>GSTIN ${g.gstNumber}
    </div>`;
}
