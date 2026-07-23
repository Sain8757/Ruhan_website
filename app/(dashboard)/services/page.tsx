"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Filter,
  ChevronRight,
  Briefcase,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { formatCurrency, formatDate, SERVICE_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import NewServiceDialog from "@/components/services/NewServiceDialog";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";
import LegacyDialog from "@/components/layout/LegacyDialog";

interface Service {
  id: string;
  serviceType: string;
  status: string;
  fees: number;
  paymentStatus: string;
  createdAt: string;
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

function KanbanBoard({ services, onSelect }: { services: Service[], onSelect: (s: Service) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const cols = services.filter((s) => s.status === status);
        return (
          <div key={status} className="kanban-column shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className={`badge ${SERVICE_STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                {cols.length}
              </span>
            </div>
            {cols.length === 0 ? (
              <div
                className="text-center py-8 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                No services
              </div>
            ) : (
              cols.map((s) => (
                <div
                  key={s.id}
                  className="kanban-card"
                  onClick={() => onSelect(s)}
                >
                  <div
                    className="font-bold text-sm mb-1 truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {s.customer.name}
                  </div>
                  <div
                    className="text-xs mb-2 truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.serviceType}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(s.createdAt)}
                    </span>
                    <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                      {formatCurrency(s.fees)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/services?${params}`);
      const data = await res.json();
      setServices(data.services || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filtered = query
    ? services.filter(
        (s) =>
          s.serviceType.toLowerCase().includes(query.toLowerCase()) ||
          s.customer.name.toLowerCase().includes(query.toLowerCase())
      )
    : services;

  return (
    <div className="page-shell page-shell-list">
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
          </>
        }
      />

      {/* Filters */}
      <div className="toolbar">
        <div className="search-field">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search service or customer..."
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input-field"
          style={{ maxWidth: "220px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Content */}
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
        <KanbanBoard services={filtered} onSelect={setSelectedService} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Fees</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedService(s)}
                >
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
                    <span className={`badge ${SERVICE_STATUS_COLORS[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${PAYMENT_STATUS_COLORS[s.paymentStatus]}`}>
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(s.fees)}
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {formatDate(s.createdAt)}
                  </td>
                  <td>
                    <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      )}

      <NewServiceDialog
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        onSuccess={fetchServices}
      />

      <LegacyDialog
        isOpen={!!selectedService && !isDetailsOpen}
        onClose={() => setSelectedService(null)}
        title="Service Status"
        width="350px"
      >
        {selectedService && (
          <div style={{ padding: '8px' }}>
            <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
              <legend>Customer</legend>
              <div className="font-semibold text-lg" style={{ color: "black" }}>{selectedService.customer.name}</div>
              <div className="text-xs" style={{ color: "black" }}>{selectedService.customer.mobile}</div>
            </fieldset>

            <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
              <legend>Service Request</legend>
              <div className="font-medium" style={{ color: "black" }}>{selectedService.serviceType}</div>
            </fieldset>

            <fieldset className="legacy-fieldset" style={{ marginBottom: '12px' }}>
              <legend>Current Status</legend>
              <span className={`badge ${SERVICE_STATUS_COLORS[selectedService.status]} text-sm px-3 py-1`}>
                {STATUS_LABELS[selectedService.status]}
              </span>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setSelectedService(null)}>Close</button>
              <button onClick={() => setIsDetailsOpen(true)}>View Full Details</button>
            </div>
          </div>
        )}
      </LegacyDialog>

      <ServiceDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
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
