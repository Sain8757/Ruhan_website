"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, FileText } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("PENDING");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/services/${resolvedParams.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Service not found");
        return res.json();
      })
      .then((data) => {
        setService(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setPaymentMode(data.paymentMode);
        setNotes(data.notes || "");
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        router.push("/services");
      });
  }, [resolvedParams.id, router, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          paymentMode,
          notes,
          fees: service.fees,
          requiredDocs: service.requiredDocs,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service updated successfully!");
      router.push("/services");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  return (
    <div className="page-shell page-shell-detail">
      <PageHeader
        title="Service Details"
        subtitle="Manage workflow status and details"
        backHref="/services"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Service Info */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-blue-500" />
              <h2 className="section-title mb-0">Service Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Service Type</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{service.serviceType}</p>
              </div>
              <div>
                <span className="text-slate-400">Fees</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formatCurrency(service.fees)}</p>
              </div>
              <div>
                <span className="text-slate-400">Created At</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formatDate(service.createdAt)}</p>
              </div>
              <div>
                <span className="text-slate-400">Assigned Operator</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{service.assignedTo?.name || "None"}</p>
              </div>
            </div>
          </div>

          {/* Customer Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-500" />
              <h2 className="section-title mb-0">Customer Contact</h2>
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {service.customer.name}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Mobile: {service.customer.mobile}
              </p>
              {service.customer.email && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Email: {service.customer.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status / Editor Form */}
        <div>
          <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
            <h2 className="section-title">Update Status</h2>

            <div>
              <label className="label">Workflow Status</label>
              <select
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PROCESSING">Processing</option>
                <option value="APPROVED">Approved</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="label">Payment Mode</label>
              <select
                className="input-field"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div>
              <label className="label">Payment Status</label>
              <select
                className="input-field"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <div>
              <label className="label">Service Notes</label>
              <textarea
                className="input-field resize-none text-xs"
                placeholder="Workflow details or updates..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Status</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
