"use client";

import React from "react";

function SkeletonBox({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg shimmer ${className}`}
      style={{
        background: "linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(79,110,247,0.06) 50%, var(--bg-tertiary) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s infinite",
        ...style,
      }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="stat-card flex flex-col justify-between"
      style={{ minHeight: "108px", padding: "12px 14px" }}
    >
      <div className="flex items-center justify-between mb-3">
        <SkeletonBox className="w-8 h-8 rounded-lg" />
        <SkeletonBox className="w-14 h-5 rounded-md" />
      </div>
      <div>
        <SkeletonBox className="w-24 h-6 rounded mb-1.5" />
        <SkeletonBox className="w-32 h-3.5 rounded" />
      </div>
    </div>
  );
}

function ActionCardSkeleton() {
  return (
    <div className="action-card flex flex-col items-center justify-center gap-3">
      <SkeletonBox className="w-12 h-12 rounded-2xl" />
      <div className="flex flex-col items-center gap-1.5 w-full">
        <SkeletonBox className="w-20 h-4 rounded" />
        <SkeletonBox className="w-16 h-3 rounded" />
      </div>
    </div>
  );
}

function ChartCardSkeleton({ height = 340 }: { height?: number }) {
  return (
    <div className="glass-card p-6 flex flex-col" style={{ minHeight: `${height}px` }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <SkeletonBox className="w-36 h-5 rounded mb-2" />
          <SkeletonBox className="w-28 h-3.5 rounded" />
        </div>
        <SkeletonBox className="w-24 h-7 rounded-xl" />
      </div>
      <div className="flex-1 flex items-end gap-2 px-2">
        {[65, 80, 45, 90, 55, 75, 100].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <SkeletonBox className="w-full rounded-t-lg" style={{ height: `${h}%` } as React.CSSProperties} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-5 pb-4">
        <div>
          <SkeletonBox className="w-36 h-5 rounded mb-2" />
          <SkeletonBox className="w-44 h-3.5 rounded" />
        </div>
        <SkeletonBox className="w-16 h-4 rounded" />
      </div>
      <div className="px-2 pb-3">
        {/* Table header */}
        <div className="flex gap-4 px-4 py-2.5 mb-1">
          {["flex-[2]", "flex-[1.5]", "flex-1", "flex-1", "flex-1"].map((flex, i) => (
            <SkeletonBox key={i} className={`h-3 rounded ${flex}`} />
          ))}
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--border-secondary)] last:border-0">
            <div className="flex items-center gap-2.5 flex-[2]">
              <SkeletonBox className="w-7 h-7 rounded-lg shrink-0" />
              <div className="flex-1">
                <SkeletonBox className="w-24 h-3.5 rounded mb-1.5" />
                <SkeletonBox className="w-20 h-3 rounded" />
              </div>
            </div>
            <SkeletonBox className="flex-[1.5] h-3.5 rounded" />
            <SkeletonBox className="flex-1 h-5 rounded-full max-w-[70px]" />
            <SkeletonBox className="flex-1 h-3.5 rounded max-w-[50px]" />
            <SkeletonBox className="flex-1 h-3.5 rounded max-w-[60px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="page-shell page-shell-dashboard animate-fade-in">
      {/* Hero skeleton */}
      <div
        className="relative overflow-hidden rounded-xl p-4 sm:p-5"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          minHeight: "110px",
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="w-24 h-5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="w-56 h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="w-48 h-4 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="metric-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="flex flex-col gap-4">
        <SkeletonBox className="w-32 h-5 rounded" />
        <div className="quick-grid">
          {[1, 2, 3, 4].map((i) => (
            <ActionCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Charts row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-5">
        <ChartCardSkeleton />
        <div className="glass-card p-5 flex flex-col min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBox className="w-32 h-5 rounded" />
            <SkeletonBox className="w-3 h-3 rounded-full" />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl">
                <SkeletonBox className="w-7 h-7 rounded-lg shrink-0" />
                <div className="flex-1">
                  <SkeletonBox className="w-40 h-3.5 rounded mb-1.5" />
                  <SkeletonBox className="w-28 h-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)] gap-5">
        <ChartCardSkeleton height={300} />
        <TableCardSkeleton />
      </div>
    </div>
  );
}
