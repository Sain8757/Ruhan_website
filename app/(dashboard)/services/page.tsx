"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Loader2,
  ChevronRight,
  Briefcase,
  LayoutGrid,
  List,
  Search,
  MessageCircle,
  TrendingDown,
  Clock,
  IndianRupee,
  AlertTriangle,
  Eye,
  Calendar,
  Keyboard,
  Download,
  CheckSquare,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  SERVICE_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";
import NewServiceDialog from "@/components/services/NewServiceDialog";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";
import dynamic from "next/dynamic";

// Lazy-load analytics panel (has recharts — avoids SSR issues)
const ServicesAnalyticsPanel = dynamic(
  () => import("@/components/services/ServicesAnalyticsPanel"),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: string;
  trackingId?: string;
  serviceType: string;
  status: string;
  fees: number;
  paymentStatus: string;
  createdAt: string;
  deadline?: string | null;
  missingDocs?: string;
  notes?: string;
  customer: { id: string; name: string; mobile: string };
}

interface DayRevenue {
  day: string;
  revenue: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_ORDER = ["PENDING", "SUBMITTED", "PROCESSING", "APPROVED", "DELIVERED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const STATUS_COLORS_BG: Record<string, string> = {
  PENDING: "#fffde7",
  SUBMITTED: "#e3f0ff",
  PROCESSING: "#e6f7ff",
  APPROVED: "#f0fff0",
  DELIVERED: "#d9f7be",
  CANCELLED: "#fff1f0",
};
const QUICK_FILTERS = [
  { key: "ALL", label: "All", color: "#555", bg: "#f0f0f0" },
  { key: "PENDING", label: "Pending", color: "#7c5e00", bg: "#fffde7" },
  { key: "SUBMITTED", label: "Submitted", color: "#003a8c", bg: "#e3f0ff" },
  { key: "PROCESSING", label: "Processing", color: "#00596b", bg: "#e6f7ff" },
  { key: "APPROVED", label: "Approved", color: "#1a5c1a", bg: "#f0fff0" },
  { key: "DELIVERED", label: "Delivered", color: "#135200", bg: "#d9f7be" },
  { key: "UNPAID", label: "💰 Unpaid", color: "#d46b08", bg: "#fff7e6" },
  { key: "DUE_TODAY", label: "📅 Due Today", color: "#cf1322", bg: "#fff1f0" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysOld(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}
function getAgeingBg(daysOld: number): string {
  if (daysOld >= 10) return "#ffe4cc";
  if (daysOld >= 6) return "#fff3e0";
  if (daysOld >= 3) return "#fffde7";
  return "";
}

// ─── Sound beep helper (F5) ───────────────────────────────────────────────────
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) {}
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface ContextMenuState {
  x: number;
  y: number;
  service: Service;
}
function ContextMenu({
  ctx,
  onClose,
  onStatusChange,
  onOpenDetails,
}: {
  ctx: ContextMenuState;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onOpenDetails: (s: Service) => void;
}) {
  const [showStatus, setShowStatus] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: Math.min(ctx.y, window.innerHeight - 280),
    left: Math.min(ctx.x, window.innerWidth - 200),
    zIndex: 999999,
    background: "var(--bg-card)",
    border: "1px solid var(--border-primary)",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    minWidth: "185px",
    padding: "4px",
    fontSize: "13px",
  };
  const itemBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    cursor: "pointer",
    borderRadius: 6,
    color: "var(--text-primary)",
  };
  const Item = ({
    icon,
    label,
    onClick,
    danger,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <div
      style={{ ...itemBase, color: danger ? "#cf1322" : itemBase.color }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={() => {
        onClick();
        onClose();
      }}
    >
      <span>{icon}</span> {label}
    </div>
  );
  const s = ctx.service;
  return (
    <div ref={ref} style={menuStyle}>
      <div
        style={{
          padding: "4px 12px 6px",
          fontSize: "11px",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border-primary)",
          marginBottom: 4,
        }}
      >
        {s.customer.name} — {s.serviceType}
      </div>
      <Item icon="📂" label="Open Details" onClick={() => onOpenDetails(s)} />
      <Item
        icon="📱"
        label="Send WhatsApp"
        onClick={() => {
          const msg = encodeURIComponent(
            `नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* का status: *${STATUS_LABELS[s.status]}*\n\n— RA Seva Point`
          );
          window.open(
            `https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`,
            "_blank"
          );
        }}
      />
      <Item icon="🖨️" label="Print Receipt" onClick={() => window.print()} />
      <div style={{ position: "relative" }}>
        <div
          style={itemBase}
          onMouseEnter={(e) => {
            (e.currentTarget.style.background = "var(--bg-hover)");
            setShowStatus(true);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          onClick={() => setShowStatus(!showStatus)}
        >
          <span>🔄</span> Change Status{" "}
          <span style={{ marginLeft: "auto" }}>▶</span>
        </div>
        {showStatus && (
          <div
            style={{
              position: "absolute",
              left: "100%",
              top: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              minWidth: "150px",
              padding: 4,
              zIndex: 999999,
            }}
          >
            {STATUS_ORDER.map((st) => (
              <div
                key={st}
                style={{
                  ...itemBase,
                  background:
                    s.status === st ? STATUS_COLORS_BG[st] : "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    s.status === st ? STATUS_COLORS_BG[st] : "transparent")
                }
                onClick={() => {
                  onStatusChange(s.id, st);
                  onClose();
                }}
              >
                {STATUS_LABELS[st]}
                {s.status === st && (
                  <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          borderTop: "1px solid var(--border-primary)",
          marginTop: 4,
          paddingTop: 4,
        }}
      >
        <Item
          icon="💳"
          label="Mark as Paid"
          onClick={async () => {
            await fetch(`/api/services/${s.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentStatus: "PAID" }),
            });
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}

// ─── Hover Preview ────────────────────────────────────────────────────────────
interface HoverState {
  x: number;
  y: number;
  service: Service;
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────
function KanbanBoard({
  services,
  onSelect,
  onStatusChange,
  onContextMenu,
}: {
  services: Service[];
  onSelect: (s: Service) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onContextMenu: (e: React.MouseEvent, s: Service) => void;
}) {
  const [hoveredService, setHoveredService] = useState<HoverState | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // F10: Quick status update
  const [quickStatusId, setQuickStatusId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("serviceId", id);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("serviceId");
    if (id) onStatusChange(id, status);
  };
  const handleMouseEnter = (e: React.MouseEvent, s: Service) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hoverTimer.current = setTimeout(() => {
      setHoveredService({ x: rect.right + 8, y: rect.top, service: s });
    }, 800);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoveredService(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ position: "relative" }}>
      {STATUS_ORDER.map((status) => {
        // F11: FIFO sort
        const cols = services
          .filter((s) => s.status === status)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return (
          <div
            key={status}
            className="kanban-column shrink-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            style={{ minHeight: "200px" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`badge ${SERVICE_STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {cols.length}
              </span>
            </div>
            {cols.length === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: "var(--text-muted)" }}>
                No services
              </div>
            ) : (
              cols.map((s, idx) => {
                const isOverdue =
                  s.deadline &&
                  new Date(s.deadline).getTime() < Date.now() &&
                  !["APPROVED", "DELIVERED", "CANCELLED"].includes(s.status);
                const isDueSoon =
                  s.deadline &&
                  new Date(s.deadline).getTime() - Date.now() < 86400000 * 2 &&
                  !isOverdue &&
                  !["APPROVED", "DELIVERED", "CANCELLED"].includes(s.status);
                const daysOld = getDaysOld(s.createdAt);
                const isStalled =
                  daysOld > 5 && ["PROCESSING", "SUBMITTED"].includes(s.status);
                const isLossRisk = s.fees === 0 || daysOld > 10;
                const isOldest = idx === 0 && cols.length > 1;
                const ageingBg = getAgeingBg(daysOld);
                const cardBg = isOverdue
                  ? "#ffeaea"
                  : isDueSoon
                  ? "#fff7e6"
                  : ageingBg || "var(--bg-card)";
                const cardBorder = isOverdue
                  ? "2px solid #ff4d4f"
                  : isDueSoon
                  ? "2px solid #fa8c16"
                  : isStalled
                  ? "2px solid #722ed1"
                  : "1px solid var(--border-primary)";

                return (
                  <div
                    key={s.id}
                    className="kanban-card cursor-grab active:cursor-grabbing"
                    style={{ background: cardBg, border: cardBorder, position: "relative" }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    onClick={() => {
                      if (quickStatusId === s.id) return;
                      onSelect(s);
                    }}
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, s); }}
                    onMouseEnter={(e) => handleMouseEnter(e, s)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {isOldest && (
                      <div style={{ position: "absolute", top: 4, right: 4, fontSize: "9px", background: "#722ed1", color: "white", padding: "1px 4px", borderRadius: 2 }}>
                        ⏳ OLDEST
                      </div>
                    )}
                    <div
                      className="font-bold text-sm mb-1 truncate"
                      style={{ color: "var(--text-primary)", paddingRight: isOldest ? "52px" : "0", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      {s.customer.name}
                      {isOverdue && <span title="Overdue!" className="text-red-500 text-xs">⚠️</span>}
                    </div>
                    <div className="text-xs mb-1 truncate" style={{ color: "var(--text-secondary)" }}>
                      {s.serviceType}
                    </div>

                    {/* F10: Quick Status Toggle */}
                    {quickStatusId === s.id ? (
                      <select
                        autoFocus
                        value={s.status}
                        style={{ fontSize: 11, width: "100%", marginBottom: 4, border: "1px solid #aaa", borderRadius: 3, padding: "2px" }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { onStatusChange(s.id, e.target.value); setQuickStatusId(null); }}
                        onBlur={() => setQuickStatusId(null)}
                      >
                        {STATUS_ORDER.map((st) => (
                          <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuickStatusId(s.id); }}
                        style={{ fontSize: "9px", background: STATUS_COLORS_BG[s.status] || "#f0f0f0", border: "1px solid #ccc", borderRadius: 3, padding: "1px 5px", cursor: "pointer", marginBottom: 4, width: "100%", textAlign: "left" }}
                        title="Quick Status Change"
                      >
                        🔄 {STATUS_LABELS[s.status]}
                      </button>
                    )}

                    <div className="flex flex-wrap gap-1 mb-1">
                      {isStalled && (
                        <span style={{ fontSize: "9px", background: "#f9f0ff", color: "#722ed1", border: "1px solid #d3adf7", padding: "1px 4px", borderRadius: 2, fontWeight: "bold" }}>
                          🔴 Stalled {daysOld}d
                        </span>
                      )}
                      {isLossRisk && (
                        <span style={{ fontSize: "9px", background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e", padding: "1px 4px", borderRadius: 2, fontWeight: "bold" }}>
                          💸 Loss Risk
                        </span>
                      )}
                      {s.paymentStatus === "UNPAID" && (
                        <span style={{ fontSize: "9px", background: "#fff7e6", color: "#d46b08", border: "1px solid #ffd591", padding: "1px 4px", borderRadius: 2 }}>
                          💰 Unpaid
                        </span>
                      )}
                      {s.missingDocs && (
                        <span style={{ fontSize: "9px", background: "#f0f5ff", color: "#2f54eb", border: "1px solid #adc6ff", padding: "1px 4px", borderRadius: 2 }}>
                          📎 Docs
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(s.createdAt)}</span>
                        <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>{formatCurrency(s.fees)}</span>
                      </div>
                      {s.deadline && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm inline-block self-start ${isOverdue ? "bg-red-100 text-red-700" : isDueSoon ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                          Due: {new Date(s.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {/* F10: Hover Preview */}
      {hoveredService && (
        <div style={{ position: "fixed", top: Math.min(hoveredService.y, window.innerHeight - 230), left: Math.min(hoveredService.x, window.innerWidth - 260), zIndex: 99999, background: "var(--bg-card)", border: "2px solid var(--brand-primary)", borderRadius: 8, padding: "12px", width: "240px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", pointerEvents: "none", fontSize: "12px" }}>
          <div style={{ fontWeight: "bold", marginBottom: 6, color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: 4 }}>
            <Eye size={12} /> Quick Look
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div><strong>Customer:</strong> {hoveredService.service.customer.name}</div>
            <div><strong>Mobile:</strong> {hoveredService.service.customer.mobile}</div>
            <div><strong>Service:</strong> {hoveredService.service.serviceType}</div>
            <div><strong>Fees:</strong> {formatCurrency(hoveredService.service.fees)}</div>
            <div><strong>Payment:</strong> <span style={{ color: hoveredService.service.paymentStatus === "PAID" ? "green" : "red" }}>{hoveredService.service.paymentStatus}</span></div>
            {hoveredService.service.missingDocs && <div style={{ color: "#d46b08" }}><strong>Missing Docs:</strong> {hoveredService.service.missingDocs}</div>}
            {hoveredService.service.notes && <div style={{ color: "#555" }}><strong>Notes:</strong> {hoveredService.service.notes.slice(0, 80)}</div>}
            <div style={{ color: "#888", fontSize: "10px" }}>Age: {getDaysOld(hoveredService.service.createdAt)} days</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ services, onSelect }: { services: Service[]; onSelect: (s: Service) => void }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const getDayLabel = (d: Date) => {
    if (d.toDateString() === today.toDateString()) return "Today";
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
      {days.map((d, idx) => {
        const dateStr = d.toDateString();
        const daySvcs = services.filter(
          (s) => s.deadline && new Date(s.deadline).toDateString() === dateStr
        );
        const isToday = idx === 0;
        return (
          <div key={idx} style={{ minWidth: 160, background: isToday ? "#e3f0ff" : "var(--bg-card)", border: isToday ? "2px solid #000080" : "1px solid var(--border-primary)", borderRadius: 8, padding: "10px 8px", flexShrink: 0 }}>
            <div style={{ fontWeight: "bold", fontSize: 12, color: isToday ? "#000080" : "var(--text-muted)", marginBottom: 8 }}>
              {isToday && "📅 "}
              {getDayLabel(d)}
            </div>
            {daySvcs.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No deadlines</div>
            ) : (
              daySvcs.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelect(s)}
                  style={{ background: STATUS_COLORS_BG[s.status] || "#f9f9f9", border: "1px solid #ddd", borderRadius: 4, padding: "4px 6px", marginBottom: 4, cursor: "pointer", fontSize: 11 }}
                >
                  <div style={{ fontWeight: "bold", color: "var(--text-primary)" }}>{s.customer.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10 }}>{s.serviceType}</div>
                  <div style={{ color: "var(--brand-primary)", fontSize: 10, fontWeight: "bold" }}>{formatCurrency(s.fees)}</div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Keyboard Shortcuts Tooltip ────────────────────────────────────────────────
function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: "2px solid #000080", borderRadius: 10, padding: "20px 28px", minWidth: 320, boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: "#000080", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Keyboard size={16} /> Keyboard Shortcuts
        </div>
        {[
          ["N", "New Service"],
          ["K", "Kanban View"],
          ["L", "List View"],
          ["C", "Calendar View"],
          ["/", "Focus Search"],
          ["A", "Analytics Panel"],
          ["E", "Export to Excel"],
          ["Escape", "Close dialogs / menu"],
        ].map(([key, label]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <kbd style={{ background: "#f0f0f0", border: "1px solid #aaa", borderRadius: 4, padding: "2px 8px", fontFamily: "monospace", fontSize: 13, minWidth: 60, textAlign: "center" }}>{key}</kbd>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: 10, width: "100%", padding: "6px", background: "#000080", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Close (Esc)</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("ALL");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [liveToken, setLiveToken] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dailyRevenue, setDailyRevenue] = useState<DayRevenue[]>([]);
  const [dailyTarget, setDailyTarget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("ra_daily_target") || "2000");
    }
    return 2000;
  });
  // F4: stalled alert banner
  const [stalledBannerDismissed, setStalledBannerDismissed] = useState(false);
  // F16: duplicate alert
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // ─── Fetch services ─────────────────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      const res = await fetch(`/api/services?${params}`);
      const data = await res.json();
      const svcs: Service[] = data.services || [];
      setServices(svcs);
      setTotal(data.total || 0);

      // F16: Duplicate alert check
      const seen: Record<string, { customer: string; date: string }[]> = {};
      svcs.forEach((s) => {
        const key = `${s.customer.id}__${s.serviceType}`;
        if (!seen[key]) seen[key] = [];
        seen[key].push({ customer: s.customer.name, date: s.createdAt });
      });
      for (const key of Object.keys(seen)) {
        const entries = seen[key];
        if (entries.length > 1) {
          const sorted = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const daysDiff = Math.floor((new Date(sorted[0].date).getTime() - new Date(sorted[1].date).getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 30) {
            const parts = key.split("__");
            setDuplicateAlert(`⚠️ Duplicate Alert: ${sorted[0].customer} — "${parts[1]}" has been added ${entries.length} times in the last 30 days!`);
            break;
          }
        }
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch daily revenue for chart ──────────────────────────────────────────
  const fetchRevenue = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/daily-closing");
      const data = await res.json();
      if (data.last7Days) {
        setDailyRevenue(
          data.last7Days.map((d: any) => ({
            day: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
            revenue: d.income || 0,
          }))
        );
      }
    } catch {
      // Fallback: compute from loaded services
      const dayMap: Record<string, number> = {};
      services.forEach((s) => {
        const d = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short" });
        dayMap[d] = (dayMap[d] || 0) + s.fees;
      });
      setDailyRevenue(Object.entries(dayMap).map(([day, revenue]) => ({ day, revenue })));
    }
  }, [services]);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => { if (services.length > 0) fetchRevenue(); }, [services.length]);

  // ─── F6: Browser Tab Badge ───────────────────────────────────────────────────
  useEffect(() => {
    const overdueCount = services.filter(
      (s) =>
        s.deadline &&
        new Date(s.deadline).getTime() < Date.now() &&
        !["APPROVED", "DELIVERED", "CANCELLED"].includes(s.status)
    ).length;
    if (overdueCount > 0) {
      document.title = `(${overdueCount} Overdue) Services — RA Seva Point`;
    } else {
      document.title = "Services — RA Seva Point";
    }
    return () => { document.title = "Services — RA Seva Point"; };
  }, [services]);

  // ─── F9: Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      switch (e.key.toLowerCase()) {
        case "n": setIsNewServiceOpen(true); break;
        case "k": setView("kanban"); break;
        case "l": setView("list"); break;
        case "c": setView("calendar"); break;
        case "a": setShowAnalytics((v) => !v); break;
        case "e": handleExportExcel(); break;
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "?": setShowShortcuts(true); break;
        case "escape":
          setIsNewServiceOpen(false);
          setIsDetailsOpen(false);
          setShowShortcuts(false);
          setContextMenu(null);
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ─── F12: Export to Excel ────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const rows = filtered.map((s) => ({
      "Customer Name": s.customer.name,
      "Mobile": s.customer.mobile,
      "Service Type": s.serviceType,
      "Status": STATUS_LABELS[s.status],
      "Payment": s.paymentStatus,
      "Fees (₹)": s.fees,
      "Created Date": formatDate(s.createdAt),
      "Deadline": s.deadline ? new Date(s.deadline).toLocaleDateString() : "",
      "Missing Docs": s.missingDocs || "",
      "Tracking ID": s.trackingId || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Services");
    XLSX.writeFile(wb, `services-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel file downloaded!");
  };

  // ─── F13: WhatsApp Daily Summary ─────────────────────────────────────────────
  const handleWASummary = () => {
    const today = new Date().toDateString();
    const todayServices = services.filter(
      (s) => new Date(s.createdAt).toDateString() === today
    );
    const todayRevenue = todayServices.reduce((sum, s) => sum + s.fees, 0);
    const delivered = services.filter((s) => s.status === "DELIVERED").length;
    const unpaid = services.filter((s) => s.paymentStatus === "UNPAID" && s.status !== "CANCELLED").length;
    const overdue = services.filter(
      (s) => s.deadline && new Date(s.deadline).getTime() < Date.now() && !["APPROVED","DELIVERED","CANCELLED"].includes(s.status)
    ).length;

    const text = encodeURIComponent(
      `📊 *RA Seva Point — Daily Report*\n` +
      `📅 Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
      `✅ New Services Today: ${todayServices.length}\n` +
      `💰 Today's Collection: ₹${todayRevenue.toLocaleString("en-IN")}\n` +
      `📦 Total Active: ${total}\n` +
      `✔️ Delivered: ${delivered}\n` +
      `💳 Unpaid: ${unpaid}\n` +
      `⚠️ Overdue: ${overdue}\n\n` +
      `— RA Seva Point Management`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // ─── F11: Close Day ───────────────────────────────────────────────────────────
  const handleCloseDay = async () => {
    const approved = services.filter((s) => s.status === "APPROVED");
    if (approved.length === 0) { toast.error("No APPROVED services to close."); return; }
    if (!confirm(`${approved.length} APPROVED services ko DELIVERED mark karein? Yahi kal ka closing hai.`)) return;
    try {
      await Promise.all(
        approved.map((s) =>
          fetch(`/api/services/${s.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "DELIVERED" }),
          })
        )
      );
      toast.success(`${approved.length} services DELIVERED marked!`);
      fetchServices();
    } catch {
      toast.error("Some updates failed, please refresh.");
    }
  };

  // ─── Kiosk call next ─────────────────────────────────────────────────────────
  const callNextToken = async () => {
    setCallingNext(true);
    try {
      const res = await fetch("/api/kiosk/call-next", { method: "POST" });
      const data = await res.json();
      if (data.token) {
        setLiveToken(data.token);
        toast.success(`Calling: ${data.token} — ${data.customer?.name}`);
        playBeep(); // F5: Sound alert
        fetchServices();
        setTimeout(() => setLiveToken(null), 6000);
      } else {
        toast.error("No pending kiosk requests");
      }
    } catch {
      toast.error("Failed to call next token");
    } finally {
      setCallingNext(false);
    }
  };

  // ─── Status change ────────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, newStatus: string) => {
    const svc = services.find((x) => x.id === id);
    if (newStatus === "DELIVERED" && svc && svc.paymentStatus === "UNPAID" && svc.fees > 0) {
      const addToKhata = confirm(
        `${svc.customer.name} ka ₹${svc.fees} UNPAID hai.\nKya Khata (Udhaar) mein add karein?`
      );
      if (addToKhata) {
        try {
          await fetch("/api/income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `${svc.serviceType} — ${svc.customer.name}`, amount: svc.fees, category: "Udhaar", customerId: svc.customer.id }),
          });
          toast.success("Khata entry added!");
        } catch { toast.error("Khata entry failed."); }
      }
    }
    try {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Status updated");
      if (newStatus === "APPROVED" || newStatus === "DELIVERED") {
        if (confirm(`WhatsApp bhejein?`)) {
          const s = services.find((x) => x.id === id);
          if (s) {
            const msg = encodeURIComponent(`नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* का status: *${STATUS_LABELS[newStatus]}*\n\n— RA Seva Point`);
            window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
          }
        }
      }
    } catch {
      toast.error("Status update failed");
      fetchServices();
    }
  };

  // ─── Bulk update ──────────────────────────────────────────────────────────────
  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/services/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: bulkStatus }),
      });
      if (!res.ok) throw new Error("Bulk update failed");
      toast.success(`${selectedIds.size} services updated`);
      setSelectedIds(new Set());
      setBulkStatus("");
      fetchServices();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsBulkUpdating(false); }
  };

  // ─── Bulk WhatsApp ────────────────────────────────────────────────────────────
  const handleBulkWhatsApp = () => {
    const targets = filtered.filter(
      (s) => selectedIds.size > 0 ? selectedIds.has(s.id) : (s.status === "PENDING" && s.missingDocs)
    );
    if (targets.length === 0) { toast.error("Koi bhi target customer nahi mila."); return; }
    toast.success(`${targets.length} customers ko message bheja ja raha hai...`);
    targets.forEach((s, i) => {
      setTimeout(() => {
        const msg = encodeURIComponent(`नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* के लिए दस्तावेज़ बाकी हैं:\n*${s.missingDocs || "आवश्यक दस्तावेज़"}*\n\n— RA Seva Point`);
        window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
      }, i * 600);
    });
  };

  // ─── Target save ─────────────────────────────────────────────────────────────
  const handleTargetChange = (t: number) => {
    setDailyTarget(t);
    localStorage.setItem("ra_daily_target", String(t));
  };

  // ─── Toggles ──────────────────────────────────────────────────────────────────
  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? new Set(filtered.map((s) => s.id)) : new Set());
  };

  // ─── Filtering ────────────────────────────────────────────────────────────────
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

  const baseFiltered = query
    ? services.filter(
        (s) =>
          s.serviceType.toLowerCase().includes(query.toLowerCase()) ||
          s.customer.name.toLowerCase().includes(query.toLowerCase()) ||
          s.customer.mobile.includes(query) ||
          (s.trackingId || "").toLowerCase().includes(query.toLowerCase())
      )
    : services;

  const filtered = (() => {
    if (quickFilter === "ALL") return baseFiltered;
    if (quickFilter === "UNPAID") return baseFiltered.filter((s) => s.paymentStatus === "UNPAID");
    if (quickFilter === "DUE_TODAY")
      return baseFiltered.filter(
        (s) => s.deadline && new Date(s.deadline) >= todayStart && new Date(s.deadline) <= todayEnd
      );
    return baseFiltered.filter((s) => s.status === quickFilter);
  })();

  // ─── Footer analytics ─────────────────────────────────────────────────────────
  const totalUnpaid = services.filter((s) => s.paymentStatus === "UNPAID" && s.status !== "CANCELLED").reduce((sum, s) => sum + s.fees, 0);
  const dueTodayCount = services.filter((s) => s.deadline && new Date(s.deadline) >= todayStart && new Date(s.deadline) <= todayEnd).length;
  const overdueCount = services.filter((s) => s.deadline && new Date(s.deadline) < todayStart && !["APPROVED","DELIVERED","CANCELLED"].includes(s.status)).length;
  const stalledCount = services.filter((s) => getDaysOld(s.createdAt) > 5 && ["PROCESSING","SUBMITTED"].includes(s.status)).length;

  const showStalledBanner = stalledCount > 0 && !stalledBannerDismissed;

  return (
    <div className="page-shell page-shell-list" style={{ paddingBottom: "56px", paddingRight: showAnalytics ? "296px" : undefined }}>
      {/* F16: Duplicate Alert */}
      {duplicateAlert && (
        <div style={{ background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#d46b08" }}>
          {duplicateAlert}
          <button onClick={() => setDuplicateAlert(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#d46b08" }}>✕</button>
        </div>
      )}

      {/* F4: Stalled Banner */}
      {showStalledBanner && (
        <div style={{ background: "#f9f0ff", border: "1px solid #d3adf7", borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#722ed1" }}>
          🔴 <strong>{stalledCount} services</strong> 5+ din se nahi badhi hain. Unhe check karein!
          <button onClick={() => { setStalledBannerDismissed(true); setQuickFilter("PROCESSING"); }} style={{ background: "#722ed1", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11, marginLeft: 8 }}>View Stalled</button>
          <button onClick={() => setStalledBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#722ed1", marginLeft: 4 }}>✕</button>
        </div>
      )}

      <PageHeader
        title="Services"
        subtitle={`${total} total services`}
        actions={
          <>
            {/* View toggle */}
            <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
              <button className={`p-2 rounded-lg transition-all ${view === "kanban" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`} onClick={() => setView("kanban")} title="Kanban (K)"><LayoutGrid size={16} /></button>
              <button className={`p-2 rounded-lg transition-all ${view === "list" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`} onClick={() => setView("list")} title="List (L)"><List size={16} /></button>
              <button className={`p-2 rounded-lg transition-all ${view === "calendar" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`} onClick={() => setView("calendar")} title="Calendar (C)"><Calendar size={16} /></button>
            </div>
            <button className="btn-primary" onClick={() => setIsNewServiceOpen(true)} title="New Service (N)"><Plus size={16} /> New Service</button>
            {/* F11: Close Day */}
            <button
              onClick={handleCloseDay}
              className="legacy-button"
              style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: 4, background: "#006600", color: "white" }}
              title="Mark all APPROVED → DELIVERED"
            >
              <CheckSquare size={14} /> Close Day
            </button>
            {/* F12: Export */}
            <button onClick={handleExportExcel} className="legacy-button" style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: 4 }} title="Export Excel (E)">
              <Download size={14} /> Export
            </button>
            {/* F13: WA Summary */}
            <button onClick={handleWASummary} className="legacy-button" style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: 4, background: "#25D366", color: "white" }} title="WhatsApp Daily Summary">
              <MessageCircle size={14} /> Summary
            </button>
            {/* F9: Shortcuts help */}
            <button onClick={() => setShowShortcuts(true)} className="legacy-button" style={{ padding: "6px 8px", fontSize: "12px" }} title="Keyboard Shortcuts (?)">
              <Keyboard size={14} />
            </button>
            <button
              className="legacy-button"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: 6, background: liveToken ? "#008000" : "#d4d0c8", color: liveToken ? "white" : "black" }}
              onClick={callNextToken}
              disabled={callingNext}
            >
              {callingNext ? <Loader2 size={14} className="animate-spin" /> : "🔔"}
              {liveToken ? liveToken : "Call Next"}
            </button>
            <a href="/display" target="_blank" rel="noopener noreferrer" className="legacy-button" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: 6 }}>
              🖥️ Display Board
            </a>
          </>
        }
      />

      {/* Search */}
      <div className="toolbar">
        <div className="search-field" style={{ flex: 1 }}>
          <Search size={14} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by name, mobile, service type or tracking ID... (/)"
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* F2: Mini Filter Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 0 12px 0", alignItems: "center" }}>
        {QUICK_FILTERS.map((f) => {
          const isActive = quickFilter === f.key;
          const count = f.key === "UNPAID"
            ? baseFiltered.filter((s) => s.paymentStatus === "UNPAID").length
            : f.key === "DUE_TODAY"
            ? baseFiltered.filter((s) => s.deadline && new Date(s.deadline) >= todayStart && new Date(s.deadline) <= todayEnd).length
            : f.key === "ALL"
            ? undefined
            : baseFiltered.filter((s) => s.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: isActive ? "bold" : "normal", background: isActive ? f.color : f.bg, color: isActive ? "white" : f.color, border: `1px solid ${f.color}`, cursor: "pointer", transition: "all 0.15s" }}
            >
              {f.label}{count !== undefined && <span style={{ marginLeft: 4, opacity: 0.75 }}>({count})</span>}
            </button>
          );
        })}
        {/* F7: Bulk Remind */}
        <button onClick={handleBulkWhatsApp} style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", background: "#25D366", color: "white", border: "1px solid #1da851", cursor: "pointer", marginLeft: "auto" }} title="Send WhatsApp to all Pending customers with missing docs">
          📱 Remind All Missing Docs
        </button>
      </div>

      {/* Bulk actions (list view) */}
      {selectedIds.size > 0 && view === "list" && (
        <div className="flex items-center gap-3 p-3 mb-4 rounded" style={{ background: "#000080", color: "white" }}>
          <span className="font-semibold text-sm">{selectedIds.size} selected</span>
          <select className="input-field" style={{ width: "150px", color: "black" }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            <option value="">Change Status...</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button className="legacy-button" style={{ fontWeight: "bold" }} onClick={handleBulkUpdate} disabled={!bulkStatus || isBulkUpdating}>
            {isBulkUpdating ? "Updating..." : "Apply"}
          </button>
          <button onClick={() => filtered.filter((s) => selectedIds.has(s.id)).forEach((s, i) => setTimeout(() => {
            const msg = encodeURIComponent(`नमस्ते ${s.customer.name},\nStatus: *${STATUS_LABELS[s.status]}*\n— RA Seva Point`);
            window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
          }, i * 600))}
            style={{ padding: "4px 10px", background: "#25D366", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "12px" }}>
            📱 WhatsApp All
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={56} className="empty-state-icon" />
          <div className="empty-state-title">No services found</div>
          <div className="empty-state-desc">Add your first service or change the filter</div>
          <button className="btn-primary mt-4" onClick={() => setIsNewServiceOpen(true)}><Plus size={16} /> New Service</button>
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          services={filtered}
          onSelect={(s) => { setSelectedService(s); setIsDetailsOpen(true); }}
          onStatusChange={handleStatusChange}
          onContextMenu={(e, s) => setContextMenu({ x: e.clientX, y: e.clientY, service: s })}
        />
      ) : view === "calendar" ? (
        <CalendarView services={filtered} onSelect={(s) => { setSelectedService(s); setIsDetailsOpen(true); }} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}><input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleAll} /></th>
                <th>Customer</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Fees</th>
                <th>Age</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const daysOld = getDaysOld(s.createdAt);
                const isStalled = daysOld > 5 && ["PROCESSING", "SUBMITTED"].includes(s.status);
                const isLossRisk = s.fees === 0 || daysOld > 10;
                return (
                  <tr key={s.id} className={`cursor-pointer ${selectedIds.has(s.id) ? "bg-blue-50" : ""}`}
                    style={{ background: isStalled ? "#faf0ff" : undefined }}
                    onClick={() => { setSelectedService(s); setIsDetailsOpen(true); }}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, service: s }); }}
                  >
                    <td onClick={(e) => toggleSelection(s.id, e)}>
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => {}} />
                    </td>
                    <td>
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.customer.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.customer.mobile}</div>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.serviceType}</td>
                    <td>
                      <span className={`badge ${SERVICE_STATUS_COLORS[s.status]}`}>{s.status}</span>
                      {isStalled && <span style={{ marginLeft: 4, fontSize: "9px", background: "#f9f0ff", color: "#722ed1", padding: "1px 4px", borderRadius: 2 }}>🔴 Stalled</span>}
                    </td>
                    <td><span className={`badge ${PAYMENT_STATUS_COLORS[s.paymentStatus]}`}>{s.paymentStatus}</span></td>
                    <td className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(s.fees)}
                      {isLossRisk && <span style={{ marginLeft: 4, fontSize: "9px", color: "#cf1322" }}>💸</span>}
                    </td>
                    <td className="text-sm" style={{ color: daysOld > 7 ? "#cf1322" : "var(--text-muted)", fontWeight: daysOld > 7 ? "bold" : "normal" }}>{daysOld}d</td>
                    <td className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(s.createdAt)}</td>
                    <td><ChevronRight size={16} style={{ color: "var(--text-muted)" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          ctx={contextMenu}
          onClose={() => setContextMenu(null)}
          onStatusChange={handleStatusChange}
          onOpenDetails={(s) => { setSelectedService(s); setIsDetailsOpen(true); setContextMenu(null); }}
        />
      )}

      {/* F9: Shortcuts Overlay */}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      {/* Analytics Panel */}
      <ServicesAnalyticsPanel
        services={services}
        dailyRevenue={dailyRevenue}
        dailyTarget={dailyTarget}
        onTargetChange={handleTargetChange}
        isOpen={showAnalytics}
        onToggle={() => setShowAnalytics((v) => !v)}
      />

      {/* F4: Live Analytics Footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9000, background: "var(--bg-secondary)", borderTop: "1px solid var(--border-primary)", padding: "6px 16px", display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Briefcase size={12} />
          <strong style={{ color: "var(--text-primary)" }}>{total}</strong> Total
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#d46b08" }}>
          <IndianRupee size={12} />
          Unpaid: <strong>₹{totalUnpaid.toLocaleString("en-IN")}</strong>
        </div>
        {dueTodayCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#1d39c4" }}>
            <Clock size={12} /> Due Today: <strong>{dueTodayCount}</strong>
          </div>
        )}
        {overdueCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#cf1322" }}>
            <AlertTriangle size={12} /> Overdue: <strong>{overdueCount}</strong>
          </div>
        )}
        {stalledCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#722ed1" }}>
            <TrendingDown size={12} /> Stalled: <strong>{stalledCount}</strong>
          </div>
        )}
        <div style={{ marginLeft: "auto", fontSize: "11px" }}>
          Showing {filtered.length} / {services.length} &nbsp;|&nbsp;
          <button onClick={() => setShowShortcuts(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11 }}>⌨ Shortcuts</button>
        </div>
      </div>

      <NewServiceDialog isOpen={isNewServiceOpen} onClose={() => setIsNewServiceOpen(false)} onSuccess={fetchServices} />
      <ServiceDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedService(null); }}
        serviceId={selectedService?.id || null}
        onSuccess={() => { setIsDetailsOpen(false); setSelectedService(null); fetchServices(); }}
      />
    </div>
  );
}
