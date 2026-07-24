"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  X, LayoutDashboard, Users, Briefcase, Receipt, Camera,
  ScanLine, Layers, WalletCards, BookOpen, Package,
  MessageSquare, BarChart3, Settings, QrCode, FileImage,
  Search, Bell, MessageCircle, Mail, Sparkles, LogOut, AlertTriangle, Clock
} from "lucide-react";
import { WorkspaceProvider, useWorkspace } from "@/components/workspace/WorkspaceProvider";
import Providers from "@/components/Providers";
import { WORKSPACE_MODULES } from "@/lib/workspace";
import { signOut } from "next-auth/react";
import { DownloadProvider } from "@/contexts/DownloadContext";
import AIAssistant from "@/components/ai/AIAssistant";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  LayoutDashboard,
  Users,
  Briefcase,
  Receipt,
  Camera,
  ScanLine,
  Layers,
  WalletCards,
  BookOpen,
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  QrCode,
  FileImage,
};

function LegacyDesktopInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { openSearch } = useWorkspace();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  const [notifications, setNotifications] = useState<{
    pendingServices: any[];
    lowStockItems: any[];
  }>({ pendingServices: [], lowStockItems: [] });

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

  const totalNotifs =
    notifications.pendingServices.length + notifications.lowStockItems.length;

  const getWindowTitle = () => {
    if (pathname === "/") return "Dashboard";
    const activeModule = WORKSPACE_MODULES.find(
      (m) => pathname.startsWith(m.href) && m.href !== "/"
    );
    return activeModule ? activeModule.label : "Agency Information Manager";
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const openWhatsApp = () => {
    window.open("https://web.whatsapp.com/", "_blank");
  };

  const openMail = () => {
    window.open("https://mail.google.com/", "_blank");
  };

  return (
    <div className="legacy-desktop" style={{ width: "100vw", height: "100vh", display: "flex" }}>
      {/* Main Background Window Container */}
      <div
        className="legacy-window"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1440px",
          margin: "0 auto",
          height: "100vh",
          boxShadow: "0 0 50px rgba(0,0,0,0.3)",
        }}
      >
        {/* Title Bar */}
        <div className="legacy-window-titlebar">
          <div className="title-text" style={{ flex: 1 }}>
            <span style={{ fontSize: "14px", lineHeight: 1 }}>🔹</span>
            {getWindowTitle()} - RA Seva Point
          </div>

          {/* Universal Search & Utility Icons centered in Title Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 2 }}>
            {/* Universal Search Box */}
            <div
              onClick={openSearch}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                borderTop: "2px solid #808080",
                borderLeft: "2px solid #808080",
                borderRight: "2px solid #fff",
                borderBottom: "2px solid #fff",
                padding: "1px",
                marginRight: "16px",
                width: "250px",
                flexShrink: 0,
                cursor: "text",
              }}
            >
              <input
                type="text"
                placeholder="Search services, customers, invoices..."
                onFocus={openSearch}
                readOnly
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: "11px",
                  padding: "0 4px",
                  color: "#000",
                  cursor: "text",
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSearch();
                }}
                style={{
                  padding: "2px 4px",
                  background: "#d4d0c8",
                  borderTop: "2px solid #fff",
                  borderLeft: "2px solid #fff",
                  borderRight: "2px solid #404040",
                  borderBottom: "2px solid #404040",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Open Universal Search (Ctrl+K)"
              >
                <Search size={12} color="#000" />
              </button>
            </div>

            {/* Utility Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, position: "relative" }}>
              {/* Notifications Button */}
              <button
                className="legacy-toolbar-btn"
                title="Notifications & Alerts"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: "#d4d0c8", padding: "2px 4px", position: "relative", cursor: "pointer" }}
              >
                <Bell size={16} color="#d4af37" />
                {totalNotifs > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "14px",
                      height: "14px",
                      fontSize: "9px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {totalNotifs}
                  </span>
                )}
              </button>

              {/* WhatsApp Button */}
              <button
                className="legacy-toolbar-btn"
                title="Open WhatsApp Web"
                onClick={openWhatsApp}
                style={{ background: "#d4d0c8", padding: "2px 4px", cursor: "pointer" }}
              >
                <MessageCircle size={16} color="#25D366" />
              </button>

              {/* Email Button */}
              <button
                className="legacy-toolbar-btn"
                title="Open Webmail / Gmail"
                onClick={openMail}
                style={{ background: "#d4d0c8", padding: "2px 4px", cursor: "pointer" }}
              >
                <Mail size={16} color="#D44638" />
              </button>

              {/* Gemini AI Button */}
              <button
                className="legacy-toolbar-btn"
                title="Gemini AI Assistant"
                onClick={() => setShowAI(true)}
                style={{ background: "#d4d0c8", padding: "2px 4px", cursor: "pointer" }}
              >
                <Sparkles size={16} color="#4285F4" />
              </button>
            </div>
          </div>

          {/* Logout Controls */}
          <div className="legacy-window-controls" style={{ flex: 1, justifyContent: "flex-end", display: "flex" }}>
            <button
              className="legacy-btn-sys"
              style={{ width: "auto", padding: "0 8px", display: "flex", gap: "4px", cursor: "pointer" }}
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Toolbar - Dynamic Modules */}
        <div className="legacy-toolbar" style={{ overflowX: "auto", whiteSpace: "nowrap", display: "flex", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {WORKSPACE_MODULES.map((module, idx) => {
              const IconComponent = iconMap[module.icon as string] || ScanLine;
              return (
                <React.Fragment key={module.id}>
                  <button className="legacy-toolbar-btn" onClick={() => router.push(module.href)}>
                    <IconComponent size={16} color={idx % 2 === 0 ? "#008080" : "#000080"} />
                    {module.label}
                  </button>
                  {(idx === 3 || idx === 6 || idx === 10) && (
                    <div style={{ width: "2px", borderLeft: "1px solid #808080", borderRight: "1px solid #fff", margin: "0 4px", height: "24px", alignSelf: "center" }}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Inner Content Area */}
        <div style={{ background: "#d4d0c8", flex: 1, display: "flex", overflow: "hidden", padding: "4px" }}>
          <div className="legacy-tab-content" style={{ flex: 1, overflowY: "auto", background: "#d4d0c8" }}>
            <DownloadProvider>{children}</DownloadProvider>
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div
            style={{
              position: "fixed",
              top: "45px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              width: "360px",
              backgroundColor: "#d4d0c8",
              borderTop: "2px solid #fff",
              borderLeft: "2px solid #fff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              padding: "2px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(to right, #000080 0%, #1084d0 100%)",
                color: "white",
                padding: "3px 6px",
                fontWeight: "bold",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Bell size={13} color="#FFD700" />
                <span>Notifications & System Alerts</span>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  background: "#d4d0c8",
                  borderTop: "1px solid #fff",
                  borderLeft: "1px solid #fff",
                  borderRight: "1px solid #404040",
                  borderBottom: "1px solid #404040",
                  color: "black",
                  width: "16px",
                  height: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "10px", maxHeight: "320px", overflowY: "auto", background: "#fff", margin: "2px" }}>
              {totalNotifs === 0 ? (
                <div style={{ textAlign: "center", padding: "16px", color: "#666", fontSize: "12px" }}>
                  ✅ No pending notifications or inventory alerts.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {notifications.pendingServices.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => {
                        setShowNotifications(false);
                        router.push(`/services/${srv.id}`);
                      }}
                      style={{
                        padding: "8px",
                        background: "#fff9e6",
                        border: "1px solid #ffe58f",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: "#d48800", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} />
                        Pending Service: {srv.serviceType}
                      </div>
                      <div style={{ color: "#333", marginTop: "2px" }}>
                        Customer: {srv.customer?.name} ({srv.customer?.mobile})
                      </div>
                    </div>
                  ))}

                  {notifications.lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/inventory");
                      }}
                      style={{
                        padding: "8px",
                        background: "#fff1f0",
                        border: "1px solid #ffa39e",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: "#cf1322", display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertTriangle size={12} />
                        Low Stock Alert: {item.name}
                      </div>
                      <div style={{ color: "#333", marginTop: "2px" }}>
                        Only {item.quantity} {item.unit || "pcs"} left in inventory!
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Assistant Modal */}
        <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "#d4d0c8",
                borderTop: "2px solid #fff",
                borderLeft: "2px solid #fff",
                borderRight: "2px solid #404040",
                borderBottom: "2px solid #404040",
                padding: "2px",
                width: "300px",
                boxShadow: "2px 2px 5px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(to right, #000080 0%, #1084d0 100%)",
                  color: "white",
                  padding: "2px 4px",
                  fontWeight: "bold",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Log Off Windows</span>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    background: "#d4d0c8",
                    borderTop: "1px solid #fff",
                    borderLeft: "1px solid #fff",
                    borderRight: "1px solid #404040",
                    borderBottom: "1px solid #404040",
                    color: "black",
                    width: "16px",
                    height: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  X
                </button>
              </div>

              <div style={{ padding: "16px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ color: "#000080" }}>
                  <LogOut size={32} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontFamily: "Tahoma, sans-serif" }}>
                    Are you sure you want to log off?
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "8px 16px 16px" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "4px 16px",
                    background: "#d4d0c8",
                    borderTop: "1px solid #fff",
                    borderLeft: "1px solid #fff",
                    borderRight: "1px solid #404040",
                    borderBottom: "1px solid #404040",
                    fontFamily: "Tahoma, sans-serif",
                    fontSize: "12px",
                    cursor: "pointer",
                    width: "75px",
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    padding: "4px 16px",
                    background: "#d4d0c8",
                    borderTop: "1px solid #fff",
                    borderLeft: "1px solid #fff",
                    borderRight: "1px solid #404040",
                    borderBottom: "1px solid #404040",
                    fontFamily: "Tahoma, sans-serif",
                    fontSize: "12px",
                    cursor: "pointer",
                    width: "75px",
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegacyDesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <WorkspaceProvider>
        <LegacyDesktopInner>{children}</LegacyDesktopInner>
      </WorkspaceProvider>
    </Providers>
  );
}
