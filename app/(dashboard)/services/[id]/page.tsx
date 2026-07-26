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
      <div className="bg-[#d4d0c8] min-h-screen text-black font-sans text-xs p-2 no-print border-t border-l border-white border-b border-r border-black shadow-[2px_2px_0px_#000]">
        
        {/* Top Header Bar */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Link href="/services" className="bg-[#d4d0c8] p-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex gap-2">
              <span className="font-bold border border-black bg-[#d4d0c8] px-1 uppercase tracking-tighter">REF: #{service.id.slice(-6).toUpperCase()}</span>
              <span className="font-bold border border-black bg-[#d4d0c8] px-1 uppercase tracking-tighter">{formatDate(service.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handlePrintToken} className="bg-[#d4d0c8] px-2 py-1 flex items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
              <Printer size={14} /> Print Slip
            </button>
            <button onClick={handleGenerateInvoice} disabled={isGeneratingInvoice} className="bg-[#d4d0c8] px-2 py-1 flex items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
              <FileText size={14} /> 1-Click Invoice
            </button>
          </div>
        </div>

        {/* Title Area */}
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">{service.serviceType} / Status</h1>
        <div className="flex gap-2 mb-2">
          <span className="font-bold border border-black bg-[#d4d0c8] px-1 flex items-center gap-1"><span className="w-2 h-2 bg-black inline-block"></span>{STATUS_LABELS[service.status] || service.status}</span>
          <span className="font-bold border border-black bg-[#d4d0c8] px-1 flex items-center gap-1"><span className="w-2 h-2 bg-black inline-block"></span>{service.paymentStatus}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-0 border-t-2 border-gray-400 pt-2">
          
          {/* Left Sidebar */}
          <div className="md:border-r-2 md:border-gray-400 p-2 space-y-4">
            
            {/* Customer Details */}
            <div>
              <h2 className="text-[#89a2cc] font-black uppercase text-sm mb-1 tracking-tight">CUSTOMER DETAILS</h2>
              <Link href={`/customers/${service.customer.id}`} className="text-[#3b5998] font-bold text-lg hover:underline block leading-tight">
                {service.customer.name.toUpperCase()}
              </Link>
              <div className="text-gray-600 flex items-center gap-1 mt-1">
                <Phone size={12} /> {service.customer.mobile}
              </div>
              
              <button onClick={handleSendWhatsApp} className="mt-2 w-full bg-[#d4d0c8] px-2 py-1 flex justify-center items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black">
                <MessageCircle size={14} /> WhatsApp Update
              </button>
            </div>

            {/* Profit Margin */}
            <div className="bg-[#e6f4ea] border border-black p-2 relative">
              <h2 className="text-[#2e7d32] font-black uppercase text-xs mb-2 flex items-center gap-1 tracking-tight">
                <IndianRupee size={12} className="border border-black p-0.5" /> PROFIT MARGIN
              </h2>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#2e7d32]">Customer Fees:</span>
                <span className="font-bold border border-black px-1 bg-white">₹{fees || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[#2e7d32]">Vendor/Govt Cost:</span>
                <span className="font-bold border border-black px-1 bg-white">-₹{vendorCost || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-[#dcfce7] -mx-2 -mb-2 p-2 border-t border-black">
                <span className="font-black text-[#2e7d32] uppercase">EST. PROFIT</span>
                <span className="font-black text-xl border border-black px-1 bg-white tracking-tighter">₹{(Number(fees) || 0) - (Number(vendorCost) || 0)}</span>
              </div>
            </div>

            {/* Customer Tracking */}
            {service.trackingId && (
              <div>
                <h2 className="text-[#89a2cc] font-black uppercase text-xs mb-1 tracking-tight">CUSTOMER TRACKING</h2>
                <div className="text-sm">Tracking ID: <span className="text-blue-600 font-bold">{service.trackingId}</span></div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/track/${service.trackingId}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success("Link copied");
                  }} className="flex-1 bg-[#d4d0c8] px-1 py-1 flex justify-center items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                    {copied ? <Check size={12} /> : <Copy size={12} />} Copy Link
                  </button>
                  <Link href={`/track/${service.trackingId}`} target="_blank" className="flex-1 bg-[#d4d0c8] px-1 py-1 flex justify-center items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black">
                    <ExternalLink size={12} /> View Portal
                  </Link>
                </div>
              </div>
            )}
            
            {/* Action Required */}
            {status === "PENDING" && missingDocs && (
              <div>
                <h2 className="text-red-500 font-black uppercase text-xs mb-1 tracking-tight bg-[#d4d0c8] border-b border-t border-gray-400 py-0.5 flex items-center gap-1">
                  <AlertCircle size={12} className="text-red-500 fill-white" /> MISSING DOCUMENTS
                </h2>
                <button onClick={() => {
                   if (!service?.customer?.mobile) return;
                   const msg = encodeURIComponent(`Namaste ${service.customer.name},\n\nAapka service request (${service.serviceType}) abhi ruka hua hai kyunki kuch documents missing hain:\n\n*${missingDocs}*\n\nKripya jaldi bhejein taaki kaam aage badh sake.\n- RA Seva Point`);
                   window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${msg}`, '_blank');
                }} className="w-full mt-1 bg-[#d4d0c8] px-2 py-1 flex justify-center items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black">
                  <MessageCircle size={12} /> Send Auto-Reminder
                </button>
              </div>
            )}

            {/* Service Info */}
            <div>
              <h2 className="text-[#89a2cc] font-black uppercase text-xs mb-1 tracking-tight">SERVICE INFO</h2>
              <div className="flex justify-between text-[#3b5998]">
                <span>Service Fee:</span>
                <span className="font-bold font-mono text-black text-sm">₹{fees || 0}</span>
              </div>
              <div className="flex justify-between text-[#3b5998]">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase text-black">{paymentMode}</span>
              </div>
              <div className="flex justify-between text-[#3b5998]">
                <span>Assigned To:</span>
                <span className="font-bold text-black">{service.assignedTo?.name || "RA Seva Admin"}</span>
              </div>
            </div>

          </div>

          {/* Right Content */}
          <div className="p-2 md:pl-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="border border-black p-1 bg-[#d4d0c8]">
                <Settings size={18} />
              </div>
              <h2 className="text-[#1a3673] font-bold text-xl tracking-tight">Service Configuration</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-3">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Workflow Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]">
                    <option value="PENDING">Pending</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Payment Status</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]">
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Payment Mode</label>
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card / Debit</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Fees Amount (₹)</label>
                  <input type="number" value={fees} onChange={(e) => setFees(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]" />
                </div>
              </div>
              
              <div>
                <label className="font-bold text-[#1a3673] block mb-1">Required Document Checklist</label>
                <div className="grid grid-cols-2 gap-0 border-t-black border-l-black border-b-white border-r-white border-[2px] bg-white">
                  {["Aadhaar Card", "PAN Card", "Passport Photo", "Income Proof", "Caste Certificate", "Ration Card"].map((docName) => {
                    const isChecked = requiredDocs.includes(docName);
                    return (
                      <div key={docName} onClick={() => toggleDoc(docName)} className="flex items-center gap-1 p-1 border-b border-r border-[#d4d0c8] hover:bg-[#d4d0c8] cursor-pointer">
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="pointer-events-none w-3 h-3" />
                        <span>{docName}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex mt-1">
                  <input type="text" value={newDocInput} onChange={(e) => setNewDocInput(e.target.value)} placeholder="Add custom required document..." className="flex-1 bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]" onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomDoc(); } }} />
                  <button type="button" onClick={addCustomDoc} className="ml-1 bg-[#d4d0c8] px-3 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white flex items-center gap-1">
                    <Plus size={12} /> Add Doc
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Expected Deadline</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]" />
                </div>
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Govt. Ref / ARN Number</label>
                  <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. 15-digit ARN" className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]" />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1a3673] block mb-1">Assign to Vendor (Outsource)</label>
                <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]">
                  <option value="">-- No Vendor (Self) --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} {v.company ? `(${v.company})` : ""}</option>
                  ))}
                </select>
              </div>

              {vendorId && (
                <div>
                  <label className="font-bold text-[#1a3673] block mb-1">Vendor Cost (₹)</label>
                  <input type="number" value={vendorCost} onChange={(e) => setVendorCost(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none text-red-600 h-[28px]" />
                </div>
              )}

              <div>
                <label className="font-bold text-[#1a3673] mb-1 flex items-center gap-1">
                  <input type="checkbox" className="mr-1 w-3 h-3" defaultChecked />
                  Service Task Checklist
                </label>
                <div className="space-y-1 ml-4 border-l-2 border-[#d4d0c8] pl-2 py-1">
                  {tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="checkbox" checked={task.completed} onChange={() => { const newTasks = [...tasks]; newTasks[idx].completed = !newTasks[idx].completed; setTasks(newTasks); }} className="w-3 h-3" />
                      <span className={`flex-1 ${task.completed ? "line-through text-gray-500" : ""}`}>{task.title}</span>
                      <button type="button" onClick={() => setTasks(tasks.filter((_, i) => i !== idx))} className="text-red-600 font-bold px-1.5 py-0.5 border-t-white border-l-white border-b-black border-r-black border-[2px] bg-[#d4d0c8] active:border-t-black active:border-l-black active:border-b-white active:border-r-white leading-none">X</button>
                    </div>
                  ))}
                </div>
                <div className="flex mt-1">
                  <input type="text" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} placeholder="Add a new task (e.g. Scan docs)..." className="flex-1 bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none h-[28px]" onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if (newTaskInput.trim()) { setTasks([...tasks, { title: newTaskInput.trim(), completed: false }]); setNewTaskInput(""); } } }} />
                  <button type="button" onClick={() => { if (newTaskInput.trim()) { setTasks([...tasks, { title: newTaskInput.trim(), completed: false }]); setNewTaskInput(""); } }} className="ml-1 bg-[#d4d0c8] px-3 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1a3673] block mb-1">Missing Documents (If any)</label>
                <textarea value={missingDocs} onChange={(e) => setMissingDocs(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none text-red-600 font-bold" rows={2}></textarea>
              </div>

              <div>
                <label className="font-bold text-[#1a3673] block mb-1">Notes / Instructions</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-1 px-1 focus:outline-none" rows={2}></textarea>
              </div>

              <div className="flex justify-between items-center pt-2 mt-4 border-t-2 border-gray-400">
                <button type="button" onClick={handleDelete} disabled={deleting} className="bg-[#d4d0c8] text-red-600 px-4 py-1 flex items-center gap-1 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
                </button>
                <button type="submit" disabled={saving} className="bg-[#d4d0c8] px-6 py-1 flex items-center gap-1 font-black border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Updates
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
