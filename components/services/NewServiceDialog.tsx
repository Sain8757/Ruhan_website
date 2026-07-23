import React, { useState, useEffect } from "react";
import LegacyDialog from "@/components/layout/LegacyDialog";
import { useToast } from "@/contexts/ToastContext";
import { SERVICE_TYPES } from "@/lib/utils";
import { findCatalogItem } from "@/lib/serviceCatalog";

interface NewServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewServiceDialog({ isOpen, onClose, onSuccess }: NewServiceDialogProps) {
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

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setCustomerSearch("");
      setCustomers([]);
      setSelectedCustomer(null);
      setForm({
        serviceType: "",
        fees: "",
        paymentStatus: "UNPAID",
        paymentMode: "CASH",
        notes: "",
        requiredDocs: [],
      });
      setDocInput("");
    }
  }, [isOpen]);

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
      toast.success("Service created!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LegacyDialog isOpen={isOpen} onClose={onClose} title="New Service Request" width="500px">
      <form onSubmit={handleSubmit} style={{ padding: '8px' }}>
        
        <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
          <legend>Customer Details</legend>
          {selectedCustomer ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{selectedCustomer.name}</strong> ({selectedCustomer.mobile})
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name or mobile..."
                style={{ width: '100%' }}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customers.length > 0 && (
                <div style={{ position: 'absolute', background: '#fff', border: '1px solid #000', width: '100%', zIndex: 10 }}>
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      style={{ padding: '4px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                        setCustomers([]);
                      }}
                    >
                      {c.name} - {c.mobile}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </fieldset>

        <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
          <legend>Service Configuration</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Service Type:</label>
              <select
                style={{ width: '100%' }}
                value={form.serviceType}
                onChange={(e) => applyServicePreset(e.target.value)}
                required
              >
                <option value="">-- Select --</option>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Fees (₹):</label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={form.fees}
                onChange={(e) => setForm({ ...form, fees: e.target.value })}
              />
            </div>
            <div>
              <label>Payment Status:</label>
              <select style={{ width: '100%' }} value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
          <legend>Notes</legend>
          <textarea
            style={{ width: '100%' }}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </fieldset>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'OK'}</button>
        </div>
      </form>
    </LegacyDialog>
  );
}
