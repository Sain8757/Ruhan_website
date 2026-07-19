"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import { cn } from "@/lib/utils";
import { getPageTitle } from "@/lib/workspace";
import { usePathname } from "next/navigation";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    }
  }, []);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const closeMobileSidebar = () => setMobileOpenPath(null);
  const toggleMobileSidebar = () => {
    setMobileOpenPath((current) => (current === pathname ? null : pathname));
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <WorkspaceProvider>
      <div className="dashboard-shell">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* Desktop Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          className="hidden lg:flex"
        />

        {/* Mobile sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar collapsed={false} onToggle={closeMobileSidebar} className="flex" />
        </div>

        {/* Main content */}
        <div className="main-content">
          <Header onMenuToggle={toggleMobileSidebar} pageTitle={pageTitle} />

          {/* Page content */}
          <main className="app-main">
            <div className="app-container">{children}</div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardShell>{children}</DashboardShell>
    </Providers>
  );
}
