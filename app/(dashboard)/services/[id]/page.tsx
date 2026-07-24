"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, MessageCircle, Save, Trash2, Printer, Plus,
  Phone, User, Calendar, IndianRupee, FileText, CheckCircle, Clock, XCircle, CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate, SERVICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [status, setStatus] = useState("PENDING");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [fees, setFees] = useState<number | "">(0);
  const [notes, setNotes] = useState("");
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [newDocInput, setNewDocInput] = useState("");

  const fetchService = async () => {
    try {
      const res = await fetch(`/api/services/${resolvedParams.id}`);
      if (!res.ok) throw new Error("Service request not found");
      const data = await res.json();
      setService(data);
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
      setPaymentMode(data.paymentMode);
      setFees(data.fees);
      setNotes(data.notes || "");
      setRequiredDocs(data.requiredDocs || ["Aadhaar Card", "Passport Photo"]);
    } catch (err: any) {
      toast.error(err.message);
      router.push("/services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [resolvedParams.id]);

  const handleUpdate = async (e: React.FormEvent) => {
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
          fees: Number(fees) || 0,
          notes,
          requiredDocs,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service status");
      toast.success("Service updated successfully!");
      fetchService();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this service record?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${resolvedParams.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service");
      toast.success("Service record deleted");
      router.push("/services");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!service || !service.customer?.mobile) return;
    const msg = encodeURIComponent(
      `Hello ${service.customer.name},\n\nUpdate on your service request for *${service.serviceType}*:\nStatus: *${STATUS_LABELS[status] || status}*\nPayment: *${paymentStatus}*\nRef No: #${service.id.slice(-6).toUpperCase()}\n\nThank you,\nRA Seva Point`
    );
    window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${msg}`, '_blank');
  };

  const handlePrintToken = () => {
    window.print();
  };

  const toggleDoc = (docName: string) => {
    if (requiredDocs.includes(docName)) {
      setRequiredDocs(requiredDocs.filter((d) => d !== docName));
    } else {
      setRequiredDocs([...requiredDocs, docName]);
    }
  };

  const addCustomDoc = () => {
    if (!newDocInput.trim()) return;
    if (!requiredDocs.includes(newDocInput.trim())) {
      setRequiredDocs([...requiredDocs, newDocInput.trim()]);
    }
    setNewDocInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Printable Service Token Slip (Hidden on screen, visible on print) */}
      <div className="hidden print:block text-black font-mono p-6 border-2 border-black max-w-lg mx-auto">
        <div className="text-center pb-2 border-b-2 border-black mb-3">
          <h2 className="text-xl font-bold uppercase">RA SEVA POINT</h2>
          <p className="text-xs">Service Application Acknowledgment Slip</p>
        </div>
        <div className="text-xs space-y-1 mb-3">
          <div className="flex justify-between">
            <span><strong>Token Ref:</strong> #{service.id.slice(-6).toUpperCase()}</span>
            <span><strong>Date:</strong> {formatDate(service.createdAt)}</span>
          </div>
          <div><strong>Customer Name:</strong> {service.customer.name}</div>
          <div><strong>Mobile No:</strong> {service.customer.mobile}</div>
          <div><strong>Service Application:</strong> {service.serviceType}</div>
          <div className="flex justify-between">
            <span><strong>Fees:</strong> {formatCurrency(service.fees)}</span>
            <span><strong>Payment:</strong> {service.paymentStatus}</span>
          </div>
        </div>

        {requiredDocs.length > 0 && (
          <div className="border-t border-black pt-2 mb-3 text-xs">
            <strong className="block mb-1">Required Documents Checklist:</strong>
            <div className="grid grid-cols-2 gap-1">
              {requiredDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="font-bold">[✓]</span> {doc}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-black pt-2 text-[10px] text-center">
          <p>Please keep this token slip for tracking your application status.</p>
          <p className="font-bold mt-1">Thank you for visiting RA Seva Point!</p>
        </div>
      </div>

      {/* Screen Header (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/services" className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{service.serviceType}</h1>
            <p className="page-subtitle">Service Ref: #{service.id.slice(-6).toUpperCase()} • Registered {formatDate(service.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintToken}
            className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
            title="Print Customer Acknowledgment Slip"
          >
            <Printer size={14} />
            Print Token Slip
          </button>
          <span className={`badge ${SERVICE_STATUS_COLORS[service.status]} text-sm px-3 py-1`}>
            {STATUS_LABELS[service.status] || service.status}
          </span>
          <span className={`badge ${PAYMENT_STATUS_COLORS[service.paymentStatus]} text-sm px-3 py-1`}>
            {service.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Customer & Details */}
        <div className="md:col-span-1 space-y-4">
          {/* Customer Info Card */}
          <div className="glass-card p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</div>
            
            <div>
              <Link href={`/customers/${service.customer.id}`} className="font-bold text-base hover:underline text-blue-600">
                {service.customer.name}
              </Link>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Phone size={12} />
                {service.customer.mobile}
              </div>
              {service.customer.email && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {service.customer.email}
                </div>
              )}
              {service.customer.address && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {service.customer.address}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full btn-secondary py-1.5 text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ color: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.1)", borderColor: "rgba(22, 163, 74, 0.2)" }}
              >
                <MessageCircle size={14} />
                WhatsApp Update
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="glass-card p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Info</div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Service Fee:</span>
              <span className="font-bold text-slate-900">{formatCurrency(service.fees)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-800">{service.paymentMode}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Assigned To:</span>
              <span className="font-semibold text-slate-800">{service.assignedTo?.name || "Unassigned"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Status Update Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdate} className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Update Service Status</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Workflow Status</label>
                <select
                  className="input-field w-full"
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
                <label className="label">Payment Status</label>
                <select
                  className="input-field w-full"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="input-field w-full"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card / Debit</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label className="label">Fees Amount (₹)</label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={fees}
                  onChange={(e) => setFees(e.target.value === "" ? "" : parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="label">Required Document Checklist</label>
              <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {["Aadhaar Card", "PAN Card", "Passport Photo", "Income Proof", "Caste Certificate", "Ration Card"].map((docName) => {
                  const isChecked = requiredDocs.includes(docName);
                  return (
                    <div
                      key={docName}
                      onClick={() => toggleDoc(docName)}
                      className={`flex items-center gap-2 text-xs p-2 rounded cursor-pointer transition-colors ${isChecked ? "bg-blue-50 text-blue-800 font-bold border border-blue-200" : "bg-white text-slate-700 border border-slate-200"}`}
                    >
                      {isChecked ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-slate-400" />}
                      <span>{docName}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field text-xs flex-1"
                  placeholder="Add custom required document..."
                  value={newDocInput}
                  onChange={(e) => setNewDocInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomDoc();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomDoc}
                  className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Doc
                </button>
              </div>
            </div>

            <div>
              <label className="label">Notes / Instructions</label>
              <textarea
                className="input-field w-full"
                rows={3}
                placeholder="Enter notes, portal details, or application reference numbers..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger px-3 py-1.5 flex items-center gap-1.5 text-xs"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Record
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-5 py-2 flex items-center gap-2 font-bold"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Updates"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
