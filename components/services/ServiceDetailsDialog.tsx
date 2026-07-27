/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, Copy, ExternalLink, MessageCircle, RefreshCw, Printer, FileText, Trash2, Check, User, IndianRupee, Tag, Briefcase } from "lucide-react";

const COMMON_DOCS = [
  "Aadhaar Card", "PAN Card", "Passport Photo",
  "Income Proof", "Caste Certificate", "Ration Card",
  "Voter ID", "Birth Certificate", "Residence Proof",
  "Driving Licence", "Marriage Certificate", "Death Certificate",
];

const STATUS_META: Record<string, { bg: string; color: string; border: string; label: string; dot: string }> = {
  PENDING:    { bg: "#fffde7", color: "#7c5e00", border: "#e6c200", label: "Pending",    dot: "#f0b800" },
  SUBMITTED:  { bg: "#e3f0ff", color: "#003a8c", border: "#5b9bd5", label: "Submitted",  dot: "#3b7dd8" },
  PROCESSING: { bg: "#e6f7ff", color: "#00596b", border: "#40aac2", label: "Processing", dot: "#00a0be" },
  APPROVED:   { bg: "#f0fff0", color: "#1a5c1a", border: "#52c41a", label: "Approved",   dot: "#2da32d" },
  DELIVERED:  { bg: "#d9f7be", color: "#135200", border: "#73d13d", label: "Delivered",  dot: "#389e0d" },
  CANCELLED:  { bg: "#fff1f0", color: "#820014", border: "#ff4d4f", label: "Cancelled",  dot: "#cf1322" },
};

const PAYMENT_META: Record<string, { bg: string; color: string; label: string }> = {
  UNPAID:  { bg: "#fff1f0", color: "#820014", label: "UNPAID"  },
  PARTIAL: { bg: "#fffbe6", color: "#7c5e00", label: "PARTIAL" },
  PAID:    { bg: "#f0fff0", color: "#135200", label: "PAID"    },
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

  const [service,        setService]        = useState<any>(null);
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [vendors,        setVendors]        = useState<any[]>([]);

  const [status,         setStatus]         = useState("PENDING");
  const [paymentStatus,  setPaymentStatus]  = useState("UNPAID");
  const [paymentMode,    setPaymentMode]    = useState("PENDING");
  const [fees,           setFees]           = useState(0);
  const [notes,          setNotes]          = useState("");
  const [requiredDocs,   setRequiredDocs]   = useState<string[]>([]);
  const [customDoc,      setCustomDoc]      = useState("");
  const [deadline,       setDeadline]       = useState("");
  const [referenceNo,    setReferenceNo]    = useState("");
  const [vendorId,       setVendorId]       = useState("");
  const [vendorCost,     setVendorCost]     = useState(0);
  const [missingDocs,    setMissingDocs]    = useState("");
  const [tasks,          setTasks]          = useState<{ text: string; done: boolean }[]>([]);
  const [newTask,        setNewTask]        = useState("");

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
        body: JSON.stringify({ status, paymentStatus, paymentMode, fees, notes, requiredDocs, deadline: deadline || null, referenceNo, vendorId: vendorId || null, vendorCost, missingDocs, tasks }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service updated!");
      if (onSuccess) onSuccess();
      if ((status === "APPROVED" || status === "DELIVERED") && service.status !== status) {
        if (window.confirm(`Status is ${status}. Notify customer via WhatsApp?`)) {
          const msg = encodeURIComponent(`Hello ${service.customer.name},\n\nYour *${service.serviceType}* application is now *${status}*.\nTracking ID: ${service.trackingId || "N/A"}\n\n— RA Seva Point`);
          window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`, "_blank");
        }
      }
      onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
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
    } catch (err: any) { toast.error(err.message); }
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  const handleWhatsApp = () => {
    if (!service?.customer?.mobile) return;
    const msg = encodeURIComponent(`Hi ${service.customer.name},\n\nYour *${service.serviceType}* request is currently *${status}*.\nRef: ${service.trackingId || "N/A"}\n\n— RA Seva Point`);
    window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${msg}`, "_blank");
  };

  const handleSync = async () => {
    if (!serviceId) return;
    try {
      toast.info("Connecting to Govt API...");
      const res = await fetch(`/api/services/${serviceId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setStatus(data.status); toast.success(data.message);
      if (onSuccess) onSuccess();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleDoc = (doc: string) =>
    setRequiredDocs(p => p.includes(doc) ? p.filter(d => d !== doc) : [...p, doc]);

  const addCustomDoc = () => {
    const d = customDoc.trim();
    if (d && !requiredDocs.includes(d)) { setRequiredDocs(p => [...p, d]); setCustomDoc(""); }
  };

  const addTask = () => {
    const t = newTask.trim();
    if (t) { setTasks(p => [...p, { text: t, done: false }]); setNewTask(""); }
  };

  const toggleTask = (i: number) =>
    setTasks(p => p.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));

  const profitMargin = fees - vendorCost;
  const sMeta = STATUS_META[status]  || STATUS_META.PENDING;
  const pMeta = PAYMENT_META[paymentStatus] || PAYMENT_META.UNPAID;

  // ── Style helpers ──────────────────────────────────────────────
  const F: React.CSSProperties = { fontFamily: "Tahoma, MS Sans Serif, sans-serif", fontSize: "12px" };
  const raised: React.CSSProperties = {
    borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff",
    borderRight: "2px solid #404040", borderBottom: "2px solid #404040",
  };
  const inset: React.CSSProperties = {
    borderTop: "2px solid #848484", borderLeft: "2px solid #848484",
    borderRight: "2px solid #efefef", borderBottom: "2px solid #efefef",
  };
  const groove: React.CSSProperties = { border: "2px groove #a0a0a0" };
  const btn  = (extra?: React.CSSProperties): React.CSSProperties => ({ ...F, ...raised, background: "#d4d0c8", padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px", ...extra });
  const inp  = (extra?: React.CSSProperties): React.CSSProperties => ({ ...F, ...inset, background: "white", padding: "2px 5px", outline: "none", width: "100%", ...extra });
  const sel  = (extra?: React.CSSProperties): React.CSSProperties => ({ ...F, ...inset, background: "white", padding: "2px 4px", outline: "none", width: "100%", ...extra });

  const SectionHead = ({ icon, label, color = "#000080" }: { icon: React.ReactNode; label: string; color?: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px", paddingBottom: "3px", borderBottom: `1px solid #b0b0b0` }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontWeight: "bold", fontSize: "11px", color, letterSpacing: "0.3px" }}>{label}</span>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={dialogRef} style={{ ...F, background: "#d4d0c8", ...raised, width: "760px", maxWidth: "98vw", maxHeight: "97vh", display: "flex", flexDirection: "column", boxShadow: "6px 6px 24px rgba(0,0,0,0.65)" }}>

        {/* ── TITLE BAR ── */}
        <div style={{ background: "linear-gradient(90deg,#000080 0%,#1084d0 100%)", color: "#fff", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", fontWeight: "bold", fontSize: "13px" }}>
            <Briefcase size={14} /> {service ? `${service.serviceType} — Status` : "Service Properties"}
          </div>
          <button onClick={onClose} style={{ ...raised, background: "#d4d0c8", color: "#000", width: "20px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>

        {/* ── MENU BAR ── */}
        <div style={{ background: "#d4d0c8", borderBottom: "1px solid #999", padding: "1px 6px", display: "flex", gap: "16px", fontSize: "12px", flexShrink: 0, userSelect: "none" }}>
          {["File","Edit","View","Help"].map(m => <span key={m} style={{ padding: "1px 4px", cursor: "default" }}>{m}</span>)}
        </div>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", flex: 1 }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px" }} /><div>Loading...</div>
          </div>
        ) : service ? (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

            {/* ── INFO BAR ── */}
            <div style={{ padding: "5px 8px", borderBottom: "1px solid #999", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#c8c4bc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* REF */}
                <span style={{ ...raised, padding: "2px 8px", background: "#d4d0c8", fontWeight: "bold", fontSize: "12px" }}>
                  REF: #{service.trackingId || "N/A"}
                </span>
                <span style={{ ...raised, padding: "2px 8px", background: "#d4d0c8", fontSize: "12px" }}>
                  {formatDate(service.createdAt)}
                </span>
                {/* Status pill */}
                <span style={{ padding: "2px 10px", background: sMeta.bg, color: sMeta.color, fontWeight: "bold", fontSize: "11px", border: `1px solid ${sMeta.border}`, display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: sMeta.dot, display: "inline-block", flexShrink: 0 }} />
                  {sMeta.label}
                </span>
                {/* Payment pill */}
                <span style={{ padding: "2px 10px", background: pMeta.bg, color: pMeta.color, fontWeight: "bold", fontSize: "11px", border: `1px solid ${pMeta.color}` }}>
                  ■ {pMeta.label}
                </span>
              </div>
              {/* Action buttons */}
              <div style={{ display: "flex", gap: "5px" }}>
                <button type="button" onClick={() => window.print()} style={btn()}>
                  <Printer size={12} /> Print Slip
                </button>
                <button type="button" onClick={() => window.open(`/billing?customerId=${service.customer.id}`, "_blank")}
                  style={btn({ background: "#0a246a", color: "white", borderColor: "#0a246a" })}>
                  <FileText size={12} /> 1-Click Invoice
                </button>
              </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

              {/* ── LEFT PANEL ── */}
              <div style={{ width: "200px", flexShrink: 0, borderRight: "2px solid #808080", padding: "8px 8px", overflowY: "auto", background: "#ccc8c0", display: "flex", flexDirection: "column", gap: "8px" }}>

                {/* Customer */}
                <div style={{ ...groove, padding: "7px", background: "#d4d0c8" }}>
                  <SectionHead icon={<User size={12} />} label="Customer Details" />
                  <div style={{ fontWeight: "bold", fontSize: "13px", color: "#000080", marginBottom: "3px", wordBreak: "break-word" }}>{service.customer.name}</div>
                  <div style={{ fontSize: "11px", color: "#444", marginBottom: "2px" }}>📱 {service.customer.mobile}</div>
                  {service.customer.email && <div style={{ fontSize: "10px", color: "#666", wordBreak: "break-all" }}>{service.customer.email}</div>}
                  <button type="button" onClick={handleWhatsApp}
                    style={{ ...btn({ background: "#075e54", color: "white", marginTop: "6px", width: "100%", justifyContent: "center", fontSize: "11px" }) }}>
                    <MessageCircle size={11} /> WhatsApp Update
                  </button>
                </div>

                {/* Profit Margin */}
                <div style={{ ...groove, padding: "7px", background: "#d4d0c8" }}>
                  <SectionHead icon={<IndianRupee size={12} />} label="Profit Margin" color="#006600" />
                  <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ padding: "2px 0", color: "#555" }}>Customer Fees:</td>
                          <td style={{ textAlign: "right", fontWeight: "bold" }}>₹{fees}</td></tr>
                      <tr><td style={{ padding: "2px 0", color: "#555" }}>Vendor Cost:</td>
                          <td style={{ textAlign: "right", color: "#cc0000", fontWeight: "bold" }}>-₹{vendorCost}</td></tr>
                      <tr>
                        <td colSpan={2}><div style={{ borderTop: "1px solid #aaa", margin: "3px 0" }} /></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: "bold", fontSize: "12px" }}>Est. Profit:</td>
                        <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "13px", color: profitMargin >= 0 ? "#006600" : "#cc0000" }}>₹{profitMargin}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tracking */}
                <div style={{ ...groove, padding: "7px", background: "#d4d0c8" }}>
                  <SectionHead icon={<Tag size={12} />} label="Tracking" />
                  <div style={{ fontSize: "11px", marginBottom: "5px" }}>
                    ID: <strong style={{ fontSize: "12px", letterSpacing: "1px" }}>{service.trackingId || "N/A"}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(service.trackingId || ""); toast.success("Copied!"); }}
                      style={btn({ flex: 1, justifyContent: "center", fontSize: "11px" })}>
                      <Copy size={10} /> Copy
                    </button>
                    <button type="button" onClick={() => window.open(`/track/${service.trackingId}`, "_blank")}
                      style={btn({ flex: 1, justifyContent: "center", fontSize: "11px" })}>
                      <ExternalLink size={10} /> View
                    </button>
                  </div>
                </div>

                {/* Service Info */}
                <div style={{ ...groove, padding: "7px", background: "#d4d0c8" }}>
                  <SectionHead icon={<Briefcase size={12} />} label="Service Info" />
                  <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                    <tbody>
                      {[
                        ["Fee:",      formatCurrency(service.fees)],
                        ["Mode:",     service.paymentMode],
                        ["Assignee:", service.assignedTo?.name || "Admin"],
                        ...(service.tokenNumber ? [["Token:", `T${String(service.tokenNumber).padStart(3,"0")}`]] : []),
                      ].map(([k, v]) => (
                        <tr key={k}><td style={{ color: "#555", padding: "1px 0" }}>{k}</td><td style={{ fontWeight: "bold", textAlign: "right" }}>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── RIGHT PANEL ── */}
              <div style={{ flex: 1, padding: "8px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>

                {/* ⚙ Service Configuration */}
                <div style={{ ...groove, padding: "8px", background: "#d4d0c8" }}>
                  <SectionHead icon="⚙" label="Service Configuration" color="#000080" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>

                    {/* Workflow Status */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                        <label style={{ fontSize: "11px" }}>Workflow Status:</label>
                        <button type="button" onClick={handleSync} style={btn({ fontSize: "10px", padding: "1px 5px" })}>
                          <RefreshCw size={9} /> Sync API
                        </button>
                      </div>
                      <select style={sel()} value={status} onChange={e => setStatus(e.target.value)}>
                        {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                      </select>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Payment Status:</label>
                      <select style={sel()} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </div>

                    {/* Payment Mode */}
                    <div>
                      <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Payment Mode:</label>
                      <select style={sel()} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                        <option value="PENDING">Pending</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>

                    {/* Fees */}
                    <div>
                      <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Fees Amount (₹):</label>
                      <input type="number" style={inp()} value={fees} min={0} onChange={e => setFees(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>

                {/* Required Documents */}
                <div style={{ ...groove, padding: "8px", background: "#d4d0c8" }}>
                  <SectionHead icon="📁" label="Required Documents" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px 10px", marginBottom: "7px" }}>
                    {COMMON_DOCS.map(doc => (
                      <label key={doc} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", cursor: "pointer", padding: "2px 0" }}>
                        <input type="checkbox" checked={requiredDocs.includes(doc)} onChange={() => toggleDoc(doc)} />
                        {doc}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input type="text" style={inp({ flex: 1 })} value={customDoc} onChange={e => setCustomDoc(e.target.value)}
                      placeholder="Add custom doc..." onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomDoc(); }}} />
                    <button type="button" style={btn()} onClick={addCustomDoc}>+ Add</button>
                  </div>
                  {/* Custom doc tags */}
                  {requiredDocs.filter(d => !COMMON_DOCS.includes(d)).length > 0 && (
                    <div style={{ marginTop: "5px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {requiredDocs.filter(d => !COMMON_DOCS.includes(d)).map(d => (
                        <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#e8f0ff", border: "1px solid #93b4e8", padding: "1px 6px", fontSize: "11px" }}>
                          {d}
                          <button type="button" onClick={() => setRequiredDocs(p => p.filter(x => x !== d))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontWeight: "bold", padding: 0, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deadline + ARN */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Expected Deadline:</label>
                    <input type="date" style={inp()} value={deadline} onChange={e => setDeadline(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Govt. Ref / ARN Number:</label>
                    <input type="text" style={inp()} value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="e.g. 15-digit ARN" />
                  </div>
                </div>

                {/* Vendor */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Outsource to Vendor:</label>
                    <select style={sel()} value={vendorId} onChange={e => setVendorId(e.target.value)}>
                      <option value="">-- No Vendor (Self) --</option>
                      {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>
                      <span style={{ color: vendorCost > 0 ? "#cc0000" : undefined }}>Vendor Cost (₹):</span>
                    </label>
                    <input type="number" style={inp()} value={vendorCost} min={0} onChange={e => setVendorCost(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ ...groove, padding: "8px", background: "#d4d0c8" }}>
                  <SectionHead icon="☑" label="Service Tasks Check" />
                  <div style={{ minHeight: "48px", marginBottom: "6px" }}>
                    {tasks.length === 0
                      ? <div style={{ color: "#999", fontSize: "11px", fontStyle: "italic" }}>No tasks yet. Add tasks below.</div>
                      : tasks.map((t, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", borderBottom: "1px dotted #ccc" }}>
                            <input type="checkbox" checked={t.done} onChange={() => toggleTask(i)} style={{ cursor: "pointer" }} />
                            <span style={{ flex: 1, fontSize: "12px", textDecoration: t.done ? "line-through" : "none", color: t.done ? "#999" : "#000" }}>{t.text}</span>
                            <button type="button" onClick={() => setTasks(p => p.filter((_, idx) => idx !== i))}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontSize: "14px", lineHeight: 1, padding: 0 }}>×</button>
                          </div>
                      ))
                    }
                  </div>
                  <div style={{ display: "flex", gap: "4px", borderTop: "1px solid #bbb", paddingTop: "6px" }}>
                    <input type="text" style={inp({ flex: 1 })} value={newTask} onChange={e => setNewTask(e.target.value)}
                      placeholder="Add a new task..." onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); }}} />
                    <button type="button" style={btn()} onClick={addTask}>+ Add Task</button>
                  </div>
                </div>

                {/* Missing Docs */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#b30000", display: "block", marginBottom: "3px" }}>
                    ⚠ Missing Documents (If any):
                  </label>
                  <textarea style={{ ...inp(), resize: "vertical", minHeight: "36px" }}
                    value={missingDocs} onChange={e => setMissingDocs(e.target.value)} placeholder="List missing documents here..." />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: "11px", display: "block", marginBottom: "3px" }}>Notes / Instructions:</label>
                  <textarea style={{ ...inp(), resize: "vertical", minHeight: "50px" }}
                    value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes..." />
                </div>

              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{ borderTop: "2px solid #848484", padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#c8c4bc" }}>
              {/* Delete */}
              <button type="button" onClick={handleDelete} disabled={deleting}
                style={btn({ background: confirmDelete ? "#cc0000" : "#d4d0c8", color: confirmDelete ? "white" : "black" })}>
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {confirmDelete ? "Confirm Delete?" : "Delete"}
              </button>

              {/* Right buttons */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {/* Progress indicator */}
                <span style={{ fontSize: "11px", color: "#555", marginRight: "4px" }}>
                  {tasks.length > 0 && `${tasks.filter(t => t.done).length}/${tasks.length} tasks done`}
                </span>
                <button type="button" onClick={() => { setConfirmDelete(false); onClose(); }} style={btn()}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={btn({ background: "#0a246a", color: "white", padding: "4px 20px", fontSize: "13px", fontWeight: "bold" })}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
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
