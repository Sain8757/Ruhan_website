/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, Copy, ExternalLink, MessageCircle, RefreshCw, Printer, FileText, Trash2, Check } from "lucide-react";

const COMMON_DOCS = [
  "Aadhaar Card", "PAN Card", "Passport Photo",
  "Income Proof", "Caste Certificate", "Ration Card",
  "Voter ID", "Birth Certificate", "Residence Proof",
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: "#fff3cd", color: "#856404", label: "Pending" },
  SUBMITTED:  { bg: "#cce5ff", color: "#004085", label: "Submitted" },
  PROCESSING: { bg: "#d1ecf1", color: "#0c5460", label: "Processing" },
  APPROVED:   { bg: "#d4edda", color: "#155724", label: "Approved" },
  DELIVERED:  { bg: "#c8f0c8", color: "#0a3d0a", label: "Delivered" },
  CANCELLED:  { bg: "#f8d7da", color: "#721c24", label: "Cancelled" },
};

const PAYMENT_COLORS: Record<string, { bg: string; color: string }> = {
  UNPAID:  { bg: "#f8d7da", color: "#721c24" },
  PARTIAL: { bg: "#fff3cd", color: "#856404" },
  PAID:    { bg: "#d4edda", color: "#155724" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string | null;
  onSuccess?: () => void;
}

export default function ServiceDetailsDialog({ isOpen, onClose, serviceId, onSuccess }: Props) {
  const toast = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Service data
  const [service, setService]           = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [vendors, setVendors]           = useState<any[]>([]);

  // Editable fields
  const [status, setStatus]             = useState("PENDING");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paymentMode, setPaymentMode]   = useState("PENDING");
  const [fees, setFees]                 = useState(0);
  const [notes, setNotes]               = useState("");
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [customDoc, setCustomDoc]       = useState("");
  const [deadline, setDeadline]         = useState("");
  const [referenceNo, setReferenceNo]   = useState("");
  const [vendorId, setVendorId]         = useState("");
  const [vendorCost, setVendorCost]     = useState(0);
  const [missingDocs, setMissingDocs]   = useState("");
  const [tasks, setTasks]               = useState<{ text: string; done: boolean }[]>([]);
  const [newTask, setNewTask]           = useState("");

  const loadService = () => {
    if (!isOpen || !serviceId) return;
    setLoading(true);
    fetch(`/api/services/${serviceId}`)
      .then(r => { if (!r.ok) throw new Error("Service not found"); return r.json(); })
      .then(data => {
        setService(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setPaymentMode(data.paymentMode);
        setFees(data.fees || 0);
        setNotes(data.notes || "");
        setRequiredDocs(data.requiredDocs || []);
        setDeadline(data.deadline ? new Date(data.deadline).toISOString().split("T")[0] : "");
        setReferenceNo(data.referenceNo || "");
        setVendorId(data.vendorId || "");
        setVendorCost(data.vendorCost || 0);
        setMissingDocs(data.missingDocs || "");
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setLoading(false);
      })
      .catch(err => { toast.error(err.message); onClose(); });
  };

  useEffect(() => { loadService(); }, [isOpen, serviceId]);

  // Load vendors
  useEffect(() => {
    fetch("/api/vendors").then(r => r.json()).then(d => setVendors(d.vendors || [])).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status, paymentStatus, paymentMode, fees, notes,
          requiredDocs, deadline: deadline || null, referenceNo,
          vendorId: vendorId || null, vendorCost, missingDocs, tasks,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service updated successfully!");
      if (onSuccess) onSuccess();

      // WA notification on approve/deliver
      if ((status === "APPROVED" || status === "DELIVERED") && service.status !== status) {
        if (window.confirm(`Status is now ${status}. Notify customer via WhatsApp?`)) {
          const msg = encodeURIComponent(
            `Hello ${service.customer.name},\n\nYour *${service.serviceType}* application status is now *${status}*.\n\nTracking ID: ${service.trackingId || "N/A"}\n\nThank you,\nRA Seva Point`
          );
          window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
        }
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Service deleted.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false); setConfirmDelete(false);
    }
  };

  const handleWhatsApp = () => {
    if (!service?.customer?.mobile) return;
    const msg = encodeURIComponent(
      `Hi ${service.customer.name},\n\nYour service request for *${service.serviceType}* is currently *${status}*.\n\nRef: ${service.trackingId || "N/A"}\n\n— RA Seva Point`
    );
    window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
  };

  const handleSync = async () => {
    if (!serviceId) return;
    try {
      toast.info("Connecting to Govt API...");
      const res = await fetch(`/api/services/${serviceId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setStatus(data.status);
      toast.success(data.message);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePrintSlip = () => window.print();

  const toggleDoc = (doc: string) => {
    setRequiredDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  };

  const addCustomDoc = () => {
    const d = customDoc.trim();
    if (d && !requiredDocs.includes(d)) { setRequiredDocs(prev => [...prev, d]); setCustomDoc(""); }
  };

  const addTask = () => {
    const t = newTask.trim();
    if (t) { setTasks(prev => [...prev, { text: t, done: false }]); setNewTask(""); }
  };

  const toggleTask = (i: number) =>
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));

  const profitMargin = fees - vendorCost;
  const estStatusColor = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const estPayColor = PAYMENT_COLORS[paymentStatus] || PAYMENT_COLORS.UNPAID;

  const W95: React.CSSProperties = { fontFamily: "Tahoma, MS Sans Serif, sans-serif", fontSize: "12px" };
  const raised: React.CSSProperties = { borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040" };
  const inset: React.CSSProperties = { borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff" };
  const btn: React.CSSProperties = { ...raised, background: "#d4d0c8", ...W95, padding: "3px 12px", cursor: "pointer", whiteSpace: "nowrap" };
  const input: React.CSSProperties = { ...inset, background: "white", ...W95, padding: "2px 4px", outline: "none" };
  const select: React.CSSProperties = { ...inset, background: "white", ...W95, padding: "2px 4px", outline: "none" };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={dialogRef} style={{ ...W95, background: "#d4d0c8", ...raised, width: "700px", maxWidth: "98vw", maxHeight: "96vh", display: "flex", flexDirection: "column", boxShadow: "4px 4px 20px rgba(0,0,0,0.6)" }}>

        {/* ── Title Bar ── */}
        <div style={{ background: "linear-gradient(to right, #000080, #1084d0)", color: "white", padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", fontSize: "13px" }}>
            <span>📋</span>
            {service ? `${service.serviceType} — Service Properties` : "Service Properties"}
          </div>
          <button onClick={onClose} style={{ ...raised, background: "#d4d0c8", color: "black", width: "18px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "11px", cursor: "pointer" }}>✕</button>
        </div>

        {/* ── Menu Bar ── */}
        <div style={{ background: "#d4d0c8", borderBottom: "1px solid #808080", padding: "2px 6px", display: "flex", gap: "12px", fontSize: "12px", flexShrink: 0 }}>
          {["File", "Edit", "View", "Help"].map(m => (
            <span key={m} style={{ cursor: "default", padding: "1px 4px" }} className="hover:bg-[#000080] hover:text-white">{m}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", flex: 1 }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div>Loading service data...</div>
          </div>
        ) : service ? (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

            {/* ── Sub Toolbar ── */}
            <div style={{ padding: "4px 6px", borderBottom: "1px solid #808080", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <span style={{ ...raised, padding: "1px 6px", background: "#d4d0c8", fontWeight: "bold" }}>REF: #{service.trackingId || "N/A"}</span>
                <span style={{ ...raised, padding: "1px 6px", background: "#d4d0c8" }}>{formatDate(service.createdAt)}</span>
                <span style={{ padding: "1px 8px", background: estStatusColor.bg, color: estStatusColor.color, fontWeight: "bold", border: "1px solid #999" }}>■ {estStatusColor.label}</span>
                <span style={{ padding: "1px 8px", background: estPayColor.bg, color: estPayColor.color, fontWeight: "bold", border: "1px solid #999" }}>■ {paymentStatus}</span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button type="button" onClick={handlePrintSlip} style={{ ...btn, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Printer size={12} /> Print Slip
                </button>
                <button type="button" onClick={() => window.open(`/billing/new?customerId=${service.customer.id}`, "_blank")} style={{ ...btn, display: "flex", alignItems: "center", gap: "4px", background: "#0a246a", color: "white" }}>
                  <FileText size={12} /> 1-Click Invoice
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", gap: "0" }}>

              {/* Left Panel */}
              <div style={{ width: "180px", flexShrink: 0, borderRight: "2px solid #808080", padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>

                {/* Customer Details */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "6px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px" }}>Customer Details</legend>
                  <div style={{ fontWeight: "bold", fontSize: "13px", color: "#000080", marginBottom: "2px" }}>{service.customer.name}</div>
                  <div style={{ fontSize: "11px", color: "#333" }}>📱 {service.customer.mobile}</div>
                  {service.customer.email && <div style={{ fontSize: "10px", color: "#666", marginTop: "2px", wordBreak: "break-all" }}>{service.customer.email}</div>}
                  <button type="button" onClick={handleWhatsApp} style={{ ...btn, marginTop: "6px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", background: "#25D366", color: "white" }}>
                    <MessageCircle size={12} /> WhatsApp
                  </button>
                </fieldset>

                {/* Profit Margin */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "6px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px", color: "#008000", fontWeight: "bold" }}>✦ Profit Margin</legend>
                  <table style={{ width: "100%", fontSize: "11px" }}>
                    <tbody>
                      <tr><td style={{ color: "#555" }}>Customer Fees:</td><td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(fees)}</td></tr>
                      <tr><td style={{ color: "#555" }}>Vendor Cost:</td><td style={{ textAlign: "right", color: "#cc0000", fontWeight: "bold" }}>-{formatCurrency(vendorCost)}</td></tr>
                      <tr style={{ borderTop: "1px solid #888" }}>
                        <td style={{ fontWeight: "bold" }}>Est. Profit:</td>
                        <td style={{ textAlign: "right", fontWeight: "bold", color: profitMargin >= 0 ? "#008000" : "#cc0000" }}>{formatCurrency(profitMargin)}</td>
                      </tr>
                    </tbody>
                  </table>
                </fieldset>

                {/* Tracking */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "6px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px" }}>⊞ Tracking</legend>
                  <div style={{ fontSize: "11px", color: "#555" }}>ID: <strong>{service.trackingId || "N/A"}</strong></div>
                  <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                    <button type="button" title="Copy tracking ID" onClick={() => { navigator.clipboard.writeText(service.trackingId || ""); toast.success("Copied!"); }}
                      style={{ ...btn, flex: 1, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                      <Copy size={10} /> Copy
                    </button>
                    <button type="button" title="View tracking page" onClick={() => window.open(`/track/${service.trackingId}`, "_blank")}
                      style={{ ...btn, flex: 1, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                      <ExternalLink size={10} /> View
                    </button>
                  </div>
                </fieldset>

                {/* Service Info */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "6px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px" }}>Service Info</legend>
                  <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div>Fee: <strong>{formatCurrency(service.fees)}</strong></div>
                    <div>Mode: <strong>{service.paymentMode}</strong></div>
                    <div>Assignee: <strong>{service.assignedTo?.name || "Admin"}</strong></div>
                    {service.tokenNumber && (
                      <div>Token: <strong style={{ color: "#000080" }}>T{String(service.tokenNumber).padStart(3, "0")}</strong></div>
                    )}
                  </div>
                </fieldset>
              </div>

              {/* Right Panel — Main Form */}
              <div style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>

                {/* Service Configuration */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "8px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px", color: "#000080", fontWeight: "bold" }}>⚙ Service Configuration</legend>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                        <label style={{ fontSize: "11px" }}>Workflow Status:</label>
                        <button type="button" onClick={handleSync} style={{ ...btn, fontSize: "10px", padding: "1px 5px", display: "flex", alignItems: "center", gap: "3px" }}>
                          <RefreshCw size={10} /> Sync API
                        </button>
                      </div>
                      <select style={{ ...select, width: "100%" }} value={status} onChange={e => setStatus(e.target.value)}>
                        {["PENDING","SUBMITTED","PROCESSING","APPROVED","DELIVERED","CANCELLED"].map(s =>
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Payment Status:</label>
                      <select style={{ ...select, width: "100%" }} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Payment Mode:</label>
                      <select style={{ ...select, width: "100%" }} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                        <option value="PENDING">Pending</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Fees Amount (₹):</label>
                      <input type="number" style={{ ...input, width: "100%" }} value={fees} onChange={e => setFees(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </fieldset>

                {/* Required Documents */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "8px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px" }}>Required Documents</legend>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", marginBottom: "6px" }}>
                    {COMMON_DOCS.map(doc => (
                      <label key={doc} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", cursor: "pointer" }}>
                        <input type="checkbox" checked={requiredDocs.includes(doc)} onChange={() => toggleDoc(doc)} style={{ cursor: "pointer" }} />
                        {doc}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input type="text" style={{ ...input, flex: 1 }} value={customDoc} onChange={e => setCustomDoc(e.target.value)} placeholder="Add custom doc..." onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomDoc(); }}} />
                    <button type="button" style={btn} onClick={addCustomDoc}>+ Add</button>
                  </div>
                  {requiredDocs.filter(d => !COMMON_DOCS.includes(d)).map(d => (
                    <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#e8f0ff", border: "1px solid #aac", padding: "1px 6px", fontSize: "11px", marginTop: "4px", marginRight: "4px" }}>
                      {d} <button type="button" onClick={() => setRequiredDocs(prev => prev.filter(x => x !== d))} style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontWeight: "bold", padding: 0 }}>×</button>
                    </span>
                  ))}
                </fieldset>

                {/* Deadline + Reference */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Expected Deadline:</label>
                    <input type="date" style={{ ...input, width: "100%" }} value={deadline} onChange={e => setDeadline(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Govt. Ref / ARN Number:</label>
                    <input type="text" style={{ ...input, width: "100%" }} value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="e.g. 15-digit ARN" />
                  </div>
                </div>

                {/* Vendor */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Outsource to Vendor:</label>
                    <select style={{ ...select, width: "100%" }} value={vendorId} onChange={e => setVendorId(e.target.value)}>
                      <option value="">-- No Vendor (Self) --</option>
                      {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "2px", color: vendorCost > 0 ? "#cc0000" : "#555" }}>Vendor Cost (₹):</label>
                    <input type="number" style={{ ...input, width: "100%" }} value={vendorCost} onChange={e => setVendorCost(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                {/* Service Tasks */}
                <fieldset style={{ border: "2px groove #c0c0c0", padding: "8px", margin: 0 }}>
                  <legend style={{ fontSize: "11px", padding: "0 4px" }}>Service Tasks Check</legend>
                  <div style={{ minHeight: "50px", marginBottom: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    {tasks.map((t, i) => (
                      <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", textDecoration: t.done ? "line-through" : "none", color: t.done ? "#888" : "#000" }}>
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(i)} style={{ cursor: "pointer" }} />
                        {t.text}
                        <button type="button" onClick={() => setTasks(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontSize: "13px", lineHeight: 1, marginLeft: "auto", padding: 0 }}>×</button>
                      </label>
                    ))}
                    {tasks.length === 0 && <div style={{ color: "#999", fontSize: "11px" }}>No tasks added yet.</div>}
                  </div>
                  <div style={{ display: "flex", gap: "4px", borderTop: "1px solid #c0c0c0", paddingTop: "6px" }}>
                    <input type="text" style={{ ...input, flex: 1 }} value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..." onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); }}} />
                    <button type="button" style={btn} onClick={addTask}>+ Add Task</button>
                  </div>
                </fieldset>

                {/* Missing Documents */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#cc0000", display: "block", marginBottom: "2px" }}>Missing Documents (If any):</label>
                  <textarea style={{ ...input, width: "100%", resize: "vertical", minHeight: "40px" }} value={missingDocs} onChange={e => setMissingDocs(e.target.value)} placeholder="List any missing documents here..." />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Notes / Instructions:</label>
                  <textarea style={{ ...input, width: "100%", resize: "vertical", minHeight: "50px" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions or notes..." />
                </div>

              </div>
            </div>

            {/* ── Footer Buttons ── */}
            <div style={{ borderTop: "2px solid #808080", padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <button type="button" onClick={handleDelete} disabled={deleting}
                style={{ ...btn, background: confirmDelete ? "#cc0000" : "#d4d0c8", color: confirmDelete ? "white" : "black", display: "flex", alignItems: "center", gap: "4px" }}>
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {confirmDelete ? "Confirm Delete?" : "Delete"}
              </button>

              <div style={{ display: "flex", gap: "6px" }}>
                <button type="button" onClick={() => { setConfirmDelete(false); onClose(); }} style={btn}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ ...btn, background: "#0a246a", color: "white", display: "flex", alignItems: "center", gap: "4px", padding: "3px 18px" }}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {saving ? "Saving..." : "Save Updates"}
                </button>
              </div>
            </div>

          </form>
        ) : null}
      </div>
    </div>
  );
}
