"use client";

import { useState, useEffect, use } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function LedgerPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomer(data);
        setLoading(false);
        setTimeout(() => {
          window.print();
        }, 1000);
      });
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const totalBilled = customer.invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
  const totalPaid = customer.invoices?.reduce((sum: number, inv: any) => sum + (inv.amountPaid || 0), 0) || 0;
  const totalDue = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black min-h-screen">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black uppercase tracking-wider">RA Seva Point</h1>
        <p className="text-gray-600 mt-1">Khata Ledger Statement</p>
      </div>

      <div className="flex justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold">{customer.name}</h2>
          <p>Mobile: {customer.mobile}</p>
          {customer.address && <p>Address: {customer.address}</p>}
        </div>
        <div className="text-right">
          <p><strong>Date:</strong> {formatDate(new Date().toISOString())}</p>
          <p><strong>Total Due Balance:</strong> <span className="text-red-600 font-bold text-xl">{formatCurrency(totalDue)}</span></p>
        </div>
      </div>

      <table className="w-full border-collapse border border-gray-300 mb-8 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Date</th>
            <th className="border border-gray-300 p-2 text-left">Invoice No</th>
            <th className="border border-gray-300 p-2 text-left">Description</th>
            <th className="border border-gray-300 p-2 text-right">Total Amount</th>
            <th className="border border-gray-300 p-2 text-right">Paid Amount</th>
            <th className="border border-gray-300 p-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {customer.invoices?.map((inv: any) => (
            <tr key={inv.id}>
              <td className="border border-gray-300 p-2">{formatDate(inv.createdAt)}</td>
              <td className="border border-gray-300 p-2 font-mono">{inv.id.slice(-6).toUpperCase()}</td>
              <td className="border border-gray-300 p-2">
                {inv.items?.map((item: any) => item.description).join(", ") || "Service"}
              </td>
              <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrency(inv.total)}</td>
              <td className="border border-gray-300 p-2 text-right text-green-700">{formatCurrency(inv.amountPaid)}</td>
              <td className="border border-gray-300 p-2 text-right text-red-700">
                {formatCurrency(Math.max(0, inv.total - inv.amountPaid))}
              </td>
            </tr>
          ))}
          {(!customer.invoices || customer.invoices.length === 0) && (
            <tr>
              <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-500">No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-300">
        <div>
          <p className="font-bold text-gray-700">Lifetime Billed: {formatCurrency(totalBilled)}</p>
          <p className="font-bold text-gray-700">Total Received: {formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="text-sm font-bold text-gray-500 uppercase">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
}
