"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Search, BookOpen, AlertTriangle, Phone, IndianRupee, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";

interface LedgerItem {
  id: string;
  type: "INVOICE" | "SERVICE";
  number: string;
  total: number;
  paid: number;
  due: number;
  date: string;
  dueDate: string | null;
  status: string;
}

interface UdhaarCustomer {
  customer: {
    id: string;
    name: string;
    mobile: string;
  };
  totalDue: number;
  totalBilled: number;
  invoiceCount: number;
  serviceCount: number;
  items: LedgerItem[];
}

export default function UdhaarLedgerPage() {
  const [customers, setCustomers] = useState<UdhaarCustomer[]>([]);
  const [totalUdhaar, setTotalUdhaar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toast = useToast();

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/udhaar");
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalUdhaar(data.totalDue || 0);
    } catch {
      toast.error("Failed to load Udhaar ledger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const filteredCustomers = customers.filter(c => 
    c.customer.name.toLowerCase().includes(query.toLowerCase()) || 
    c.customer.mobile.includes(query)
  );

  const sendWhatsAppReminder = (c: UdhaarCustomer) => {
    const msg = `Namaste ${c.customer.name} ji! 🙏\n\nRA Seva Point se aapka total pending due (udhaar) *${formatCurrency(c.totalDue)}* baaki hai.\n\nKripya ise jald se jald cash ya UPI dwara bhugtan karein.\n\nDhanyawad! 📱`;
    window.open(`https://wa.me/91${c.customer.mobile}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="legacy-page flex flex-col h-full">
      <PageHeader 
        title="Udhaar Ledger" 
        subtitle="Customer-wise pending dues tracking" 
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-4 mt-4">
        {/* Total Udhaar Banner */}
        <div 
          className="flex-1 flex flex-col justify-center px-6 py-4"
          style={{ 
            background: "#800000", 
            color: "white",
            borderTop: "2px solid #ff8080",
            borderLeft: "2px solid #ff8080",
            borderRight: "2px solid #400000",
            borderBottom: "2px solid #400000",
            boxShadow: "2px 2px 4px rgba(0,0,0,0.5)"
          }}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-[#ffb3b3] mb-1">
            Total Market Udhaar
          </div>
          <div className="text-3xl font-black tracking-tight" style={{ textShadow: "1px 1px 2px black" }}>
            {formatCurrency(totalUdhaar)}
          </div>
        </div>

        <div className="legacy-window sm:w-80 flex-shrink-0" style={{ padding: "6px" }}>
          <div className="flex items-center bg-white border-2 border-gray-400 border-t-black border-l-black h-8 px-2">
            <Search size={14} className="text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search Customer / Mobile..." 
              className="flex-1 text-sm bg-transparent outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="legacy-window flex-1 flex flex-col overflow-hidden">
        <div className="legacy-window-titlebar">
          <div className="title-text">
            <span>Customer Pending Dues</span>
          </div>
          <div className="flex gap-1">
            <button className="legacy-btn-close" disabled>_</button>
            <button className="legacy-btn-close" disabled>◻</button>
            <button className="legacy-btn-close" disabled>×</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white p-2" style={{ border: "2px inset #dfdfdf" }}>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              No Udhaar records found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((c, i) => (
                <div 
                  key={c.customer.id} 
                  style={{
                    border: "2px solid #dfdfdf",
                    borderBottomColor: "#808080",
                    borderRightColor: "#808080",
                    background: expandedId === c.customer.id ? "#f5f5f5" : "#fff"
                  }}
                >
                  <div 
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-[#e6e6e6]"
                    onClick={() => setExpandedId(expandedId === c.customer.id ? null : c.customer.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-[#cc0000] text-white font-bold w-6 h-6 flex items-center justify-center text-xs shadow-sm">
                        {i + 1}
                      </div>
                      <div>
                        <Link href={`/customers/${c.customer.id}`} className="font-bold hover:underline text-[14px]">
                          {c.customer.name}
                        </Link>
                        <div className="text-[11px] text-gray-600 flex items-center gap-2 mt-0.5">
                          <span>{c.customer.mobile}</span>
                          <span>•</span>
                          <span>{c.invoiceCount} Invoices, {c.serviceCount} Services</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Due</div>
                        <div className="text-lg font-black text-[#cc0000] tracking-tight">{formatCurrency(c.totalDue)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="legacy-button flex items-center gap-1"
                          onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(c); }}
                          title="Send WhatsApp Reminder"
                          style={{ padding: "4px 8px" }}
                        >
                          <Phone size={12} color="#25D366" /> <span className="text-[11px]">Remind</span>
                        </button>
                        <Link 
                          href={`/billing?q=${c.customer.mobile}`}
                          className="legacy-button flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          title="Settle Dues in Billing"
                          style={{ padding: "4px 8px", textDecoration: "none", color: "inherit" }}
                        >
                          <IndianRupee size={12} color="#000080" /> <span className="text-[11px]">Settle</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {expandedId === c.customer.id && (
                    <div className="bg-white p-3 border-t-2 border-[#dfdfdf]">
                      <table className="legacy-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Balance Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                            <tr key={item.id}>
                              <td>{formatDate(item.date)}</td>
                              <td>
                                <span className={`px-1 text-[10px] font-bold ${item.type === 'INVOICE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="font-medium">{item.number}</td>
                              <td>{formatCurrency(item.total)}</td>
                              <td>{formatCurrency(item.paid)}</td>
                              <td className="font-bold text-[#cc0000]">{formatCurrency(item.due)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
