"use client";

import { useEffect, useState, useRef } from "react";
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
  Star,
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

interface DashboardData {
  todayIncome: number;
  todayTransactions: number;
  todayCustomers: number;
  pendingServices: number;
  completedToday: number;
  totalCustomers: number;
  monthlyRevenue: number;
  recentServices: any[];
  recentActivities: any[];
  chartData: any[];
  partialInvoicesCount: number;
}

const MOCK_CHART = [
  { date: "Mon", revenue: 0, invoices: 0 },
  { date: "Tue", revenue: 0, invoices: 0 },
  { date: "Wed", revenue: 0, invoices: 0 },
  { date: "Thu", revenue: 0, invoices: 0 },
  { date: "Fri", revenue: 0, invoices: 0 },
  { date: "Sat", revenue: 0, invoices: 0 },
  { date: "Sun", revenue: 0, invoices: 0 },
];

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
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
  icon: any;
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
  const Component = href ? Link : ("div" as any);

  return (
    <Component
      href={href}
      className={`stat-card animate-slide-up flex flex-col justify-between ${href ? 'hover:scale-[1.01] hover:shadow-md transition-all cursor-pointer' : ''}`}
      style={{ 
        animationDelay: `${delay}ms`, 
        animationFillMode: "both",
        minHeight: "108px",
        padding: "12px 14px"
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
            <ArrowUpRight size={10} style={{ transform: changePositive ? "" : "rotate(90deg)" }} />
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

// Replaced with real data from API

const CustomTooltip = ({ active, payload, label }: any) => {
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
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {p.dataKey === "revenue" ? formatCurrency(p.value) : `${p.value} invoices`}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
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
          {payload[0].value} invoices
        </p>
      </div>
    );
  }
  return null;
};

// Helper to calculate time ago
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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetingEmoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : "🌙";

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
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
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow"
          style={{ background: "linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)" }}
        >
          <Loader2 size={24} className="animate-spin text-white" />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  const stats: StatCardProps[] = [
    {
      title: "Today's Income",
      value: data?.todayIncome || 0,
      displayValue: formatCurrency(data?.todayIncome || 0),
      subtitle: `${data?.todayTransactions || 0} transactions today`,
      icon: IndianRupee,
      gradient: "linear-gradient(135deg, #4f6ef7 0%, #3451d1 100%)",
      accentColor: "#4f6ef7",
      change: "+12%",
      changePositive: true,
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
      change: "+5%",
      changePositive: true,
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
      change: "+3",
      changePositive: true,
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
      change: "+18%",
      changePositive: true,
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

  return (
    <div className="page-shell page-shell-dashboard">
      {/* ===== WELCOME HERO ===== */}
      <div
        className="relative overflow-hidden rounded-xl p-4 sm:p-5 animate-fade-in flex flex-col gap-3.5"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)", // Rich indigo gradient
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 12px 24px -6px rgba(49, 46, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        {/* Background orbs */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)",
            transform: "translate(20%, -30%)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-xs"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                Live Dashboard
              </div>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight"
            >
              {greeting}, Ruhan! {greetingEmoji}
            </h1>
            <p
              className="text-xs font-semibold flex items-center gap-1.5"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              <Clock size={13} className="opacity-80" />
              {format(now, "EEEE, dd MMMM yyyy • hh:mm:ss a")}
            </p>
          </div>

          <Link
            href="/services"
            className="hidden sm:flex btn-primary shrink-0 py-2 px-3 text-xs transition-transform hover:scale-105"
            style={{
              background: "#ffffff",
              color: "#312e81",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <Plus size={14} />
            New Service
          </Link>
        </div>

        {/* Stats preview strip */}
        <div
          className="relative z-10 pt-2.5 flex items-center flex-wrap gap-x-6 gap-y-2 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {[
            { label: "Today's Income", value: formatCurrency(data?.todayIncome || 0), icon: "💰" },
            { label: "Active Services", value: data?.pendingServices || 0, icon: "⚡" },
            { label: "New Today", value: data?.todayCustomers || 0, icon: "👥" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-base filter drop-shadow-xs">{item.icon}</span>
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <span className="opacity-75 text-xs font-medium">{item.label}:</span>
                <span className="text-sm font-bold tracking-tight">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                    animationFillMode: "both"
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
                  <span
                    className="text-sm font-bold block"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {action.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {action.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
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
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <TrendingUp size={12} />
              +18.2% this week
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData?.length ? data.chartData : MOCK_CHART}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
              <XAxis
                dataKey="date"
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
                activeDot={{
                  r: 5,
                  fill: "#4f6ef7",
                  stroke: "var(--bg-card)",
                  strokeWidth: 2,
                }}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
            {(!data?.recentActivities || data.recentActivities.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                <Activity size={24} className="mb-2" />
                <p className="text-xs">No recent activity</p>
              </div>
            ) : (
              data.recentActivities.map((item: any, i: number) => {
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

      {/* ===== INVOICE BAR CHART + RECENT SERVICES TABLE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] gap-5 items-stretch">
        {/* Bar chart */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h2 className="section-title mb-1">Daily Invoices</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Last 7 days
          </p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
              <XAxis
                dataKey="date"
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
                {MOCK_CHART.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === MOCK_CHART.length - 2 ? "#4f6ef7" : "rgba(79,110,247,0.25)"}
                  />
                ))}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Services Table */}
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
                {(!data?.recentServices || data.recentServices.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 opacity-50 text-sm">
                      No recent services found
                    </td>
                  </tr>
                ) : data.recentServices.map((service: any, i: number) => (
                  <tr key={service.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}>
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
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {service.serviceType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${SERVICE_STATUS_COLORS[service.status]}`}>
                        {service.status}
                      </span>
                    </td>
                    <td
                      className="text-[12.5px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {format(new Date(service.createdAt), "dd MMM")}
                    </td>
                    <td>
                      <span
                        className="font-bold text-[13px]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatCurrency(service.fees)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
