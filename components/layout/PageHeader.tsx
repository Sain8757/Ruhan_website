"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("page-header", className)}
      style={{
        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
      }}
    >
      {/* Left: Back + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
        {backHref && (
          <Link
            href={backHref}
            aria-label="Go back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#d4d0c8",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080",
              padding: "2px 6px",
              color: "#000",
              textDecoration: "none",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={12} />
          </Link>
        )}

        {/* Title area — Win95 group box style */}
        <div
          style={{
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderRight: "1px solid #ffffff",
            borderBottom: "1px solid #ffffff",
            padding: "4px 10px 4px 8px",
            minWidth: 0,
            background: "#d4d0c8",
            position: "relative",
          }}
        >
          <h1
            className="page-title"
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#000080",
              letterSpacing: 0,
              lineHeight: "1.3",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            🔹 {title}
          </h1>
          {subtitle && (
            <p
              className="page-subtitle"
              style={{
                fontSize: "11px",
                color: "#444444",
                margin: "1px 0 0 0",
                lineHeight: "1.3",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Action buttons */}
      {actions && (
        <div
          className="page-actions"
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
