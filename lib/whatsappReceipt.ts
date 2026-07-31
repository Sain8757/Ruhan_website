// Instant WhatsApp PDF & Digital Receipt Generator for RA Seva Point

export interface InvoiceReceiptData {
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  createdAt: string;
  total: number;
  amountPaid?: number;
  paymentMode: string;
  paymentStatus: string;
  items?: Array<{ name: string; quantity: number; price: number; total?: number }>;
  shopName?: string;
  shopPhone?: string;
}

export function generateWhatsAppMessage(data: InvoiceReceiptData): string {
  const shopName = data.shopName || "RA SEVA POINT";
  const formattedDate = new Date(data.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const totalStr = `₹${data.total.toLocaleString("en-IN")}`;
  const paidStr = `₹${(data.amountPaid || data.total).toLocaleString("en-IN")}`;
  const pendingAmount = Math.max(0, data.total - (data.amountPaid || 0));
  const pendingStr = `₹${pendingAmount.toLocaleString("en-IN")}`;

  let itemsList = "";
  if (data.items && data.items.length > 0) {
    itemsList = data.items
      .map((item, idx) => `  ${idx + 1}. ${item.name} (${item.quantity} x ₹${item.price}) = ₹${item.quantity * item.price}`)
      .join("\n");
  }

  let statusEmoji = "✅";
  let statusText = "PAID (भुगतान सफल)";

  if (data.paymentStatus === "UNPAID") {
    statusEmoji = "🔴";
    statusText = "UNPAID (लंबित)";
  } else if (data.paymentStatus === "PARTIAL") {
    statusEmoji = "🟡";
    statusText = `PARTIAL (आंशिक: ${paidStr} / शेष: ${pendingStr})`;
  }

  return `💐 *${shopName.toUpperCase()}* 💐
*डिजिटल सेवा एवं ऑनलाइन बिल रसीद*
----------------------------------------
🧾 *Invoice No:* #${data.invoiceNumber}
📅 *Date:* ${formattedDate}
👤 *Customer:* ${data.customerName}
📞 *Mobile:* ${data.customerMobile}

${itemsList ? `*सेवा / आइटम्स विवरण (Items):*\n${itemsList}\n----------------------------------------\n` : ""}💰 *Total Amount:* ${totalStr}
${statusEmoji} *Status:* ${statusText}
💳 *Payment Mode:* ${data.paymentMode || "Cash"}
----------------------------------------
🙏 *धन्यवाद! RA Seva Point mein aane ke liye shukriya.*
Aapki sewa mein hamesha tatpar!
${data.shopPhone ? `📞 Call/WhatsApp: ${data.shopPhone}` : ""}`;
}

export function openWhatsAppReceipt(data: InvoiceReceiptData) {
  const cleanMobile = data.customerMobile.replace(/\D/g, "").slice(-10);
  const message = generateWhatsAppMessage(data);
  const encodedMsg = encodeURIComponent(message);

  const url = cleanMobile && cleanMobile.length === 10
    ? `https://wa.me/91${cleanMobile}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}
