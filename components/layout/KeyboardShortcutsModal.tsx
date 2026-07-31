"use client";

import { useEffect, useState } from "react";
import { Keyboard, X, Sparkles, Command } from "lucide-react";

const SHORTCUTS = [
  { key: "F2", description: "Issue Customer Token Ticket" },
  { key: "F4", description: "Search Customers / Services" },
  { key: "F8", description: "Open Today's Cash & Summary" },
  { key: "Ctrl + K", description: "Open Universal Workspace Search" },
  { key: "Ctrl + P", description: "Print Current Page / Invoice" },
  { key: "?", description: "Open Keyboard Shortcuts Help" },
];

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Keyboard size={20} className="text-yellow-300" />
            <span>Counter Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500">
            Use these fast keyboard shortcuts to operate the counter quickly without taking your hands off the keyboard:
          </p>

          <div className="space-y-2">
            {SHORTCUTS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50/40 transition-colors"
              >
                <span className="text-xs font-extrabold text-slate-800">{item.description}</span>
                <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-indigo-700 shadow-xs">
                  {item.key}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 text-center border-t border-slate-200">
          <p className="text-[11px] font-bold text-slate-600">
            Press <code className="px-1.5 py-0.5 bg-white border rounded font-mono text-indigo-600">Esc</code> to close this popup
          </p>
        </div>
      </div>
    </div>
  );
}
