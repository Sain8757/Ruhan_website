"use client";

import { useState, useEffect } from "react";

interface CheckItem {
  id: string;
  text: string;
  done: boolean;
  isDefault: boolean;
}

const DEFAULT_ITEMS = [
  "Saari pending services check karein",
  "Overdue customers ko follow-up karein",
  "Aaj ka cash count karein",
  "Daily summary WhatsApp bhejein",
  "New services ka acknowledgement karein",
  "Document missing walo ko remind karein",
  "Vendor payments verify karein",
  "Aaj ke deadlines dekhein",
];

const TODAY_KEY = () => "ra_checklist_" + new Date().toDateString();

const R: React.CSSProperties = {
  borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff",
  borderRight: "2px solid #808080", borderBottom: "2px solid #808080",
};
const INS: React.CSSProperties = {
  borderTop: "2px solid #808080", borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff",
};

export default function DailyChecklist({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TODAY_KEY());
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        const defaults: CheckItem[] = DEFAULT_ITEMS.map((text, i) => ({
          id: `def_${i}`,
          text,
          done: false,
          isDefault: true,
        }));
        setItems(defaults);
        localStorage.setItem(TODAY_KEY(), JSON.stringify(defaults));
      }
    } catch {}
  }, []);

  const save = (updated: CheckItem[]) => {
    setItems(updated);
    try { localStorage.setItem(TODAY_KEY(), JSON.stringify(updated)); } catch {}
  };

  const toggle = (id: string) => save(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const removeItem = (id: string) => save(items.filter(i => i.id !== id));
  const addItem = () => {
    if (!newItem.trim()) return;
    const item: CheckItem = { id: Date.now().toString(), text: newItem.trim(), done: false, isDefault: false };
    save([...items, item]);
    setNewItem("");
  };
  const resetAll = () => {
    const reset = items.map(i => ({ ...i, done: false }));
    save(reset);
  };

  const doneCount = items.filter(i => i.done).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const allDone = doneCount === items.length && items.length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#d4d0c8", ...R, width: 420, maxHeight: "85vh", display: "flex", flexDirection: "column", fontFamily: "Tahoma, sans-serif", boxShadow: "4px 4px 16px rgba(0,0,0,0.4)" }}>

        {/* Title Bar */}
        <div style={{ background: "linear-gradient(to right, #000080, #1084d0)", color: "white", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontWeight: "bold", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            📋 Daily Opening Checklist — {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          <button onClick={onClose} style={{ background: "#d4d0c8", border: "none", ...R, width: 18, height: 18, cursor: "pointer", fontWeight: "bold", fontSize: 11, lineHeight: 1 }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ padding: "8px 10px", borderBottom: "1px solid #aaa", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
            <span style={{ fontWeight: "bold", color: allDone ? "#006600" : "#333" }}>
              {allDone ? "✅ Sab kaam ho gaya!" : "📋 Aaj ka kaam"}
            </span>
            <span style={{ color: allDone ? "#006600" : "#555", fontWeight: "bold" }}>{doneCount}/{items.length} ({pct}%)</span>
          </div>
          <div style={{ ...INS, height: 14, background: "#808080", position: "relative", overflow: "hidden" }}>
            <div style={{ background: allDone ? "#006600" : pct > 60 ? "#d46b08" : "#000080", width: `${pct}%`, height: "100%", transition: "width 0.4s" }} />
            <span style={{ position: "absolute", inset: 0, textAlign: "center", fontSize: 10, fontWeight: "bold", color: pct > 40 ? "white" : "#111", lineHeight: "14px" }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: item.done ? "#e8ffe8" : "white", border: "1px solid #bbb", cursor: "pointer", ...INS }}
              onClick={() => toggle(item.id)}
            >
              <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} onClick={e => e.stopPropagation()} style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, textDecoration: item.done ? "line-through" : "none", color: item.done ? "#888" : "black" }}>
                {item.done ? "✓ " : `${idx + 1}. `}{item.text}
              </span>
              {!item.isDefault && (
                <button
                  onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontSize: 13, padding: "0 2px", lineHeight: 1 }}
                  title="Hatao"
                >×</button>
              )}
            </div>
          ))}
        </div>

        {/* Add New */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid #aaa", display: "flex", gap: 5, flexShrink: 0, background: "#c8c4bc" }}>
          <input
            type="text"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="Naya task likhein..."
            style={{ flex: 1, fontSize: 11, padding: "3px 6px", ...INS, background: "white" }}
          />
          <button onClick={addItem} style={{ ...R, background: "#d4d0c8", border: "none", padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Add</button>
          <button onClick={resetAll} style={{ ...R, background: "#d4d0c8", border: "none", padding: "3px 8px", fontSize: 11, cursor: "pointer" }} title="Sab reset karein">↺</button>
          <button onClick={onClose} style={{ ...R, background: "#d4d0c8", border: "none", padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}
