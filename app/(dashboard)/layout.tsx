"use client";

import LegacyDesktopLayout from "@/components/layout/LegacyDesktopLayout";
import KioskNotifier from "@/components/kiosk/KioskNotifier";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LegacyDesktopLayout>
      <KioskNotifier />
      {children}
    </LegacyDesktopLayout>
  );
}
