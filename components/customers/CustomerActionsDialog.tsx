"use client";

import React, { useState, useEffect } from "react";
import LegacyDialog from "@/components/layout/LegacyDialog";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { SERVICE_TYPES } from "@/lib/utils";
import { findCatalogItem } from "@/lib/serviceCatalog";
import { 
  User, Phone, Mail, MapPin, Edit, Trash2, MessageCircle, FileText, PlusCircle, ExternalLink, Loader2, Check 
} from "lucide-react";
import NewBillDialog from "@/components/billing/NewBillDialog";

interface CustomerActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onSuccess?: () => void;
}

type TabType = "actions" | "edit" | "new_service";

export default function CustomerActionsDialog({
  isOpen,
  onClose,
  customerId,
  onSuccess,
}: CustomerActionsDialogProps) {
  const toast = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("actions");
  
  // Loading & Data states
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    aadhaarNumber: "",
    panNumber: "",
    dob: "",
    tags: "",
    rating: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // New Service Form State
  const [serviceForm, setServiceForm] = useState({
    serviceType: "",
    fees: "",
    paymentStatus: "UNPAID",
    paymentMode: "CASH",
    amountPaid: "",
    notes: "",
    requiredDocs: [] as string[],
  });
  const [customService, setCustomService] = useState("");
  const [docInput, setDocInput] = useState("");
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  
  const [dbServices, setDbServices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/kiosk/services')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbServices(data);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Customer details when modal opens
  useEffect(() => {
    if (!isOpen || !customerId) return;
    setLoading(true);
    setActiveTab("actions");
    
    fetch(`/api/customers/${customerId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Customer not found");
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
          dob: data.dob ? data.dob.split('T')[0] : "",
          tags: data.tags ? data.tags.join(', ') : "",
          rating: data.rating ? data.rating.toString() : "",
        });
        // Reset service form
        setServiceForm({
          serviceType: "",
          fees: "",
          paymentStatus: "UNPAID",
          paymentMode: "PENDING",
          amountPaid: "",
          notes: "",
          requiredDocs: []
        });
        setCustomService("");
        setDocInput("");
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        onClose();
      });
  }, [isOpen, customerId]);

  // Handle customer edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          dob: editForm.dob || undefined,
          rating: editForm.rating ? parseInt(editForm.rating) : undefined
        }),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      toast.success("Customer profile updated!");
      if (onSuccess) onSuccess();
      setActiveTab("actions");
      // Reload customer details
      const updated = await res.json();
      setCustomer(updated);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!window.confirm("Are you sure you want to delete this customer? This will remove all associated services & invoices!")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer removed successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  // Auto fill service preset values
  const applyServicePreset = (serviceName: string) => {
    if (serviceName === "Other") {
      setServiceForm({ ...serviceForm, serviceType: "Other", fees: "", notes: "", requiredDocs: [] });
      setCustomService("");
      return;
    }
    const preset = dbServices.find((s) => s.name === serviceName);
    if (preset) {
      let msg = "";
      if (preset.requiredDocs && preset.requiredDocs.length > 0) {
         msg = `Namaste ${customer?.name || 'Customer'},\n${serviceName} ke liye kripya yeh documents provide karein: ${preset.requiredDocs.join(', ')}.`;
      } else {
         msg = `Namaste ${customer?.name || 'Customer'},\n${serviceName} request received.`;
      }
      
      setServiceForm({
        ...serviceForm,
        serviceType: serviceName,
        fees: preset.sellingPrice?.toString() || "0",
        notes: msg,
        requiredDocs: preset.requiredDocs || []
      });
    } else {
      setServiceForm({ ...serviceForm, serviceType: serviceName, fees: "", notes: "", requiredDocs: [] });
    }
  };

  // Handle service creation submit
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = serviceForm.serviceType === "Other" && customService.trim() ? customService.trim() : serviceForm.serviceType;
    if (!finalType) {
      toast.error("Please specify a service type");
      return;
    }

    setIsCreatingService(true);
    const trackingId = "RA-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const finalAmountPaid = serviceForm.paymentStatus === "PAID" 
      ? Number(serviceForm.fees) 
      : (serviceForm.paymentStatus === "PARTIAL" ? Number(serviceForm.amountPaid) : 0);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...serviceForm,
          amountPaid: finalAmountPaid,
          serviceType: finalType,
          customerId: customerId,
          trackingId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create service");
      toast.success(`Service request created successfully! Tracking ID: ${trackingId}`);
      if (onSuccess) onSuccess();
      setActiveTab("actions");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreatingService(false);
    }
  };

  const sendWhatsApp = () => {
    if (!customer?.mobile) return;
    const url = `https://wa.me/91${customer.mobile}?text=${encodeURIComponent(`Hello ${customer.name},\n`)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.5)" }} 
        onClick={onClose} 
      />

      {/* Dialog Shell */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div 
          style={{ 
            fontFamily: "Tahoma, Geneva, sans-serif",
            fontSize: "12px",
            background: "#d4d0c8",
            borderTop: "2px solid #ffffff",
            borderLeft: "2px solid #ffffff",
            borderRight: "2px solid #404040",
            borderBottom: "2px solid #404040",
            width: "550px", 
            maxWidth: "96vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "4px 4px 20px rgba(0,0,0,0.5)",
            pointerEvents: "all"
          }}
        >
          {/* Header Bar */}
          <div style={{ background: "linear-gradient(90deg,#000080,#1084d0)", color: "#fff", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", fontSize: "13px" }}>
              <User size={14} />
              <span>{customer ? `${customer.name} — Customer Quick Options` : "Customer Options"}</span>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                background: "#d4d0c8", 
                borderTop: "2px solid #ffffff", 
                borderLeft: "2px solid #ffffff", 
                borderRight: "2px solid #404040", 
                borderBottom: "2px solid #404040", 
                color: "#000", 
                width: "20px", 
                height: "17px", 
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
              <span>Loading customer options...</span>
            </div>
          ) : (
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
              
              {/* Customer summary */}
              {customer && activeTab !== "edit" && (
                <div style={{ display: "flex", gap: "12px", background: "#eae6de", padding: "8px", border: "1px groove #fff", borderRadius: "2px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", color: "#000080" }}>{customer.name}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", color: "#333" }}>
                      <span>📞 {customer.mobile}</span>
                      {customer.email && <span>✉️ {customer.email}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Actions List */}
              {activeTab === "actions" && customer && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                  
                  {/* View Profile */}
                  <button 
                    onClick={() => { onClose(); router.push(`/customers/${customer.id}`); }}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#f1f5f9", cursor: "pointer",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
                      textAlign: "left", fontWeight: "bold"
                    }}
                  >
                    <User size={16} className="text-blue-600" />
                    <div>
                      <div style={{ color: "#000" }}>👤 View Ledger Profile</div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: "normal" }}>Check Khata dues & documents</div>
                    </div>
                  </button>

                  {/* Create Service */}
                  <button 
                    onClick={() => setActiveTab("new_service")}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#f1f5f9", cursor: "pointer",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
                      textAlign: "left", fontWeight: "bold"
                    }}
                  >
                    <PlusCircle size={16} className="text-emerald-600" />
                    <div>
                      <div style={{ color: "#000" }}>➕ Add New Service</div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: "normal" }}>Apply PAN, Passport, Visa etc.</div>
                    </div>
                  </button>

                  {/* WhatsApp Message */}
                  <button 
                    onClick={sendWhatsApp}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#f1f5f9", cursor: "pointer",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
                      textAlign: "left", fontWeight: "bold"
                    }}
                  >
                    <MessageCircle size={16} className="text-green-600" />
                    <div>
                      <div style={{ color: "#000" }}>💬 WhatsApp Chat</div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: "normal" }}>Send direct WhatsApp alert</div>
                    </div>
                  </button>

                  {/* Generate Invoice */}
                  <button 
                    onClick={() => setIsNewBillOpen(true)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#f1f5f9", cursor: "pointer",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
                      textAlign: "left", fontWeight: "bold"
                    }}
                  >
                    <FileText size={16} className="text-purple-600" />
                    <div>
                      <div style={{ color: "#000" }}>📄 Create Invoice / Bill</div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: "normal" }}>Collect payment or print invoice</div>
                    </div>
                  </button>

                  {/* Edit Customer */}
                  <button 
                    onClick={() => setActiveTab("edit")}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#f1f5f9", cursor: "pointer",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
                      textAlign: "left", fontWeight: "bold"
                    }}
                  >
                    <Edit size={16} className="text-amber-600" />
                    <div>
                      <div style={{ color: "#000" }}>✏️ Edit Information</div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: "normal" }}>Update Aadhaar, PAN or contact</div>
                    </div>
                  </button>

                  {/* Delete Customer */}
                  <button 
                    onClick={handleDeleteCustomer}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#fef2f2", cursor: "pointer",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
                      textAlign: "left", fontWeight: "bold"
                    }}
                  >
                    <Trash2 size={16} className="text-red-600" />
                    <div>
                      <div style={{ color: "#991b1b" }}>🗑️ Delete Customer</div>
                      <div style={{ fontSize: "10px", color: "#b91c1c", fontWeight: "normal" }}>Remove customer from database</div>
                    </div>
                  </button>

                </div>
              )}

              {/* TAB CONTENT: Edit Form */}
              {activeTab === "edit" && (
                <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="legacy-fieldset">
                    <div className="legacy-legend">Edit Customer details</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                      
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Full Name *:</label>
                        <input 
                          type="text" required className="legacy-input" style={{ flex: 1 }}
                          value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Mobile Number *:</label>
                        <input 
                          type="text" required pattern="[0-9]{10}" className="legacy-input" style={{ flex: 1 }}
                          value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Email:</label>
                        <input 
                          type="email" className="legacy-input" style={{ flex: 1 }}
                          value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start" }}>
                        <label style={{ width: "120px", marginTop: "2px" }}>Address:</label>
                        <textarea 
                          className="legacy-input" style={{ flex: 1, height: "40px", resize: "none" }}
                          value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Aadhaar Number:</label>
                        <input 
                          type="text" pattern="[0-9]{12}" className="legacy-input" style={{ flex: 1 }}
                          value={editForm.aadhaarNumber} onChange={e => setEditForm({...editForm, aadhaarNumber: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>PAN Number:</label>
                        <input 
                          type="text" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" className="legacy-input" style={{ flex: 1, textTransform: "uppercase" }}
                          value={editForm.panNumber} onChange={e => setEditForm({...editForm, panNumber: e.target.value.toUpperCase()})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Date of Birth:</label>
                        <input 
                          type="date" className="legacy-input" style={{ flex: 1 }}
                          value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Tags (csv):</label>
                        <input 
                          type="text" className="legacy-input" style={{ flex: 1 }} placeholder="VIP, Defaulter"
                          value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ width: "120px" }}>Rating (1-5):</label>
                        <input 
                          type="number" className="legacy-input" style={{ flex: 1 }} min="1" max="5"
                          value={editForm.rating} onChange={e => setEditForm({...editForm, rating: e.target.value})}
                        />
                      </div>

                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button type="button" className="legacy-button" onClick={() => setActiveTab("actions")}>Back</button>
                    <button type="submit" className="legacy-button" disabled={isSaving} style={{ fontWeight: "bold" }}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB CONTENT: Add New Service Form */}
              {activeTab === "new_service" && (
                <form onSubmit={handleServiceSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="legacy-fieldset">
                    <div className="legacy-legend">Configure New Service Request</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: "2px" }}>Service Type:</label>
                        <select
                          className="legacy-input" style={{ width: "100%" }}
                          value={serviceForm.serviceType}
                          onChange={e => applyServicePreset(e.target.value)}
                          required
                        >
                          <option value="">-- Select Service --</option>
                          {dbServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          <option value="Other">Other (Custom)</option>
                        </select>
                      </div>

                      {serviceForm.serviceType === "Other" && (
                        <div>
                          <label style={{ display: "block", marginBottom: "2px" }}>Specify Custom Service:</label>
                          <input 
                            type="text" required className="legacy-input" style={{ width: "100%" }}
                            value={customService} onChange={e => setCustomService(e.target.value)}
                          />
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "2px" }}>Fees (₹):</label>
                          <input 
                            type="number" className="legacy-input" style={{ width: "100%" }}
                            value={serviceForm.fees} onChange={e => setServiceForm({...serviceForm, fees: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "2px" }}>Payment Status:</label>
                          <select 
                            className="legacy-input" style={{ width: "100%" }}
                            value={serviceForm.paymentStatus} onChange={e => setServiceForm({...serviceForm, paymentStatus: e.target.value})}
                          >
                            <option value="UNPAID">Unpaid</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="PAID">Paid</option>
                          </select>
                        </div>
                      </div>

                      {serviceForm.paymentStatus === "PARTIAL" && (
                        <div>
                          <label style={{ display: "block", marginBottom: "2px" }}>Amount Paid (₹):</label>
                          <input 
                            type="number" className="legacy-input" style={{ width: "100%" }}
                            value={serviceForm.amountPaid} onChange={e => setServiceForm({...serviceForm, amountPaid: e.target.value})}
                            required
                            max={serviceForm.fees || undefined}
                          />
                        </div>
                      )}

                      <div>
                        <label style={{ display: "block", marginBottom: "2px" }}>Service Notes / Comments:</label>
                        <textarea 
                          className="legacy-input" style={{ width: "100%", height: "45px", resize: "none" }}
                          value={serviceForm.notes} onChange={e => setServiceForm({...serviceForm, notes: e.target.value})}
                        />
                      </div>

                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button type="button" className="legacy-button" onClick={() => setActiveTab("actions")}>Back</button>
                    <button type="submit" className="legacy-button" disabled={isCreatingService} style={{ fontWeight: "bold" }}>
                      {isCreatingService ? "Saving..." : "Create Service"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* Footer cancel */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px", background: "#c8c4bc", borderTop: "1px solid #999" }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="legacy-button"
              style={{ width: "70px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <NewBillDialog 
        isOpen={isNewBillOpen} 
        onClose={() => setIsNewBillOpen(false)} 
        defaultCustomer={customer} 
        zIndex={10005}
        onSuccess={() => {
          setIsNewBillOpen(false);
          toast.success("Invoice created! You can now print the bill.");
        }}
      />
    </>
  );
}
