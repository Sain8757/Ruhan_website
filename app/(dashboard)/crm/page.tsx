"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Bell, Send, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

interface PendingService {
  id: string;
  serviceType: string;
  fees: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    mobile: string;
  };
}

export default function CrmPage() {
  const toast = useToast();
  const [pending, setPending] = useState<PendingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services?status=PENDING")
      .then((res) => res.json())
      .then((data) => {
        setPending(data.services || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback mock data if API not connected
        setPending([
          { id: "1", serviceType: "Aadhaar Card Update", fees: 150, createdAt: new Date().toISOString(), customer: { id: "1", name: "Rajesh Kumar", mobile: "9876543210" } },
          { id: "2", serviceType: "PAN Card Application", fees: 120, createdAt: new Date().toISOString(), customer: { id: "2", name: "Sunita Devi", mobile: "9765432109" } },
        ]);
        setLoading(false);
      });
  }, []);

  const sendWhatsAppReminder = (item: PendingService) => {
    const message = `Hello ${item.customer.name},\nThis is a friendly reminder from *RA Seva Point* regarding your pending service: *${item.serviceType}*.\nTotal Fees: ₹${item.fees}.\nPlease visit our shop to complete it.\nThank you!`;
    const url = `https://wa.me/91${item.customer.mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast.success("WhatsApp web interface opened!");
  };

  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="CRM & Reminders"
        subtitle="Send WhatsApp/SMS follow-up reminders to customers directly"
      />

      <div className="content-grid">
        {/* Pending follow-ups list */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="section-title flex items-center gap-2 mb-0">
            <Bell size={18} className="text-blue-500" />
            Awaiting Follow-ups
          </h2>
          <p className="text-xs text-slate-400 mt-1">Customers with pending services who need follow-ups</p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              No pending services require reminders.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border"
                  style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}
                >
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      {item.customer.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Service: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.serviceType}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Fees: <span className="font-bold">₹{item.fees}</span> · Registered: {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => sendWhatsAppReminder(item)}
                      className="btn-primary py-2 px-3 flex items-center gap-1.5 text-xs"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageSquare size={14} />
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates Panel */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Send size={18} className="text-blue-500" />
            Reminder Templates
          </h2>
          
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border-secondary)" }}>
              <span className="font-bold text-slate-600 dark:text-slate-300">Template 1: Pending Work</span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                "Hello [Name], reminder from RA Seva Point regarding [Service]. Please visit us to submit details. Thanks!"
              </p>
            </div>

            <div className="p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border-secondary)" }}>
              <span className="font-bold text-slate-600 dark:text-slate-300">Template 2: Payment Pending</span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                "Hello [Name], invoice for [Service] is pending payment of ₹[Fees]. Pay via UPI/Cash at RA Seva Point. Thanks!"
              </p>
            </div>

            <div className="p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border-secondary)" }}>
              <span className="font-bold text-slate-600 dark:text-slate-300">Template 3: Ready for Delivery</span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                "Hello [Name], your document for [Service] is approved & ready for collection at RA Seva Point. Thanks!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
