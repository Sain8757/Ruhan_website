"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Camera,
  Receipt,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  ScanLine,
  Layers,
  MessageSquare,
  Sparkles,
  WalletCards,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKSPACE_MODULES, type WorkspaceIcon } from "@/lib/workspace";

// Icon colors for premium look
const iconColors: Partial<Record<WorkspaceIcon, string>> = {
  LayoutDashboard: "#4f6ef7",
  Users: "#a78bfa",
  Briefcase: "#f59e0b",
  Receipt: "#10b981",
  Camera: "#f43f5e",
  ScanLine: "#06b6d4",
  Layers: "#f97316",
  WalletCards: "#0ea5e9",
  BookOpen: "#8b5cf6",
  Package: "#14b8a6",
  MessageSquare: "#ec4899",
  BarChart3: "#22c55e",
  Settings: "#6b7280",
  QrCode: "#4f46e5",
};

const iconMap: Partial<Record<WorkspaceIcon, React.ComponentType<{ size?: number; className?: string }>>> = {
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
};

const NAV_SECTIONS = ["Core", "Tools", "Inventory", "Business"] as const;

const SECTION_LABELS: Record<(typeof NAV_SECTIONS)[number], string> = {
  Core: "Main",
  Tools: "Tools",
  Inventory: "Inventory",
  Business: "Business",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export default function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("sidebar", collapsed && "collapsed", className)}>
      {/* Ambient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 100% 35% at 50% 0%, rgba(79,110,247,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 relative z-10"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center relative overflow-hidden bg-white shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,0.1)" }}
        >
          {/* Logo image expects 'logo.png' in the public folder */}
          <img 
            src="/logo.png" 
            alt="RA" 
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              // Fallback if image doesn't exist yet
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.className = 'text-blue-600 font-black text-sm tracking-tight';
                fallback.innerText = 'RA';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div
              className="font-extrabold text-[15px] leading-tight truncate text-slate-800"
            >
              RA Seva Point
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles size={10} className="text-blue-500" />
              <span className="text-[11px] font-medium leading-tight truncate text-slate-500">
                Services & Books
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg transition-all shrink-0"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.35)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,110,247,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#7b93ff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 relative z-10">
        {NAV_SECTIONS.map((section, sectionIndex) => {
          const items = WORKSPACE_MODULES.filter((item) => item.section === section);

          return (
            <div key={section}>
              {sectionIndex > 0 && (
                !collapsed ? (
                  <div className="pt-4 pb-1.5 px-2">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.18)" }}
                    >
                      {SECTION_LABELS[section]}
                    </span>
                  </div>
                ) : (
                  <div
                    className="my-3 mx-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  />
                )
              )}

              {items.map((item) => {
                const Icon = iconMap[item.icon];
                const active = isActive(item.href);
                const iconColor = iconColors[item.icon] || "#7b93ff";
                if (!Icon) return null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("sidebar-item group", active && "active")}
                    title={collapsed ? item.label : undefined}
                    style={collapsed ? { justifyContent: "center", padding: "10px 0" } : {}}
                  >
                    {/* Icon with colored background on active */}
                    <div
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: active
                          ? `${iconColor}22`
                          : "transparent",
                      }}
                    >
                      <span
                        style={{
                          color: active ? iconColor : "rgba(255,255,255,0.38)",
                          transition: "color 0.2s ease",
                          filter: active ? `drop-shadow(0 0 4px ${iconColor}80)` : "none",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Icon size={16} />
                      </span>
                    </div>

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {active && !collapsed && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: iconColor,
                          boxShadow: `0 0 6px ${iconColor}`,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="p-2.5 relative z-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "sidebar-item w-full",
            collapsed && "justify-center"
          )}
          style={{ color: "rgba(244,63,94,0.6)" }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(244,63,94,0.08)";
            el.style.color = "#f43f5e";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "";
            el.style.color = "rgba(244,63,94,0.6)";
          }}
          title={collapsed ? "Sign out" : undefined}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(244,63,94,0.08)" }}>
            <LogOut size={15} className="shrink-0" />
          </div>
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <div
            className="mt-3 px-2 flex items-center gap-1.5"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            <Heart size={9} style={{ color: "rgba(244,63,94,0.4)" }} />
            <span className="text-[10px]">Made for RA Seva Point</span>
          </div>
        )}
      </div>
    </aside>
  );
}
