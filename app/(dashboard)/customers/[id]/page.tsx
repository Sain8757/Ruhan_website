"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, MapPin, Loader2, ChevronRight, FileText, Plus, Trash2, Edit, X, MessageCircle, Check } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate, SERVICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

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

  useEffect(() => {
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
        router.push("/customers");
      });
  }, [resolvedParams.id, router, toast]);

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
        {/* Profile Card */}
        <div className="glass-card p-6 h-fit space-y-4">
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
                    className="glass-card p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => router.push(`/services/${s.id}`)}
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
                        className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
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
                  No invoice records found.
                </div>
              ) : (
                customer.invoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="glass-card p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => router.push(`/billing/${inv.id}`)}
                  >
                    <div>
                      <div className="font-mono font-bold text-sm" style={{ color: "var(--brand-primary)" }}>
                        #{inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDate(inv.createdAt)} · {inv.items?.length || 0} items
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {formatCurrency(inv.total)}
                      </span>
                      {inv.paymentStatus !== "PAID" && (
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-red-500 font-medium">
                            Due: {formatCurrency(inv.total - (inv.amountPaid || 0))}
                          </span>
                        </div>
                      )}
                      <span className={`badge ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}>
                        {inv.paymentStatus}
                      </span>
                      
                      {inv.paymentStatus !== "PAID" && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSettleInvoice(inv.id);
                          }}
                          className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 border border-emerald-200"
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

          {activeTab === "documents" && (
            <div className="space-y-3">
              <div className="glass-card p-4">
                <h2 className="section-title flex items-center gap-2">
                  <FileText size={16} />
                  Document Folder
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_1fr_auto] gap-2">
                  <input
                    className="input-field"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    placeholder="Aadhaar copy, PAN, receipt..."
                  />
                  <input
                    className="input-field"
                    value={docForm.type}
                    onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                    placeholder="Type"
                  />
                  <input
                    className="input-field"
                    value={docForm.url}
                    onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
                    placeholder="File URL / reference"
                  />
                  <button type="button" className="btn-primary" onClick={addDocument}>
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </div>

              {customer.documents?.length === 0 ? (
                <div className="text-center py-12 glass-card text-sm text-slate-400">
                  No documents saved.
                </div>
              ) : (
                customer.documents.map((doc: any) => (
                  <div key={doc.id} className="glass-card p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {doc.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {doc.type} · {formatDate(doc.createdAt)}
                      </div>
                      {doc.url && doc.url !== "#" && (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "var(--brand-primary)" }}>
                          Open document
                        </a>
                      )}
                    </div>
                    <button type="button" className="btn-ghost p-2" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="section-title mb-0">Edit Customer</h2>
              <button onClick={() => setShowEditModal(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="modal-body space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input required className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Mobile Number</label>
                  <input required className="input-field" value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email Address (Optional)</label>
                  <input type="email" className="input-field" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Address (Optional)</label>
                <input className="input-field" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Aadhaar (Optional)</label>
                  <input className="input-field" value={editForm.aadhaarNumber} onChange={e => setEditForm({ ...editForm, aadhaarNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">PAN (Optional)</label>
                  <input className="input-field" value={editForm.panNumber} onChange={e => setEditForm({ ...editForm, panNumber: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
