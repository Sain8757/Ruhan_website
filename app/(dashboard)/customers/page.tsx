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
    <div className="hidden md:block table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Contact</th>
            <th>Services</th>
            <th>Invoices</th>
            <th>Last Activity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="cursor-pointer" onClick={() => onOpen(customer.id)}>
              <td>
                <div className="flex items-center gap-3">
                  <CustomerAvatar customer={customer} />
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {customer.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      Registered customer
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {customer.mobile}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {customer.email || "No email added"}
                </div>
              </td>
              <td>
                <span className="badge badge-submitted">{customer._count.services} services</span>
              </td>
              <td>
                <span className="badge badge-paid">{customer._count.invoices} invoices</span>
              </td>
              <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                {formatRelativeTime(customer.createdAt)}
              </td>
              <td>
                <span className="badge badge-approved">Active</span>
              </td>
              <td>
                <button
                  type="button"
                  className="btn-ghost p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(customer.id);
                  }}
                  title="Open customer"
                >
                  <ChevronRight size={16} />
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
