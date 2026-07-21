"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, Loader2, CheckCircle, Clock, XCircle,
  IndianRupee, Phone, MapPin, Mail, MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

const PAYMENT_STATUS_STYLES: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  PAID: {
    className: "bg-green-500/10 text-green-600 border border-green-500/20",
    icon: <CheckCircle size={14} />,
    label: "Paid",
  },
  UNPAID: {
    className: "bg-red-500/10 text-red-600 border border-red-500/20",
    icon: <XCircle size={14} />,
    label: "Unpaid",
  },
  PARTIAL: {
    className: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
    icon: <Clock size={14} />,
    label: "Partial Payment",
  },
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card / Debit",
  PENDING: "Pending",
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${resolvedParams.id}`).then((r) => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      }),
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([inv, cfg]) => {
        setInvoice(inv);
        setSettings(cfg);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        router.push("/billing");
      });
  }, [resolvedParams.id, router, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  if (!invoice) return null;

  const shopName = settings?.shopName || "RA Seva Point";
  const shopTagline = settings?.tagline || "One Stop for Books, Print & Digital Services";
  const shopAddress = settings?.shopAddress || "";
  const shopPhone = settings?.shopPhone || "";
  const shopEmail = settings?.shopEmail || "";
  const upiId = settings?.upiId || "rasevapoint@upi";

  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${invoice.total}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`;
  const paymentStyle = PAYMENT_STATUS_STYLES[invoice.paymentStatus] || PAYMENT_STATUS_STYLES.UNPAID;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${invoice.customer.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Invoice_${invoice.invoiceNumber}`;
    window.print();
    document.title = originalTitle;
  };

  const handleWhatsApp = () => {
    let message = "";
    const customerName = invoice.customer.name;
    const invNumber = invoice.invoiceNumber;
    const total = formatCurrency(invoice.total);
    const paid = formatCurrency(invoice.amountPaid || 0);
    const balance = formatCurrency(invoice.total - (invoice.amountPaid || 0));

    if (invoice.paymentStatus === "PAID") {
      message = `Hello ${customerName},\n\nGreetings from ${shopName}! 🙏\n\nYour payment of ${total} for Invoice #${invNumber} has been successfully received.\n\nThank you for your business. We look forward to serving you again!`;
    } else if (invoice.paymentStatus === "PARTIAL") {
      message = `Hello ${customerName},\n\nGreetings from ${shopName}! 🙏\n\nYour Invoice #${invNumber} for a total of ${total} has been generated. We have received your partial payment of ${paid}.\n\nPending Balance: ${balance}\n\nPlease clear the pending balance at your earliest convenience. Thank you!`;
    } else {
      message = `Hello ${customerName},\n\nGreetings from ${shopName}! 🙏\n\nYour Invoice #${invNumber} has been generated for a total of ${total}.\n\nCurrently, the invoice is UNPAID. Please clear the payment at your earliest convenience. Thank you!`;
    }

    const whatsappUrl = `https://wa.me/91${invoice.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Action Buttons — hidden on print via .no-print */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-3">
          <Link href="/billing" className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Invoice #{invoice.invoiceNumber}</h1>
            <p className="page-subtitle">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${paymentStyle.className}`}>
            {paymentStyle.icon}
            {paymentStyle.label}
          </div>
          <button onClick={handleWhatsApp} className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-sm" style={{ color: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.1)", borderColor: "rgba(22, 163, 74, 0.2)" }}>
            <MessageCircle size={16} />
            WhatsApp
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Card — invoice-print-card class for print CSS targeting */}
      <div
        className="glass-card invoice-print-card p-8"
        style={{ background: "white", border: "1px solid var(--border-primary)" }}
      >
        {/* ── HEADER ── */}
        <div
          className="flex justify-between items-start gap-4 flex-wrap pb-8 border-b-2"
          style={{ borderColor: "var(--border-secondary)" }}
        >
          {/* Shop Info */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center bg-white shadow-sm"
                style={{ border: "1px solid rgba(0,0,0,0.1)" }}
              >
                <img 
                  src="/logo.png" 
                  alt="RA" 
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent && !parent.querySelector('.fallback-ra')) {
                      const fallback = document.createElement('span');
                      fallback.className = 'fallback-ra text-blue-600 font-black text-2xl tracking-tight';
                      fallback.innerText = 'RA';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div>
                <h2 className="font-extrabold text-2xl tracking-tight text-slate-900">
                  {shopName}
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mt-0.5">
                  {shopTagline}
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              {shopAddress && (
                <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  {shopAddress}
                </p>
              )}
              {shopPhone && (
                <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  {shopPhone}
                </p>
              )}
              {shopEmail && (
                <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  {shopEmail}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="text-right">
            <div
              className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2"
              style={{ background: "rgba(79,110,247,0.08)", color: "#4f6ef7" }}
            >
              Tax Invoice
            </div>
            <div className="font-mono font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              #{invoice.invoiceNumber}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Date: {formatDate(invoice.createdAt)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Operator: {invoice.createdBy?.name || "—"}
            </div>
            {/* Payment status badge (print-visible) */}
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-xs font-semibold ${paymentStyle.className}`}>
              {paymentStyle.icon}
              {paymentStyle.label}
            </div>
          </div>
        </div>

        {/* ── BILLED TO / ISSUED BY ── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b"
          style={{ borderColor: "var(--border-secondary)" }}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Billed To
            </div>
            <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              {invoice.customer.name}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              <Phone size={10} />
              {invoice.customer.mobile}
            </div>
            {invoice.customer.address && (
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                <MapPin size={10} />
                {invoice.customer.address}
              </div>
            )}
            {invoice.customer.email && (
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                <Mail size={10} />
                {invoice.customer.email}
              </div>
            )}
          </div>

          <div className="sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Payment Details
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span style={{ color: "var(--text-muted)" }}>Mode: </span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {PAYMENT_MODE_LABELS[invoice.paymentMode] || invoice.paymentMode}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>UPI: </span>
                <span className="font-mono font-semibold" style={{ color: "#4f6ef7" }}>{upiId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div className="my-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-primary)" }}>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[40%]">
                  Description
                </th>
                <th className="pb-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16">
                  Qty
                </th>
                <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-28">
                  Unit Price
                </th>
                <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, i: number) => (
                <tr
                  key={item.id}
                  className="border-b border-dashed"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  <td className="py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.name}
                  </td>
                  <td className="py-3 text-center" style={{ color: "var(--text-secondary)" }}>
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center justify-end gap-0.5">
                      <IndianRupee size={10} />
                      {item.price.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold" style={{ color: "var(--text-primary)" }}>
                    <span className="flex items-center justify-end gap-0.5">
                      <IndianRupee size={10} />
                      {item.total.toLocaleString("en-IN")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS + QR CODE ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 items-end qr-section">
          {/* QR Code */}
          <div className="flex gap-4 items-center p-4 rounded-2xl border border-dashed"
            style={{ background: "rgba(79,110,247,0.04)", borderColor: "rgba(79,110,247,0.2)" }}>
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm">
              <QRCodeSVG value={upiLink} size={88} />
            </div>
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Scan to Pay (UPI)
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                GPay, PhonePe, Paytm se scan karein
              </p>
              <div className="text-[10px] font-mono font-bold mt-1 text-blue-500">{upiId}</div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="flex items-center gap-0.5">
                <IndianRupee size={11} />
                {invoice.subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount:</span>
                <span>- ₹{invoice.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {invoice.gst > 0 && (
              <div className="flex justify-between">
                <span>GST ({invoice.gst}%):</span>
                <span className="flex items-center gap-0.5">
                  <IndianRupee size={11} />
                  {Math.round((invoice.subtotal * invoice.gst) / 100).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div
              className="flex justify-between font-bold text-lg border-t pt-3 mt-2"
              style={{ color: "var(--text-primary)", borderColor: "var(--border-primary)" }}
            >
              <span>Grand Total:</span>
              <span className="flex items-center gap-1 text-blue-600">
                <IndianRupee size={15} />
                {invoice.total.toLocaleString("en-IN")}
              </span>
            </div>
            {(invoice.paymentStatus === "PARTIAL" || invoice.paymentStatus === "UNPAID") && (
              <>
                <div className="flex justify-between font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                  <span>Amount Paid:</span>
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <IndianRupee size={11} />
                    {(invoice.amountPaid || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-red-500 mt-1">
                  <span>Balance Due:</span>
                  <span className="flex items-center gap-0.5">
                    <IndianRupee size={12} />
                    {Math.max(0, invoice.total - (invoice.amountPaid || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── NOTES ── */}
        {invoice.notes && (
          <div
            className="mt-6 p-4 rounded-xl border border-dashed"
            style={{ borderColor: "var(--border-secondary)", background: "var(--bg-secondary)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Notes
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{invoice.notes}</p>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div
          className="text-center pt-8 mt-8 border-t text-[10px]"
          style={{ borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}
        >
          <p className="font-semibold">Thank you for choosing {shopName}!</p>
          <p className="mt-1">Please retain this invoice for your records. This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  );
}
