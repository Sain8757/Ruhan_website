"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, MessageCircle, Save, Trash2, Printer, Plus,
  Phone, User, Calendar, IndianRupee, FileText, CheckCircle, Clock, XCircle, CheckSquare, Square,
  ExternalLink, Copy, AlertCircle, Check, Settings
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

  const [deadline, setDeadline] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendorCost, setVendorCost] = useState<number | "">(0);
  const [missingDocs, setMissingDocs] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Pro Max Features State
  const [tasks, setTasks] = useState<{title: string, completed: boolean}[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

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
      setDeadline(data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : "");
      setReferenceNo(data.referenceNo || "");
      setVendorId(data.vendorId || "");
      setVendorCost(data.vendorCost || 0);
      setMissingDocs(data.missingDocs || "");
      setTasks(data.tasks || []);
    } catch (err: any) {
      toast.error(err.message);
      router.push("/services");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchService();
    fetchVendors();
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
          deadline,
          referenceNo,
          vendorId,
          vendorCost: Number(vendorCost) || 0,
          missingDocs,
          tasks,
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

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: service.customer.id,
          totalAmount: Number(fees) || 0,
          paymentStatus: paymentStatus,
          paymentMode: paymentMode,
          type: "TAX_INVOICE",
          notes: `Generated for service: ${service.serviceType}`,
          items: [
            {
              serviceId: service.id,
              description: service.serviceType,
              amount: Number(fees) || 0,
            }
          ]
        })
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      const newInvoice = await res.json();
      toast.success("Invoice generated successfully!");
      router.push(`/invoices/${newInvoice.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingInvoice(false);
    }
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
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-2xl p-6 md:p-8 mb-8 text-white shadow-xl shadow-blue-900/10 no-print">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-5">
          <div className="flex items-start gap-4 w-full md:w-auto">
            <Link href="/services" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full backdrop-blur-md transition-colors text-white border border-white/10 mt-1 flex-shrink-0 shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest font-bold uppercase border border-white/10 shadow-inner">
                  Ref: #{service.id.slice(-6).toUpperCase()}
                </span>
                <span className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-white/10 shadow-inner">
                  {formatDate(service.createdAt)}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md mb-3">{service.serviceType}</h1>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md border ${
                  service.status === 'APPROVED' || service.status === 'DELIVERED' ? 'bg-green-500/30 text-green-50 border-green-400/40' :
                  service.status === 'PENDING' ? 'bg-amber-500/30 text-amber-50 border-amber-400/40' :
                  'bg-blue-400/30 text-blue-50 border-blue-300/40'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span> 
                  {STATUS_LABELS[service.status] || service.status}
                </span>
                
                <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md border ${
                  service.paymentStatus === 'PAID' ? 'bg-emerald-500/30 text-emerald-50 border-emerald-400/40' :
                  service.paymentStatus === 'PARTIAL' ? 'bg-orange-500/30 text-orange-50 border-orange-400/40' :
                  'bg-rose-500/30 text-rose-50 border-rose-400/40'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  {service.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto md:mt-1 pt-4 md:pt-0 border-t border-white/10 md:border-0">
            <button
              type="button"
              onClick={handlePrintToken}
              className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              title="Print Customer Acknowledgment Slip"
            >
              <Printer size={16} />
              Print Slip
            </button>
            
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={isGeneratingInvoice}
              className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-400/50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-70"
              title="Generate Final Invoice for this service"
            >
              {isGeneratingInvoice ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {isGeneratingInvoice ? "Working..." : "1-Click Invoice"}
            </button>
          </div>
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

          {/* Profit Tracking */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-1.5">
              <div className="p-1 bg-emerald-100 rounded text-emerald-600"><IndianRupee size={12} /></div>
              Profit Margin
            </div>
            
            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-800/80 font-semibold">Customer Fees:</span>
                <span className="font-bold text-emerald-900 bg-white/70 px-2.5 py-1 rounded-md border border-emerald-100/50 shadow-sm">{formatCurrency(Number(fees) || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-800/80 font-semibold">Vendor/Govt Cost:</span>
                <span className="font-bold text-rose-600 bg-white/70 px-2.5 py-1 rounded-md border border-rose-100/50 shadow-sm">-{formatCurrency(Number(vendorCost) || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-emerald-200/70 mt-1 pt-4">
                <span className="font-black text-emerald-900 uppercase text-xs tracking-wider">Est. Profit</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 drop-shadow-sm">
                  {formatCurrency((Number(fees) || 0) - (Number(vendorCost) || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Info */}
          {service.trackingId && (
            <div className="glass-card p-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Tracking</div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-800">Tracking ID: <span className="font-mono text-blue-600 font-bold">{service.trackingId}</span></span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/track/${service.trackingId}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast.success("Tracking link copied");
                    }}
                    className="btn-secondary text-xs flex-1 py-1.5 flex items-center justify-center gap-1"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    Copy Link
                  </button>
                  <Link 
                    href={`/track/${service.trackingId}`} 
                    target="_blank"
                    className="btn-secondary text-xs flex-1 py-1.5 flex items-center justify-center gap-1 text-blue-600 border-blue-200 bg-blue-50"
                  >
                    <ExternalLink size={14} />
                    View Portal
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Action Required: Missing Docs */}
          {status === "PENDING" && (
            <div className="glass-card p-5 space-y-3 bg-red-50 border-red-100">
              <div className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> Missing Documents
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!service?.customer?.mobile) return;
                  const docs = missingDocs || "Pending Documents";
                  const msg = encodeURIComponent(`Namaste ${service.customer.name},\n\nAapka service request (${service.serviceType}) abhi ruka hua hai kyunki kuch documents missing hain:\n\n*${docs}*\n\nKripya jaldi bhejein taaki kaam aage badh sake.\n- RA Seva Point`);
                  window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${msg}`, '_blank');
                }}
                className="w-full btn-danger py-1.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={14} /> Send Auto-Reminder
              </button>
            </div>
          )}

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
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center text-blue-600 shadow-sm">
                <Settings size={20} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Service Configuration</h2>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Expected Deadline</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">Govt. Ref / ARN Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="e.g. 15-digit ARN"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                  {referenceNo && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`https://www.google.com/search?q=track+${referenceNo}`, "_blank");
                      }}
                      className="btn-secondary px-2 py-1 text-xs"
                      title="Search / Track on Portal"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Assign to Vendor (Outsource)</label>
                <select
                  className="input-field w-full"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">-- No Vendor (Self) --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} {v.company ? `(${v.company})` : ""}</option>
                  ))}
                </select>
              </div>

              {vendorId && (
                <div>
                  <label className="label">Vendor Cost (₹)</label>
                  <input
                    type="number"
                    className="input-field w-full text-red-600"
                    placeholder="Cost paid to vendor"
                    value={vendorCost}
                    onChange={(e) => setVendorCost(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <label className="label flex items-center gap-2">
                <CheckSquare size={16} className="text-blue-600"/> 
                Service Task Checklist
              </label>
              <div className="space-y-2 mt-2">
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => {
                        const newTasks = [...tasks];
                        newTasks[idx].completed = !newTasks[idx].completed;
                        setTasks(newTasks);
                      }}
                      className="cursor-pointer"
                    />
                    <span className={`text-sm flex-1 ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {task.title}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-2 mt-2 border-t border-slate-100">
                  <input
                    type="text"
                    className="input-field text-xs flex-1"
                    placeholder="Add a new task (e.g. Scan docs)..."
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newTaskInput.trim()) {
                          setTasks([...tasks, { title: newTaskInput.trim(), completed: false }]);
                          setNewTaskInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTaskInput.trim()) {
                        setTasks([...tasks, { title: newTaskInput.trim(), completed: false }]);
                        setNewTaskInput("");
                      }
                    }}
                    className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <label className="label">Missing Documents (If any)</label>
              <textarea
                className="input-field w-full border-red-200 focus:border-red-500 bg-red-50"
                rows={2}
                placeholder="List documents customer still needs to provide..."
                value={missingDocs}
                onChange={(e) => setMissingDocs(e.target.value)}
              />
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
