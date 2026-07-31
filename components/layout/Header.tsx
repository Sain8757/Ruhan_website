"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Menu, Bell, AlertTriangle, Clock, MessageCircle, Mail, FolderOpen, Sparkles, LogOut, X, Key, Moon, Sun, Volume2, VolumeX, Languages } from "lucide-react";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import AIAssistant from "@/components/ai/AIAssistant";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

export default function Header({ onMenuToggle, pageTitle }: HeaderProps) {
  const { openSearch } = useWorkspace();
  const { language, toggleLanguage, soundEnabled, toggleSound, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState<{
    pendingServices: Array<{ id: string; customer?: { name: string }; serviceType: string; createdAt: string }>;
    lowStockItems: Array<{ id: string; name: string; quantity: number; minStock: number }>;
  }>({ pendingServices: [], lowStockItems: [] });

  const notifRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dark mode init — check localStorage + system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const openFileExplorer = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setNotifications(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalNotifs = notifications.pendingServices.length + notifications.lowStockItems.length;

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="header-icon-button lg:hidden" onClick={onMenuToggle} title="Open navigation">
          <Menu size={18} />
        </button>

        {pageTitle && (
          <div className="header-title hidden sm:flex">
            <div className="header-title-accent" />
            <h1>{pageTitle}</h1>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-4 px-2" style={{ zIndex: 10 }}>
        <div
          className="hidden md:flex items-center"
          style={{ border: "2px inset #dfdfdf", background: "#fff", height: "26px", width: "200px" }}
        >
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            style={{ flex: 1, paddingLeft: "6px", fontSize: "12px", border: "none", outline: "none", background: "transparent" }}
            onFocus={openSearch}
          />
          <button
            className="legacy-button"
            style={{ height: "20px", width: "22px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", marginRight: "1px" }}
            title="Search"
            onClick={openSearch}
          >
            <Search size={14} color="#000" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <input type="file" ref={fileInputRef} className="hidden" />

          {/* Language Switcher Badge */}
          <button
            className="legacy-button flex items-center gap-1 font-semibold text-xs transition-all"
            style={{
              padding: "3px 8px",
              background: language === "hi" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "var(--bg-secondary)",
              color: language === "hi" ? "#ffffff" : "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "4px",
              boxShadow: language === "hi" ? "0 2px 6px rgba(59,130,246,0.4)" : "none",
            }}
            onClick={toggleLanguage}
            title="Switch Language (English / हिंदी)"
          >
            <Languages size={14} className={language === "hi" ? "text-white" : "text-blue-500"} />
            <span>{language === "en" ? "EN" : "हिंदी"}</span>
          </button>

          {/* Sound Feedback Toggle */}
          <button
            className="legacy-button flex items-center justify-center transition-all"
            style={{
              padding: "4px 8px",
              color: soundEnabled ? "#10b981" : "#ef4444",
            }}
            onClick={toggleSound}
            title={soundEnabled ? t("soundOn") : t("soundOff")}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            className="legacy-button"
            style={{ padding: "4px 8px", color: "#000" }}
            onClick={openFileExplorer}
            title={t("fileExplorer")}
          >
            <FolderOpen size={16} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            className="legacy-button"
            style={{
              padding: "4px 8px",
              color: isDark ? "#f59e0b" : "#6366f1",
              position: "relative",
            }}
            onClick={toggleDarkMode}
            title={isDark ? t("lightMode") : t("darkMode")}
          >
            <span
              style={{
                display: "inline-flex",
                transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s",
                transform: isDark ? "rotate(0deg)" : "rotate(180deg)",
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </span>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              className="legacy-button relative"
              style={{ padding: "4px 8px", color: "#eab308" }}
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={16} />
              {totalNotifs > 0 && (
                <span
                  className="absolute top-0 right-0 flex items-center justify-center text-[9px] font-bold text-white rounded-full min-w-[14px] h-[14px] px-0.5"
                  style={{
                    background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                    boxShadow: "0 0 6px rgba(244,63,94,0.6)",
                    transform: "translate(25%, -25%)",
                  }}
                >
                  {totalNotifs > 9 ? "9+" : totalNotifs}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="absolute top-full mt-2 -right-2 md:right-0 w-80 rounded-xl border shadow-xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border-primary)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div
                  className="p-3 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--border-secondary)", background: "var(--bg-secondary)" }}
                >
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Notifications
                  </h3>
                  {totalNotifs > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(244,63,94,0.1)",
                        color: "#f43f5e",
                        border: "1px solid rgba(244,63,94,0.2)",
                      }}
                    >
                      {totalNotifs} new
                    </span>
                  )}
                </div>

                <div className="overflow-y-auto flex-1 p-2 space-y-1 text-left">
                  {totalNotifs === 0 ? (
                    <div className="p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      ✅ All caught up! No new notifications.
                    </div>
                  ) : (
                    <>
                      {notifications.pendingServices.length > 0 && (
                        <div className="mb-3">
                          <div
                            className="px-2 py-1 text-xs font-semibold uppercase tracking-wider mb-1"
                            style={{ color: "var(--brand-primary)" }}
                          >
                            Pending Services
                          </div>
                          {notifications.pendingServices.map((srv) => (
                            <div
                              key={srv.id}
                              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors mb-1 cursor-default"
                            >
                              <div className="flex items-start gap-2">
                                <Clock size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                <div>
                                  <div
                                    className="text-sm font-medium leading-tight"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {srv.customer?.name} - {srv.serviceType}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    Since {new Date(srv.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {notifications.lowStockItems.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider mb-1 text-red-500">
                            Low Stock Alert
                          </div>
                          {notifications.lowStockItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors mb-1 cursor-default"
                            >
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                <div>
                                  <div
                                    className="text-sm font-medium leading-tight"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {item.name}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    Only {item.quantity} left (Min: {item.minStock})
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <a
            href="https://web.whatsapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="legacy-button"
            style={{ padding: "4px 8px", color: "#25D366", display: "flex" }}
            title="WhatsApp Web"
          >
            <MessageCircle size={16} />
          </a>

          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="legacy-button"
            style={{ padding: "4px 8px", color: "#ef4444", display: "flex" }}
            title="Open Mail"
          >
            <Mail size={16} />
          </a>

          <button
            className="legacy-button"
            style={{ padding: "4px 8px", color: "#3b82f6" }}
            onClick={() => setShowAI(true)}
            title="RA Seva AI Assistant"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* Empty right div to keep grid balance */}
      <div className="app-header-right" style={{ display: "flex", justifyContent: "flex-end", paddingRight: "4px" }}>
        <button
          className="legacy-button"
          style={{ padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", color: "#000" }}
          onClick={() => setShowLogoutConfirm(true)}
          title="Log Off"
        >
          <LogOut size={14} /> Log Off
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "transparent", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "350px",
              backgroundColor: "#d4d0c8",
              borderTop: "2px solid #fff",
              borderLeft: "2px solid #fff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              boxShadow: "1px 1px 4px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              fontSize: "11px",
              color: "black",
            }}
          >
            <div
              style={{
                background: "linear-gradient(to right, #0a246a 0%, #a6caf0 100%)",
                color: "white",
                fontWeight: "bold",
                padding: "3px 2px 3px 4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                userSelect: "none",
                margin: "2px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Key size={14} color="#ffd700" style={{ filter: "drop-shadow(1px 1px 1px #000)" }} />
                Log Off Windows
              </div>
              <button className="legacy-btn-close" type="button" onClick={() => setShowLogoutConfirm(false)} title="Close">
                <X size={12} strokeWidth={3} />
              </button>
            </div>
            <div style={{ padding: "16px", display: "flex", gap: "16px" }}>
              <div style={{ width: "48px", display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    width: "32px", height: "32px",
                    background: "linear-gradient(135deg, #008080, #004040)",
                    border: "2px solid #fff", borderRadius: "4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Key size={20} color="#ffd700" />
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "11px" }}>Are you sure you want to log off?</p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    className="legacy-button"
                    style={{ width: "70px", fontWeight: "bold" }}
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    Yes
                  </button>
                  <button
                    className="legacy-button"
                    style={{ width: "70px" }}
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
