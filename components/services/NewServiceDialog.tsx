/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect } from "react";
import LegacyDialog from "@/components/layout/LegacyDialog";
import { useToast } from "@/contexts/ToastContext";
import { SERVICE_TYPES } from "@/lib/utils";
import { findCatalogItem } from "@/lib/serviceCatalog";
import AddCustomerDialog from "@/components/customers/AddCustomerDialog";

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
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  
  const [form, setForm] = useState({
    serviceType: "",
    fees: "",
    paymentStatus: "UNPAID",
    paymentMode: "CASH",
    notes: "",
    requiredDocs: [] as string[],
  });
  const [customServiceType, setCustomServiceType] = useState("");
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
      setCustomServiceType("");
      setDocInput("");
    }
  }, [isOpen]);

  const applyServicePreset = async (serviceType: string) => {
    const preset = findCatalogItem(serviceType);
    let masterFee = preset ? String(preset.fee) : "";
    let masterDocs = preset ? preset.documents : [];
    
    try {
      const res = await fetch(`/api/inventory?q=${encodeURIComponent(serviceType)}&type=service`);
      if (res.ok) {
        const data = await res.json();
        const master = data.find((item: any) => item.name === serviceType);
        if (master) {
          masterFee = String(master.sellingPrice);
          masterDocs = master.requiredDocs || [];
        }
      }
    } catch (e) {
      console.error("Failed to fetch service master", e);
    }

    setForm((current) => {
      const replacedMessage = preset ? preset.message.replace(/{name}/g, selectedCustomer ? selectedCustomer.name : '{name}') : '';
      return {
        ...current,
        serviceType,
        fees: masterFee || current.fees,
        requiredDocs: masterDocs.length > 0 ? masterDocs : current.requiredDocs,
        notes: preset
          ? `${replacedMessage}\nEstimated time: ${preset.estimate}${preset.portal ? `\nPortal: ${preset.portal}` : ""}`
          : current.notes,
      };
    });
  };

  useEffect(() => {
    if (selectedCustomer && form.notes.includes("{name}")) {
      setForm(prev => ({
        ...prev,
        notes: prev.notes.replace(/{name}/g, selectedCustomer.name)
      }));
    }
  }, [selectedCustomer]);

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
    const finalServiceType = form.serviceType === "Other" && customServiceType.trim() ? customServiceType.trim() : form.serviceType;
    if (!finalServiceType) { toast.error("Please select service type"); return; }
    setLoading(true);
    
    // Generate a short 8-character alphanumeric tracking ID
    const trackingId = "RA-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, serviceType: finalServiceType, customerId: selectedCustomer.id, trackingId }),
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
    <>
      <LegacyDialog isOpen={isOpen} onClose={onClose} title="New Service Request" width="500px">
        <form onSubmit={handleSubmit} style={{ padding: '8px' }}>
          
          <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
            <legend>Customer Details</legend>
            {selectedCustomer ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{selectedCustomer.name}</strong> ({selectedCustomer.mobile})
                </div>
                <button type="button" className="legacy-button" onClick={() => setSelectedCustomer(null)}>Change</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="legacy-input"
                    placeholder="Search by name or mobile..."
                    style={{ flex: 1 }}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <button
                    type="button"
                    className="legacy-button"
                    onClick={() => setIsAddCustomerOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '2px 8px' }}
                    title="Add New Customer"
                  >
                    <span style={{ color: 'green', fontWeight: 'bold', fontSize: '12px' }}>+</span> Add New Customer
                  </button>
                </div>
                {(customers.length > 0 || customerSearch.trim().length > 0) && (
                  <div style={{ position: 'absolute', background: '#fff', border: '1px solid #000', width: '100%', zIndex: 10, maxHeight: '140px', overflowY: 'auto', boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }}>
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
                        <strong>{c.name}</strong> - {c.mobile}
                      </div>
                    ))}
                    <div
                      style={{ padding: '4px 6px', cursor: 'pointer', background: '#f0f4ff', color: '#0a246a', fontWeight: 'bold', borderTop: customers.length > 0 ? '1px solid #0a246a' : 'none' }}
                      onClick={() => setIsAddCustomerOpen(true)}
                    >
                      + Create "{customerSearch}" as New Customer
                    </div>
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
                  className="legacy-input"
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
                {form.serviceType === "Other" && (
                  <div style={{ marginTop: '8px' }}>
                    <label>Custom Service Name:</label>
                    <input
                      type="text"
                      className="legacy-input"
                      style={{ width: '100%' }}
                      placeholder="Enter custom service name"
                      value={customServiceType}
                      onChange={(e) => setCustomServiceType(e.target.value)}
                      required
                    />
                  </div>
                )}
                <fieldset className="legacy-fieldset" style={{ marginTop: '8px', padding: '6px' }}>
                  <legend style={{ color: '#000080' }}>Required Documents</legend>
                  {form.requiredDocs.length > 0 && (
                    <ul style={{ margin: '0 0 8px 0', paddingLeft: '16px', color: 'black' }}>
                      {form.requiredDocs.map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: '2px' }}>
                          {doc}
                          <span onClick={() => removeDoc(idx)} style={{ marginLeft: '8px', color: '#e81123', cursor: 'pointer', textDecoration: 'underline' }}>remove</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="legacy-input" 
                      style={{ flex: 1, fontSize: '10px' }} 
                      placeholder="Add a document..." 
                      value={docInput} 
                      onChange={(e) => setDocInput(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDoc(); } }} 
                    />
                    <button type="button" className="legacy-button" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={addDoc}>Add</button>
                  </div>
                  
                  {form.requiredDocs.length > 0 && selectedCustomer && selectedCustomer.mobile && (
                    <button 
                      type="button" 
                      className="legacy-button"
                      style={{ marginTop: '8px', fontWeight: 'bold' }}
                      onClick={() => {
                        const docList = form.requiredDocs.map(d => `- ${d}`).join('%0A');
                        const msg = `Hello ${selectedCustomer.name},%0A%0AWe require the following documents for your ${form.serviceType === 'Other' ? (customServiceType || 'service') : form.serviceType} application:%0A%0A${docList}%0A%0APlease send them at your earliest convenience.%0A%0AThank you,%0ARA Seva Point`;
                        window.open(`https://wa.me/91${selectedCustomer.mobile.replace(/\D/g, '').slice(-10)}?text=${msg}`, '_blank');
                      }}
                    >
                      Ask Docs via WhatsApp
                    </button>
                  )}
                </fieldset>
              </div>
              <div>
                <label>Fees (₹):</label>
                <input
                  type="number"
                  className="legacy-input"
                  style={{ width: '100%' }}
                  value={form.fees}
                  onChange={(e) => setForm({ ...form, fees: e.target.value })}
                />
              </div>
              <div>
                <label>Payment Status:</label>
                <select className="legacy-input" style={{ width: '100%' }} value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
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
              className="legacy-input"
              style={{ width: '100%' }}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </fieldset>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="legacy-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="legacy-button" disabled={loading} style={{ fontWeight: 'bold' }}>{loading ? 'Saving...' : 'OK'}</button>
          </div>
        </form>
      </LegacyDialog>

      <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        initialSearch={customerSearch}
        onSuccess={(newCust) => {
          if (newCust) {
            setSelectedCustomer(newCust);
            setCustomerSearch("");
            setCustomers([]);
          }
        }}
        zIndex={10050}
      />
    </>
  );
}
