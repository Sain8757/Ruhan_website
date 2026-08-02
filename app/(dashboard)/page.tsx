"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle,
  IndianRupee,
  ArrowUpRight,
  Loader2,
  Plus,
  UserPlus,
  FileText,
  Package,
  Clock,
  Activity,
  Sparkles,
  ChevronRight,
  Zap,
  RefreshCw,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { formatCurrency, SERVICE_STATUS_COLORS } from "@/lib/utils";
import { format } from "date-fns";
import BulkRemindersWidget from "@/components/dashboard/BulkRemindersWidget";
import GoalTrackerWidget from "@/components/dashboard/GoalTrackerWidget";
import TopServicesWidget from "@/components/dashboard/TopServicesWidget";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import MorningSummaryWidget from "@/components/dashboard/MorningSummaryWidget";
import LowStockWidget from "@/components/dashboard/LowStockWidget";
import QuickExpenseWidget from "@/components/dashboard/QuickExpenseWidget";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";

interface PercentChange {
  value: string;
  positive: boolean;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
}

interface DashboardData {
  todayIncome: number;
  todayTransactions: number;
  todayCustomers: number;
  pendingServices: number;
  completedToday: number;
  totalCustomers: number;
  monthlyRevenue: number;
  recentServices: RecentService[];
  recentActivities: RecentActivity[];
  chartData: ChartDataPoint[];
  partialInvoicesCount: number;
  topServices: TopService[];
  overdueServices: RecentService[];
  dueTodayServices: RecentService[];
  lowStockItems: LowStockItem[];
  percentChanges: {
    income: PercentChange;
    customers: PercentChange;
    monthlyRevenue: PercentChange;
    weeklyIncome: PercentChange;
  };
}

interface RecentService {
  id: string;
  serviceType: string;
  status: string;
  fees: number;
  createdAt: string;
  customer: { name: string; mobile: string } | null;
}

interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  invoices: number;
}

interface TopService {
  name: string;
  count: number;
}

const MOCK_CHART: ChartDataPoint[] = [
  { date: "Mon", revenue: 0, invoices: 0 },
  { date: "Tue", revenue: 0, invoices: 0 },
  { date: "Wed", revenue: 0, invoices: 0 },
  { date: "Thu", revenue: 0, invoices: 0 },
  { date: "Fri", revenue: 0, invoices: 0 },
  { date: "Sat", revenue: 0, invoices: 0 },
  { date: "Sun", revenue: 0, invoices: 0 },
];

const formatChartDate = (dateStr: string) => {
  if (dateStr.length === 3) return dateStr;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : format(d, "EEE");
  } catch {
    return dateStr;
  }
};

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

interface StatCardProps {
  title: string;
  value: number;
  displayValue?: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  accentColor: string;
  change?: string;
  changePositive?: boolean;
  delay?: number;
  href?: string;
}

function StatCard({
  title,
  value,
  displayValue,
  subtitle,
  icon: Icon,
  gradient,
  accentColor,
  change,
  changePositive = true,
  delay = 0,
  href,
}: StatCardProps) {
  const animatedValue = useCountUp(value);
  const Component = href ? Link : ("div" as React.ElementType);

  return (
    <Component
      href={href}
      className={`stat-card animate-slide-up flex flex-col justify-between ${href ? "hover:scale-[1.01] hover:shadow-md transition-all cursor-pointer" : ""}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
        minHeight: "108px",
        padding: "12px 14px",
      }}
    >
      {/* Background gradient orb */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0"
          style={{ background: gradient }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)" }}
          />
          <Icon size={16} className="text-white relative z-10" />
        </div>

        {/* Change indicator */}
        {change && (
          <div
            className="flex h-5 items-center gap-0.5 rounded-md px-1.5 text-[11px] font-semibold"
            style={{
              background: changePositive ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
              color: changePositive ? "#10b981" : "#f43f5e",
              border: `1px solid ${changePositive ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
            }}
          >
            <ArrowUpRight
              size={10}
              style={{ transform: changePositive ? "" : "rotate(90deg)" }}
            />
            {change}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10">
        <div
          className="text-xl font-black mb-0.5"
          style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
        >
          {displayValue || animatedValue.toLocaleString()}
        </div>
        <div
          className="text-xs font-bold leading-tight"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="text-[11px] mt-0.5 flex items-center gap-1 leading-tight"
            style={{ color: "var(--text-muted)" }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{
          width: "40%",
          background: gradient,
          opacity: 0.5,
        }}
      />
    </Component>
  );
}

const QUICK_ACTIONS = [
  {
    label: "New Customer",
    desc: "Register a profile",
    icon: UserPlus,
    href: "/customers/new",
    gradient: "linear-gradient(135deg, #4f6ef7 0%, #3451d1 100%)",
    accentColor: "#4f6ef7",
    glow: "rgba(79,110,247,0.3)",
  },
  {
    label: "New Service",
    desc: "Start a request",
    icon: Briefcase,
    href: "/services",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
    accentColor: "#a78bfa",
    glow: "rgba(167,139,250,0.3)",
  },
  {
    label: "New Invoice",
    desc: "Create billing",
    icon: FileText,
    href: "/billing/new",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    accentColor: "#10b981",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    label: "Photo Studio",
    desc: "Edit & print",
    icon: Package,
    href: "/photo-studio",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    accentColor: "#f97316",
    glow: "rgba(249,115,22,0.3)",
  },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-2xl text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(79,110,247,0.2)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(79,110,247,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        <p className="font-bold mb-2 text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {p.dataKey === "revenue" ? formatCurrency(p.value) : `${p.value} transactions`}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(79,110,247,0.15)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <p className="font-bold text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="font-semibold mt-0.5" style={{ color: "#4f6ef7" }}>
          {payload[0].value} transactions
        </p>
      </div>
    );
  }
  return null;
};

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return format(date, "MMM d, yyyy");
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [now, setNow] = useState(new Date());
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("API error");
      const d = await res.json();
      setData(d);
      setError(false);
      setLastRefreshed(new Date());
    } catch {
      setError(true);
      if (!data) {
        setData({
          todayIncome: 0,
          todayTransactions: 0,
          todayCustomers: 0,
          pendingServices: 0,
          completedToday: 0,
          totalCustomers: 0,
          monthlyRevenue: 0,
          recentServices: [],
          recentActivities: [],
          chartData: [],
          partialInvoicesCount: 0,
          topServices: [],
          overdueServices: [],
          dueTodayServices: [],
          lowStockItems: [],
          percentChanges: {
            income: { value: "—", positive: true },
            customers: { value: "—", positive: true },
            monthlyRevenue: { value: "—", positive: true },
            weeklyIncome: { value: "—", positive: true },
          },
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      fetchData(true);
    }, 60000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [fetchData]);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetingEmoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : "🌙";

  if (loading) return <DashboardSkeleton />;

  const stats: StatCardProps[] = [
    {
      title: "Today's Income",
      value: data?.todayIncome || 0,
      displayValue: formatCurrency(data?.todayIncome || 0),
      subtitle: `${data?.todayTransactions || 0} transactions today`,
      icon: IndianRupee,
      gradient: "linear-gradient(135deg, #4f6ef7 0%, #3451d1 100%)",
      accentColor: "#4f6ef7",
      change: data?.percentChanges?.income?.value,
      changePositive: data?.percentChanges?.income?.positive,
      delay: 0,
      href: "/billing",
    },
    {
      title: "Today's Customers",
      value: data?.todayCustomers || 0,
      subtitle: `${data?.totalCustomers || 0} total registered`,
      icon: Users,
      gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
      accentColor: "#a78bfa",
      change: data?.percentChanges?.customers?.value,
      changePositive: data?.percentChanges?.customers?.positive,
      delay: 60,
      href: "/customers",
    },
    {
      title: "Pending Services",
      value: data?.pendingServices || 0,
      subtitle: "Awaiting action",
      icon: Clock,
      gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      accentColor: "#f97316",
      delay: 120,
      href: "/services",
    },
    {
      title: "Completed Today",
      value: data?.completedToday || 0,
      subtitle: "Services delivered",
      icon: CheckCircle,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      accentColor: "#10b981",
      delay: 180,
      href: "/services",
    },
    {
      title: "Monthly Revenue",
      value: data?.monthlyRevenue || 0,
      displayValue: formatCurrency(data?.monthlyRevenue || 0),
      subtitle: format(new Date(), "MMMM yyyy"),
      icon: TrendingUp,
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      accentColor: "#06b6d4",
      change: data?.percentChanges?.monthlyRevenue?.value,
      changePositive: data?.percentChanges?.monthlyRevenue?.positive,
      delay: 240,
      href: "/reports",
    },
    {
      title: "Partial Pending",
      value: data?.partialInvoicesCount || 0,
      subtitle: "Invoices to settle",
      icon: IndianRupee,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      accentColor: "#f59e0b",
      delay: 300,
      href: "/billing?paymentStatus=PARTIAL",
    },
  ];

  const chartColors = ["#4f6ef7", "#a78bfa", "#4f6ef7", "#7b93ff", "#4f6ef7", "#a78bfa", "#4f6ef7"];
  const chartData = data?.chartData?.length ? data.chartData : MOCK_CHART;
  const isChartEmpty = !data?.chartData?.length || data.chartData.every((d) => d.revenue === 0 && d.invoices === 0);

  return (
    <div className="page-shell page-shell-dashboard">
      <MorningSummaryWidget 
        overdueCount={data?.overdueServices?.length || 0} 
        dueTodayCount={data?.dueTodayServices?.length || 0} 
        pendingPaymentsCount={data?.partialInvoicesCount || 0} 
      />

      {/* ===== WELCOME HERO (Windows 95 Classic Style) ===== */}
      <div
        className="p-4 flex flex-col gap-4 mb-4"
        style={{
          background: "#c0c0c0",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderRight: "2px solid #808080",
          borderBottom: "2px solid #808080",
          color: "#000000",
          boxShadow: "1px 1px 0 #000000",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex items-center gap-1.5 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide"
                style={{
                  background: "#000080", // Classic Win95 Titlebar Blue
                  color: "#ffffff",
                }}
              >
                <div className="w-2 h-2 bg-cyan-400" style={{ border: "1px solid #fff" }} />
                LIVE DASHBOARD
              </div>
              <div
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "#333333" }}
              >
                <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : `Updated ${timeAgo(lastRefreshed.toISOString())}`}
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#000000", letterSpacing: "0px" }}>
              {greeting}, Ruhan! {greetingEmoji}
            </h1>
            
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#000000" }}>
              <Clock size={13} />
              {format(now, "EEEE, dd MMMM yyyy • hh:mm:ss a")}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Win95 Button: Refresh */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 py-1 px-3 text-xs font-bold active:bg-gray-300"
              style={{
                background: "#c0c0c0",
                color: "#000000",
                borderTop: "2px solid #ffffff",
                borderLeft: "2px solid #ffffff",
                borderRight: "2px solid #000000",
                borderBottom: "2px solid #000000",
                boxShadow: "inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf",
                outline: "none"
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.borderTop = "2px solid #000000";
                e.currentTarget.style.borderLeft = "2px solid #000000";
                e.currentTarget.style.borderRight = "2px solid #ffffff";
                e.currentTarget.style.borderBottom = "2px solid #ffffff";
                e.currentTarget.style.boxShadow = "inset 1px 1px 0 #808080";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.borderTop = "2px solid #ffffff";
                e.currentTarget.style.borderLeft = "2px solid #ffffff";
                e.currentTarget.style.borderRight = "2px solid #000000";
                e.currentTarget.style.borderBottom = "2px solid #000000";
                e.currentTarget.style.boxShadow = "inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderTop = "2px solid #ffffff";
                e.currentTarget.style.borderLeft = "2px solid #ffffff";
                e.currentTarget.style.borderRight = "2px solid #000000";
                e.currentTarget.style.borderBottom = "2px solid #000000";
                e.currentTarget.style.boxShadow = "inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf";
              }}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            {/* Win95 Button: New Service */}
            <Link
              href="/services"
              className="flex items-center gap-1.5 py-1 px-3 text-xs font-bold active:bg-gray-300"
              style={{
                background: "#c0c0c0",
                color: "#000000",
                borderTop: "2px solid #ffffff",
                borderLeft: "2px solid #ffffff",
                borderRight: "2px solid #000000",
                borderBottom: "2px solid #000000",
                boxShadow: "inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf",
                textDecoration: "none"
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.borderTop = "2px solid #000000";
                e.currentTarget.style.borderLeft = "2px solid #000000";
                e.currentTarget.style.borderRight = "2px solid #ffffff";
                e.currentTarget.style.borderBottom = "2px solid #ffffff";
                e.currentTarget.style.boxShadow = "inset 1px 1px 0 #808080";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.borderTop = "2px solid #ffffff";
                e.currentTarget.style.borderLeft = "2px solid #ffffff";
                e.currentTarget.style.borderRight = "2px solid #000000";
                e.currentTarget.style.borderBottom = "2px solid #000000";
                e.currentTarget.style.boxShadow = "inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderTop = "2px solid #ffffff";
                e.currentTarget.style.borderLeft = "2px solid #ffffff";
                e.currentTarget.style.borderRight = "2px solid #000000";
                e.currentTarget.style.borderBottom = "2px solid #000000";
                e.currentTarget.style.boxShadow = "inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf";
              }}
            >
              <Plus size={12} color="#000080" />
              New Service
            </Link>
          </div>
        </div>

        {/* Stats preview strip */}
        <div
          className="pt-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-xs"
          style={{ borderTop: "2px groove #ffffff" }}
        >
          {[
            { label: "Today's Income", value: formatCurrency(data?.todayIncome || 0), icon: "💰" },
            { label: "Active Services", value: data?.pendingServices || 0, icon: "⚡" },
            { label: "New Today", value: data?.todayCustomers || 0, icon: "👥" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-xs">{item.label}:</span>
                <span className="text-xs font-bold">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl animate-slide-up"
          style={{
            background: "rgba(244,63,94,0.08)",
            border: "1px solid rgba(244,63,94,0.2)",
          }}
        >
          <AlertCircle size={16} className="shrink-0" style={{ color: "#f43f5e" }} />
          <p className="text-sm font-medium" style={{ color: "#f43f5e" }}>
            Data load karne mein problem aayi. Showing last available data.
          </p>
          <button
            onClick={() => fetchData(true)}
            className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(244,63,94,0.15)",
              color: "#f43f5e",
              border: "1px solid rgba(244,63,94,0.25)",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ===== KPI STAT CARDS ===== */}
      <div className="metric-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: "var(--brand-primary)" }} />
          <h2 className="section-title mb-0">Quick Actions</h2>
        </div>
        <div className="quick-grid">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="action-card group flex flex-col items-center justify-center gap-3 text-center animate-slide-up"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.boxShadow = `var(--shadow-md), 0 0 0 1px ${action.accentColor}30`;
                  el.style.borderColor = `${action.accentColor}30`;
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.boxShadow = "var(--shadow-card)";
                  el.style.borderColor = "var(--border-primary)";
                  el.style.transform = "";
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-110"
                  style={{ background: action.gradient, boxShadow: `0 6px 20px ${action.glow}` }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)" }}
                  />
                  <Icon size={22} className="text-white relative z-10" />
                </div>
                <div>
                  <span className="text-sm font-bold block" style={{ color: "var(--text-primary)" }}>
                    {action.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {action.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <BulkRemindersWidget />
      </section>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-5 items-stretch">
        {/* Revenue Area Chart */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title mb-0">Revenue Overview</h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Last 7 days performance
              </p>
            </div>
            {data?.percentChanges?.weeklyIncome && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: data.percentChanges.weeklyIncome.positive
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(244,63,94,0.1)",
                  color: data.percentChanges.weeklyIncome.positive ? "#10b981" : "#f43f5e",
                  border: `1px solid ${data.percentChanges.weeklyIncome.positive ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
                }}
              >
                <TrendingUp size={12} />
                {data.percentChanges.weeklyIncome.value} vs last week
              </div>
            )}
          </div>

          {isChartEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(79,110,247,0.1)", border: "1px dashed rgba(79,110,247,0.3)" }}
              >
                <TrendingUp size={24} style={{ color: "var(--brand-primary)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  No revenue data yet
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Transactions hone pe chart yahan dikhega
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.map((d) => ({ ...d, displayDate: formatChartDate(d.date) }))}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11.5, fill: "var(--text-muted)", fontFamily: "inherit" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "inherit" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(79,110,247,0.15)", strokeWidth: 2 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f6ef7"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#4f6ef7", stroke: "var(--bg-card)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Activity</h2>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: "#10b981",
                boxShadow: "0 0 8px rgba(16,185,129,0.7)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {!data?.recentActivities || data.recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50 py-10 gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(79,110,247,0.1)", border: "1px dashed rgba(79,110,247,0.3)" }}
                >
                  <Activity size={22} style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No recent activity</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Koi action hone pe yahan dikhega</p>
                </div>
              </div>
            ) : (
              data.recentActivities.map((item: RecentActivity, i: number) => {
                let color = "#4f6ef7";
                let ItemIcon = Activity;
                let href = "#";

                if (item.entity === "CUSTOMER") {
                  color = "#10b981";
                  ItemIcon = UserPlus;
                  href = item.entityId ? `/customers/${item.entityId}` : "/customers";
                } else if (item.entity === "SERVICE") {
                  color = "#f97316";
                  ItemIcon = Briefcase;
                  href = item.entityId ? `/services/${item.entityId}` : "/services";
                } else if (item.entity === "INVOICE") {
                  color = "#a78bfa";
                  ItemIcon = IndianRupee;
                  href = item.entityId ? `/billing/${item.entityId}` : "/billing";
                }

                return (
                  <Link
                    href={href}
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-all hover:bg-[var(--bg-secondary)] animate-slide-up"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}18` }}
                    >
                      <ItemIcon size={13} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.action}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {item.details || item.entity} · {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/services"
            className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-primary)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "rgba(79,110,247,0.08)";
              el.style.color = "var(--brand-primary)";
              el.style.borderColor = "rgba(79,110,247,0.2)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "var(--bg-secondary)";
              el.style.color = "var(--text-secondary)";
              el.style.borderColor = "var(--border-primary)";
            }}
          >
            View all activity
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* ===== GOAL TRACKER + TOP SERVICES ROW ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <GoalTrackerWidget currentIncome={data?.todayIncome || 0} />
        <TopServicesWidget services={data?.topServices || []} />
      </div>

      {/* ===== LOW STOCK + QUICK EXPENSE ROW ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <LowStockWidget items={data?.lowStockItems || []} />
        <QuickExpenseWidget />
      </div>

      {/* ===== INVOICE BAR CHART + RECENT SERVICES TABLE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] gap-5 items-stretch">
        {/* Bar chart */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h2 className="section-title mb-1">Daily Invoices</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Last 7 days
          </p>
          {isChartEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(79,110,247,0.1)", border: "1px dashed rgba(79,110,247,0.3)" }}
              >
                <BarChart2 size={24} style={{ color: "var(--brand-primary)" }} />
              </div>
              <p className="text-sm font-medium text-center" style={{ color: "var(--text-secondary)" }}>
                No invoice data yet
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.map((d) => ({ ...d, displayDate: formatChartDate(d.date) }))}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "inherit" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "inherit" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(79,110,247,0.06)", radius: 8 }} />
                  <Bar dataKey="invoices" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === chartData.length - 1 ? "#4f6ef7" : "rgba(79,110,247,0.25)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Services Table — Rows clickable */}
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h2 className="section-title mb-0">Recent Services</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Latest customer requests
              </p>
            </div>
            <Link
              href="/services"
              className="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
              style={{ color: "var(--brand-primary)" }}
            >
              View all
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Fees</th>
                </tr>
              </thead>
              <tbody>
                {!data?.recentServices || data.recentServices.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-10 opacity-50 gap-3">
                        <Briefcase size={24} style={{ color: "var(--text-muted)" }} />
                        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                          No recent services found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.recentServices.map((service: RecentService, i: number) => (
                    <tr
                      key={service.id}
                      className="animate-slide-up cursor-pointer"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setIsServiceDetailsOpen(true);
                      }}
                      title="Click to view service details"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{
                              background: `hsl(${(service.customer?.name?.charCodeAt(0) || 65) * 5 % 360}, 65%, 50%)`,
                            }}
                          >
                            {service.customer?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
                              {service.customer?.name}
                            </div>
                            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {service.customer?.mobile}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          {service.serviceType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${SERVICE_STATUS_COLORS[service.status as keyof typeof SERVICE_STATUS_COLORS]}`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                        {format(new Date(service.createdAt), "dd MMM")}
                      </td>
                      <td>
                        <span className="font-bold text-[13px]" style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(service.fees)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ServiceDetailsDialog
        isOpen={isServiceDetailsOpen}
        onClose={() => {
          setIsServiceDetailsOpen(false);
          setSelectedServiceId(null);
        }}
        serviceId={selectedServiceId}
        onSuccess={(shouldClose = true) => {
          fetchData(true);
          if (shouldClose) {
            setIsServiceDetailsOpen(false);
            setSelectedServiceId(null);
          }
        }}
      />
    </div>
  );
}
