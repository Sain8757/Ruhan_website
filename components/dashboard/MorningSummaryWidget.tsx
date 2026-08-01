import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, CreditCard, X, Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

interface MorningSummaryWidgetProps {
  overdueCount: number;
  dueTodayCount: number;
  pendingPaymentsCount: number;
}

export default function MorningSummaryWidget({ overdueCount, dueTodayCount, pendingPaymentsCount }: MorningSummaryWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if there's actually something to act on
    if (overdueCount > 0 || dueTodayCount > 0 || pendingPaymentsCount > 0) {
      // Check if we already dismissed it today
      const lastDismissed = localStorage.getItem("morning_summary_dismissed");
      const todayStr = new Date().toDateString();
      if (lastDismissed !== todayStr) {
        setIsVisible(true);
      }
    }
  }, [overdueCount, dueTodayCount, pendingPaymentsCount]);

  if (!isVisible) return null;

  const dismiss = () => {
    localStorage.setItem("morning_summary_dismissed", new Date().toDateString());
    setIsVisible(false);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #001f3f 0%, #003366 100%)",
      color: "white",
      borderRadius: "12px",
      padding: "16px 20px",
      marginBottom: "24px",
      position: "relative",
      boxShadow: "0 8px 24px rgba(0,31,63,0.15)",
      overflow: "hidden"
    }}>
      {/* Decorative background circle */}
      <div style={{
        position: "absolute", right: "-10%", top: "-50%",
        width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />

      <button 
        onClick={dismiss}
        style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "4px" }}
      >
        <X size={16} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", position: "relative" }}>
        <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px", borderRadius: "50%" }}>
          <Bell size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Good Morning! Here's your summary</h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Let's get things done today.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", position: "relative" }}>
        {overdueCount > 0 && (
          <div style={{ background: "rgba(255, 59, 48, 0.2)", border: "1px solid rgba(255, 59, 48, 0.4)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="#FF3B30" />
              <div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#FF3B30", lineHeight: 1 }}>{overdueCount}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", marginTop: "2px" }}>Overdue Services</div>
              </div>
            </div>
            <Link href="/services?status=overdue" style={{ color: "white" }}><ChevronRight size={16} /></Link>
          </div>
        )}

        {dueTodayCount > 0 && (
          <div style={{ background: "rgba(255, 204, 0, 0.2)", border: "1px solid rgba(255, 204, 0, 0.4)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#FFCC00" />
              <div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#FFCC00", lineHeight: 1 }}>{dueTodayCount}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", marginTop: "2px" }}>Deadlines Today</div>
              </div>
            </div>
            <Link href="/services?status=due-today" style={{ color: "white" }}><ChevronRight size={16} /></Link>
          </div>
        )}

        {pendingPaymentsCount > 0 && (
          <div style={{ background: "rgba(52, 199, 89, 0.2)", border: "1px solid rgba(52, 199, 89, 0.4)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={18} color="#34C759" />
              <div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#34C759", lineHeight: 1 }}>{pendingPaymentsCount}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", marginTop: "2px" }}>Partial Payments</div>
              </div>
            </div>
            <Link href="/billing?status=partial" style={{ color: "white" }}><ChevronRight size={16} /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
