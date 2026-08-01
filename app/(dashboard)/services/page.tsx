"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import { formatCurrency, formatDate, SERVICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";
import NewServiceDialog from "@/components/services/NewServiceDialog";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";

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
  PENDING:    "#fffde7",
  SUBMITTED:  "#e3f0ff",
  PROCESSING: "#e6f7ff",
  APPROVED:   "#f0fff0",
  DELIVERED:  "#d9f7be",
  CANCELLED:  "#fff1f0",
};

// ─── Helper: Days since createdAt ────────────────────────────────────────────
function getDaysOld(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Helper: Ageing background color ─────────────────────────────────────────
function getAgeingBg(daysOld: number): string {
  if (daysOld >= 10) return "#ffe4cc";  // deep amber-red
  if (daysOld >= 6)  return "#fff3e0";  // amber
  if (daysOld >= 3)  return "#fffde7";  // light yellow
  return "";                             // fresh — no tint
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface ContextMenuState {
  x: number;
  y: number;
  service: Service;
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("serviceId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("serviceId");
    if (id) onStatusChange(id, status);
  };

  const handleMouseEnter = (e: React.MouseEvent, s: Service) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setHoveredService({ x: rect.right + 8, y: rect.top, service: s });
    }, 800);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredService(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ position: "relative" }}>
      {STATUS_ORDER.map((status) => {
        // Feature 11: FIFO — sort oldest first within each column
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

                // Feature 5: Stalled = >5 days in PROCESSING or SUBMITTED
                const isStalled =
                  daysOld > 5 &&
                  ["PROCESSING", "SUBMITTED"].includes(s.status);

                // Feature 9: Loss Risk badge
                const isLossRisk = s.fees === 0 || daysOld > 10;

                // Feature 11: Oldest in column
                const isOldest = idx === 0 && cols.length > 1;

                // Feature 3: Ageing background
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
                    onClick={() => onSelect(s)}
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, s); }}
                    onMouseEnter={(e) => handleMouseEnter(e, s)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Feature 11: Oldest tag */}
                    {isOldest && (
                      <div style={{ position: "absolute", top: 4, right: 4, fontSize: "9px", background: "#722ed1", color: "white", padding: "1px 4px", borderRadius: 2 }}>
                        ⏳ OLDEST
                      </div>
                    )}

                    {/* Customer Name Row */}
                    <div className="font-bold text-sm mb-1 truncate flex items-center gap-1" style={{ color: "var(--text-primary)", paddingRight: isOldest ? "52px" : "0" }}>
                      {s.customer.name}
                      {isOverdue && <span title="Overdue!" className="text-red-500 text-xs">⚠️</span>}
                    </div>

                    {/* Service Type */}
                    <div className="text-xs mb-2 truncate" style={{ color: "var(--text-secondary)" }}>
                      {s.serviceType}
                    </div>

                    {/* Mini Badges Row — Features 5, 9 */}
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
                          📎 Docs Needed
                        </span>
                      )}
                    </div>

                    {/* Fees + Date + Deadline */}
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatDate(s.createdAt)}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                          {formatCurrency(s.fees)}
                        </span>
                      </div>
                      {s.deadline && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm inline-block self-start ${
                          isOverdue ? "bg-red-100 text-red-700" : isDueSoon ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                        }`}>
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

      {/* Feature 10: Hover Preview */}
      {hoveredService && (
        <div
          style={{
            position: "fixed",
            top: Math.min(hoveredService.y, window.innerHeight - 220),
            left: Math.min(hoveredService.x, window.innerWidth - 260),
            zIndex: 99999,
            background: "var(--bg-card)",
            border: "2px solid var(--brand-primary)",
            borderRadius: 8,
            padding: "12px",
            width: "240px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            pointerEvents: "none",
            fontSize: "12px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 6, color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: 4 }}>
            <Eye size={12} /> Quick Look
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div><strong>Customer:</strong> {hoveredService.service.customer.name}</div>
            <div><strong>Mobile:</strong> {hoveredService.service.customer.mobile}</div>
            <div><strong>Service:</strong> {hoveredService.service.serviceType}</div>
            <div><strong>Fees:</strong> {formatCurrency(hoveredService.service.fees)}</div>
            <div><strong>Payment:</strong> <span style={{ color: hoveredService.service.paymentStatus === "PAID" ? "green" : "red" }}>{hoveredService.service.paymentStatus}</span></div>
            {hoveredService.service.missingDocs && (
              <div style={{ color: "#d46b08" }}><strong>Missing Docs:</strong> {hoveredService.service.missingDocs}</div>
            )}
            {hoveredService.service.notes && (
              <div style={{ color: "#555" }}><strong>Notes:</strong> {hoveredService.service.notes.slice(0, 80)}</div>
            )}
            <div style={{ color: "#888", fontSize: "10px" }}>Age: {getDaysOld(hoveredService.service.createdAt)} days</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Right-Click Context Menu Component ──────────────────────────────────────
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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: Math.min(ctx.y, window.innerHeight - 260),
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

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    cursor: "pointer",
    borderRadius: 6,
    color: "var(--text-primary)",
    transition: "background 0.15s",
  };

  const Item = ({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) => (
    <div
      style={{ ...itemStyle, color: danger ? "#cf1322" : itemStyle.color }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      onClick={() => { onClick(); onClose(); }}
    >
      <span>{icon}</span> {label}
    </div>
  );

  const s = ctx.service;

  return (
    <div ref={ref} style={menuStyle}>
      <div style={{ padding: "4px 12px 6px", fontSize: "11px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-primary)", marginBottom: 4 }}>
        {s.customer.name} — {s.serviceType}
      </div>
      <Item icon="📂" label="Open Details" onClick={() => onOpenDetails(s)} />
      <Item icon="📱" label="Send WhatsApp" onClick={() => {
        const msg = encodeURIComponent(`नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* का status: *${STATUS_LABELS[s.status]}*\n\n— RA Seva Point`);
        window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
      }} />
      <Item icon="🖨️" label="Print Receipt" onClick={() => window.print()} />
      <div style={{ position: "relative" }}>
        <div
          style={{ ...itemStyle }}
          onMouseEnter={e => { (e.currentTarget.style.background = "var(--bg-hover)"); setShowStatus(true); }}
          onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); }}
          onClick={() => setShowStatus(!showStatus)}
        >
          <span>🔄</span> Change Status <span style={{ marginLeft: "auto" }}>▶</span>
        </div>
        {showStatus && (
          <div style={{ position: "absolute", left: "100%", top: 0, background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: "150px", padding: 4, zIndex: 999999 }}>
            {STATUS_ORDER.map(st => (
              <div key={st}
                style={{ ...itemStyle, background: s.status === st ? STATUS_COLORS_BG[st] : "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = s.status === st ? STATUS_COLORS_BG[st] : "transparent")}
                onClick={() => { onStatusChange(s.id, st); onClose(); }}
              >
                {STATUS_LABELS[st]}
                {s.status === st && <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ borderTop: "1px solid var(--border-primary)", marginTop: 4, paddingTop: 4 }}>
        <Item icon="💳" label="Mark as Paid" onClick={async () => {
          await fetch(`/api/services/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: "PAID" }) });
          window.location.reload();
        }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");

  // Mini-filter state (Feature 2)
  const [quickFilter, setQuickFilter] = useState<string>("ALL"); // ALL, PENDING, SUBMITTED, PROCESSING, APPROVED, DELIVERED, UNPAID, DUE_TODAY

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [liveToken, setLiveToken] = useState<string | null>(null);

  // Context menu state (Feature 1)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const toast = useToast();

  const callNextToken = async () => {
    setCallingNext(true);
    try {
      const res = await fetch("/api/kiosk/call-next", { method: "POST" });
      const data = await res.json();
      if (data.token) {
        setLiveToken(data.token);
        toast.success(`Calling: ${data.token} — ${data.customer?.name} (${data.serviceType})`);
        fetchServices();
        setTimeout(() => setLiveToken(null), 6000);
      } else {
        toast.error("No pending kiosk requests in queue");
      }
    } catch {
      toast.error("Failed to call next token");
    } finally {
      setCallingNext(false);
    }
  };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      const res = await fetch(`/api/services?${params}`);
      const data = await res.json();
      setServices(data.services || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const svc = services.find(x => x.id === id);

    // Feature 8: Khata prompt when DELIVERED + UNPAID
    if (newStatus === "DELIVERED" && svc && svc.paymentStatus === "UNPAID" && svc.fees > 0) {
      const addToKhata = confirm(
        `${svc.customer.name} ka ₹${svc.fees} abhi tak UNPAID hai.\n\nKya aap is amount ko unke Khata (Udhaar) mein add karna chahte hain?`
      );
      if (addToKhata) {
        try {
          await fetch("/api/income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `${svc.serviceType} — ${svc.customer.name}`,
              amount: svc.fees,
              category: "Udhaar",
              customerId: svc.customer.id,
              note: `Auto-added from Service ID ${svc.id}`,
            }),
          });
          toast.success("Khata entry added!");
        } catch {
          toast.error("Khata entry failed, but status will update.");
        }
      }
    }

    try {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated");

      if (newStatus === "APPROVED" || newStatus === "DELIVERED") {
        if (confirm(`Status updated to ${newStatus}! WhatsApp customer bhejein?`)) {
          const s = services.find((x) => x.id === id);
          if (s && s.customer.mobile) {
            const msg = encodeURIComponent(
              `नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* का status अब *${STATUS_LABELS[newStatus]}* है।\n\n— RA Seva Point`
            );
            window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
          }
        }
      }
    } catch {
      toast.error("Status update failed");
      fetchServices();
    }
  };

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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Feature 7: Bulk WhatsApp Remind All (for Pending with missing docs)
  const handleBulkWhatsApp = () => {
    const targets = filtered.filter(
      (s) => selectedIds.has(s.id) || (selectedIds.size === 0 && s.status === "PENDING" && s.missingDocs)
    );
    if (targets.length === 0) {
      toast.error("Koi bhi Pending + Missing Docs customer nahi mila.");
      return;
    }
    toast.success(`${targets.length} customers ko WhatsApp bheja ja raha hai...`);
    targets.forEach((s, i) => {
      setTimeout(() => {
        const msg = encodeURIComponent(
          `नमस्ते ${s.customer.name},\n\nआपके *${s.serviceType}* आवेदन के लिए कुछ दस्तावेज़ अभी बाकी हैं:\n*${s.missingDocs || "आवश्यक दस्तावेज़"}*\n\nकृपया जल्द भेजें।\n\n— RA Seva Point`
        );
        window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
      }, i * 600);
    });
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Feature 6: Smart Search (name, mobile, serviceType, trackingId)
  // Feature 2: Mini-filter chips
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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
        (s) =>
          s.deadline &&
          new Date(s.deadline).getTime() >= today.getTime() &&
          new Date(s.deadline).getTime() < tomorrow.getTime()
      );
    return baseFiltered.filter((s) => s.status === quickFilter);
  })();

  // ─── Analytics Footer data (Feature 4) ────────────────────────────────────
  const totalUnpaid = services
    .filter((s) => s.paymentStatus === "UNPAID" && s.status !== "CANCELLED")
    .reduce((sum, s) => sum + s.fees, 0);

  const dueTodayCount = services.filter(
    (s) =>
      s.deadline &&
      new Date(s.deadline).getTime() >= today.getTime() &&
      new Date(s.deadline).getTime() < tomorrow.getTime()
  ).length;

  const overdueCount = services.filter(
    (s) =>
      s.deadline &&
      new Date(s.deadline).getTime() < today.getTime() &&
      !["APPROVED", "DELIVERED", "CANCELLED"].includes(s.status)
  ).length;

  const stalledCount = services.filter(
    (s) => getDaysOld(s.createdAt) > 5 && ["PROCESSING", "SUBMITTED"].includes(s.status)
  ).length;

  // Mini filter chip definitions
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

  return (
    <div className="page-shell page-shell-list" style={{ paddingBottom: "52px" }}>
      <PageHeader
        title="Services"
        subtitle={`${total} total services`}
        actions={
          <>
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
            >
              <button
                className={`p-2 rounded-lg transition-all ${view === "kanban" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`}
                onClick={() => setView("kanban")}
                title="Kanban view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`p-2 rounded-lg transition-all ${view === "list" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`}
                onClick={() => setView("list")}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
            <button className="btn-primary" onClick={() => setIsNewServiceOpen(true)}>
              <Plus size={16} />
              New Service
            </button>
            <button
              className="legacy-button"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", background: liveToken ? "#008000" : "#d4d0c8", color: liveToken ? "white" : "black", transition: "all 0.3s" }}
              onClick={callNextToken}
              disabled={callingNext}
              title="Call next kiosk token"
            >
              {callingNext ? <Loader2 size={14} className="animate-spin" /> : "🔔"}
              {liveToken ? liveToken : "Call Next"}
            </button>
            <a
              href="/display"
              target="_blank"
              rel="noopener noreferrer"
              className="legacy-button"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
              title="Open TV Display Board"
            >
              🖥️ Display Board
            </a>
          </>
        }
      />

      {/* ── Search Bar ── */}
      <div className="toolbar">
        <div className="search-field" style={{ flex: 1 }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by name, mobile, service type, or tracking ID..."
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Feature 2: Mini Filter Chips ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 0 12px 0" }}>
        {QUICK_FILTERS.map((f) => {
          const isActive = quickFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: isActive ? "bold" : "normal",
                background: isActive ? f.color : f.bg,
                color: isActive ? "white" : f.color,
                border: `1px solid ${f.color}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
              {f.key !== "ALL" && f.key !== "UNPAID" && f.key !== "DUE_TODAY" && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({baseFiltered.filter((s) => s.status === f.key).length})
                </span>
              )}
              {f.key === "UNPAID" && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({baseFiltered.filter((s) => s.paymentStatus === "UNPAID").length})
                </span>
              )}
            </button>
          );
        })}

        {/* Feature 7: Bulk Remind All */}
        <button
          onClick={handleBulkWhatsApp}
          style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", background: "#25D366", color: "white", border: "1px solid #1da851", cursor: "pointer", marginLeft: "auto" }}
          title="Send WhatsApp to all Pending customers with missing docs"
        >
          📱 Remind All Missing Docs
        </button>
      </div>

      {/* ── Bulk Actions (List View) ── */}
      {selectedIds.size > 0 && view === "list" && (
        <div className="flex items-center gap-3 p-3 mb-4 rounded" style={{ background: "#000080", color: "white" }}>
          <span className="font-semibold text-sm">{selectedIds.size} selected</span>
          <select
            className="input-field"
            style={{ width: "150px", color: "black" }}
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Change Status...</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            className="legacy-button"
            style={{ fontWeight: "bold" }}
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || isBulkUpdating}
          >
            {isBulkUpdating ? "Updating..." : "Apply to Selected"}
          </button>
          <button
            onClick={() => {
              const targets = filtered.filter((s) => selectedIds.has(s.id));
              targets.forEach((s, i) => {
                setTimeout(() => {
                  const msg = encodeURIComponent(`नमस्ते ${s.customer.name},\nआपके *${s.serviceType}* का status: *${STATUS_LABELS[s.status]}*\n— RA Seva Point`);
                  window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${msg}`, "_blank");
                }, i * 600);
              });
            }}
            style={{ padding: "4px 10px", background: "#25D366", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "12px" }}
          >
            📱 WhatsApp All
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={56} className="empty-state-icon" />
          <div className="empty-state-title">No services found</div>
          <div className="empty-state-desc">Add your first service to get started</div>
          <button className="btn-primary mt-4" onClick={() => setIsNewServiceOpen(true)}>
            <Plus size={16} />
            New Service
          </button>
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          services={filtered}
          onSelect={(s) => { setSelectedService(s); setIsDetailsOpen(true); }}
          onStatusChange={handleStatusChange}
          onContextMenu={(e, s) => setContextMenu({ x: e.clientX, y: e.clientY, service: s })}
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleAll}
                  />
                </th>
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
                  <tr
                    key={s.id}
                    className={`cursor-pointer ${selectedIds.has(s.id) ? "bg-blue-50" : ""}`}
                    style={{ background: isStalled ? "#faf0ff" : undefined }}
                    onClick={() => { setSelectedService(s); setIsDetailsOpen(true); }}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, service: s }); }}
                  >
                    <td onClick={(e) => toggleSelection(s.id, e)}>
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => {}} />
                    </td>
                    <td>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {s.customer.name}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {s.customer.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {s.serviceType}
                    </td>
                    <td>
                      <span className={`badge ${SERVICE_STATUS_COLORS[s.status]}`}>{s.status}</span>
                      {isStalled && <span style={{ marginLeft: 4, fontSize: "9px", background: "#f9f0ff", color: "#722ed1", padding: "1px 4px", borderRadius: 2 }}>🔴 Stalled</span>}
                    </td>
                    <td>
                      <span className={`badge ${PAYMENT_STATUS_COLORS[s.paymentStatus]}`}>{s.paymentStatus}</span>
                    </td>
                    <td className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(s.fees)}
                      {isLossRisk && <span style={{ marginLeft: 4, fontSize: "9px", color: "#cf1322" }}>💸</span>}
                    </td>
                    <td className="text-sm" style={{ color: daysOld > 7 ? "#cf1322" : "var(--text-muted)", fontWeight: daysOld > 7 ? "bold" : "normal" }}>
                      {daysOld}d
                    </td>
                    <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {formatDate(s.createdAt)}
                    </td>
                    <td>
                      <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Feature 1: Context Menu ── */}
      {contextMenu && (
        <ContextMenu
          ctx={contextMenu}
          onClose={() => setContextMenu(null)}
          onStatusChange={handleStatusChange}
          onOpenDetails={(s) => { setSelectedService(s); setIsDetailsOpen(true); setContextMenu(null); }}
        />
      )}

      {/* ── Feature 4: Live Analytics Footer ── */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-primary)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        fontSize: "12px",
        color: "var(--text-muted)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Briefcase size={12} />
          <strong style={{ color: "var(--text-primary)" }}>{total}</strong> Total Services
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#d46b08" }}>
          <IndianRupee size={12} />
          Unpaid: <strong>₹{totalUnpaid.toLocaleString("en-IN")}</strong>
        </div>
        {dueTodayCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#1d39c4" }}>
            <Clock size={12} />
            Due Today: <strong>{dueTodayCount}</strong>
          </div>
        )}
        {overdueCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#cf1322" }}>
            <AlertTriangle size={12} />
            Overdue: <strong>{overdueCount}</strong>
          </div>
        )}
        {stalledCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#722ed1" }}>
            <TrendingDown size={12} />
            Stalled: <strong>{stalledCount}</strong>
          </div>
        )}
        {selectedIds.size > 0 && (
          <div style={{ marginLeft: "auto", color: "var(--brand-primary)", fontWeight: "bold" }}>
            ✓ {selectedIds.size} selected
          </div>
        )}
        <div style={{ marginLeft: selectedIds.size > 0 ? 0 : "auto", color: "var(--text-muted)", fontSize: "11px" }}>
          Showing {filtered.length} / {services.length}
        </div>
      </div>

      <NewServiceDialog
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        onSuccess={fetchServices}
      />

      <ServiceDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedService(null); }}
        serviceId={selectedService?.id || null}
        onSuccess={() => {
          setIsDetailsOpen(false);
          setSelectedService(null);
          fetchServices();
        }}
      />
    </div>
  );
}
