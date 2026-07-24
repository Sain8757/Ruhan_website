"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Loader2, Printer, IndianRupee, Edit3 } from "lucide-react";
import { formatCurrency, formatDate, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import SettleModal, { SettleInvoiceData } from "./SettleModal";
import NewBillDialog from "@/components/billing/NewBillDialog";
import EditBillDialog from "@/components/billing/EditBillDialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  amountPaid: number;
  paymentMode: string;
  paymentStatus: string;
  createdAt: string;
  customer: { id: string; name: string; mobile: string };
  items: any[];
}

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  PENDING: "Pending",
};

function BillingContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("paymentStatus") || "");
  const [settleInvoice, setSettleInvoice] = useState<SettleInvoiceData | null>(null);
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const limit = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter) params.set("paymentStatus", statusFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [query, page, statusFilter, toast]);

  const handleSettleInvoice = (invoice: Invoice) => {
    setSettleInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      total: invoice.total,
      amountPaid: invoice.amountPaid || 0,
    });
  };

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-shell page-shell-list">
      <PageHeader
        title="Billing & Invoices"
        subtitle={`${total} total invoice${total === 1 ? "" : "s"} generated`}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsNewBillOpen(true)}>
            <Plus size={16} />
            Create Invoice
          </button>
        }
      />
      <NewBillDialog
        isOpen={isNewBillOpen}
        onClose={() => setIsNewBillOpen(false)}
        onSuccess={fetchInvoices}
      />

      {/* Search & Filters */}
      <div className="toolbar">
        <div className="search-field">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or mobile..."
            className="input-field"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Payment Status Filter */}
        <select
          className="input-field"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <FileText size={56} className="empty-state-icon" />
          <div className="empty-state-title">No invoices found</div>
          <div className="empty-state-desc">
            {query || statusFilter
              ? "No results match your search/filter criteria."
              : "Create your first invoice to record a sale."}
          </div>
          {!query && !statusFilter && (
            <button type="button" onClick={() => setIsNewBillOpen(true)} className="btn-primary mt-4">
              <Plus size={16} />
              Create Invoice
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment Status</th>
                  <th>Mode</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/billing/${inv.id}`)}
                  >
                    <td className="font-mono font-bold text-sm" style={{ color: "var(--brand-primary)" }}>
                      #{inv.invoiceNumber}
                    </td>
                    <td>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {inv.customer.name}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {inv.customer.mobile}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {inv.items.length} item{inv.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {PAYMENT_MODE_LABELS[inv.paymentMode] || inv.paymentMode}
                      </span>
                    </td>
                    <td className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      <span className="flex items-center gap-1">
                        <IndianRupee size={12} />
                        {inv.total.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {formatDate(inv.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {inv.paymentStatus !== "PAID" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSettleInvoice(inv);
                            }}
                            className="btn-secondary px-2 py-1 text-xs flex items-center gap-1"
                            style={{ color: "#059669", backgroundColor: "rgba(5, 150, 105, 0.1)", borderColor: "rgba(5, 150, 105, 0.2)" }}
                            title="Settle Payment"
                          >
                            <IndianRupee size={12} /> Settle
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInvoiceId(inv.id);
                          }}
                          className="btn-ghost p-1.5 rounded-lg"
                          title="Edit Invoice"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/billing/${inv.id}`);
                          }}
                          className="btn-ghost p-1.5 rounded-lg"
                          title="View & Print"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {page} / {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <SettleModal 
        isOpen={!!settleInvoice}
        onClose={() => setSettleInvoice(null)}
        invoice={settleInvoice}
        onSuccess={() => {
          toast.success("Payment settled successfully");
          fetchInvoices();
        }}
      />

      <EditBillDialog
        isOpen={!!editingInvoiceId}
        onClose={() => setEditingInvoiceId(null)}
        invoiceId={editingInvoiceId}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
