"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, IndianRupee, Edit3, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface GoalTrackerProps {
  currentIncome: number;
}

export default function GoalTrackerWidget({ currentIncome }: GoalTrackerProps) {
  const [goal, setGoal] = useState<number>(5000);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("5000");

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_daily_goal");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setGoal(parsed);
        setInputVal(parsed.toString());
      }
    }
  }, []);

  const saveGoal = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(parsed);
      localStorage.setItem("dashboard_daily_goal", parsed.toString());
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setInputVal(goal.toString());
    setEditing(false);
  };

  const progress = Math.min((currentIncome / goal) * 100, 100);
  const isAchieved = currentIncome >= goal;
  const remaining = Math.max(goal - currentIncome, 0);

  const progressColor = isAchieved
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress > 70
    ? "linear-gradient(90deg, #f59e0b, #d97706)"
    : "linear-gradient(90deg, #4f6ef7, #3451d1)";

  return (
    <div
      className="glass-card p-5 relative overflow-hidden"
      style={{ borderColor: isAchieved ? "rgba(16,185,129,0.3)" : undefined }}
    >
      {/* Background glow when achieved */}
      {isAchieved && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: isAchieved
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #4f6ef7, #3451d1)",
              }}
            >
              <Target size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Daily Goal
            </span>
            {isAchieved && (
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                🎉 ACHIEVED!
              </span>
            )}
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-primary)",
              }}
              title="Set daily goal"
            >
              <Edit3 size={11} />
              Set Goal
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
                <span className="px-2 text-xs font-bold" style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}>₹</span>
                <input
                  type="number"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveGoal();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="w-20 px-2 py-1.5 text-xs font-bold outline-none"
                  style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
                  autoFocus
                />
              </div>
              <button
                onClick={saveGoal}
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
              >
                <Check size={12} />
              </button>
              <button
                onClick={cancelEdit}
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(244,63,94,0.1)", color: "#f43f5e" }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div
            className="w-full h-2.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: progressColor,
                boxShadow: isAchieved ? "0 0 12px rgba(16,185,129,0.5)" : "0 0 8px rgba(79,110,247,0.4)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {progress.toFixed(0)}% complete
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              Goal: {formatCurrency(goal)}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <IndianRupee size={11} style={{ color: "var(--brand-primary)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Earned Today
              </span>
            </div>
            <div className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(currentIncome)}
            </div>
          </div>
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp size={11} style={{ color: isAchieved ? "#10b981" : "#f97316" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {isAchieved ? "Surplus" : "Remaining"}
              </span>
            </div>
            <div
              className="text-sm font-black"
              style={{ color: isAchieved ? "#10b981" : "#f97316" }}
            >
              {isAchieved
                ? `+${formatCurrency(currentIncome - goal)}`
                : formatCurrency(remaining)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
