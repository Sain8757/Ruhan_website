"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Loader2, Printer, IndianRupee, Edit3, Download } from "lucide-react";
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

  const handleExportCSV = () => {
    if (!invoices || invoices.length === 0) {
      toast.error("No invoices available to export");
      return;
    }
    const headers = ["Invoice Number", "Date", "Customer Name", "Mobile", "Subtotal (INR)", "Discount (INR)", "GST (%)", "Total Amount (INR)", "Amount Paid (INR)", "Balance Due (INR)", "Payment Mode", "Payment Status"];
    const rows = invoices.map(inv => [
      `"${inv.invoiceNumber}"`,
      `"${new Date(inv.createdAt).toLocaleDateString("en-IN")}"`,
      `"${inv.customer.name.replace(/"/g, '""')}"`,
      `"${inv.customer.mobile}"`,
      inv.subtotal || 0,
      inv.discount || 0,
      inv.gst || 0,
      inv.total || 0,
      inv.amountPaid || 0,
      Math.max(0, inv.total - (inv.amountPaid || 0)),
      `"${inv.paymentMode}"`,
      `"${inv.paymentStatus}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RA_Seva_Point_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sales report exported successfully!");
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
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex items-center gap-1 text-xs font-bold" onClick={handleExportCSV}>
              <Download size={14} />
              Export Sales (CSV)
            </button>
            <button type="button" className="btn-primary flex items-center gap-1 text-xs font-bold" onClick={() => setIsNewBillOpen(true)}>
              <Plus size={16} />
              Create Invoice
            </button>
          </div>
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
                  <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Invoice #</th>
                  <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Customer Name</th>
                  <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Items</th>
                  <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Payment Status</th>
                  <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Mode</th>
                  <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Total Amount</th>
                  <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #808080", color: "#000000" }}>Date</th>
                  <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", color: "#000000" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, index) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/billing/${inv.id}`)}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f6",
                      borderBottom: "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td style={{ padding: "8px 10px", fontWeight: "bold", color: "#000080" }}>
                      #{inv.invoiceNumber}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: "bold", color: "#0f172a" }}>{inv.customer.name}</div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>📞 {inv.customer.mobile}</div>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center", color: "#334155" }}>
                      {inv.items.length} item{inv.items.length !== 1 ? "s" : ""}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      <span
                        style={{
                          background: inv.paymentStatus === "PAID" ? "#166534" : inv.paymentStatus === "PARTIAL" ? "#ca8a04" : "#dc2626",
                          color: "#ffffff",
                          fontWeight: "bold",
                          padding: "2px 8px",
                          borderRadius: "2px",
                          fontSize: "10px",
                        }}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "bold", color: "#475569" }}>
                      {PAYMENT_MODE_LABELS[inv.paymentMode] || inv.paymentMode}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "900", color: "#0f172a" }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>
                      {formatDate(inv.createdAt)}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <Link
                          href={`/billing/${inv.id}`}
                          style={{
                            backgroundColor: "#d4d0c8",
                            borderTop: "2px solid #ffffff",
                            borderLeft: "2px solid #ffffff",
                            borderRight: "2px solid #404040",
                            borderBottom: "2px solid #404040",
                            padding: "2px 6px",
                            fontWeight: "bold",
                            fontSize: "11px",
                            color: "#000000",
                            textDecoration: "none",
                          }}
                        >
                          View
                        </Link>
                        {inv.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => handleSettleInvoice(inv)}
                            style={{
                              backgroundColor: "#166534",
                              color: "#ffffff",
                              borderTop: "2px solid #ffffff",
                              borderLeft: "2px solid #ffffff",
                              borderRight: "2px solid #14532d",
                              borderBottom: "2px solid #14532d",
                              padding: "2px 6px",
                              fontWeight: "bold",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            Settle
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInvoiceId(inv.id);
                          }}
                          style={{
                            backgroundColor: "#d4d0c8",
                            borderTop: "2px solid #ffffff",
                            borderLeft: "2px solid #ffffff",
                            borderRight: "2px solid #404040",
                            borderBottom: "2px solid #404040",
                            padding: "2px 6px",
                            fontWeight: "bold",
                            fontSize: "11px",
                            color: "#000000",
                            cursor: "pointer",
                          }}
                          title="Edit Invoice"
                        >
                          Edit
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
