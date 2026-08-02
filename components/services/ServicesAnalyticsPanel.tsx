"use client";

import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Service {
  id: string;
  serviceType: string;
  status: string;
  fees: number;
  paymentStatus: string;
  createdAt: string;
  deadline?: string | null;
}

interface DayRevenue {
  day: string;
  revenue: number;
}

interface Props {
  services: Service[];
  dailyRevenue: DayRevenue[];
  dailyTarget: number;
  onTargetChange: (t: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const PIE_COLORS = [
  "#000080", "#1084d0", "#00596b", "#006600", "#722ed1",
  "#d46b08", "#cf1322", "#25D366", "#fa8c16", "#13c2c2",
];

const F: React.CSSProperties = { fontFamily: "Tahoma, sans-serif" };

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: DayRevenue[] }) {
  return (
    <div style={{ ...F }}>
      <div style={{ fontWeight: "bold", fontSize: 12, marginBottom: 8, color: "#000080" }}>
        📈 Last 7 Days Revenue
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v) => [`₹${Number(v || 0).toLocaleString("en-IN")}`, "Revenue"]}
            contentStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="revenue" fill="#000080" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Service Type Pie Chart ───────────────────────────────────────────────────
function ServiceTypePie({ services }: { services: Service[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach((s) => {
      counts[s.serviceType] = (counts[s.serviceType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [services]);

  if (data.length === 0) return null;

  return (
    <div style={{ ...F }}>
      <div style={{ fontWeight: "bold", fontSize: 12, marginBottom: 8, color: "#000080" }}>
        🗂️ Service Mix
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={60}
            dataKey="value"
            label={({ name, percent }) => `${(name ?? "").slice(0, 10)} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
            fontSize={9}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Daily Target Progress ────────────────────────────────────────────────────
function DailyTargetBar({
  services,
  target,
  onTargetChange,
}: {
  services: Service[];
  target: number;
  onTargetChange: (t: number) => void;
}) {
  const today = new Date().toDateString();
  const todayRevenue = services
    .filter((s) => new Date(s.createdAt).toDateString() === today)
    .reduce((sum, s) => sum + s.fees, 0);

  const pct = target > 0 ? Math.min(100, Math.round((todayRevenue / target) * 100)) : 0;
  const color = pct >= 100 ? "#006600" : pct >= 60 ? "#d46b08" : "#cf1322";

  return (
    <div style={{ ...F }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontWeight: "bold", fontSize: 12, color: "#000080" }}>🎯 Daily Target</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#555" }}>Target: ₹</span>
          <input
            type="number"
            value={target}
            min={0}
            onChange={(e) => onTargetChange(parseInt(e.target.value) || 0)}
            style={{ width: 70, fontSize: 11, border: "1px solid #aaa", borderRadius: 3, padding: "1px 4px" }}
          />
        </div>
      </div>
      <div style={{ background: "#e8e8e8", borderRadius: 4, height: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ background: color, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
        <span style={{ position: "absolute", top: 0, left: 0, right: 0, textAlign: "center", fontSize: 11, fontWeight: "bold", color: pct > 40 ? "white" : "#333", lineHeight: "18px" }}>
          ₹{todayRevenue.toLocaleString("en-IN")} / ₹{target.toLocaleString("en-IN")} ({pct}%)
        </span>
      </div>
    </div>
  );
}

// ─── Peak Hour Heatmap ────────────────────────────────────────────────────────
function PeakHourHeatmap({ services }: { services: Service[] }) {
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const SLOTS = ["6-11am", "11-2pm", "2-5pm", "5-9pm"];

  const grid = useMemo(() => {
    const counts: number[][] = Array.from({ length: 7 }, () => Array(4).fill(0));
    services.forEach((s) => {
      const d = new Date(s.createdAt);
      const day = d.getDay();
      const hour = d.getHours();
      let slot = 3;
      if (hour < 11) slot = 0;
      else if (hour < 14) slot = 1;
      else if (hour < 17) slot = 2;
      counts[day][slot]++;
    });
    return counts;
  }, [services]);

  const maxVal = Math.max(...grid.flat(), 1);

  const getHeatColor = (val: number): string => {
    const intensity = val / maxVal;
    if (intensity === 0) return "#f5f5f5";
    if (intensity < 0.25) return "#c6e3f7";
    if (intensity < 0.5) return "#6baed6";
    if (intensity < 0.75) return "#2171b5";
    return "#000080";
  };

  return (
    <div style={{ ...F }}>
      <div style={{ fontWeight: "bold", fontSize: 12, marginBottom: 8, color: "#000080" }}>
        🔥 Peak Hours Heatmap
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `40px repeat(7, 1fr)`, gap: 2 }}>
        <div />
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#555", fontWeight: "bold" }}>{d}</div>
        ))}
        {SLOTS.map((slot, si) => (
          <React.Fragment key={slot}>
            <div style={{ fontSize: 9, color: "#555", display: "flex", alignItems: "center" }}>{slot}</div>
            {DAYS.map((_, di) => (
              <div
                key={di}
                title={`${DAYS[di]} ${slot}: ${grid[di][si]} services`}
                style={{
                  background: getHeatColor(grid[di][si]),
                  borderRadius: 3,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: grid[di][si] > maxVal * 0.5 ? "white" : "#333",
                }}
              >
                {grid[di][si] > 0 ? grid[di][si] : ""}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Main Analytics Panel ─────────────────────────────────────────────────────
export default function ServicesAnalyticsPanel({
  services,
  dailyRevenue,
  dailyTarget,
  onTargetChange,
  isOpen,
  onToggle,
}: Props) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{ position: "fixed", right: 16, top: 80, zIndex: 8000, background: "#000080", color: "white", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 18, boxShadow: "0 4px 12px rgba(0,0,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}
        title="Show Analytics Panel"
      >
        📊
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      bottom: 0,
      width: 280,
      zIndex: 8000,
      background: "#f0efec",
      borderLeft: "2px solid #808080",
      boxShadow: "-4px 0 16px rgba(0,0,0,0.15)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: "12px 10px",
      ...F,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: 13, color: "#000080" }}>📊 Analytics</div>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>

      <DailyTargetBar services={services} target={dailyTarget} onTargetChange={onTargetChange} />
      <hr style={{ border: "none", borderTop: "1px solid #ccc" }} />
      <RevenueChart data={dailyRevenue} />
      <hr style={{ border: "none", borderTop: "1px solid #ccc" }} />
      <ServiceTypePie services={services} />
      <hr style={{ border: "none", borderTop: "1px solid #ccc" }} />
      <PeakHourHeatmap services={services} />
    </div>
  );
}
