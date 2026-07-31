"use client";

import { useState } from "react";
import { MessageCircle, X, Copy, Check, FileDown } from "lucide-react";
import { InvoiceReceiptData, generateWhatsAppMessage, openWhatsAppReceipt } from "@/lib/whatsappReceipt";
import { useToast } from "@/contexts/ToastContext";

interface WhatsAppReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceReceiptData;
}

export default function WhatsAppReceiptModal({ isOpen, onClose, invoice }: WhatsAppReceiptModalProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const whatsappMsg = generateWhatsAppMessage(invoice);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMsg);
    setCopied(true);
    toast.success("WhatsApp receipt message copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    openWhatsAppReceipt(invoice);
    toast.success("Opening WhatsApp chat...");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <MessageCircle size={22} className="text-white animate-bounce" />
            <span>Send WhatsApp Receipt</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
            <div>
              <p className="text-slate-500">Invoice #{invoice.invoiceNumber}</p>
              <p className="text-slate-900 font-extrabold text-sm">{invoice.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-700 font-black text-base">₹{invoice.total.toLocaleString("en-IN")}</p>
              <p className="text-slate-500 font-semibold">{invoice.customerMobile}</p>
            </div>
          </div>

          {/* Chat Preview */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <p className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
              💬 Message Preview:
            </p>
            <pre className="text-[11px] font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto p-2.5 bg-white rounded-lg border border-emerald-100 shadow-xs">
              {whatsappMsg}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Text"}
          </button>

          <button
            onClick={handleSend}
            style={{
              backgroundColor: "#25D366",
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)",
            }}
            className="flex-1 py-2.5 px-4 text-white hover:brightness-105 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <MessageCircle size={18} />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
