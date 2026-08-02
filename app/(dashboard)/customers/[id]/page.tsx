"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, MapPin, Loader2, ChevronRight, FileText, Plus, Trash2, Edit, X, MessageCircle, Check } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate, SERVICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";
import InvoiceDetailsDialog from "@/components/billing/InvoiceDetailsDialog";
import LegacyDialog from "@/components/layout/LegacyDialog";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"services" | "invoices" | "documents">("services");
  const [docForm, setDocForm] = useState({ name: "", type: "Document", url: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: "", mobile: "", email: "", address: "", aadhaarNumber: "", panNumber: "" 
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchCustomer = () => {
    fetch(`/api/customers/${resolvedParams.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Customer profile not found");
        return res.json();
      })
      .then((data) => {
        setCustomer(data);
        setEditForm({
          name: data.name || "",
          mobile: data.mobile || "",
          email: data.email || "",
          address: data.address || "",
          aadhaarNumber: data.aadhaarNumber || "",
          panNumber: data.panNumber || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomer();
  }, [resolvedParams.id]);

  const refreshCustomer = async () => {
    const res = await fetch(`/api/customers/${resolvedParams.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setCustomer(data);
    setEditForm({
      name: data.name || "",
      mobile: data.mobile || "",
      email: data.email || "",
      address: data.address || "",
      aadhaarNumber: data.aadhaarNumber || "",
      panNumber: data.panNumber || "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      await refreshCustomer();
      toast.success("Customer updated successfully");
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/customers/${resolvedParams.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      toast.success("Customer deleted");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addDocument = async () => {
    if (!docForm.name.trim()) {
      toast.error("Document name required");
      return;
    }
    const res = await fetch(`/api/customers/${resolvedParams.id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docForm),
    });
    if (!res.ok) {
      toast.error("Document save failed");
      return;
    }
    setDocForm({ name: "", type: "Document", url: "" });
    await refreshCustomer();
    toast.success("Document saved");
  };

  const deleteDocument = async (documentId: string) => {
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Document delete failed");
      return;
    }
    await refreshCustomer();
    toast.success("Document deleted");
  };

  const sendWhatsApp = (text?: string) => {
    if (!customer?.mobile) return toast.error("Mobile number not found");
    const message = text || `Hello ${customer.name},\n`;
    const url = `https://wa.me/91${customer.mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleSettleInvoice = async (invoiceId: string) => {
    const amount = prompt("Enter amount paid by customer:");
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaid: Number(amount) })
      });
      if (!res.ok) throw new Error("Failed to settle payment");
      toast.success("Payment settled");
      await refreshCustomer();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Khata ledger calculations
  const autoBilledServiceIds = new Set(
    customer?.invoices?.filter((inv: any) => inv.notes?.includes("Service ID: "))
    .map((inv: any) => inv.notes.split("Service ID: ")[1]?.trim()) || []
  );

  const totalInvoiceBilled = customer?.invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
  const totalInvoicePaid = customer?.invoices?.reduce((sum: number, inv: any) => sum + (inv.amountPaid || 0), 0) || 0;
  
  const unbilledServices = customer?.services?.filter((srv: any) => !autoBilledServiceIds.has(srv.id)) || [];
  const totalServiceBilled = unbilledServices.reduce((sum: number, srv: any) => sum + (srv.fees || 0), 0) || 0;
  const totalServicePaid = unbilledServices.reduce((sum: number, srv: any) => sum + (srv.amountPaid || 0), 0) || 0;
  
  const totalBilled = totalInvoiceBilled + totalServiceBilled;
  const totalPaid = totalInvoicePaid + totalServicePaid;
  const totalDue = Math.max(0, totalBilled - totalPaid);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setDocForm((prev) => ({
        ...prev,
        name: prev.name || file.name,
        url: base64,
      }));
      toast.success("File attached! Click Add to save.");
    };
    reader.readAsDataURL(file);
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
        title={customer.name}
        subtitle={`Registered on ${formatDate(customer.createdAt)}`}
        backHref="/customers"
        actions={
          <div className="flex gap-2">
            <button 
              onClick={() => sendWhatsApp()} 
              className="btn-secondary text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button onClick={() => setShowEditModal(true)} className="btn-secondary text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
              <Edit size={16} /> Edit
            </button>
            <button onClick={handleDelete} className="btn-secondary text-red-600 border-red-200 bg-red-50 hover:bg-red-100">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile & Khata Card */}
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <User size={18} className="text-blue-500" />
              Customer Profile
            </h2>
            <hr style={{ borderColor: "var(--border-primary)" }} />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span style={{ color: "var(--text-primary)" }}>{customer.mobile}</span>
              </div>

              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span style={{ color: "var(--text-primary)" }}>{customer.email}</span>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span style={{ color: "var(--text-primary)" }}>{customer.address}</span>
                </div>
              )}
            </div>

            <hr style={{ borderColor: "var(--border-primary)" }} />

            <div className="space-y-2">
              <div>
                <span className="label">Aadhaar Number</span>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {customer.aadhaarNumber || "Not Provided"}
                </p>
              </div>
              <div>
                <span className="label">PAN Number</span>
                <p className="text-sm font-semibold uppercase" style={{ color: "var(--text-primary)" }}>
                  {customer.panNumber || "Not Provided"}
                </p>
              </div>
              <div className="pt-2 border-t mt-2" style={{ borderColor: "var(--border-primary)" }}>
                <span className="label flex items-center gap-1">⭐ Loyalty Points</span>
                <p className="text-xl font-bold text-yellow-600">
                  {customer.loyaltyPoints || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Khata Ledger Summary Card (Windows 95 Classic Bevel Window Style) */}
          <div
            style={{
              backgroundColor: "#d4d0c8",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              padding: "2px",
              boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
            }}
          >
            {/* Title Bar */}
            <div
              style={{
                background: "linear-gradient(to right, #000080 0%, #1084d0 100%)",
                color: "#ffffff",
                padding: "3px 6px",
                fontWeight: "bold",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={13} color="#ffffff" />
                <span style={{ color: "#ffffff", fontWeight: "bold" }}>KHATA LEDGER ACCOUNT</span>
              </div>
              {totalDue > 0 && (
                <span
                  style={{
                    background: "#b91c1c",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "1px 6px",
                    borderRadius: "2px",
                    border: "1px solid #ffffff",
                  }}
                >
                  UDHAAR ACTIVE
                </span>
              )}
            </div>

            {/* Inset White Content Box */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderTop: "2px solid #808080",
                borderLeft: "2px solid #808080",
                borderRight: "2px solid #ffffff",
                borderBottom: "2px solid #ffffff",
                padding: "10px",
                marginTop: "2px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingBottom: "8px", borderBottom: "1px solid #d4d0c8" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#444444", textTransform: "uppercase" }}>LIFETIME BILLED</div>
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "#000080" }}>{formatCurrency(totalBilled)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#444444", textTransform: "uppercase" }}>TOTAL RECEIVED</div>
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "#008000" }}>{formatCurrency(totalPaid)}</div>
                </div>
              </div>

              <div style={{ paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#444444", textTransform: "uppercase" }}>PENDING DUE BALANCE</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: totalDue > 0 ? "#cc0000" : "#008000" }}>
                    {formatCurrency(totalDue)}
                  </div>
                </div>
              </div>

              {totalDue > 0 && (
                <button
                  type="button"
                  onClick={() => sendWhatsApp(`Namaste ${customer.name} ji! 🙏\n\nRA Seva Point se aapka total pending due (udhaar) *${formatCurrency(totalDue)}* baaki baaki hai.\n\nKripya ise jald se jald cash ya UPI dwara bhugtan karein.\n\nDhanyawad! 📱 RA Seva Point`)}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "6px 8px",
                    backgroundColor: "#d4d0c8",
                    borderTop: "2px solid #ffffff",
                    borderLeft: "2px solid #ffffff",
                    borderRight: "2px solid #404040",
                    borderBottom: "2px solid #404040",
                    color: "#000000",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <MessageCircle size={15} color="#25D366" />
                  <span>Send Due Reminder on WhatsApp</span>
                </button>
              )}

              {totalDue > 0 && customer.walletBalance > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Settle dues of ${formatCurrency(Math.min(totalDue, customer.walletBalance))} from wallet?`)) {
                      toast.info("Settling from wallet...");
                      try {
                        const res = await fetch(`/api/customers/${customer.id}/settle-wallet`, { method: "POST" });
                        if (!res.ok) throw new Error("Failed to settle");
                        toast.success("Wallet amount settled against dues!");
                        refreshCustomer();
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "6px 8px",
                    backgroundColor: "#dcfce7",
                    borderTop: "2px solid #ffffff",
                    borderLeft: "2px solid #ffffff",
                    borderRight: "2px solid #404040",
                    borderBottom: "2px solid #404040",
                    color: "#166534",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span>💸 Auto-Settle from Wallet</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.open(`/print/ledger/${customer.id}`, '_blank');
                }}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "6px 8px",
                  backgroundColor: "#d4d0c8",
                  borderTop: "2px solid #ffffff",
                  borderLeft: "2px solid #ffffff",
                  borderRight: "2px solid #404040",
                  borderBottom: "2px solid #404040",
                  color: "#000000",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <FileText size={15} color="#000080" />
                <span>Print Khata Ledger PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* History Tabs */}
        <div className="md:col-span-2 space-y-4">
          <div className="segmented-control full" role="tablist" aria-label="Customer history">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "services"}
              onClick={() => setActiveTab("services")}
              className={`segmented-item ${activeTab === "services" ? "active" : ""}`}
            >
              Services ({customer.services?.length || 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "invoices"}
              onClick={() => setActiveTab("invoices")}
              className={`segmented-item ${activeTab === "invoices" ? "active" : ""}`}
            >
              Invoices ({customer.invoices?.length || 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
              className={`segmented-item ${activeTab === "documents" ? "active" : ""}`}
            >
              Documents ({customer.documents?.length || 0})
            </button>
          </div>

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-3">
              {customer.services?.length === 0 ? (
                <div className="text-center py-12 glass-card text-sm text-slate-400">
                  No service records found.
                </div>
              ) : (
                customer.services.map((s: any) => (
                  <div
                    key={s.id}
                    className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => { setSelectedServiceId(s.id); setIsServiceModalOpen(true); }}
                  >
                    <div>
                      <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {s.serviceType}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Registered: {formatDate(s.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${SERVICE_STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsApp(`Hello ${customer.name}, your service application for ${s.serviceType} is currently ${s.status}.`);
                        }}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                        title="Send WhatsApp update"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-3">
              {customer.invoices?.length === 0 ? (
                <div className="text-center py-12 glass-card text-sm text-slate-400">
                  No billing records found.
                </div>
              ) : (
                customer.invoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedInvoiceId(inv.id)}
                  >
                    <div>
                      <div className="font-mono font-bold text-sm" style={{ color: "var(--brand-primary)" }}>
                        #{inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDate(inv.createdAt)} · Total: {formatCurrency(inv.total)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}>
                        {inv.paymentStatus}
                      </span>
                      
                      {inv.paymentStatus !== "PAID" && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSettleInvoice(inv.id);
                          }}
                          className="btn-secondary px-2 py-1 text-xs"
                          style={{ color: "#059669", backgroundColor: "rgba(5, 150, 105, 0.1)", borderColor: "rgba(5, 150, 105, 0.2)" }}
                        >
                          Settle
                        </button>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsApp(`Hello ${customer.name}, your invoice #${inv.invoiceNumber} for amount ${formatCurrency(inv.total)} has a pending due of ${formatCurrency(inv.total - (inv.amountPaid || 0))}. Please settle it at your earliest convenience.`);
                        }}
                        className="p-1 text-green-500 hover:bg-green-50 rounded"
                        title="Send Reminder"
                      >
                        <MessageCircle size={14} />
                      </button>
                      
                      <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="glass-card p-4 space-y-3">
                <h2 className="section-title flex items-center gap-2 mb-0">
                  <FileText size={16} className="text-blue-600" />
                  Customer Document Folder
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="input-field"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    placeholder="Document Name (e.g. Aadhaar Card)..."
                  />
                  <select
                    className="input-field"
                    value={docForm.type}
                    onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport Photo">Passport Photo</option>
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Caste Certificate">Caste Certificate</option>
                    <option value="Marksheet">Marksheet</option>
                    <option value="Other">Other Document</option>
                  </select>
                  <input
                    type="date"
                    className="input-field"
                    title="Expiry Date (Optional)"
                    value={(docForm as any).expiryDate || ""}
                    onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value } as any)}
                  />
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="doc-file-input"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="doc-file-input"
                      className="btn-secondary text-xs px-3 py-2 cursor-pointer truncate max-w-[130px]"
                      title="Upload file from device"
                    >
                      {docForm.url ? "File Attached ✓" : "Choose File..."}
                    </label>
                    <button type="button" className="btn-primary flex-1 py-2 text-xs" onClick={addDocument}>
                      <Plus size={14} />
                      Save Doc
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Tip: Upload Aadhaar, PAN, Photos or Certificates directly to save them permanently for future form applications. Add an Expiry Date for alerts.
                </div>
              </div>

              {customer.documents?.length === 0 ? (
                <div className="text-center py-12 glass-card text-sm text-slate-400">
                  No documents saved for this customer.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.documents.map((doc: any) => {
                    const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                    const isNearExpiry = doc.expiryDate && new Date(doc.expiryDate) >= new Date() && new Date(doc.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
                    return (
                    <div key={doc.id} className="glass-card p-4 flex items-center justify-between gap-3 border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="truncate">
                        <div className="font-bold text-sm truncate flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                          {doc.name}
                          {isExpired && <span className="badge bg-red-100 text-red-700 text-[10px]">Expired</span>}
                          {isNearExpiry && <span className="badge bg-orange-100 text-orange-700 text-[10px]">Expiring Soon</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Category: <span className="font-semibold text-blue-600">{doc.type}</span> · {formatDate(doc.createdAt)}
                          {doc.expiryDate && <><br/>Expires: <span style={{color: isExpired ? '#dc2626' : (isNearExpiry ? '#d97706' : '#16a34a')}}>{formatDate(doc.expiryDate)}</span></>}
                        </div>
                        {doc.url && (
                          <button
                            type="button"
                            onClick={() => setPreviewUrl(doc.url)}
                            className="text-xs font-semibold underline mt-1 inline-block text-blue-600 hover:text-blue-800 bg-transparent border-none p-0 cursor-pointer text-left"
                          >
                            Preview / Download
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-ghost p-2 text-red-500 hover:bg-red-50 rounded"
                        onClick={() => deleteDocument(doc.id)}
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <LegacyDialog isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer" width="500px">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="bg-[#c0c0c0] p-4">
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1 text-black">Full Name</label>
                <input required className="w-full bg-white border-[2px] border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 py-1 text-black font-bold text-xs focus:outline-none ring-1 ring-black shadow-[1px_1px_0px_#fff_inset]" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-black">Mobile Number</label>
                  <input required className="w-full bg-white border-[2px] border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 py-1 text-black font-bold text-xs focus:outline-none ring-1 ring-black shadow-[1px_1px_0px_#fff_inset]" value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-black">Email Address (Optional)</label>
                  <input type="email" className="w-full bg-white border-[2px] border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 py-1 text-black font-bold text-xs focus:outline-none ring-1 ring-black shadow-[1px_1px_0px_#fff_inset]" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1 text-black">Address (Optional)</label>
                <input className="w-full bg-white border-[2px] border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 py-1 text-black font-bold text-xs focus:outline-none ring-1 ring-black shadow-[1px_1px_0px_#fff_inset]" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-black">Aadhaar (Optional)</label>
                  <input className="w-full bg-white border-[2px] border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 py-1 text-black font-bold text-xs focus:outline-none ring-1 ring-black shadow-[1px_1px_0px_#fff_inset]" value={editForm.aadhaarNumber} onChange={e => setEditForm({ ...editForm, aadhaarNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-black">PAN (Optional)</label>
                  <input className="w-full bg-white border-[2px] border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 py-1 text-black font-bold text-xs focus:outline-none ring-1 ring-black shadow-[1px_1px_0px_#fff_inset]" value={editForm.panNumber} onChange={e => setEditForm({ ...editForm, panNumber: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-[#c0c0c0] px-6 py-1.5 text-xs font-bold text-black border-t-white border-l-white border-b-black border-r-black border-[2px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white" disabled={saving}>Cancel</button>
                <button type="submit" className="bg-[#c0c0c0] px-6 py-1.5 text-xs font-bold text-black border-t-white border-l-white border-b-black border-r-black border-[3px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white ring-1 ring-black ring-inset shadow-[1px_1px_0px_#fff_inset] flex items-center justify-center min-w-[100px]" disabled={saving}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </LegacyDialog>
      )}

      {isServiceModalOpen && selectedServiceId && (
        <ServiceDetailsDialog
          isOpen={isServiceModalOpen}
          onClose={() => { setIsServiceModalOpen(false); setSelectedServiceId(null); }}
          serviceId={selectedServiceId}
          onSuccess={() => fetchCustomer()}
        />
      )}

      {selectedInvoiceId && (
        <InvoiceDetailsDialog
          isOpen={!!selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          invoiceId={selectedInvoiceId}
        />
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div style={{ position:"fixed",inset:0,zIndex:100000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"#d4d0c8", borderTop:"2px solid #ffffff", borderLeft:"2px solid #ffffff", borderRight:"2px solid #404040", borderBottom:"2px solid #404040", display:"flex", flexDirection:"column", width:"80%", maxWidth:"700px", maxHeight:"85vh", boxShadow:"0 10px 30px rgba(0,0,0,0.8)" }}>
            <div style={{ background:"linear-gradient(90deg,#000080,#1084d0)", color:"white", padding:"6px 10px", fontWeight:"bold", fontSize:"13px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>Document Preview</span>
              <button onClick={() => setPreviewUrl(null)} style={{ background:"#d4d0c8", color:"black", borderTop:"1px solid #ffffff", borderLeft:"1px solid #ffffff", borderRight:"1px solid #404040", borderBottom:"1px solid #404040", padding:"1px 6px", cursor:"pointer", fontWeight:"bold" }}>✕</button>
            </div>
            
            <div style={{ flex:1, background:"#000", display:"flex", alignItems:"center", justifyContent:"center", padding:"10px", overflow:"hidden", minHeight:"300px" }}>
              {(previewUrl.includes('data:image/') || previewUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) ? (
                <img src={previewUrl} alt="Preview" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
              ) : (
                <iframe src={previewUrl} style={{ width:"100%", height:"500px", border:"none", background:"white" }} title="Document Preview" />
              )}
            </div>
            
            <div style={{ padding:"10px", display:"flex", justifyContent:"center", gap:"10px", background:"#111" }}>
              <button onClick={() => setPreviewUrl(null)} style={{ background:"#d4d0c8", color:"black", borderTop:"1px solid #ffffff", borderLeft:"1px solid #ffffff", borderRight:"1px solid #404040", borderBottom:"1px solid #404040", padding:"6px 20px", fontWeight:"bold", cursor:"pointer" }}>
                Close
              </button>
              <button onClick={() => { window.open(previewUrl, '_blank'); }} style={{ background:"#d4d0c8", color:"black", borderTop:"1px solid #ffffff", borderLeft:"1px solid #ffffff", borderRight:"1px solid #404040", borderBottom:"1px solid #404040", padding:"6px 16px", fontWeight:"bold", cursor:"pointer" }}>
                ↗️ Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
