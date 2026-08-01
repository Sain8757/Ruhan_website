"use client";

import Link from "next/link";
import { FileText, FilePlus2, ChevronRight } from "lucide-react";

const win95Font: React.CSSProperties = {
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontSize: "12px",
};

export default function ManualFormsDashboard() {
  return (
    <div
      style={{
        ...win95Font,
        padding: "16px",
        maxWidth: "720px",
        margin: "0 auto",
        background: "#d4d0c8",
        minHeight: "100vh",
      }}
    >
      {/* Outer Win95 window panel */}
      <div
        style={{
          background: "#d4d0c8",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderRight: "2px solid #404040",
          borderBottom: "2px solid #404040",
          boxShadow: "1px 1px 0 #000",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "linear-gradient(90deg, #000080, #1084d0)",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            userSelect: "none",
          }}
        >
          <FileText size={14} color="#ffffff" />
          <span
            style={{
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              fontWeight: "bold",
              fontSize: "13px",
              fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
            }}
          >
            Manual Form Filling
          </span>
        </div>

        {/* Window body */}
        <div style={{ padding: "12px" }}>
          {/* Page heading */}
          <p
            style={{
              ...win95Font,
              color: "#000000",
              WebkitTextFillColor: "#000000",
              marginBottom: "12px",
            }}
          >
            Select a category and form type to start filling.
          </p>

          {/* Category: Ration Card */}
          <div
            style={{
              border: "1px solid #808080",
              marginBottom: "8px",
            }}
          >
            {/* Section header */}
            <div
              style={{
                background: "#d4d0c8",
                borderTop: "2px solid #ffffff",
                borderLeft: "2px solid #ffffff",
                borderRight: "2px solid #808080",
                borderBottom: "2px solid #808080",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FileText size={16} color="#000080" />
              <div>
                <div
                  style={{
                    ...win95Font,
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#000080",
                    WebkitTextFillColor: "#000080",
                  }}
                >
                  Bihar Ration Card (बिहार राशन कार्ड)
                </div>
                <div
                  style={{
                    ...win95Font,
                    fontSize: "11px",
                    color: "#000000",
                    WebkitTextFillColor: "#000000",
                  }}
                >
                  Official government forms for Bihar Ration Card
                </div>
              </div>
            </div>

            {/* Form rows */}
            <div style={{ background: "#ffffff" }}>
              <FormRow
                href="/manual-forms/ration-card/new"
                icon={<FilePlus2 size={16} color="#000080" />}
                title="New Apply (Old)"
                description="Application for new ration card (Old Template)."
              />
              <FormRow
                href="/manual-forms/ration-card/ka"
                icon={<FilePlus2 size={16} color="#000080" />}
                title="प्रपत्र क (Form Ka)"
                description="Application for generating a completely new ration card."
              />
              <FormRow
                href="/manual-forms/ration-card/kha"
                icon={<FileText size={16} color="#000080" />}
                title="प्रपत्र ख (Form Kha)"
                description="Application for modification, name addition, or surrender."
                isLast
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormRowProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}

function FormRow({ href, icon, title, description, isLast }: FormRowProps) {
  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "block" }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.outline = "1px dotted #000000";
        (e.currentTarget as HTMLElement).style.background = "#f0f0f0";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.outline = "none";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "none",
          borderBottom: isLast ? "none" : "1px solid #c0c0c0",
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
        }}
      >
        {/* Icon */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
              fontSize: "13px",
              fontWeight: "bold",
              color: "#000080",
              WebkitTextFillColor: "#000080",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
              fontSize: "11px",
              color: "#000000",
              WebkitTextFillColor: "#000000",
              marginTop: "2px",
            }}
          >
            {description}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={16} color="#808080" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}
