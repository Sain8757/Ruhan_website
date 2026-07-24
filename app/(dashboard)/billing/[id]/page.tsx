"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, Loader2, CheckCircle, Clock, XCircle,
  IndianRupee, Phone, MapPin, Mail, MessageCircle, Download, FileText
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import SettleModal, { SettleInvoiceData } from "../SettleModal";

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [template, setTemplate] = useState<"classic" | "modern">("classic");
  const [settleInvoiceData, setSettleInvoiceData] = useState<SettleInvoiceData | null>(null);

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

  const shopName = settings?.shopName || "RA SEVA POINT";
  const shopTagline = settings?.tagline || "ONE STOP FOR BOOKS, PRINT & DIGITAL SERVICES";
  const shopAddress = settings?.shopAddress || "Front of High School, Sehaik, Amour, Purnea, Bihar - 854315";
  const shopPhone = settings?.shopPhone || "+91 7667538401";
  const shopEmail = settings?.shopEmail || "ruhanahmad2017@gmail.com";
  const upiId = settings?.upiId || "rasevapoint@upi";

  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${invoice.total}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`;
  const paymentStyle = PAYMENT_STATUS_STYLES[invoice.paymentStatus] || PAYMENT_STATUS_STYLES.UNPAID;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${invoice.customer.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Invoice_${invoice.invoiceNumber}`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const element = document.querySelector(".invoice-print-card") as HTMLElement;
      if (!element) throw new Error("Invoice container not found");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, { scale: 2.5, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 295));
      const fileName = `${invoice.customer.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Invoice_${invoice.invoiceNumber}.pdf`;
      pdf.save(fileName);
      toast.success("Invoice PDF downloaded!");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSettleInvoice = () => {
    setSettleInvoiceData({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      total: invoice.total,
      amountPaid: invoice.amountPaid || 0,
    });
  };

  const handleWhatsApp = async () => {
    let message = "";
    const customerName = invoice.customer.name;
    const invNumber = invoice.invoiceNumber;
    const total = formatCurrency(invoice.total);
    const paid = formatCurrency(invoice.amountPaid || 0);
    const balance = formatCurrency(Math.max(0, invoice.total - (invoice.amountPaid || 0)));

    if (invoice.paymentStatus === "PAID") {
      message = `Hello ${customerName},\n\nGreetings from ${shopName}! 🙏\n\nYour payment of ${total} for Invoice #${invNumber} has been successfully received.\n\nThank you for your business. We look forward to serving you again!`;
    } else if (invoice.paymentStatus === "PARTIAL") {
      message = `Hello ${customerName},\n\nGreetings from ${shopName}! 🙏\n\nYour Invoice #${invNumber} for a total of ${total} has been generated. We have received your partial payment of ${paid}.\n\nPending Balance: ${balance}\n\nPlease clear the pending balance at your earliest convenience. Thank you!`;
    } else {
      message = `Hello ${customerName},\n\nGreetings from ${shopName}! 🙏\n\nYour Invoice #${invNumber} has been generated for a total of ${total}.\n\nCurrently, the invoice is UNPAID. Please clear the payment at your earliest convenience. Thank you!`;
    }

    try {
      setIsGeneratingPdf(true);
      const element = document.querySelector(".invoice-print-card") as HTMLElement;
      if (!element) throw new Error("Invoice element not found");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output("blob");
      const fileName = `${invoice.customer.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Invoice_${invoice.invoiceNumber}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: message,
          files: [file],
        });
      } else {
        const whatsappUrl = `https://wa.me/91${invoice.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      toast.error("Opening WhatsApp directly...");
      const whatsappUrl = `https://wa.me/91${invoice.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Top Action Header — hidden on print */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/billing" className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Invoice #{invoice.invoiceNumber}</h1>
            <p className="page-subtitle">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>

        {/* Template Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden bg-white text-xs font-bold shadow-sm" style={{ borderColor: 'var(--border-primary)' }}>
            <button
              onClick={() => setTemplate("classic")}
              className={`px-3 py-1.5 transition-colors ${template === "classic" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Classic Vintage (Old)
            </button>
            <button
              onClick={() => setTemplate("modern")}
              className={`px-3 py-1.5 transition-colors ${template === "modern" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Modern Executive
            </button>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${paymentStyle.className}`}>
            {paymentStyle.icon}
            {paymentStyle.label}
          </div>

          {invoice.paymentStatus !== "PAID" && (
            <button
              onClick={handleSettleInvoice}
              className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold no-print"
              style={{ color: "#059669", backgroundColor: "rgba(5, 150, 105, 0.1)", borderColor: "rgba(5, 150, 105, 0.2)" }}
            >
              <IndianRupee size={14} />
              Settle
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold"
            title="Download PDF File"
          >
            {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Save PDF
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={isGeneratingPdf}
            className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold"
            style={{ color: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.1)", borderColor: "rgba(22, 163, 74, 0.2)" }}
          >
            {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
            WhatsApp
          </button>

          <button onClick={handlePrint} className="btn-primary px-4 py-1.5 flex items-center gap-1.5 text-xs font-bold">
            <Printer size={14} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* ── INVOICE TEMPLATE CONTAINER ── */}
      <div className="invoice-print-area">
        {template === "classic" ? (
          /* ========================================================================= */
          /*  CLASSIC VINTAGE / DOT-MATRIX OLD-STYLE INVOICE TEMPLATE (Matching Image 2)  */
          /* ========================================================================= */
          <div
            className="invoice-print-card bg-white p-6 sm:p-8 text-black"
            style={{
              fontFamily: "'Courier New', Courier, 'Consolas', monospace",
              border: "2px solid #000",
              color: "#000000",
              background: "#ffffff",
              boxSizing: "border-box"
            }}
          >
            {/* Top Brand Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "60px", height: "60px", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                  <img
                    src="/logo.png"
                    alt="RA"
                    style={{ maxHeight: "54px", maxWidth: "54px", objectFit: "contain" }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      const p = (e.target as HTMLElement).parentElement;
                      if (p && !p.querySelector(".fb-logo")) {
                        const s = document.createElement("span");
                        s.className = "fb-logo";
                        s.style.fontWeight = "bold";
                        s.style.fontSize = "20px";
                        s.innerText = "GIT";
                        p.appendChild(s);
                      }
                    }}
                  />
                </div>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    {shopName}
                  </h1>
                  <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#333", marginTop: "2px" }}>
                    {shopTagline}
                  </div>
                  <div style={{ fontSize: "10px", marginTop: "4px", lineHeight: "1.3", color: "#222" }}>
                    {shopAddress && <div>{shopAddress}</div>}
                    <div>TEL: {shopPhone} | EMAIL: {shopEmail}</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <h2 style={{ fontSize: "28px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "2px", color: "#000" }}>
                  INVOICE
                </h2>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginTop: "4px" }}>
                  INVOICE NO. <span style={{ textDecoration: "underline" }}>{invoice.invoiceNumber}</span>
                </div>
              </div>
            </div>

            {/* Billed To & Order Details Grid Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11px", marginBottom: "12px" }}>
              <thead>
                <tr style={{ background: "#f2f2f2", borderBottom: "1px solid #000", textAlign: "left" }}>
                  <th style={{ padding: "4px 8px", width: "40%", borderRight: "1px solid #000", fontWeight: "bold" }}>BILL TO</th>
                  <th style={{ padding: "4px 8px", width: "15%", borderRight: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>CUSTOMER NO.</th>
                  <th style={{ padding: "4px 8px", width: "15%", borderRight: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>TERMS</th>
                  <th style={{ padding: "4px 8px", width: "15%", borderRight: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>INVOICE DATE</th>
                  <th style={{ padding: "4px 8px", width: "15%", fontWeight: "bold", textAlign: "center" }}>SALES PERSON</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 8px", borderRight: "1px solid #000", verticalAlign: "top" }}>
                    <div style={{ fontWeight: "bold", fontSize: "13px" }}>{invoice.customer.name}</div>
                    <div style={{ fontSize: "10px" }}>TEL: {invoice.customer.mobile}</div>
                    {invoice.customer.address && <div style={{ fontSize: "10px" }}>ADD: {invoice.customer.address}</div>}
                  </td>
                  <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top" }}>
                    #{invoice.customer.mobile.slice(-6)}
                  </td>
                  <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top", fontWeight: "bold" }}>
                    {invoice.paymentStatus} ({PAYMENT_MODE_LABELS[invoice.paymentMode] || invoice.paymentMode})
                  </td>
                  <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top" }}>
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "top" }}>
                    {invoice.createdBy?.name || "OPERATOR"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Line Items Table with Vertical Grid Borders */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "11px", marginBottom: "12px" }}>
              <thead>
                <tr style={{ background: "#f2f2f2", borderBottom: "1px solid #000" }}>
                  <th style={{ padding: "6px 8px", width: "8%", borderRight: "1px solid #000", textAlign: "center" }}>ITEM #</th>
                  <th style={{ padding: "6px 8px", width: "52%", borderRight: "1px solid #000", textAlign: "left" }}>DESCRIPTION / PARTICULARS</th>
                  <th style={{ padding: "6px 8px", width: "10%", borderRight: "1px solid #000", textAlign: "center" }}>QTY</th>
                  <th style={{ padding: "6px 8px", width: "15%", borderRight: "1px solid #000", textAlign: "right" }}>UNIT PRICE</th>
                  <th style={{ padding: "6px 8px", width: "15%", textAlign: "right" }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center" }}>
                      {(idx + 1).toString().padStart(2, "0")}
                    </td>
                    <td style={{ padding: "6px 8px", borderRight: "1px solid #000", fontWeight: "500" }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "right" }}>
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Fill minimum blank rows for authentic vintage look */}
                {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ height: "24px", borderBottom: "1px solid #eee" }}>
                    <td style={{ borderRight: "1px solid #000" }}></td>
                    <td style={{ borderRight: "1px solid #000" }}></td>
                    <td style={{ borderRight: "1px solid #000" }}></td>
                    <td style={{ borderRight: "1px solid #000" }}></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bottom Grid Section: Left Note & Term | Right Sub-Total & Totals */}
            <div style={{ display: "flex", gap: "12px", alignItems: "stretch", marginBottom: "12px" }}>
              {/* NOTE & TERM Box */}
              <div style={{ flex: 1.2, border: "1px solid #000", padding: "8px 10px", fontSize: "9px", lineHeight: "1.3" }}>
                <div style={{ fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: "3px", marginBottom: "5px" }}>
                  NOTE & TERM
                </div>
                
                {/* A. Services Section */}
                <div style={{ marginBottom: "6px" }}>
                  <strong style={{ textDecoration: "underline" }}>A. Digital & Online Services:</strong>
                  <ol style={{ paddingLeft: "14px", margin: "2px 0 0 0" }}>
                    <li>Govt portal timeline & approvals depend on department verification.</li>
                    <li>Govt fees & portal charges are strictly non-refundable once submitted.</li>
                    <li>Customer is responsible for providing accurate documents & information.</li>
                  </ol>
                </div>

                {/* B. Inventory Section */}
                <div>
                  <strong style={{ textDecoration: "underline" }}>B. Goods & Inventory Sales:</strong>
                  <ol style={{ paddingLeft: "14px", margin: "2px 0 0 0" }}>
                    <li>7 days replacement for manufacturing defects with original tax invoice bill.</li>
                    <li>Warranty claims subject to respective brand authorized service center.</li>
                    <li>Goods once sold must be inspected at counter. Physical damage not covered.</li>
                  </ol>
                </div>
              </div>

              {/* Totals Summary Box */}
              <div style={{ flex: 0.8, border: "1px solid #000", padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>SUB-TOTAL:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#c00" }}>
                    <span>DISCOUNT:</span>
                    <span>- ₹{invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.gst > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>GST ({invoice.gst}%):</span>
                    <span>₹{((invoice.subtotal * invoice.gst) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "4px 0", margin: "4px 0", fontWeight: "900", fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
                  <span>TOTAL:</span>
                  <span>₹{invoice.total.toFixed(2)}</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                  <span>AMOUNT PAID:</span>
                  <span style={{ fontWeight: "bold" }}>₹{(invoice.amountPaid || 0).toFixed(2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px", fontWeight: "bold", color: (invoice.total - (invoice.amountPaid || 0)) > 0 ? "#cc0000" : "#008000" }}>
                  <span>BALANCE DUE:</span>
                  <span>₹{Math.max(0, invoice.total - (invoice.amountPaid || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer & Signature */}
            <div style={{ borderTop: "1px solid #000", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <QRCodeSVG value={upiLink} size={50} />
                <div style={{ fontSize: "9px" }}>
                  <div style={{ fontWeight: "bold" }}>SCAN TO PAY VIA UPI</div>
                  <div>GPay, PhonePe, Paytm</div>
                  <div style={{ fontFamily: "monospace", fontSize: "9px" }}>{upiId}</div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Brush Script MT', 'cursive', cursive", fontSize: "22px", fontWeight: "bold" }}>
                  Thank You
                </div>
                <div style={{ fontSize: "9px", borderTop: "1px solid #000", paddingTop: "2px", width: "140px", textAlign: "center" }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "8px", color: "#555", marginTop: "8px" }}>
              Please retain this invoice for your records. This is a computer-generated invoice.
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /*  MODERN EXECUTIVE INVOICE TEMPLATE                                         */
          /* ========================================================================= */
          <div
            className="invoice-print-card glass-card p-8 bg-white border text-slate-900"
            style={{ background: "#ffffff", borderColor: "var(--border-primary)" }}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4 flex-wrap pb-6 border-b-2 border-slate-200">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white border border-slate-200 shadow-sm">
                    <img src="/logo.png" alt="RA" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-2xl tracking-tight text-slate-900">{shopName}</h2>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mt-0.5">{shopTagline}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  {shopAddress && <p className="flex items-center gap-1.5"><MapPin size={12} /> {shopAddress}</p>}
                  {shopPhone && <p className="flex items-center gap-1.5"><Phone size={12} /> {shopPhone}</p>}
                  {shopEmail && <p className="flex items-center gap-1.5"><Mail size={12} /> {shopEmail}</p>}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 bg-blue-50 text-blue-600">
                  Tax Invoice
                </div>
                <div className="font-mono font-bold text-lg text-slate-900">#{invoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500 mt-1">Date: {formatDate(invoice.createdAt)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Operator: {invoice.createdBy?.name || "—"}</div>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To</div>
                <div className="font-bold text-base text-slate-900">{invoice.customer.name}</div>
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-1"><Phone size={11} /> {invoice.customer.mobile}</div>
                {invoice.customer.address && <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5"><MapPin size={11} /> {invoice.customer.address}</div>}
              </div>
              <div className="sm:text-right text-xs space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Details</div>
                <div><span className="text-slate-500">Mode: </span><span className="font-semibold text-slate-900">{PAYMENT_MODE_LABELS[invoice.paymentMode] || invoice.paymentMode}</span></div>
                <div><span className="text-slate-500">Status: </span><span className="font-semibold text-blue-600">{invoice.paymentStatus}</span></div>
                <div><span className="text-slate-500">UPI ID: </span><span className="font-mono font-semibold text-blue-600">{upiId}</span></div>
              </div>
            </div>

            {/* Items Table */}
            <div className="my-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[45%]">Description</th>
                    <th className="pb-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16">Qty</th>
                    <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-28">Unit Price</th>
                    <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-dashed border-slate-200">
                      <td className="py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">₹{item.price.toLocaleString("en-IN")}</td>
                      <td className="py-3 text-right font-semibold text-slate-900">₹{item.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 items-end">
              <div className="flex gap-4 items-center p-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/50">
                <QRCodeSVG value={upiLink} size={76} />
                <div>
                  <div className="text-xs font-bold text-slate-900">Scan to Pay (UPI)</div>
                  <p className="text-[10px] text-slate-500">GPay, PhonePe, Paytm se scan karein</p>
                  <div className="text-[10px] font-mono font-bold text-blue-600 mt-1">{upiId}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{invoice.subtotal.toLocaleString("en-IN")}</span></div>
                {invoice.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount:</span><span>- ₹{invoice.discount.toLocaleString("en-IN")}</span></div>}
                {invoice.gst > 0 && <div className="flex justify-between"><span>GST ({invoice.gst}%):</span><span>₹{Math.round((invoice.subtotal * invoice.gst) / 100).toLocaleString("en-IN")}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2 text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">₹{invoice.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-semibold mt-1"><span>Amount Paid:</span><span className="text-emerald-600">₹{(invoice.amountPaid || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between font-bold text-red-500 mt-1"><span>Balance Due:</span><span>₹{Math.max(0, invoice.total - (invoice.amountPaid || 0)).toLocaleString("en-IN")}</span></div>
              </div>
            </div>

            {/* Separate Terms Section */}
            <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-2">
              <div className="font-bold uppercase tracking-wider text-slate-600">Terms & Conditions</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong className="text-slate-800">1. Digital & Cyber Services:</strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 mt-0.5">
                    <li>Govt application processing depends on department portals.</li>
                    <li>Govt fees & portal charges are non-refundable after submission.</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-slate-800">2. Goods & Products:</strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 mt-0.5">
                    <li>7 days replacement for manufacturing defect with original bill.</li>
                    <li>Warranty claims handled by respective brand service center.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 mt-6 border-t border-slate-200 text-[10px] text-slate-400">
              <p className="font-semibold">Thank you for choosing {shopName}!</p>
              <p className="mt-0.5">Please retain this invoice for your records. This is a computer-generated invoice.</p>
            </div>
          </div>
        )}
      </div>

      <SettleModal 
        isOpen={!!settleInvoiceData}
        onClose={() => setSettleInvoiceData(null)}
        invoice={settleInvoiceData}
        onSuccess={async () => {
          toast.success("Payment settled successfully");
          const inv = await fetch(`/api/invoices/${invoice.id}`).then(r => r.json());
          setInvoice(inv);
        }}
      />
    </div>
  );
}
