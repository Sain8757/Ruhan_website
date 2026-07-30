"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Printer, Loader2, CheckCircle, Clock, XCircle,
  IndianRupee, MessageCircle, Download, Edit3, MapPin, Phone, Mail
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import SettleModal, { SettleInvoiceData } from "@/app/(dashboard)/billing/SettleModal";
import EditBillDialog from "./EditBillDialog";
import LegacyDialog from "@/components/layout/LegacyDialog";

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}

export default function InvoiceDetailsDialog({ isOpen, onClose, invoiceId }: Props) {
  const toast = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [template, setTemplate] = useState<"classic" | "modern" | "thermal">("classic");
  const [settleInvoiceData, setSettleInvoiceData] = useState<SettleInvoiceData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const invoiceCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !invoiceId) return;
    setLoading(true);
    
    Promise.all([
      fetch(`/api/invoices/${invoiceId}`).then((r) => {
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
        onClose();
      });
  }, [isOpen, invoiceId, onClose, toast]);

  if (!isOpen) return null;

  const shopName = settings?.shopName || "RA SEVA POINT";
  const shopTagline = settings?.tagline || "ONE STOP FOR BOOKS, PRINT & DIGITAL SERVICES";
  const shopAddress = settings?.shopAddress || "Front of High School, Sehaik, Amour, Purnea, Bihar - 854315";
  const shopPhone = settings?.shopPhone || "+91 7667538401";
  const shopEmail = settings?.shopEmail || "ruhanahmad2017@gmail.com";
  const upiId = settings?.upiId || "rasevapoint@upi";

  const upiLink = invoice ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${invoice.total}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}` : "";
  const paymentStyle = invoice ? (PAYMENT_STATUS_STYLES[invoice.paymentStatus] || PAYMENT_STATUS_STYLES.UNPAID) : PAYMENT_STATUS_STYLES.UNPAID;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${invoice.customer.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Invoice_${invoice.invoiceNumber}`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const element = invoiceCardRef.current;
      if (!element) throw new Error("Invoice container element not found");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const origWidth = element.style.width;
      element.style.width = "794px";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      element.style.width = origWidth;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 8;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight);
      
      const fileName = `${invoice.customer.name.replace(/[^a-zA-Z0-9 ]/g, "")}_Invoice_${invoice.invoiceNumber}.pdf`;
      pdf.save(fileName);
      toast.success("Invoice PDF downloaded successfully!");
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
      const element = invoiceCardRef.current;
      if (!element) throw new Error("Invoice element not found");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 5, 5, pdfWidth - 10, pdfHeight);
      
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
    <LegacyDialog
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? `Invoice #${invoice.invoiceNumber}` : "Loading Invoice..."}
      width="900px"
    >
      {loading || !invoice ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : (
        <div className="w-full mx-auto p-4 flex flex-col h-full bg-[#c0c0c0]">
          {/* Top Action Header — hidden on print */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 no-print border-b border-gray-400 pb-2">
            {/* Template Switcher & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex border rounded-lg overflow-hidden bg-white text-[10px] font-bold shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)] border-gray-400">
                <button
                  onClick={() => setTemplate("classic")}
                  className={`px-3 py-1 transition-colors ${template === "classic" ? "bg-[#0000aa] text-white" : "text-black hover:bg-slate-200"}`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setTemplate("modern")}
                  className={`px-3 py-1 transition-colors ${template === "modern" ? "bg-[#0000aa] text-white" : "text-black hover:bg-slate-200"}`}
                >
                  Modern
                </button>
                <button
                  onClick={() => setTemplate("thermal")}
                  className={`px-3 py-1 transition-colors ${template === "thermal" ? "bg-[#0000aa] text-white" : "text-black hover:bg-slate-200"}`}
                >
                  Thermal
                </button>
              </div>

              <div className={`flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)] text-xs font-bold ${paymentStyle.className}`}>
                {paymentStyle.icon}
                {paymentStyle.label}
              </div>
            </div>

            <div className="flex gap-2">
              {invoice.paymentStatus !== "PAID" && (
                <button
                  onClick={handleSettleInvoice}
                  className="bg-[#c0c0c0] px-3 py-1 flex items-center gap-1.5 text-xs font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white no-print"
                >
                  <IndianRupee size={12} />
                  Settle
                </button>
              )}

              <button
                onClick={() => setIsEditOpen(true)}
                className="bg-[#c0c0c0] px-3 py-1 flex items-center gap-1.5 text-xs font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white no-print"
              >
                <Edit3 size={12} />
                Edit
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="bg-[#c0c0c0] px-3 py-1 flex items-center gap-1.5 text-xs font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              >
                {isGeneratingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Save PDF
              </button>

              <button
                onClick={handleWhatsApp}
                disabled={isGeneratingPdf}
                className="bg-[#c0c0c0] px-3 py-1 flex items-center gap-1.5 text-xs font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              >
                {isGeneratingPdf ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                WhatsApp
              </button>

              <button onClick={handlePrint} className="bg-[#c0c0c0] px-3 py-1 flex items-center gap-1.5 text-xs font-bold border-t-white border-l-white border-b-black border-r-black border-[3px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white border-black ring-1 ring-black ring-inset shadow-[1px_1px_0px_#fff_inset]">
                <Printer size={12} />
                Print
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex justify-center">
            {template === "classic" ? (
              <div
                ref={invoiceCardRef}
                className="invoice-print-card bg-white p-6 sm:p-8 text-black shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#fff,inset_-2px_-2px_#dfdfdf,inset_2px_2px_#fff] border"
                style={{
                  width: "100%",
                  maxWidth: "794px",
                  fontFamily: "'Courier New', Courier, 'Consolas', monospace",
                  border: "2px solid #000000",
                  color: "#000000",
                  background: "#ffffff",
                  boxSizing: "border-box"
                }}
              >
                {/* Top Brand Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "60px", height: "60px", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                      <img src="/logo.png" alt="RA" style={{ maxHeight: "54px", maxWidth: "54px", objectFit: "contain" }} />
                    </div>
                    <div>
                      <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{shopName}</h1>
                      <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#333", marginTop: "2px" }}>{shopTagline}</div>
                      <div style={{ fontSize: "10px", marginTop: "4px", lineHeight: "1.3", color: "#222" }}>
                        {shopAddress && <div>{shopAddress}</div>}
                        <div>TEL: {shopPhone} | EMAIL: {shopEmail}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <h2 style={{ fontSize: "28px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "2px", color: "#000" }}>{invoice.type === "QUOTATION" ? "QUOTATION" : "INVOICE"}</h2>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginTop: "4px" }}>INVOICE NO. <span style={{ textDecoration: "underline" }}>{invoice.invoiceNumber}</span></div>
                  </div>
                </div>

                {/* Billed To & Order Details Grid Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #000", fontSize: "11px", marginBottom: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f2f2f2", borderBottom: "1.5px solid #000", textAlign: "left" }}>
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
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top" }}>#{invoice.customer.mobile.slice(-6)}</td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top", fontWeight: "bold" }}>{invoice.paymentStatus} ({PAYMENT_MODE_LABELS[invoice.paymentMode] || invoice.paymentMode})</td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center", verticalAlign: "top" }}>{formatDate(invoice.createdAt)}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "top" }}>{invoice.createdBy?.name || "OPERATOR"}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Line Items Table with Vertical Grid Borders */}
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #000", fontSize: "11px", marginBottom: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f2f2f2", borderBottom: "1.5px solid #000" }}>
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
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center" }}>{(idx + 1).toString().padStart(2, "0")}</td>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #000", fontWeight: "500" }}>{item.name}</td>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #000", textAlign: "right" }}>₹{item.price.toFixed(2)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - invoice.items.length) }).map((_, i) => (
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
                  <div style={{ flex: 1.2, border: "1.5px solid #000", padding: "8px 10px", fontSize: "9px", lineHeight: "1.3" }}>
                    <div style={{ fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", borderBottom: "1.5px solid #000", paddingBottom: "3px", marginBottom: "5px" }}>NOTE & TERM</div>
                    <div style={{ marginBottom: "6px" }}>
                      <strong style={{ textDecoration: "underline" }}>A. Digital & Online Services:</strong>
                      <ol style={{ paddingLeft: "14px", margin: "2px 0 0 0" }}>
                        <li>Govt portal timeline & approvals depend on department verification.</li>
                        <li>Govt fees & portal charges are strictly non-refundable once submitted.</li>
                        <li>Customer is responsible for providing accurate documents & information.</li>
                      </ol>
                    </div>
                    <div>
                      <strong style={{ textDecoration: "underline" }}>B. Goods & Inventory Sales:</strong>
                      <ol style={{ paddingLeft: "14px", margin: "2px 0 0 0" }}>
                        <li>7 days replacement for manufacturing defects with original tax invoice bill.</li>
                        <li>Warranty claims subject to respective brand authorized service center.</li>
                        <li>Goods once sold must be inspected at counter. Physical damage not covered.</li>
                      </ol>
                    </div>
                  </div>

                  <div style={{ flex: 0.8, border: "1.5px solid #000", padding: "8px 10px", fontSize: "11px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>SUB-TOTAL:</span><span>₹{invoice.subtotal.toFixed(2)}</span></div>
                    {invoice.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#c00" }}><span>DISCOUNT:</span><span>- ₹{invoice.discount.toFixed(2)}</span></div>}
                    {invoice.gst > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>GST ({invoice.gst}%):</span><span>₹{((invoice.subtotal * invoice.gst) / 100).toFixed(2)}</span></div>}
                    <div style={{ borderTop: "1.5px solid #000", borderBottom: "1.5px solid #000", padding: "4px 0", margin: "4px 0", fontWeight: "900", fontSize: "14px", display: "flex", justifyContent: "space-between" }}><span>TOTAL:</span><span>₹{invoice.total.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}><span>AMOUNT PAID:</span><span style={{ fontWeight: "bold" }}>₹{(invoice.amountPaid || 0).toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px", fontWeight: "bold", color: (invoice.total - (invoice.amountPaid || 0)) > 0 ? "#cc0000" : "#008000" }}><span>BALANCE DUE:</span><span>₹{Math.max(0, invoice.total - (invoice.amountPaid || 0)).toFixed(2)}</span></div>
                  </div>
                </div>

                {/* Bottom Footer & Signature */}
                <div style={{ borderTop: "1.5px solid #000", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <QRCodeSVG value={upiLink} size={50} />
                    <div style={{ fontSize: "9px" }}>
                      <div style={{ fontWeight: "bold" }}>SCAN TO PAY VIA UPI</div>
                      <div>GPay, PhonePe, Paytm</div>
                      <div style={{ fontFamily: "monospace", fontSize: "9px" }}>{upiId}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Brush Script MT', 'cursive', cursive", fontSize: "22px", fontWeight: "bold" }}>Thank You</div>
                    <div style={{ fontSize: "9px", borderTop: "1px solid #000", paddingTop: "2px", width: "140px", textAlign: "center" }}>Authorized Signatory</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: "8px", color: "#555", marginTop: "8px" }}>Please retain this invoice for your records. This is a computer-generated invoice.</div>
              </div>
            ) : template === "modern" ? (
              <div
                ref={invoiceCardRef}
                className="invoice-print-card p-8 bg-white border text-slate-900 shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#fff,inset_-2px_-2px_#dfdfdf,inset_2px_2px_#fff]"
                style={{ width: "100%", maxWidth: "794px", background: "#ffffff", borderColor: "var(--border-primary)" }}
              >
                {/* Modern layout copy */}
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
                    <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 ${invoice.type === 'QUOTATION' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {invoice.type === 'QUOTATION' ? 'Quotation / Proforma' : 'Tax Invoice'}
                    </div>
                    <div className="font-mono font-bold text-lg text-slate-900">#{invoice.invoiceNumber}</div>
                    <div className="text-xs text-slate-500 mt-1">Date: {formatDate(invoice.createdAt)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To</div>
                    <div className="font-bold text-base text-slate-900">{invoice.customer.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-1"><Phone size={11} /> {invoice.customer.mobile}</div>
                  </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 items-end">
                  <div className="flex gap-4 items-center p-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/50">
                    <QRCodeSVG value={upiLink} size={76} />
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2 text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-blue-600">₹{invoice.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={invoiceCardRef}
                className="invoice-printable-card text-black font-mono shadow-md border border-slate-300"
                style={{
                  width: "300px",
                  background: "#ffffff",
                  padding: "16px 12px",
                  boxSizing: "border-box",
                  color: "#000000",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "11px",
                }}
              >
                <div className="text-center pb-2 border-b border-black mb-2">
                  <h2 className="text-base font-bold uppercase tracking-wider">{shopName}</h2>
                </div>
                <div className="border-b border-black pb-2 mb-2 text-[10px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>INV #{invoice.invoiceNumber}</span>
                    <span>{formatDate(invoice.createdAt)}</span>
                  </div>
                </div>
                <table className="w-full text-[10px] text-left border-b border-black pb-2 mb-2">
                  <tbody>
                    {invoice.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-1 pr-1 truncate max-w-[120px]">{item.name}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right font-bold">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-0.5 text-[10px] text-right border-b border-black pb-2 mb-2">
                  <div className="flex justify-between font-bold text-xs border-t border-black pt-1 my-0.5">
                    <span>TOTAL:</span>
                    <span>₹{invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {settleInvoiceData && (
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
      )}

      {isEditOpen && (
        <EditBillDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          invoiceId={invoice.id}
          onSuccess={async () => {
            toast.success("Invoice updated successfully!");
            const inv = await fetch(`/api/invoices/${invoice.id}`).then(r => r.json());
            setInvoice(inv);
          }}
        />
      )}
    </LegacyDialog>
  );
}
