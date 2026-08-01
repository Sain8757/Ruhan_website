"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { soundFx } from "@/lib/soundEffects";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

const TOAST_TITLES: Record<ToastType, string> = {
  success: "✓ Success",
  error: "✕ Error",
  info: "ℹ Information",
};

function Win95Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div className={`win95-toast win95-toast-${toast.type}`}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Title bar */}
        <div className="win95-toast-titlebar">
          <span>{TOAST_TITLES[toast.type]}</span>
          <button
            onClick={onClose}
            className="win95-toast-close"
            title="Close"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="win95-toast-body">
          {toast.message}
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Trigger audio cues
    if (type === "success") {
      soundFx.playSuccess();
    } else if (type === "error") {
      soundFx.playError();
    } else {
      soundFx.playClick();
    }

    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const value = React.useMemo(() => ({
    toast: addToast,
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
  }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="win95-toast-container">
        {toasts.map((t) => (
          <Win95Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
