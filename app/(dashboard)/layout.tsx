"use client";

import LegacyDesktopLayout from "@/components/layout/LegacyDesktopLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LegacyDesktopLayout>
      {children}
    </LegacyDesktopLayout>
  );
}
