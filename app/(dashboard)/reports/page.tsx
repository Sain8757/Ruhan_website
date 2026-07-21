"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Download, FileDown, TrendingUp, IndianRupee, Users, Briefcase, BookOpen, Loader2, FileText, X, Package } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

interface ReportData {
  summary: {
    allTimeRevenue: number;
    allTimeInvoices: number;
    monthRevenue: number;
    monthInvoices: number;
    todayRevenue: number;
    todayInvoices: number;
    totalCustomers: number;
    inventorySalesRevenue: number;
    inventorySalesCount: number;
    serviceSalesRevenue: number;
    serviceSalesCount: number;
  };
  chartData: { date: string; revenue: number }[];
  serviceStats: Record<string, number>;
  topServices: { name: string; count: number }[];
  invoicesByPaymentStatus: { status: string; total: number; count: number }[];
}

interface DetailedReportData {
  productSales: {
    name: string;
    quantity: number;
    revenue: number;
    purchasePrice: number;
    totalPurchaseCost: number;
    profit: number;
  }[];
  serviceSales: {
    name: string;
    quantity: number;
    profit: number;
  }[];
  dateRange: { start: string; end: string };
}

const PIE_COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
};

export default function ReportsPage() {
  const toast = useToast();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7");
  const [showDetailed, setShowDetailed] = useState(false);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedData, setDetailedData] = useState<DetailedReportData | null>(null);
  const [detailedView, setDetailedView] = useState<'all' | 'products' | 'services'>('all');
  const [detailedRange, setDetailedRange] = useState("7");

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueType, setRevenueType] = useState<"all-time" | "this-month" | "today">("all-time");
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const fetchRevenueBreakdown = async (type: "all-time" | "this-month" | "today") => {
    setRevenueType(type);
    setShowRevenueModal(true);
    setRevenueLoading(true);
    try {
      const res = await fetch(`/api/reports/revenue-breakdown?type=${type}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setRevenueData(json);
    } catch {
      toast.error("Could not load revenue breakdown");
      setShowRevenueModal(false);
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?range=${range}`);
      if (!res.ok) throw new Error("Failed to load report data");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Could not load report data");
    } finally {
      setLoading(false);
    }
  }, [range, toast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const openDetailedReport = (view: 'all' | 'products' | 'services') => {
    setDetailedView(view);
    setDetailedRange(range);
    setShowDetailed(true);
  };

  const fetchDetailedData = useCallback(async () => {
    if (!showDetailed) return;
    setDetailedLoading(true);
    try {
      const res = await fetch(`/api/reports/detailed?range=${detailedRange}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setDetailedData(json);
    } catch {
      toast.error("Could not load detailed report");
    } finally {
      setDetailedLoading(false);
    }
  }, [detailedRange, showDetailed, toast]);

  useEffect(() => {
    fetchDetailedData();
  }, [fetchDetailedData]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      if (!data) return;

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        { Metric: "All Time Revenue", Value: data.summary.allTimeRevenue },
        { Metric: "All Time Invoices", Value: data.summary.allTimeInvoices },
        { Metric: "This Month Revenue", Value: data.summary.monthRevenue },
        { Metric: "This Month Invoices", Value: data.summary.monthInvoices },
        { Metric: "Today Revenue", Value: data.summary.todayRevenue },
        { Metric: "Today Invoices", Value: data.summary.todayInvoices },
        { Metric: "Total Customers", Value: data.summary.totalCustomers },
        { Metric: "Inventory Sales Revenue", Value: data.summary.inventorySalesRevenue },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.chartData), "Revenue Chart");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.topServices), "Top Services");

      XLSX.writeFile(wb, `RA_Seva_Report_${Date.now()}.xlsx`);
      toast.success("Excel report exported!");
    } catch {
      toast.error("Failed to export Excel report");
    }
  };

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      if (!data) return;

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("RA Seva Point - Financial Report", 20, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 20, 28);
      doc.line(20, 32, 190, 32);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Summary", 20, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = [
        [`All Time Revenue:`, `Rs. ${data.summary.allTimeRevenue.toLocaleString("en-IN")}`],
        [`This Month Revenue:`, `Rs. ${data.summary.monthRevenue.toLocaleString("en-IN")}`],
        [`Today Revenue:`, `Rs. ${data.summary.todayRevenue.toLocaleString("en-IN")}`],
        [`Total Customers:`, `${data.summary.totalCustomers}`],
        [`All Time Invoices:`, `${data.summary.allTimeInvoices}`],
      ];

      let y = 50;
      for (const [label, val] of lines) {
        doc.text(label, 20, y);
        doc.text(val, 120, y);
        y += 8;
      }

      doc.save(`RA_Seva_Report_${Date.now()}.pdf`);
      toast.success("PDF report downloaded!");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const handleDetailedPDF = async () => {
    try {
      if (!detailedData) return;
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Detailed Sales & Services Report", 20, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 20, 26);
      doc.line(20, 30, 190, 30);
      
      let y = 40;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Product Sales", 20, y);
      y += 8;
      
      doc.setFontSize(9);
      doc.text("Product Name", 20, y);
      doc.text("Qty", 90, y);
      doc.text("Purchase (Total)", 110, y);
      doc.text("Sales (Total)", 145, y);
      doc.text("Profit", 175, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 5;
      
      doc.setFont("helvetica", "normal");
      let totalProductProfit = 0;
      for (const item of detailedData.productSales) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(item.name.substring(0, 35), 20, y);
        doc.text(item.quantity.toString(), 90, y);
        doc.text(item.totalPurchaseCost.toString(), 110, y);
        doc.text(item.revenue.toString(), 145, y);
        doc.text(item.profit.toString(), 175, y);
        totalProductProfit += item.profit;
        y += 7;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text(`Total Product Profit: Rs. ${totalProductProfit}`, 130, y + 2);
      y += 15;
      
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Services", 20, y);
      y += 8;
      
      doc.setFontSize(9);
      doc.text("Service Type", 20, y);
      doc.text("Count", 110, y);
      doc.text("Profit (Fees)", 150, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 5;
      
      doc.setFont("helvetica", "normal");
      let totalServiceProfit = 0;
      for (const item of detailedData.serviceSales) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(item.name.substring(0, 45), 20, y);
        doc.text(item.quantity.toString(), 110, y);
        doc.text(item.profit.toString(), 150, y);
        totalServiceProfit += item.profit;
        y += 7;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text(`Total Service Profit: Rs. ${totalServiceProfit}`, 130, y + 2);
      
      doc.save(`Detailed_Report_${Date.now()}.pdf`);
      toast.success("Detailed report PDF downloaded!");
    } catch {
      toast.error("Failed to generate detailed PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { summary, chartData, topServices, invoicesByPaymentStatus } = data;

  return (
    <div className="page-shell page-shell-analytics">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Real-time business insights from your database"
        actions={
          <>
            {/* Date Range Filter */}
            <select
              className="input-field"
              style={{ maxWidth: 160 }}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button onClick={() => openDetailedReport('all')} className="btn-secondary flex items-center gap-1.5 text-xs text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
              <FileText size={14} />
              Detailed Report
            </button>
            <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Download size={14} />
              Export Excel
            </button>
            <button onClick={handleExportPDF} className="btn-primary flex items-center gap-1.5 text-xs">
              <FileDown size={14} />
              Export PDF
            </button>
          </>
        }
      />

      {/* KPI Stats Grid */}
      <div className="metric-grid">
        <div 
          className="glass-card p-6 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
          onClick={() => fetchRevenueBreakdown('all-time')}
        >
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={14} style={{ color: "#4f6ef7" }} />
            <span className="label text-blue-500">All Time Revenue</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(summary.allTimeRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary.allTimeInvoices} paid invoices</p>
        </div>

        <div 
          className="glass-card p-6 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-colors"
          onClick={() => fetchRevenueBreakdown('this-month')}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: "#10b981" }} />
            <span className="label text-green-500">This Month</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(summary.monthRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary.monthInvoices} invoices this month</p>
        </div>

        <div 
          className="glass-card p-6 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10 transition-colors"
          onClick={() => fetchRevenueBreakdown('today')}
        >
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={14} style={{ color: "#f59e0b" }} />
            <span className="label text-yellow-500">Today</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(summary.todayRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary.todayInvoices} invoices today</p>
        </div>

        <Link href="/customers" className="glass-card p-6 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors block">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} style={{ color: "#8b5cf6" }} />
            <span className="label" style={{ color: "#8b5cf6" }}>Customers</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {summary.totalCustomers}
          </div>
          <p className="text-xs text-slate-400 mt-1">Registered customers</p>
        </Link>

        <div 
          className="glass-card p-6 bg-pink-500/5 cursor-pointer hover:bg-pink-500/10 transition-colors"
          onClick={() => openDetailedReport('products')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} style={{ color: "#f43f5e" }} />
            <span className="label text-pink-500">Inventory Sales</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(summary.inventorySalesRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary.inventorySalesCount} products sold (selected period)</p>
        </div>

        <div 
          className="glass-card p-6 bg-teal-500/5 cursor-pointer hover:bg-teal-500/10 transition-colors"
          onClick={() => openDetailedReport('services')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={14} style={{ color: "#14b8a6" }} />
            <span className="label" style={{ color: "#14b8a6" }}>Services Revenue</span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(summary.serviceSalesRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.serviceSalesCount} paid services (selected period)
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title mb-0">Revenue Trend</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Daily paid invoice revenue — last {range} days
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#4f6ef7" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        {topServices.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="section-title mb-4">Top Services</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topServices.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Status Breakdown */}
        {invoicesByPaymentStatus.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="section-title mb-4">Invoice Payment Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={invoicesByPaymentStatus}
                  dataKey="total"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={false}
                  labelLine={false}
                >
                  {invoicesByPaymentStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {showDetailed && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2 className="section-title mb-0">
                {detailedView === 'products' ? 'Product Sales Report' : detailedView === 'services' ? 'Services Report' : 'Detailed Sales & Services Report'}
              </h2>
              <div className="flex items-center gap-3">
                <select 
                  className="input-field py-1 px-2 text-sm h-8 w-32"
                  value={detailedRange}
                  onChange={(e) => setDetailedRange(e.target.value)}
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
                <button onClick={handleDetailedPDF} className="btn-primary py-1 px-3 text-sm h-8">
                  <FileDown size={14} className="mr-1" /> PDF
                </button>
                <button onClick={() => setShowDetailed(false)} className="btn-ghost p-1">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body max-h-[70vh] overflow-y-auto">
              {detailedLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : detailedData ? (
                <div className="space-y-8">
                  {(detailedView === 'all' || detailedView === 'products') && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">Product Sales</h3>
                      <div className="table-container">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-left border-b">
                            <tr>
                              <th className="p-2 font-medium">Product Name</th>
                              <th className="p-2 font-medium">Sold Qty</th>
                              <th className="p-2 font-medium">Purchase Total</th>
                              <th className="p-2 font-medium">Sales Total</th>
                              <th className="p-2 font-medium">Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {detailedData.productSales.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-2 font-medium">{item.name}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2 text-slate-500">{formatCurrency(item.totalPurchaseCost)}</td>
                                <td className="p-2 text-slate-700">{formatCurrency(item.revenue)}</td>
                                <td className="p-2 font-bold text-green-600">{formatCurrency(item.profit)}</td>
                              </tr>
                            ))}
                            {detailedData.productSales.length === 0 && (
                              <tr><td colSpan={5} className="p-4 text-center text-slate-500">No product sales in this period.</td></tr>
                            )}
                          </tbody>
                          {detailedData.productSales.length > 0 && (
                            <tfoot className="bg-slate-100 font-bold border-t">
                              <tr>
                                <td className="p-2 text-right">Total:</td>
                                <td className="p-2">{detailedData.productSales.reduce((a, b) => a + b.quantity, 0)}</td>
                                <td className="p-2 text-slate-500">{formatCurrency(detailedData.productSales.reduce((a, b) => a + b.totalPurchaseCost, 0))}</td>
                                <td className="p-2 text-slate-700">{formatCurrency(detailedData.productSales.reduce((a, b) => a + b.revenue, 0))}</td>
                                <td className="p-2 text-green-700">{formatCurrency(detailedData.productSales.reduce((a, b) => a + b.profit, 0))}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {(detailedView === 'all' || detailedView === 'services') && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">Service Profits</h3>
                    <div className="table-container">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left border-b">
                          <tr>
                            <th className="p-2 font-medium">Service Type</th>
                            <th className="p-2 font-medium">Count</th>
                            <th className="p-2 font-medium">Profit (Fees)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {detailedData.serviceSales.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-medium">{item.name}</td>
                              <td className="p-2">{item.quantity}</td>
                              <td className="p-2 font-bold text-green-600">{formatCurrency(item.profit)}</td>
                            </tr>
                          ))}
                          {detailedData.serviceSales.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">No services provided in this period.</td></tr>
                          )}
                        </tbody>
                          {detailedData.serviceSales.length > 0 && (
                            <tfoot className="bg-slate-100 font-bold border-t">
                              <tr>
                                <td className="p-2 text-right">Total:</td>
                                <td className="p-2">{detailedData.serviceSales.reduce((a, b) => a + b.quantity, 0)}</td>
                                <td className="p-2 text-green-700">{formatCurrency(detailedData.serviceSales.reduce((a, b) => a + b.profit, 0))}</td>
                              </tr>
                            </tfoot>
                          )}
                      </table>
                    </div>
                  </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-red-500">Failed to load data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRevenueModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="section-title mb-0">
                {revenueType === 'all-time' ? 'All Time Revenue' : revenueType === 'this-month' ? 'This Month Revenue' : 'Today\'s Revenue'}
              </h2>
              <button onClick={() => setShowRevenueModal(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body max-h-[70vh] overflow-y-auto">
              {revenueLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : revenueData ? (
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left border-b">
                      <tr>
                        {revenueData.type === "grouped" ? (
                          <>
                            <th className="p-3 font-medium">Date / Period</th>
                            <th className="p-3 font-medium text-right">Revenue</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3 font-medium">Invoice #</th>
                            <th className="p-3 font-medium">Time</th>
                            <th className="p-3 font-medium">Customer</th>
                            <th className="p-3 font-medium text-right">Amount</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {revenueData.data.map((item: any, idx: number) => (
                        <tr key={idx}>
                          {revenueData.type === "grouped" ? (
                            <>
                              <td className="p-3 font-medium">{item.dateLabel}</td>
                              <td className="p-3 text-right font-bold text-green-600">{formatCurrency(item.revenue)}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-medium text-blue-600">#{item.invoiceNumber}</td>
                              <td className="p-3 text-slate-500">{item.time}</td>
                              <td className="p-3">{item.customerName}</td>
                              <td className="p-3 text-right font-bold text-green-600">{formatCurrency(item.revenue)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                      {revenueData.data.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No revenue data found.</td></tr>
                      )}
                    </tbody>
                    {revenueData.data.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t">
                        <tr>
                          {revenueData.type === "grouped" ? (
                            <>
                              <td className="p-3 text-right">Total:</td>
                              <td className="p-3 text-right text-green-700">{formatCurrency(revenueData.data.reduce((sum: number, item: any) => sum + item.revenue, 0))}</td>
                            </>
                          ) : (
                            <>
                              <td colSpan={3} className="p-3 text-right">Total:</td>
                              <td className="p-3 text-right text-green-700">{formatCurrency(revenueData.data.reduce((sum: number, item: any) => sum + item.revenue, 0))}</td>
                            </>
                          )}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 text-red-500">Failed to load data</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
