"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Search, Plus, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { SERVICE_TYPES } from "@/lib/utils";
import { findCatalogItem } from "@/lib/serviceCatalog";
import PageHeader from "@/components/layout/PageHeader";

export default function NewServicePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [form, setForm] = useState({
    serviceType: "",
    fees: "",
    paymentStatus: "UNPAID",
    paymentMode: "CASH",
    notes: "",
    requiredDocs: [] as string[],
  });
  const [docInput, setDocInput] = useState("");

  const applyServicePreset = (serviceType: string) => {
    const preset = findCatalogItem(serviceType);
    setForm((current) => ({
      ...current,
      serviceType,
      fees: preset ? String(preset.fee) : current.fees,
      requiredDocs: preset ? preset.documents : current.requiredDocs,
      notes: preset
        ? `${preset.message}\nEstimated time: ${preset.estimate}${preset.portal ? `\nPortal: ${preset.portal}` : ""}`
        : current.notes,
    }));
  };

  // Customer search
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomers([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}&limit=5`);
      const data = await res.json();
      setCustomers(data.customers || []);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const addDoc = () => {
    if (docInput.trim()) {
      setForm({ ...form, requiredDocs: [...form.requiredDocs, docInput.trim()] });
      setDocInput("");
    }
  };

  const removeDoc = (i: number) => {
    setForm({ ...form, requiredDocs: form.requiredDocs.filter((_, idx) => idx !== i) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) { toast.error("Please select a customer"); return; }
    if (!form.serviceType) { toast.error("Please select service type"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, customerId: selectedCustomer.id }),
      });
      if (!res.ok) throw new Error("Failed to create service");
      const service = await res.json();
      toast.success("Service created!");
      router.push(`/services/${service.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell page-shell-form">
      <PageHeader
        title="New Service"
        subtitle="Create a new service request"
        backHref="/services"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="glass-card p-6">
          <h2 className="section-title">Customer</h2>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{selectedCustomer.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedCustomer.mobile}</div>
              </div>
              <button type="button" className="btn-ghost p-1" onClick={() => setSelectedCustomer(null)}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search customer by name or mobile..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              {customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl shadow-lg overflow-hidden" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}>
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                        setCustomers([]);
                      }}
                    >
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.mobile}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <Link href="/customers/new" className="text-xs" style={{ color: "var(--brand-primary)" }}>
                  + Add new customer
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Service Details */}
        <div className="glass-card p-6">
          <h2 className="section-title">Service Details</h2>
          <div className="form-grid form-grid-2">
            <div className="sm:col-span-2">
              <label className="label">Service Type *</label>
              <select
                className="input-field"
                value={form.serviceType}
                onChange={(e) => applyServicePreset(e.target.value)}
                required
              >
                <option value="">Select service type...</option>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fees (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={form.fees}
                onChange={(e) => setForm({ ...form, fees: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select
                className="input-field"
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
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
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="glass-card p-6">
          <h2 className="section-title">Required Documents</h2>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field"
              placeholder="Add required document (e.g. Aadhaar copy)"
              value={docInput}
              onChange={(e) => setDocInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={addDoc}>
              <Plus size={16} />
            </button>
          </div>
          {form.requiredDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.requiredDocs.map((doc, i) => (
                <span key={i} className="badge badge-submitted flex items-center gap-1">
                  {doc}
                  <button type="button" onClick={() => removeDoc(i)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="section-title">Notes</h2>
          <textarea
            className="input-field resize-none"
            placeholder="Additional notes..."
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/services" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Create Service</>}
          </button>
        </div>
      </form>
    </div>
  );
}
