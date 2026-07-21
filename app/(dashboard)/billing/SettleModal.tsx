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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Settle Payment</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-amber-800">Invoice:</span>
              <span className="font-medium text-amber-900">#{invoice.invoiceNumber} ({invoice.customerName})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-800">Total Bill:</span>
              <span className="font-medium text-amber-900">₹{invoice.total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-800">Paid So Far:</span>
              <span className="font-medium text-amber-900">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-amber-200 flex justify-between font-bold">
              <span className="text-amber-900">Amount Due:</span>
              <span className="text-amber-900 text-lg flex items-center">
                <IndianRupee size={16} />{amountDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paying Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={amountDue}
                  step="any"
                  value={amountPaying}
                  onChange={(e) => setAmountPaying(e.target.value)}
                  className="pl-9 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <IndianRupee size={16} />}
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
