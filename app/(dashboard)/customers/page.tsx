"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Phone,
  Users,
  Loader2,
  ChevronRight,
  Download,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import AddCustomerDialog from "@/components/customers/AddCustomerDialog";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  createdAt: string;
  _count: { services: number; invoices: number };
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

function CustomerMobileCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  return (
    <button className="glass-card p-4 text-left w-full" onClick={onClick}>
      <div className="flex items-center gap-3">
        <CustomerAvatar customer={customer} />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
            {customer.name}
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <Phone size={11} />
            {customer.mobile}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="rounded-xl p-2" style={{ background: "var(--bg-secondary)" }}>
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {customer._count.services}
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Services
          </div>
        </div>
        <div className="rounded-xl p-2" style={{ background: "var(--bg-secondary)" }}>
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {customer._count.invoices}
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Invoices
          </div>
        </div>
        <div className="rounded-xl p-2" style={{ background: "var(--bg-secondary)" }}>
          <div className="text-sm font-bold" style={{ color: "#10b981" }}>
            Active
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Status
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Last activity {formatRelativeTime(customer.createdAt)}
      </div>
    </button>
  );
}

function CustomerTable({ customers, onOpen }: { customers: Customer[]; onOpen: (id: string) => void }) {
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
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "Tahoma, 'MS Sans Serif', sans-serif" }}>
        <thead>
          <tr style={{ backgroundColor: "#d4d0c8", borderBottom: "2px solid #808080" }}>
            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Customer Name</th>
            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Mobile / Contact</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Services</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Invoices</th>
            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Registered Date</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Status</th>
            <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", color: "#000000" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id}
              onClick={() => onOpen(customer.id)}
              style={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f6",
                borderBottom: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
              className="hover:bg-blue-50 transition-colors"
            >
              <td style={{ padding: "8px 10px" }}>
                <div style={{ fontWeight: "bold", color: "#000080", fontSize: "13px" }}>{customer.name}</div>
                {customer.aadhaarNumber && (
                  <div style={{ fontSize: "10px", color: "#64748b" }}>Aadhaar: {customer.aadhaarNumber}</div>
                )}
              </td>
              <td style={{ padding: "8px 10px" }}>
                <div style={{ fontWeight: "bold", color: "#0f172a" }}>📞 {customer.mobile}</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>{customer.email || "No email"}</div>
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                <span style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: "bold", padding: "2px 8px", borderRadius: "3px", border: "1px solid #bae6fd", fontSize: "11px" }}>
                  {customer._count.services} Services
                </span>
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: "bold", padding: "2px 8px", borderRadius: "3px", border: "1px solid #bbf7d0", fontSize: "11px" }}>
                  {customer._count.invoices} Invoices
                </span>
              </td>
              <td style={{ padding: "8px 10px", color: "#475569" }}>
                {formatRelativeTime(customer.createdAt)}
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                <span style={{ background: "#166534", color: "#ffffff", fontWeight: "bold", padding: "2px 8px", borderRadius: "2px", fontSize: "10px" }}>
                  ACTIVE
                </span>
              </td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(customer.id);
                  }}
                  style={{
                    backgroundColor: "#d4d0c8",
                    borderTop: "2px solid #ffffff",
                    borderLeft: "2px solid #ffffff",
                    borderRight: "2px solid #404040",
                    borderBottom: "2px solid #404040",
                    padding: "3px 10px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  Open →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerCards({ customers, onOpen }: { customers: Customer[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:hidden">
      {customers.map((customer) => (
        <CustomerMobileCard key={customer.id} customer={customer} onClick={() => onOpen(customer.id)} />
      ))}
    </div>
  );
}

function CustomerResults({ customers, onOpen }: { customers: Customer[]; onOpen: (id: string) => void }) {
  return (
    <>
      <CustomerTable customers={customers} onOpen={onOpen} />
      <CustomerCards customers={customers} onOpen={onOpen} />
    </>
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

  const customerLabel = total === 1 ? "1 registered customer" : `${total} registered customers`;

  return (
    <div className="page-shell page-shell-list">
      <PageHeader
        title="Customers"
        subtitle={customerLabel}
        actions={
          <>
            <button type="button" className="btn-secondary">
              <Download size={16} />
              Export
            </button>
            <button type="button" onClick={() => setIsAddCustomerOpen(true)} className="btn-primary">
              <Plus size={16} />
              Add Customer
            </button>
          </>
        }
      />
      <AddCustomerDialog 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)} 
        onSuccess={() => {
          fetchCustomers();
        }}
      />

      {/* Search */}
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, mobile, Aadhaar, or PAN..."
            className="input-field"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
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
          <div className="empty-state-desc">
            {query ? `No results for "${query}"` : "Add your first customer to get started"}
          </div>
          {!query && (
            <Link href="/customers/new" className="btn-primary mt-4">
              <Plus size={16} />
              Add First Customer
            </Link>
          )}
        </div>
      ) : (
        <>
          <CustomerResults customers={customers} onOpen={(id) => router.push(`/customers/${id}`)} />

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                className="btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
