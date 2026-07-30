"use client";

import { BarChart2 } from "lucide-react";

interface TopService {
  name: string;
  count: number;
}

interface TopServicesWidgetProps {
  services: TopService[];
}

const SERVICE_COLORS = [
  "#4f6ef7",
  "#a78bfa",
  "#10b981",
  "#f97316",
  "#06b6d4",
  "#f43f5e",
];

export default function TopServicesWidget({ services }: TopServicesWidgetProps) {
  if (!services || services.length === 0) {
    return (
      <div className="glass-card p-5 flex flex-col items-center justify-center min-h-[200px]">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.2)" }}
        >
          <BarChart2 size={22} style={{ color: "var(--brand-primary)", opacity: 0.5 }} />
        </div>
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          No service data yet
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
          Last 30 days ka data yahan aayega
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...services.map((s) => s.count));

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
        >
          <BarChart2 size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            Top Services
          </h3>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Last 30 days
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {services.map((service, i) => {
          const barWidth = (service.count / maxCount) * 100;
          const color = SERVICE_COLORS[i % SERVICE_COLORS.length];

          return (
            <div key={service.name} className="flex items-center gap-3">
              {/* Rank */}
              <span
                className="text-[10px] font-black w-4 text-center shrink-0"
                style={{ color: i === 0 ? "#f59e0b" : "var(--text-muted)" }}
              >
                {i + 1}
              </span>

              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[12px] font-semibold truncate max-w-[140px]"
                    style={{ color: "var(--text-primary)" }}
                    title={service.name}
                  >
                    {service.name}
                  </span>
                  <span
                    className="text-[11px] font-bold ml-2 shrink-0"
                    style={{ color }}
                  >
                    {service.count}
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barWidth}%`,
                      background: color,
                      opacity: 0.85,
                      transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      boxShadow: `0 0 6px ${color}60`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 pt-3 text-[11px] font-medium"
        style={{
          borderTop: "1px solid var(--border-secondary)",
          color: "var(--text-muted)",
        }}
      >
        Total: {services.reduce((acc, s) => acc + s.count, 0)} services in last 30 days
      </div>
    </div>
  );
}
