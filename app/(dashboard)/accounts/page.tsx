"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, TrendingUp, TrendingDown, IndianRupee, ArrowUpRight, ArrowDownRight,
  FileText, Loader2, Download, RefreshCw, ChevronRight, X, Printer,
  BarChart3, Wallet, Receipt, Calendar, AlertCircle, CheckCircle2,
  CreditCard, Smartphone, Banknote, Building2, Edit3
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/contexts/ToastContext";

// ─── Types ─────────────────────────────────────────────────────────────────

interface PLData {
  dateRange: { from: string; to: string };
  revenue: {
    productSales: number;
    serviceSales: number;
    manualIncome: number;
    manualIncomeBreakdown: { category: string; amount: number }[];
    total: number;
  };
  cogs: { inventoryCost: number; vendorCost: number; vendorPayments: number; total: number };
  grossProfit: number;
  grossMarginPercent: number;
  expenses: { breakdown: { category: string; amount: number }[]; total: number };
  netProfit: number;
  netMarginPercent: number;
  totalPaymentsReceived: number;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  type: "PAYMENT" | "INCOME" | "EXPENSE" | "VENDOR";
  category: string;
  reference: string;
  paymentMode?: string;
}

interface LedgerData {
  ledger: LedgerEntry[];
  summary: { totalCredit: number; totalDebit: number; netBalance: number; entryCount: number };
}

interface GSTData {
  period: string;
  summary: {
    totalInvoicesWithGST: number;
    totalTaxableAmount: number;
    totalOutputGST: number;
    totalInputGST: number;
    cgst: number;
    sgst: number;
    netGSTPayable: number;
  };
  breakdown: { rate: number; taxableAmount: number; gstAmount: number; count: number }[];
  invoices: {
    invoiceNumber: string; date: string; customer: string;
    taxableAmount: number; gstRate: number; gstAmount: number;
    total: number; paymentStatus: string;
  }[];
}

interface CashFlowData {
  dailyFlow: {
    date: string; displayDate: string;
    opening: number; cashIn: number; cashOut: number; net: number; closing: number;
    cashBreakdown: { cash: number; upi: number; card: number; total: number };
  }[];
  summary: {
    totalCashIn: number; totalCashOut: number; netCashFlow: number;
    openingBalance: number; closingBalance: number;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const TABS = ["P&L Statement", "Balance Sheet", "Ledger", "Cash Flow", "GST Summary"] as const;
type Tab = (typeof TABS)[number];

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        fontWeight: active ? "bold" : "normal",
        fontSize: "12px",
        background: active ? "#000080" : "#d4d0c8",
        color: active ? "#fff" : "#000",
        borderTop: active ? "2px solid #fff" : "2px solid #fff",
        borderLeft: active ? "2px solid #fff" : "2px solid #fff",
        borderRight: active ? "2px solid #404040" : "2px solid #404040",
        borderBottom: active ? "2px solid #000080" : "2px solid #404040",
        cursor: "pointer",
        marginRight: "2px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function StatCard({
  label, value, sub, color = "#000080", icon: Icon, negative
}: {
  label: string; value: string; sub?: string;
  color?: string; icon: any; negative?: boolean;
}) {
  return (
    <div style={{
      background: "#fff",
      borderTop: "2px solid #808080",
      borderLeft: "2px solid #808080",
      borderRight: "2px solid #fff",
      borderBottom: "2px solid #fff",
      padding: "12px 14px",
      boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)",
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 11, color: "#444", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: negative ? "#dc2626" : color, letterSpacing: "-0.5px" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── P&L Tab ───────────────────────────────────────────────────────────────

function PLTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/accounts/pl-statement?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("P&L load karne mein error"))
      .finally(() => setLoading(false));
  }, [from, to]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Category", "Amount (INR)"],
      ["REVENUE", ""],
      ["Product Sales", data.revenue.productSales],
      ["Service Revenue", data.revenue.serviceSales],
      ["Other Income", data.revenue.manualIncome],
      ["Total Revenue", data.revenue.total],
      ["", ""],
      ["COST OF GOODS SOLD (COGS)", ""],
      ["Inventory Cost", data.cogs.inventoryCost],
      ["Vendor Cost", data.cogs.vendorCost],
      ["Total COGS", data.cogs.total],
      ["", ""],
      ["Gross Profit", data.grossProfit],
      ["Gross Margin %", data.grossMarginPercent + "%"],
      ["", ""],
      ["EXPENSES", ""],
      ...data.expenses.breakdown.map((e) => [e.category, e.amount]),
      ["Total Expenses", data.expenses.total],
      ["", ""],
      ["NET PROFIT", data.netProfit],
      ["Net Margin %", data.netMarginPercent + "%"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PL_Statement_${from}_to_${to}.csv`;
    a.click();
    toast.success("P&L CSV exported!");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#000080", margin: "0 auto" }} /></div>;
  if (!data) return <div style={{ padding: 20, color: "red" }}>Data load nahi hua</div>;

  const isProfit = data.netProfit >= 0;

  return (
    <div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 11, fontWeight: "bold", background: "#d4d0c8", borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", cursor: "pointer" }}>
          <Download size={12} /> Export CSV
        </button>
        <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 11, fontWeight: "bold", background: "#d4d0c8", borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", cursor: "pointer" }}>
          <Printer size={12} /> Print
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        <StatCard label="Total Revenue" value={fmt(data.revenue.total)} sub="Billings + Income" color="#166534" icon={TrendingUp} />
        <StatCard label="Total COGS" value={fmt(data.cogs.total)} sub="Inventory + Vendor" color="#7e3af2" icon={ArrowDownRight} />
        <StatCard label="Gross Profit" value={fmt(data.grossProfit)} sub={`${data.grossMarginPercent}% margin`} color="#d97706" icon={BarChart3} />
        <StatCard
          label="Net Profit"
          value={(isProfit ? "+" : "-") + fmt(data.netProfit)}
          sub={`${data.netMarginPercent}% net margin`}
          color={isProfit ? "#166534" : "#dc2626"}
          icon={isProfit ? CheckCircle2 : AlertCircle}
          negative={!isProfit}
        />
      </div>

      {/* Tally-style P&L Table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* LEFT: Expenditure */}
        <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff" }}>
          <div style={{ background: "#000080", color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
            📤 Expenditure (Dr)
          </div>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#d4d0c8", borderBottom: "1px solid #808080" }}>
                <th style={{ padding: "5px 10px", textAlign: "left" }}>Particulars</th>
                <th style={{ padding: "5px 10px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "#f0f0e8" }}>
                <td style={{ padding: "4px 10px", fontWeight: "bold", color: "#444" }}>Cost of Goods Sold</td>
                <td></td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Inventory Cost</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.cogs.inventoryCost)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Vendor Payments</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.cogs.vendorCost + data.cogs.vendorPayments)}</td>
              </tr>
              <tr style={{ borderTop: "1px solid #ccc", background: "#f9f9f0" }}>
                <td style={{ padding: "4px 10px", fontWeight: "bold" }}>Total COGS</td>
                <td style={{ padding: "4px 10px", textAlign: "right", fontWeight: "bold" }}>{fmt(data.cogs.total)}</td>
              </tr>

              <tr><td colSpan={2} style={{ padding: "8px 10px 2px", fontWeight: "bold", color: "#444", background: "#f0f0e8" }}>Operating Expenses</td></tr>
              {data.expenses.breakdown.map((e) => (
                <tr key={e.category}>
                  <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>{e.category}</td>
                  <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(e.amount)}</td>
                </tr>
              ))}
              {data.expenses.breakdown.length === 0 && (
                <tr><td colSpan={2} style={{ padding: "6px 10px", color: "#999", fontSize: 11 }}>No expenses logged</td></tr>
              )}
              <tr style={{ borderTop: "1px solid #ccc", background: "#f9f9f0" }}>
                <td style={{ padding: "4px 10px", fontWeight: "bold" }}>Total Expenses</td>
                <td style={{ padding: "4px 10px", textAlign: "right", fontWeight: "bold" }}>{fmt(data.expenses.total)}</td>
              </tr>

              {isProfit && (
                <tr style={{ borderTop: "2px solid #000", background: "#e8f5e9" }}>
                  <td style={{ padding: "6px 10px", fontWeight: "900", color: "#166534" }}>NET PROFIT (transferred)</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900", color: "#166534" }}>{fmt(data.netProfit)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: "#d4d0c8", borderTop: "2px solid #808080" }}>
                <td style={{ padding: "6px 10px", fontWeight: "900" }}>TOTAL</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900" }}>{fmt(data.revenue.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* RIGHT: Income */}
        <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff" }}>
          <div style={{ background: "#166534", color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
            📥 Income (Cr)
          </div>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#d4d0c8", borderBottom: "1px solid #808080" }}>
                <th style={{ padding: "5px 10px", textAlign: "left" }}>Particulars</th>
                <th style={{ padding: "5px 10px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "#f0f0e8" }}>
                <td style={{ padding: "4px 10px", fontWeight: "bold", color: "#444" }}>Trading Account</td>
                <td></td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Product/Inventory Sales</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.revenue.productSales)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Service Revenue</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.revenue.serviceSales)}</td>
              </tr>
              <tr style={{ borderTop: "1px solid #ccc", background: "#f9f9f0" }}>
                <td style={{ padding: "4px 10px", fontWeight: "bold" }}>Gross Profit (b/d)</td>
                <td style={{ padding: "4px 10px", textAlign: "right", fontWeight: "bold", color: "#d97706" }}>{fmt(data.grossProfit)}</td>
              </tr>

              {data.revenue.manualIncomeBreakdown.length > 0 && (
                <>
                  <tr><td colSpan={2} style={{ padding: "8px 10px 2px", fontWeight: "bold", color: "#444", background: "#f0f0e8" }}>Other Income</td></tr>
                  {data.revenue.manualIncomeBreakdown.map((m) => (
                    <tr key={m.category}>
                      <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>{m.category}</td>
                      <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(m.amount)}</td>
                    </tr>
                  ))}
                </>
              )}

              {!isProfit && (
                <tr style={{ borderTop: "2px solid #000", background: "#fef2f2" }}>
                  <td style={{ padding: "6px 10px", fontWeight: "900", color: "#dc2626" }}>NET LOSS (c/d)</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900", color: "#dc2626" }}>{fmt(Math.abs(data.netProfit))}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: "#d4d0c8", borderTop: "2px solid #808080" }}>
                <td style={{ padding: "6px 10px", fontWeight: "900" }}>TOTAL</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900" }}>{fmt(data.revenue.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Net Profit Banner */}
      <div style={{
        marginTop: 12, padding: "10px 16px",
        background: isProfit ? "#dcfce7" : "#fef2f2",
        border: `2px solid ${isProfit ? "#166534" : "#dc2626"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontWeight: 900, fontSize: 14, color: isProfit ? "#166534" : "#dc2626" }}>
          {isProfit ? "✅ NET PROFIT" : "❌ NET LOSS"}
        </span>
        <span style={{ fontWeight: 900, fontSize: 18, color: isProfit ? "#166534" : "#dc2626" }}>
          {(isProfit ? "+" : "-")}{fmt(data.netProfit)} ({data.netMarginPercent}% margin)
        </span>
      </div>
    </div>
  );
}

// ─── Ledger Tab ─────────────────────────────────────────────────────────────

function LedgerTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/accounts/ledger?from=${from}&to=${to}&type=${typeFilter}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Ledger load nahi hua"))
      .finally(() => setLoading(false));
  }, [from, to, typeFilter]);

  const TYPE_COLORS: Record<string, string> = {
    PAYMENT: "#166534",
    INCOME: "#1d4ed8",
    EXPENSE: "#dc2626",
    VENDOR: "#d97706",
  };

  const TYPE_LABELS: Record<string, string> = {
    PAYMENT: "Payment",
    INCOME: "Income",
    EXPENSE: "Expense",
    VENDOR: "Vendor",
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#000080", margin: "0 auto" }} /></div>;
  if (!data) return <div style={{ padding: 20, color: "red" }}>Data load nahi hua</div>;

  return (
    <div>
      {/* Summary + Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ color: "#166534", fontWeight: "bold" }}>Total Credit: {fmt(data.summary.totalCredit)}</span>
          <span style={{ color: "#dc2626", fontWeight: "bold" }}>Total Debit: {fmt(data.summary.totalDebit)}</span>
          <span style={{ color: "#000080", fontWeight: "bold" }}>Net: {fmt(data.summary.netBalance)}</span>
          <span style={{ color: "#555" }}>{data.summary.entryCount} entries</span>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ fontSize: 11, padding: "2px 6px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff", background: "#fff" }}
        >
          <option value="all">All Types</option>
          <option value="payment">Payments Only</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
      </div>

      <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff", maxHeight: "55vh", overflowY: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", fontFamily: "Tahoma, sans-serif" }}>
          <thead>
            <tr style={{ background: "#d4d0c8", borderBottom: "2px solid #808080", position: "sticky", top: 0 }}>
              <th style={{ padding: "5px 8px", textAlign: "left", borderRight: "1px solid #808080" }}>Date</th>
              <th style={{ padding: "5px 8px", textAlign: "left", borderRight: "1px solid #808080" }}>Particulars</th>
              <th style={{ padding: "5px 8px", textAlign: "left", borderRight: "1px solid #808080" }}>Type</th>
              <th style={{ padding: "5px 8px", textAlign: "right", borderRight: "1px solid #808080" }}>Credit (₹)</th>
              <th style={{ padding: "5px 8px", textAlign: "right", borderRight: "1px solid #808080" }}>Debit (₹)</th>
              <th style={{ padding: "5px 8px", textAlign: "right" }}>Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.ledger.map((entry, idx) => (
              <tr key={entry.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9f9f6", borderBottom: "1px solid #e8e8e8" }}>
                <td style={{ padding: "5px 8px", borderRight: "1px solid #e8e8e8", whiteSpace: "nowrap" }}>
                  {new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                </td>
                <td style={{ padding: "5px 8px", borderRight: "1px solid #e8e8e8", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.description}
                  {entry.paymentMode && (
                    <span style={{ marginLeft: 4, fontSize: 9, background: "#d4d0c8", padding: "1px 4px" }}>
                      {entry.paymentMode}
                    </span>
                  )}
                </td>
                <td style={{ padding: "5px 8px", borderRight: "1px solid #e8e8e8" }}>
                  <span style={{ fontSize: 9, fontWeight: "bold", color: "#fff", background: TYPE_COLORS[entry.type], padding: "1px 5px" }}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                </td>
                <td style={{ padding: "5px 8px", textAlign: "right", borderRight: "1px solid #e8e8e8", color: "#166534", fontWeight: entry.credit > 0 ? "bold" : "normal" }}>
                  {entry.credit > 0 ? fmt(entry.credit) : "—"}
                </td>
                <td style={{ padding: "5px 8px", textAlign: "right", borderRight: "1px solid #e8e8e8", color: "#dc2626", fontWeight: entry.debit > 0 ? "bold" : "normal" }}>
                  {entry.debit > 0 ? fmt(entry.debit) : "—"}
                </td>
                <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "bold", color: entry.balance >= 0 ? "#166534" : "#dc2626" }}>
                  {entry.balance < 0 ? "-" : ""}{fmt(entry.balance)}
                </td>
              </tr>
            ))}
            {data.ledger.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#999" }}>Is period mein koi transaction nahi mili</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Cash Flow Tab ──────────────────────────────────────────────────────────

function CashFlowTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingOb, setEditingOb] = useState<{ date: string; amount: number } | null>(null);
  const toast = useToast();

  const fetchCashFlow = useCallback(() => {
    setLoading(true);
    fetch(`/api/accounts/cash-flow?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Cash Flow load nahi hua"))
      .finally(() => setLoading(false));
  }, [from, to, toast]);

  useEffect(() => {
    fetchCashFlow();
  }, [fetchCashFlow]);

  const handleUpdateOb = async () => {
    if (!editingOb) return;
    try {
      const res = await fetch("/api/accounts/cash-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: editingOb.date, opening: editingOb.amount }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Opening balance updated!");
      setEditingOb(null);
      fetchCashFlow();
    } catch {
      toast.error("Failed to update opening balance");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#000080", margin: "0 auto" }} /></div>;
  if (!data) return <div style={{ padding: 20, color: "red" }}>Data load nahi hua</div>;

  const { summary } = data;
  const isPositive = summary.netCashFlow >= 0;

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 12 }}>
        <StatCard label="Opening Balance" value={fmt(summary.openingBalance)} color="#000080" icon={Wallet} />
        <StatCard label="Total Cash In" value={fmt(summary.totalCashIn)} color="#166534" icon={ArrowUpRight} />
        <StatCard label="Total Cash Out" value={fmt(summary.totalCashOut)} color="#dc2626" icon={ArrowDownRight} negative />
        <StatCard label="Net Cash Flow" value={(isPositive ? "+" : "-") + fmt(summary.netCashFlow)} color={isPositive ? "#166534" : "#dc2626"} icon={TrendingUp} negative={!isPositive} />
        <StatCard label="Closing Balance" value={fmt(summary.closingBalance)} color="#7e3af2" icon={Building2} />
      </div>

      {/* Daily Flow Table */}
      <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff", maxHeight: "55vh", overflowY: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", fontFamily: "Tahoma, sans-serif" }}>
          <thead>
            <tr style={{ background: "#d4d0c8", borderBottom: "2px solid #808080", position: "sticky", top: 0 }}>
              <th style={{ padding: "5px 10px", textAlign: "left", borderRight: "1px solid #808080" }}>Date</th>
              <th style={{ padding: "5px 10px", textAlign: "right", borderRight: "1px solid #808080" }}>Opening (₹)</th>
              <th style={{ padding: "5px 10px", textAlign: "right", borderRight: "1px solid #808080" }}>Cash In (₹)</th>
              <th style={{ padding: "5px 10px", textAlign: "right", borderRight: "1px solid #808080" }}>Cash Out (₹)</th>
              <th style={{ padding: "5px 10px", textAlign: "right", borderRight: "1px solid #808080" }}>Net (₹)</th>
              <th style={{ padding: "5px 10px", textAlign: "right", borderRight: "1px solid #808080" }}>Closing (₹)</th>
              <th style={{ padding: "5px 10px", textAlign: "center" }}>Mode Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {data.dailyFlow.map((row, idx) => (
              <tr key={row.date} style={{ background: idx % 2 === 0 ? "#fff" : "#f9f9f6", borderBottom: "1px solid #e8e8e8" }}>
                <td style={{ padding: "6px 10px", borderRight: "1px solid #e8e8e8", fontWeight: "bold" }}>{row.displayDate}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #e8e8e8", color: "#555", cursor: "pointer" }}
                    onClick={() => setEditingOb({ date: row.date, amount: row.opening })}
                    title="Click to edit Opening Balance"
                >
                  {fmt(row.opening)} <Edit3 size={10} className="inline ml-1 text-gray-400" />
                </td>
                <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #e8e8e8", color: "#166534", fontWeight: "bold" }}>{row.cashIn > 0 ? fmt(row.cashIn) : "—"}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #e8e8e8", color: "#dc2626", fontWeight: "bold" }}>{row.cashOut > 0 ? fmt(row.cashOut) : "—"}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #e8e8e8", fontWeight: "bold", color: row.net >= 0 ? "#166534" : "#dc2626" }}>
                  {row.net >= 0 ? "+" : "-"}{fmt(row.net)}
                </td>
                <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #e8e8e8", fontWeight: "900", color: row.closing >= 0 ? "#000080" : "#dc2626" }}>
                  {fmt(row.closing)}
                </td>
                <td style={{ padding: "6px 10px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                    {row.cashBreakdown.cash > 0 && <span style={{ fontSize: 9, background: "#e8f5e9", color: "#166534", padding: "1px 4px", fontWeight: "bold" }}>💵 {fmt(row.cashBreakdown.cash)}</span>}
                    {row.cashBreakdown.upi > 0 && <span style={{ fontSize: 9, background: "#ede9fe", color: "#7e3af2", padding: "1px 4px", fontWeight: "bold" }}>📱 {fmt(row.cashBreakdown.upi)}</span>}
                    {row.cashBreakdown.card > 0 && <span style={{ fontSize: 9, background: "#dbeafe", color: "#1d4ed8", padding: "1px 4px", fontWeight: "bold" }}>💳 {fmt(row.cashBreakdown.card)}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#d4d0c8", borderTop: "2px solid #808080", fontWeight: 900 }}>
              <td style={{ padding: "6px 10px", borderRight: "1px solid #808080" }}>TOTAL</td>
              <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #808080" }}>{fmt(summary.openingBalance)}</td>
              <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #808080", color: "#166534" }}>{fmt(summary.totalCashIn)}</td>
              <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #808080", color: "#dc2626" }}>{fmt(summary.totalCashOut)}</td>
              <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #808080", color: isPositive ? "#166534" : "#dc2626" }}>{isPositive ? "+" : "-"}{fmt(summary.netCashFlow)}</td>
              <td style={{ padding: "6px 10px", textAlign: "right", borderRight: "1px solid #808080", color: "#000080" }}>{fmt(summary.closingBalance)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {editingOb && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div className="legacy-window" style={{ width: 300, background: "#d4d0c8" }}>
            <div className="legacy-window-titlebar">
              <div className="title-text">Set Opening Balance</div>
              <button className="legacy-btn-close" onClick={() => setEditingOb(null)}>×</button>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 12, fontSize: 12, fontWeight: "bold" }}>Date: {new Date(editingOb.date).toLocaleDateString()}</div>
              <input
                type="number"
                value={editingOb.amount}
                onChange={(e) => setEditingOb({ ...editingOb, amount: parseFloat(e.target.value) || 0 })}
                style={{ width: "100%", padding: 4, marginBottom: 12, borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderBottom: "2px solid #fff", borderRight: "2px solid #fff", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={{ padding: "4px 12px", background: "#d4d0c8", borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", cursor: "pointer" }} onClick={() => setEditingOb(null)}>Cancel</button>
                <button style={{ padding: "4px 12px", background: "#d4d0c8", borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", fontWeight: "bold", cursor: "pointer" }} onClick={handleUpdateOb}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GST Tab ────────────────────────────────────────────────────────────────

function GSTTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<GSTData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/accounts/gst-summary?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("GST data load nahi hua"))
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#000080", margin: "0 auto" }} /></div>;
  if (!data) return <div style={{ padding: 20, color: "red" }}>Data load nahi hua</div>;

  return (
    <div>
      {/* GST Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 12 }}>
        <StatCard label="GST Invoices" value={String(data.summary.totalInvoicesWithGST)} sub="With GST charged" color="#000080" icon={Receipt} />
        <StatCard label="Taxable Amount" value={fmt(data.summary.totalTaxableAmount)} color="#d97706" icon={IndianRupee} />
        <StatCard label="Output GST (Collected)" value={fmt(data.summary.totalOutputGST)} sub="Total tax collected" color="#7e3af2" icon={TrendingUp} />
        <StatCard label="Input GST (Paid)" value={fmt(data.summary.totalInputGST || 0)} sub="From Expenses/Vendors" color="#166534" icon={TrendingDown} />
        <StatCard label="Net GST Payable" value={fmt(data.summary.netGSTPayable)} sub="Output - Input" color="#dc2626" icon={Building2} />
      </div>

      {/* CGST + SGST Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "#fff8e1", border: "1px solid #f59e0b", padding: "10px 14px" }}>
          <div style={{ fontWeight: "bold", fontSize: 11, color: "#92400e", marginBottom: 4 }}>CGST (Central GST)</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#d97706" }}>{fmt(data.summary.cgst)}</div>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", padding: "10px 14px" }}>
          <div style={{ fontWeight: "bold", fontSize: 11, color: "#166534", marginBottom: 4 }}>SGST (State GST)</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#166534" }}>{fmt(data.summary.sgst)}</div>
        </div>
      </div>

      {/* GST Rate Breakdown */}
      {data.breakdown.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: "bold", fontSize: 12, color: "#000080", marginBottom: 6 }}>GST Rate-wise Breakdown</div>
          <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#d4d0c8" }}>
                  <th style={{ padding: "5px 10px", textAlign: "left" }}>GST Rate</th>
                  <th style={{ padding: "5px 10px", textAlign: "right" }}>Invoices</th>
                  <th style={{ padding: "5px 10px", textAlign: "right" }}>Taxable Value</th>
                  <th style={{ padding: "5px 10px", textAlign: "right" }}>CGST</th>
                  <th style={{ padding: "5px 10px", textAlign: "right" }}>SGST</th>
                  <th style={{ padding: "5px 10px", textAlign: "right" }}>Total GST</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((b) => (
                  <tr key={b.rate} style={{ borderBottom: "1px solid #e8e8e8" }}>
                    <td style={{ padding: "5px 10px", fontWeight: "bold" }}>{b.rate}%</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{b.count}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fmt(b.taxableAmount)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fmt(b.gstAmount / 2)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fmt(b.gstAmount / 2)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: "bold" }}>{fmt(b.gstAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div style={{ fontWeight: "bold", fontSize: 12, color: "#000080", marginBottom: 6 }}>
        GST Invoice List ({data.invoices.length} invoices)
      </div>
      <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff", maxHeight: "35vh", overflowY: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#d4d0c8", position: "sticky", top: 0 }}>
              <th style={{ padding: "5px 8px", textAlign: "left" }}>Invoice #</th>
              <th style={{ padding: "5px 8px", textAlign: "left" }}>Date</th>
              <th style={{ padding: "5px 8px", textAlign: "left" }}>Customer</th>
              <th style={{ padding: "5px 8px", textAlign: "right" }}>Taxable</th>
              <th style={{ padding: "5px 8px", textAlign: "center" }}>GST %</th>
              <th style={{ padding: "5px 8px", textAlign: "right" }}>GST Amt</th>
              <th style={{ padding: "5px 8px", textAlign: "right" }}>Total</th>
              <th style={{ padding: "5px 8px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.invoices.map((inv, i) => (
              <tr key={inv.invoiceNumber} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f6", borderBottom: "1px solid #e8e8e8" }}>
                <td style={{ padding: "4px 8px", fontWeight: "bold", color: "#000080" }}>#{inv.invoiceNumber}</td>
                <td style={{ padding: "4px 8px" }}>{new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                <td style={{ padding: "4px 8px" }}>{inv.customer}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{fmt(inv.taxableAmount)}</td>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>{inv.gstRate}%</td>
                <td style={{ padding: "4px 8px", textAlign: "right", color: "#7e3af2", fontWeight: "bold" }}>{fmt(inv.gstAmount)}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "bold" }}>{fmt(inv.total)}</td>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: "bold", color: "#fff", padding: "1px 5px", background: inv.paymentStatus === "PAID" ? "#166534" : inv.paymentStatus === "PARTIAL" ? "#d97706" : "#dc2626" }}>
                    {inv.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {data.invoices.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#999" }}>Is period mein koi GST invoice nahi mili</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Balance Sheet Tab ────────────────────────────────────────────────────────

interface BalanceSheetData {
  assets: { cashInHand: number; accountsReceivable: number; closingStock: number; total: number };
  liabilities: { accountsPayable: number; total: number };
  equity: { retainedEarnings: number };
}

function BalanceSheetTab() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    fetch("/api/accounts/balance-sheet")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Balance Sheet load nahi hua"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#000080", margin: "0 auto" }} /></div>;
  if (!data) return <div style={{ padding: 20, color: "red" }}>Data load nahi hua</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        
        {/* Liabilities & Equity (Left side in Tally) */}
        <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff" }}>
          <div style={{ background: "#000080", color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
            Liabilities & Equity
          </div>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#d4d0c8", borderBottom: "1px solid #808080" }}>
                <th style={{ padding: "5px 10px", textAlign: "left" }}>Particulars</th>
                <th style={{ padding: "5px 10px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "6px 10px", fontWeight: "bold" }}>Capital Account / Retained Earnings</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold" }}>{fmt(data.equity.retainedEarnings)}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#dc2626" }}>Current Liabilities</td>
                <td style={{ padding: "6px 10px", textAlign: "right" }}></td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Accounts Payable (Vendor Dues)</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.liabilities.accountsPayable)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: "#d4d0c8", borderTop: "2px solid #808080" }}>
                <td style={{ padding: "6px 10px", fontWeight: "900" }}>TOTAL LIABILITIES</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900" }}>{fmt(data.liabilities.total + data.equity.retainedEarnings)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Assets (Right side in Tally) */}
        <div style={{ background: "#fff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff" }}>
          <div style={{ background: "#166534", color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
            Assets
          </div>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#d4d0c8", borderBottom: "1px solid #808080" }}>
                <th style={{ padding: "5px 10px", textAlign: "left" }}>Particulars</th>
                <th style={{ padding: "5px 10px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#166534" }}>Current Assets</td>
                <td style={{ padding: "6px 10px", textAlign: "right" }}></td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Cash in Hand / Bank</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.assets.cashInHand)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Sundry Debtors (Udhaar / Unpaid)</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.assets.accountsReceivable)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 10px 3px 20px", color: "#555" }}>Closing Stock (Inventory)</td>
                <td style={{ padding: "3px 10px", textAlign: "right" }}>{fmt(data.assets.closingStock)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: "#d4d0c8", borderTop: "2px solid #808080" }}>
                <td style={{ padding: "6px 10px", fontWeight: "900" }}>TOTAL ASSETS</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900" }}>{fmt(data.assets.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("P&L Statement");

  // Default: current financial year (Apr 1 to today)
  const today = new Date();
  const fyStart = today.getMonth() >= 3
    ? new Date(today.getFullYear(), 3, 1)
    : new Date(today.getFullYear() - 1, 3, 1);

  const [from, setFrom] = useState(fyStart.toISOString().split("T")[0]);
  const [to, setTo] = useState(today.toISOString().split("T")[0]);

  const handleQuickRange = (days: number) => {
    const t = new Date();
    const f = new Date(t);
    f.setDate(f.getDate() - days + 1);
    setFrom(f.toISOString().split("T")[0]);
    setTo(t.toISOString().split("T")[0]);
  };

  const handleFY = () => {
    setFrom(fyStart.toISOString().split("T")[0]);
    setTo(today.toISOString().split("T")[0]);
  };

  const handleThisMonth = () => {
    const f = new Date(today.getFullYear(), today.getMonth(), 1);
    setFrom(f.toISOString().split("T")[0]);
    setTo(today.toISOString().split("T")[0]);
  };

  return (
    <div style={{ padding: "8px 12px", fontFamily: "Tahoma, 'MS Sans Serif', sans-serif" }}>
      <PageHeader
        title="📒 Accounts"
        subtitle="P&L Statement · Ledger · Cash Flow · GST Summary — Tally-style accounting"
      />

      {/* Date Range Controls */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        padding: "6px 10px",
        background: "#d4d0c8",
        borderTop: "2px solid #fff", borderLeft: "2px solid #fff",
        borderRight: "2px solid #404040", borderBottom: "2px solid #404040",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 11, fontWeight: "bold" }}>📅 Period:</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          style={{ fontSize: 11, padding: "2px 4px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff", background: "#fff" }} />
        <span style={{ fontSize: 11 }}>to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          style={{ fontSize: 11, padding: "2px 4px", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #fff", borderBottom: "2px solid #fff", background: "#fff" }} />

        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          {[
            { label: "Today", action: () => { const t = today.toISOString().split("T")[0]; setFrom(t); setTo(t); } },
            { label: "7D", action: () => handleQuickRange(7) },
            { label: "30D", action: () => handleQuickRange(30) },
            { label: "This Month", action: handleThisMonth },
            { label: "This FY", action: handleFY },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{ padding: "2px 8px", fontSize: 10, fontWeight: "bold", background: "#e0ded8", borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: "auto", fontSize: 10, color: "#666" }}>
          {new Date(from).toLocaleDateString("en-IN")} — {new Date(to).toLocaleDateString("en-IN")}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: 0, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <TabButton key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {/* Tab Content Panel */}
      <div style={{
        background: "#d4d0c8",
        borderTop: "2px solid #404040",
        borderLeft: "2px solid #808080",
        borderRight: "2px solid #fff",
        borderBottom: "2px solid #fff",
        padding: 12,
        minHeight: 400,
      }}>
        {activeTab === "P&L Statement" && <PLTab from={from} to={to} />}
        {activeTab === "Balance Sheet" && <BalanceSheetTab />}
        {activeTab === "Ledger" && <LedgerTab from={from} to={to} />}
        {activeTab === "Cash Flow" && <CashFlowTab from={from} to={to} />}
        {activeTab === "GST Summary" && <GSTTab from={from} to={to} />}
      </div>
    </div>
  );
}
