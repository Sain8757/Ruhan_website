"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils";

interface DailyReport {
  date: string;
  cashIn: { invoices: number; extra: number; total: number };
  cashOut: { expenses: number; vendorPayments: number; total: number };
  netCash: number;
}

export default function DailyClosingTab() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const toast = useToast();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/daily-closing?date=${date}`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        toast.error("Failed to load daily closing report");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [date, toast]);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Daily Closing Report</h2>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="input-field w-40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : report ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash In */}
          <div className="glass-card p-6 border-t-4 border-emerald-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowUpRight size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Total Cash In</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2 border-gray-100">
                <span className="text-gray-600 text-sm">From Customer Invoices</span>
                <span className="font-semibold text-gray-900">{formatCurrency(report.cashIn.invoices)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-gray-100">
                <span className="text-gray-600 text-sm">Extra Income</span>
                <span className="font-semibold text-gray-900">{formatCurrency(report.cashIn.extra)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-gray-800">Total Today</span>
                <span className="text-2xl font-black text-emerald-600">{formatCurrency(report.cashIn.total)}</span>
              </div>
            </div>
          </div>

          {/* Cash Out */}
          <div className="glass-card p-6 border-t-4 border-rose-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <ArrowDownRight size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Total Cash Out</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2 border-gray-100">
                <span className="text-gray-600 text-sm">Shop Expenses</span>
                <span className="font-semibold text-gray-900">{formatCurrency(report.cashOut.expenses)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-gray-100">
                <span className="text-gray-600 text-sm">Vendor Payments</span>
                <span className="font-semibold text-gray-900">{formatCurrency(report.cashOut.vendorPayments)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-gray-800">Total Today</span>
                <span className="text-2xl font-black text-rose-600">{formatCurrency(report.cashOut.total)}</span>
              </div>
            </div>
          </div>

          {/* Net Cash (Cash in Drawer) */}
          <div className="glass-card p-6 border-t-4 border-blue-500 bg-gradient-to-b from-white to-blue-50/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <DollarSign size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Net Cash Today</h3>
            </div>
            
            <div className="flex flex-col items-center justify-center h-[120px]">
              <span className="text-gray-500 text-sm font-medium mb-2">Expected Cash in Drawer</span>
              <span className={`text-4xl font-black ${report.netCash >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                {formatCurrency(report.netCash)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
