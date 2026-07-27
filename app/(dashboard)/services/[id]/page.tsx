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
      </div>      {/* Screen Header (Hidden on Print) */}
      <div className="bg-[#c0c0c0] min-h-screen text-black font-sans text-xs p-1 md:p-4 no-print flex justify-center">
        
        {/* Main Dialog Window */}
        <div className="border-t-white border-l-white border-b-black border-r-black border-[2px] w-full max-w-5xl bg-[#c0c0c0] shadow-[1px_1px_0px_#000]">
          
          {/* Windows 95 Title Bar */}
          <div className="bg-[#0000aa] text-white p-1 flex justify-between items-center font-bold px-2 border-b-2 border-transparent">
            <div className="flex items-center gap-2">
              <span className="capitalize text-sm">{service.serviceType} - Status</span>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/services" className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold leading-none pb-1" title="Close">x</Link>
            </div>
          </div>

          {/* Window Menu Bar (File, Edit, etc) */}
          <div className="flex gap-4 px-2 py-1 border-b border-gray-400">
            <span className="cursor-default hover:bg-[#0000aa] hover:text-white px-1"><span className="underline">F</span>ile</span>
            <span className="cursor-default hover:bg-[#0000aa] hover:text-white px-1"><span className="underline">E</span>dit</span>
            <span className="cursor-default hover:bg-[#0000aa] hover:text-white px-1"><span className="underline">V</span>iew</span>
            <span className="cursor-default hover:bg-[#0000aa] hover:text-white px-1"><span className="underline">H</span>elp</span>
          </div>

          {/* Toolbar area */}
          <div className="flex justify-between items-center p-2 border-b border-gray-400">
             <div className="flex items-center gap-3">
               <span className="border border-black bg-[#c0c0c0] px-1 shadow-[inset_1px_1px_0px_#fff,inset_-1px_-1px_0px_#888] font-bold">REF: #{service.id.slice(-6).toUpperCase()}</span>
               <span className="border border-black bg-[#c0c0c0] px-1 shadow-[inset_1px_1px_0px_#fff,inset_-1px_-1px_0px_#888] font-bold">{formatDate(service.createdAt)}</span>
             </div>
             <div className="flex gap-2">
               <button onClick={handlePrintToken} className="bg-[#c0c0c0] px-2 py-0.5 flex items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                 <Printer size={12} /> Print Slip
               </button>
               <button onClick={handleGenerateInvoice} disabled={isGeneratingInvoice} className="bg-[#c0c0c0] px-2 py-0.5 flex items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                 <FileText size={12} /> 1-Click Invoice
               </button>
             </div>
          </div>

          <div className="p-3">
            <div className="flex gap-2 mb-3">
              <span className="border border-gray-500 border-b-white border-r-white px-2 py-1 bg-[#c0c0c0] flex items-center gap-1 font-bold shadow-sm"><span className="w-2 h-2 bg-black inline-block"></span>{STATUS_LABELS[service.status] || service.status}</span>
              <span className="border border-gray-500 border-b-white border-r-white px-2 py-1 bg-[#c0c0c0] flex items-center gap-1 font-bold shadow-sm"><span className="w-2 h-2 bg-black inline-block"></span>{service.paymentStatus}</span>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4">
              
              {/* Left Column */}
              <div className="space-y-3">
                <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                  <legend className="px-1 text-[#0000aa] font-bold -ml-1">Customer Details</legend>
                  <Link href={`/customers/${service.customer.id}`} className="text-black font-bold hover:underline block leading-tight text-sm">
                    {service.customer.name.toUpperCase()}
                  </Link>
                  <div className="flex items-center gap-1 mt-1 text-gray-800">
                    <Phone size={10} /> {service.customer.mobile}
                  </div>
                  <button onClick={handleSendWhatsApp} className="mt-3 w-full bg-[#c0c0c0] py-0.5 flex justify-center items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black font-bold">
                    <MessageCircle size={12} /> WhatsApp Update
                  </button>
                </fieldset>

                <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                  <legend className="px-1 text-[#0000aa] font-bold -ml-1 flex items-center gap-1"><IndianRupee size={10} /> Profit Margin</legend>
                  <div className="flex justify-between items-center mb-1">
                    <span>Customer Fees:</span>
                    <span className="border-t-black border-l-black border-b-white border-r-white border-[2px] px-1 bg-white">₹{fees || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Vendor Cost:</span>
                    <span className="border-t-black border-l-black border-b-white border-r-white border-[2px] px-1 bg-white text-red-600">-₹{vendorCost || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-500 border-b border-white">
                    <span className="font-bold">Est. Profit:</span>
                    <span className="font-bold text-sm bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] px-1 text-[#0000aa]">₹{(Number(fees) || 0) - (Number(vendorCost) || 0)}</span>
                  </div>
                </fieldset>

                {service.trackingId && (
                  <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                    <legend className="px-1 text-[#0000aa] font-bold -ml-1">Tracking</legend>
                    <div className="mb-2">ID: <span className="font-bold text-black">{service.trackingId}</span></div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/track/${service.trackingId}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast.success("Link copied");
                      }} className="flex-1 bg-[#c0c0c0] py-0.5 flex justify-center items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                        {copied ? <Check size={10} /> : <Copy size={10} />} Copy
                      </button>
                      <Link href={`/track/${service.trackingId}`} target="_blank" className="flex-1 bg-[#c0c0c0] py-0.5 flex justify-center items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                        <ExternalLink size={10} /> View
                      </Link>
                    </div>
                  </fieldset>
                )}

                {status === "PENDING" && missingDocs && (
                  <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2 bg-[#d4d0c8]">
                    <legend className="px-1 text-red-700 font-bold -ml-1 flex items-center gap-1"><AlertCircle size={10} /> Missing Docs</legend>
                    <button onClick={() => {
                       if (!service?.customer?.mobile) return;
                       const msg = encodeURIComponent(`Namaste ${service.customer.name},\n\nAapka service request (${service.serviceType}) abhi ruka hua hai kyunki kuch documents missing hain:\n\n*${missingDocs}*\n\nKripya jaldi bhejein taaki kaam aage badh sake.\n- RA Seva Point`);
                       window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g, '').slice(-10)}?text=${msg}`, '_blank');
                    }} className="w-full mt-1 bg-[#c0c0c0] py-0.5 flex justify-center items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black font-bold">
                      <MessageCircle size={10} /> Send Reminder
                    </button>
                  </fieldset>
                )}
                
                <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                  <legend className="px-1 text-[#0000aa] font-bold -ml-1">Service Info</legend>
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span>₹{fees || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span>{paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignee:</span>
                    <span>{service.assignedTo?.name || "Admin"}</span>
                  </div>
                </fieldset>
              </div>

              {/* Right Column */}
              <div>
                <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-3 h-full">
                  <legend className="px-1 text-[#0000aa] font-bold flex items-center gap-1 mx-auto text-sm pb-1">
                    <Settings size={14} /> Service Configuration
                  </legend>
                  
                  <form onSubmit={handleUpdate} className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="mb-1 font-bold">Workflow Status:</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none">
                          <option value="PENDING">Pending</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="APPROVED">Approved</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="mb-1 font-bold">Payment Status:</label>
                        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none">
                          <option value="UNPAID">Unpaid</option>
                          <option value="PARTIAL">Partial</option>
                          <option value="PAID">Paid</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 font-bold">Payment Mode:</label>
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none">
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="CARD">Card / Debit</option>
                          <option value="PENDING">Pending</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="mb-1 font-bold">Fees Amount (₹):</label>
                        <input type="number" value={fees} onChange={(e) => setFees(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none" />
                      </div>
                    </div>

                    <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                      <legend className="px-1 text-black font-bold -ml-1">Required Documents</legend>
                      <div className="grid grid-cols-2 gap-0 border-t-black border-l-black border-b-white border-r-white border-[2px] bg-white max-h-32 overflow-y-auto p-1 mb-2">
                        {["Aadhaar Card", "PAN Card", "Passport Photo", "Income Proof", "Caste Certificate", "Ration Card"].map((docName) => {
                          const isChecked = requiredDocs.includes(docName);
                          return (
                            <div key={docName} onClick={() => toggleDoc(docName)} className="flex items-center gap-1 p-0.5 hover:bg-[#0000aa] hover:text-white cursor-pointer select-none">
                              <input type="checkbox" checked={isChecked} onChange={() => {}} className="pointer-events-none w-3 h-3" />
                              <span className="truncate">{docName}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-1">
                        <input type="text" value={newDocInput} onChange={(e) => setNewDocInput(e.target.value)} placeholder="Add custom doc..." className="flex-1 bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none" onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomDoc(); } }} />
                        <button type="button" onClick={addCustomDoc} className="bg-[#c0c0c0] px-3 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white flex items-center gap-1">
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    </fieldset>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="mb-1 font-bold">Expected Deadline:</label>
                        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none" />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="mb-1 font-bold">Govt. Ref / ARN Number:</label>
                        <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. 15-digit ARN" className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none" />
                      </div>
                    </div>

                    <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                      <legend className="px-1 text-black font-bold -ml-1">Outsource to Vendor</legend>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="mb-1">Select Vendor:</label>
                          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none">
                            <option value="">-- No Vendor (Self) --</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="mb-1 text-red-700">Vendor Cost (₹):</label>
                          <input type="number" value={vendorCost} onChange={(e) => setVendorCost(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none text-red-700 font-bold" disabled={!vendorId} />
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="border-t border-l border-gray-500 border-b border-r border-white p-2">
                      <legend className="px-1 text-black font-bold -ml-1">Service Tasks Check</legend>
                      <div className="space-y-1 bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] p-1 h-24 overflow-y-auto mb-2">
                        {tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center gap-1 hover:bg-[#0000aa] hover:text-white group p-0.5">
                            <input type="checkbox" checked={task.completed} onChange={() => { const newTasks = [...tasks]; newTasks[idx].completed = !newTasks[idx].completed; setTasks(newTasks); }} className="w-3 h-3" />
                            <span className={`flex-1 truncate ${task.completed ? "line-through text-gray-500 group-hover:text-gray-300" : ""}`}>{task.title}</span>
                            <button type="button" onClick={() => setTasks(tasks.filter((_, i) => i !== idx))} className="text-black group-hover:text-white px-1 leading-none font-bold">x</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input type="text" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} placeholder="Add a new task..." className="flex-1 bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none" onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if (newTaskInput.trim()) { setTasks([...tasks, { title: newTaskInput.trim(), completed: false }]); setNewTaskInput(""); } } }} />
                        <button type="button" onClick={() => { if (newTaskInput.trim()) { setTasks([...tasks, { title: newTaskInput.trim(), completed: false }]); setNewTaskInput(""); } }} className="bg-[#c0c0c0] px-3 font-bold border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white flex items-center gap-1">
                          <Plus size={10} /> Add Task
                        </button>
                      </div>
                    </fieldset>

                    <div className="flex flex-col">
                      <label className="mb-1 font-bold text-red-700">Missing Documents (If any):</label>
                      <textarea value={missingDocs} onChange={(e) => setMissingDocs(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none text-red-700 font-bold" rows={2}></textarea>
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-1 font-bold">Notes / Instructions:</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white border-t-black border-l-black border-b-white border-r-white border-[2px] py-0.5 px-1 focus:outline-none" rows={2}></textarea>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-4">
                      <button type="button" onClick={handleDelete} disabled={deleting} className="bg-[#c0c0c0] text-black font-bold px-4 py-1.5 flex items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                        {deleting ? <Loader2 size={12} className="animate-spin" /> : null} Delete
                      </button>
                      
                      <div className="flex gap-3">
                         <button type="button" onClick={() => window.history.back()} className="bg-[#c0c0c0] text-black font-bold px-4 py-1.5 flex items-center gap-1 border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                           Cancel
                         </button>
                         <button type="submit" disabled={saving} className="bg-[#c0c0c0] text-black font-bold px-8 py-1.5 flex items-center gap-2 border-t-white border-l-white border-b-black border-r-black border-[3px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white border-black ring-1 ring-black ring-inset shadow-[1px_1px_0px_#fff_inset]">
                           {saving ? <Loader2 size={12} className="animate-spin" /> : null} Save Updates
                         </button>
                      </div>
                    </div>

                  </form>
                </fieldset>
              </div>

            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
