"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Phone,
  Users,
  Loader2,
  ChevronRight,
  Download,
  Upload,
  MoreVertical,
  Star,
  Folder,
  CreditCard,
  MessageCircle,
  FileText,
  User,
  CheckSquare
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import AddCustomerDialog from "@/components/customers/AddCustomerDialog";
import CustomerActionsDialog from "@/components/customers/CustomerActionsDialog";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  createdAt: string;
  totalDues?: number;
  walletBalance?: number;
  rating?: number;
  tags?: string[];
  loyaltyPoints?: number;
  _count: { services: number; invoices: number; documents: number };
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = ["#4f6ef7", "#7c3aed", "#059669", "#ea580c", "#0891b2", "#9333ea"];
  return colors[name.charCodeAt(0) % colors.length];
}

function CustomerAvatar({ customer }: { customer: Customer }) {
  const color = getAvatarColor(customer.name);
  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
    >
      {getInitials(customer.name)}
    </div>
  );
}

function CustomerTable({ 
  customers, 
  onOpenAction, 
  selectedIds, 
  toggleSelect, 
  toggleSelectAll 
}: { 
  customers: Customer[]; 
  onOpenAction: (id: string, action?: string) => void;
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: (all: boolean) => void;
}) {
  const allSelected = customers.length > 0 && selectedIds.length === customers.length;
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderTop: "2px solid #808080",
        borderLeft: "2px solid #808080",
        borderRight: "2px solid #ffffff",
        borderBottom: "2px solid #ffffff",
        overflowX: "auto",
        boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
        minHeight: "400px" // give space for dropdowns
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "Tahoma, 'MS Sans Serif', sans-serif" }}>
        <thead>
          <tr style={{ backgroundColor: "#d4d0c8", borderBottom: "2px solid #808080" }}>
            <th style={{ padding: "6px 10px", width: "30px", borderRight: "1px solid #808080" }}>
              <input type="checkbox" checked={allSelected} onChange={(e) => toggleSelectAll(e.target.checked)} />
            </th>
            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Customer Name</th>
            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Contact & Tags</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Usage</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Khata (Balance)</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => {
            const isSelected = selectedIds.includes(customer.id);
            return (
            <tr
              key={customer.id}
              style={{
                backgroundColor: isSelected ? "#000080" : index % 2 === 0 ? "#ffffff" : "#f9f9f6",
                color: isSelected ? "#ffffff" : "#000000",
                borderBottom: "1px solid #e2e8f0",
              }}
              onMouseEnter={() => setHoveredCustomer(customer.id)}
              onMouseLeave={() => setHoveredCustomer(null)}
            >
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(customer.id)} />
              </td>
              <td style={{ padding: "8px 10px", position: "relative" }}>
                <div style={{ fontWeight: "bold", fontSize: "13px", cursor: "pointer" }} onClick={() => onOpenAction(customer.id, "profile")}>
                  {customer.name}
                  {customer.rating && (
                    <span style={{ marginLeft: "4px", color: isSelected ? "#fbbf24" : "#d97706", fontSize: "10px" }}>
                      {Array.from({length: customer.rating}).map((_, i) => "★").join("")}
                    </span>
                  )}
                </div>
                {customer.aadhaarNumber && (
                  <div style={{ fontSize: "10px", color: isSelected ? "#d1d5db" : "#666" }}>Aadhaar: {customer.aadhaarNumber}</div>
                )}
                
                {/* Quick Peek Hover Tooltip */}
                {hoveredCustomer === customer.id && (
                  <div style={{
                    position: "absolute", top: "100%", left: "10px", zIndex: 10,
                    background: "#ffffe1", border: "1px solid #000", padding: "8px",
                    boxShadow: "2px 2px 5px rgba(0,0,0,0.2)", width: "220px", fontSize: "11px",
                    color: "#000000"
                  }}>
                    <strong>Quick Peek:</strong><br/>
                    Registered: {formatRelativeTime(customer.createdAt)}<br/>
                    Wallet: ₹{customer.walletBalance || 0}<br/>
                    Points: {customer.loyaltyPoints || 0} 🎁<br/>
                    Documents Vault: {customer._count?.documents || 0} files
                  </div>
                )}
              </td>
              <td style={{ padding: "8px 10px" }}>
                <div style={{ fontWeight: "bold" }}>📞 {customer.mobile}</div>
                <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                  {customer.tags?.map(tag => (
                    <span key={tag} style={{ background: tag.toLowerCase() === "vip" ? "#fef08a" : tag.toLowerCase() === "defaulter" ? "#fecaca" : "#e2e8f0", 
                      color: tag.toLowerCase() === "vip" ? "#854d0e" : tag.toLowerCase() === "defaulter" ? "#991b1b" : "#475569", 
                      padding: "1px 4px", fontSize: "9px", fontWeight: "bold", border: "1px solid #94a3b8" }}>
                      {tag}
                    </span>
                  ))}
                  {(!customer.tags || customer.tags.length === 0) && <span style={{ fontSize: "10px", color: isSelected ? "#a1a1aa" : "#999" }}>No Tags</span>}
                </div>
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                  <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", border: "1px solid #bae6fd", fontSize: "10px", width: "80px" }}>
                    {customer._count.services} Services
                  </span>
                  <span style={{ background: "#dcfce7", color: "#15803d", padding: "1px 6px", border: "1px solid #bbf7d0", fontSize: "10px", width: "80px" }}>
                    {customer._count.invoices} Invoices
                  </span>
                  {customer._count.documents > 0 && (
                    <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "1px 6px", border: "1px solid #d8b4fe", fontSize: "10px", width: "80px" }}>
                      📁 {customer._count.documents} Docs
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                {customer.totalDues && customer.totalDues > 0 ? (
                  <div style={{ color: isSelected ? "#fca5a5" : "#dc2626", fontWeight: "bold" }}>Due: ₹{customer.totalDues}</div>
                ) : customer.walletBalance && customer.walletBalance > 0 ? (
                  <div style={{ color: isSelected ? "#86efac" : "#16a34a", fontWeight: "bold" }}>Wallet: ₹{customer.walletBalance}</div>
                ) : (
                  <div style={{ color: isSelected ? "#cbd5e1" : "#64748b" }}>₹0</div>
                )}
                {customer.loyaltyPoints && customer.loyaltyPoints > 0 ? (
                  <div style={{ fontSize: "10px", color: isSelected ? "#fde047" : "#ca8a04", marginTop: "2px" }}>🎁 {customer.loyaltyPoints} Pts</div>
                ) : null}
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center", position: "relative" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === customer.id ? null : customer.id);
                  }}
                  style={{
                    backgroundColor: "#d4d0c8",
                    borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040",
                    padding: "3px 6px", fontWeight: "bold", fontSize: "11px", color: "#000000", cursor: "pointer",
                    display: "flex", alignItems: "center", margin: "0 auto"
                  }}
                >
                  Action <MoreVertical size={12} style={{ marginLeft: "4px" }} />
                </button>
                
                {/* Context Menu Dropdown */}
                {openMenuId === customer.id && (
                  <div 
                    style={{
                      position: "absolute", top: "100%", right: "10px", zIndex: 50,
                      background: "#d4d0c8", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040",
                      width: "160px", textAlign: "left", padding: "2px"
                    }}
                  >
                    {[
                      { icon: <User size={12}/>, label: "View Ledger Profile", action: "profile" },
                      { icon: <Plus size={12}/>, label: "Add New Service", action: "service" },
                      { icon: <FileText size={12}/>, label: "Create Invoice", action: "invoice" },
                      { icon: <MessageCircle size={12}/>, label: "WhatsApp Chat", action: "whatsapp" },
                      { icon: <Folder size={12}/>, label: "Document Vault", action: "vault" },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { setOpenMenuId(null); onOpenAction(customer.id, item.action); }}
                        style={{ padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#000080", e.currentTarget.style.color = "#fff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "#000")}
                      >
                        {item.icon} {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();
  const toast = useToast();

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [actionTab, setActionTab] = useState<string>("actions");
  
  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}&page=${page}&limit=20`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [query, page, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(customers.map(c => c.id));
    else setSelectedIds([]);
  };

  const handleBulkWhatsApp = () => {
    if (selectedIds.length === 0) return toast.error("Select customers first");
    toast.success(`Opening Bulk WhatsApp for ${selectedIds.length} customers...`);
    // Ideally this would open a dialog to type a message and then loop through WA links or use an API
  };

  const handleImport = () => {
    // Just a placeholder for import action
    toast.info("Import feature opening... (Please upload CSV)");
  };

  const openActionDialog = (id: string, actionType?: string) => {
    if (actionType === "profile") {
      router.push(`/customers/${id}`);
      return;
    }
    if (actionType === "whatsapp") {
      const customer = customers.find(c => c.id === id);
      if (customer?.mobile) {
        window.open(`https://wa.me/91${customer.mobile}?text=${encodeURIComponent(`Hello ${customer.name},\n`)}`, "_blank");
      }
      return;
    }
    
    setSelectedCustomerId(id);
    setIsActionsOpen(true);
    
    // Pass the intention to the dialog (we will need to modify the dialog slightly if we want it to auto-open a tab)
    // For now we just open it.
  };

  return (
    <div className="page-shell page-shell-list">
      <PageHeader
        title="CRM & Customers"
        subtitle={`${total} registered customers`}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={handleImport}>
              <Upload size={16} /> Import
            </button>
            <button type="button" className="btn-secondary">
              <Download size={16} /> Export
            </button>
            <button type="button" onClick={() => setIsAddCustomerOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Customer
            </button>
          </>
        }
      />
      <AddCustomerDialog 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)} 
        onSuccess={() => fetchCustomers()}
      />

      <CustomerActionsDialog
        isOpen={isActionsOpen}
        onClose={() => { setIsActionsOpen(false); setSelectedCustomerId(null); }}
        customerId={selectedCustomerId}
        onSuccess={() => fetchCustomers()}
      />

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="search-field">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, mobile, Aadhaar..."
            className="input-field"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
        
        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#e0f2fe', padding: '2px 8px', border: '1px solid #7dd3fc' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>{selectedIds.length} Selected</span>
            <button onClick={handleBulkWhatsApp} className="legacy-button" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#25d366', color: 'white' }}>
              <MessageCircle size={12} /> Bulk WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <Users size={56} className="empty-state-icon" />
          <div className="empty-state-title">No customers found</div>
          <div className="empty-state-desc">{query ? `No results for "${query}"` : "Add your first customer to get started"}</div>
          {!query && (
            <button onClick={() => setIsAddCustomerOpen(true)} className="btn-primary mt-4">
              <Plus size={16} /> Add First Customer
            </button>
          )}
        </div>
      ) : (
        <>
          <CustomerTable 
            customers={customers} 
            onOpenAction={openActionDialog} 
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
          />

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 20)}</span>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
