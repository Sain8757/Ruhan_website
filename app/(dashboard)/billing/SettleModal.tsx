"use client";

import { useState, useEffect } from "react";
import { Loader2, X, IndianRupee } from "lucide-react";

export interface SettleInvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  amountPaid: number;
}

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SettleInvoiceData | null;
  onSuccess: () => void;
}

export default function SettleModal({ isOpen, onClose, invoice, onSuccess }: SettleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const amountDue = invoice ? invoice.total - invoice.amountPaid : 0;
  
  const [amountPaying, setAmountPaying] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("CASH");

  // Reset form when modal opens with a new invoice
  useEffect(() => {
    if (isOpen && invoice) {
      const due = invoice.total - invoice.amountPaid;
      setAmountPaying(due > 0 ? String(due) : "");
      setPaymentMode("CASH");
      setError("");
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const amount = Number(amountPaying);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount > amountDue) {
      setError(`Amount cannot exceed the due amount (₹${amountDue})`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaid: amount, paymentMode })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to settle payment");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" style={{ zIndex: 9999 }}>
      <div className="legacy-window" style={{ width: '380px', maxWidth: '100%', fontSize: '11px', color: 'black' }}>
        <div className="legacy-window-titlebar">
          <div className="title-text">
            Settle Payment
          </div>
          <button className="legacy-btn-close" type="button" onClick={onClose} title="Close">
            <X size={12} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && (
            <div style={{ padding: '6px', backgroundColor: '#fff', border: '1px solid #808080', color: 'red' }}>
              {error}
            </div>
          )}

          <div style={{ backgroundColor: '#fff', border: '1px solid #808080', padding: '8px' }}>
            <div className="flex justify-between mb-1">
              <span>Invoice:</span>
              <span className="font-bold">#{invoice.invoiceNumber} ({invoice.customerName})</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Total Bill:</span>
              <span className="font-bold">₹{invoice.total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Paid So Far:</span>
              <span className="font-bold">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 mt-1 border-t border-gray-300 flex justify-between font-bold" style={{ fontSize: '12px' }}>
              <span>Amount Due:</span>
              <span style={{ color: '#000' }}>₹{amountDue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Paying Amount <span style={{ color: 'red' }}>*</span>
            </label>
            <div className="flex items-center">
              <span className="mr-1">₹</span>
              <input
                type="number"
                required
                min="1"
                max={amountDue}
                step="any"
                value={amountPaying}
                onChange={(e) => setAmountPaying(e.target.value)}
                className="legacy-input w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Payment Mode <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              required
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="legacy-input w-full"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="legacy-button"
              style={{ minWidth: '80px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="legacy-button flex items-center gap-1 justify-center"
              style={{ minWidth: '130px', fontWeight: 'bold' }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <IndianRupee size={12} />}
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
