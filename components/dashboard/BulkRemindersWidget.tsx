"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Loader2, Eye, Send, X, CheckCircle2, User, Phone } from "lucide-react";

interface PendingService {
  id: string;
  serviceType: string;
  missingDocs: string;
  trackingId: string;
  customer: {
    name: string;
    mobile: string;
  };
}

export default function BulkRemindersWidget() {
  const [loading, setLoading] = useState(true);
  const [pendingServices, setPendingServices] = useState<PendingService[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/cron/reminders")
      .then((res) => res.json())
      .then((data) => {
        setPendingServices(data.pending || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getWhatsAppUrl = (s: PendingService) => {
    const text = encodeURIComponent(
      `Hello ${s.customer.name},\nAapka ${s.serviceType} application pending hai kyunki '${s.missingDocs}' jama nahi hua hai.\nKripya is link par jaakar document upload karein:\n\n🔗 ${window.location.origin}/status\n\nMobile: ${s.customer.mobile}\nTracking ID: ${s.trackingId}\n\nDhanyawad,\nRA Seva Point`
    );
    return `https://wa.me/91${s.customer.mobile.replace(/\D/g, "").slice(-10)}?text=${text}`;
  };

  const sendSingle = (s: PendingService, index: number) => {
    setSendingIndex(index);
    window.open(getWhatsAppUrl(s), "_blank");
    setTimeout(() => {
      setSentIds((prev) => new Set(prev).add(s.id));
      setSendingIndex(null);
    }, 800);
  };

  const sendAll = () => {
    const unsent = pendingServices.filter((s) => !sentIds.has(s.id));
    unsent.forEach((s, index) => {
      setTimeout(() => {
        window.open(getWhatsAppUrl(s), "_blank");
        setSentIds((prev) => new Set(prev).add(s.id));
      }, index * 1500);
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse flex items-center justify-center min-h-[80px] mt-3">
        <Loader2 className="animate-spin" size={20} style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (pendingServices.length === 0) return null;

  const unsentCount = pendingServices.filter((s) => !sentIds.has(s.id)).length;

  return (
    <>
      {/* Widget Banner */}
      <div
        className="glass-card p-4 mt-3 relative overflow-hidden"
        style={{
          border: "1px solid rgba(245,158,11,0.3)",
          background: "rgba(245,158,11,0.04)",
        }}
      >
        {/* Accent line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: "linear-gradient(180deg, #f59e0b, #d97706)" }}
        />

        <div className="flex items-center justify-between pl-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Document Reminders
                </h3>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(245,158,11,0.15)",
                    color: "#d97706",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  {pendingServices.length} pending
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {unsentCount} customer{unsentCount !== 1 ? "s" : ""} ka reminder bhejna baaki hai
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #4f6ef7, #3451d1)",
              color: "white",
              boxShadow: "0 4px 12px rgba(79,110,247,0.3)",
            }}
          >
            <Eye size={13} />
            Preview & Send
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            {/* Modal header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                >
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    WhatsApp Reminders
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {pendingServices.length} customers ko reminder bhejein
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer list */}
            <div className="modal-body pt-4 flex flex-col gap-3">
              {/* Send all button */}
              {unsentCount > 0 && (
                <button
                  onClick={sendAll}
                  className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  style={{
                    background: "linear-gradient(135deg, #25D366, #128C7E)",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
                  }}
                >
                  <Send size={14} />
                  Send All ({unsentCount}) Reminders
                </button>
              )}

              {/* Individual customers */}
              {pendingServices.map((service, index) => {
                const isSent = sentIds.has(service.id);
                const isSending = sendingIndex === index;

                return (
                  <div
                    key={service.id}
                    className="p-3.5 rounded-xl flex items-center gap-3 transition-all"
                    style={{
                      background: isSent ? "rgba(16,185,129,0.06)" : "var(--bg-secondary)",
                      border: `1px solid ${isSent ? "rgba(16,185,129,0.2)" : "var(--border-primary)"}`,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-black shrink-0"
                      style={{
                        background: `hsl(${(service.customer.name.charCodeAt(0) || 65) * 5 % 360}, 65%, 50%)`,
                        opacity: isSent ? 0.6 : 1,
                      }}
                    >
                      {service.customer.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[13px] font-bold truncate"
                          style={{ color: "var(--text-primary)", opacity: isSent ? 0.6 : 1 }}
                        >
                          {service.customer.name}
                        </span>
                        {isSent && (
                          <CheckCircle2 size={13} className="shrink-0" style={{ color: "#10b981" }} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Phone size={10} />
                          {service.customer.mobile}
                        </span>
                        <span
                          className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                          style={{
                            background: "rgba(245,158,11,0.1)",
                            color: "#d97706",
                          }}
                        >
                          {service.serviceType}
                        </span>
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                        Missing: <span style={{ color: "#f43f5e", fontWeight: 600 }}>{service.missingDocs}</span>
                      </div>
                    </div>

                    {/* Send button */}
                    <button
                      onClick={() => sendSingle(service, index)}
                      disabled={isSent || isSending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0"
                      style={{
                        background: isSent
                          ? "rgba(16,185,129,0.1)"
                          : "linear-gradient(135deg, #25D366, #128C7E)",
                        color: isSent ? "#10b981" : "white",
                        opacity: isSending ? 0.7 : 1,
                        boxShadow: isSent ? "none" : "0 3px 10px rgba(37,211,102,0.25)",
                      }}
                    >
                      {isSent ? (
                        <>
                          <CheckCircle2 size={12} />
                          Sent
                        </>
                      ) : (
                        <>
                          <MessageCircle size={12} />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
