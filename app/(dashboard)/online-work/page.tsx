"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, ExternalLink, Link as LinkIcon, Loader2, X, Copy, Check, Sparkles, Globe } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

const win95Font: React.CSSProperties = {
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontSize: "12px",
};

const win95Button: React.CSSProperties = {
  ...win95Font,
  background: "#d4d0c8",
  color: "#000",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderRight: "2px solid #404040",
  borderBottom: "2px solid #404040",
  padding: "3px 10px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  userSelect: "none" as const,
};

const win95Input: React.CSSProperties = {
  ...win95Font,
  background: "#ffffff",
  borderTop: "2px solid #808080",
  borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff",
  borderBottom: "2px solid #ffffff",
  padding: "2px 6px",
  outline: "none",
  color: "#000",
  width: "100%",
  boxSizing: "border-box" as const,
};

const win95TitleBar: React.CSSProperties = {
  background: "linear-gradient(90deg, #000080, #1084d0)",
  color: "#ffffff",
  padding: "4px 8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  ...win95Font,
  fontSize: "12px",
  fontWeight: "bold",
  userSelect: "none" as const,
};

const win95Window: React.CSSProperties = {
  background: "#d4d0c8",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderRight: "2px solid #404040",
  borderBottom: "2px solid #404040",
  outline: "1px solid #808080",
};

export default function OnlineWorkPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal Popup State
  const [activeCategoryModal, setActiveCategoryModal] = useState<any | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    fetch("/api/online-services")
      .then((res) => res.json())
      .then((data) => {
        setServicesData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const serviceGroups = useMemo(() => {
    return servicesData.map((service) => {
      // Remove leading numbers like "1. ", "2. " from title for clean display
      const cleanTitle = service.title.replace(/^\d+\.\s*/, "");
      return {
        id: service.id,
        title: cleanTitle,
        subtitle: service.description || "Official portal links & online services",
        links: service.links || [],
        raw: service,
      };
    });
  }, [servicesData]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return serviceGroups;

    return serviceGroups.filter((group) => {
      const haystack = [
        group.title,
        group.subtitle,
        ...(group.links || []).map((l: any) => l.title + " " + (l.href || "")),
      ].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, serviceGroups]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "64px", ...win95Font }}>
        <Loader2 size={20} style={{ marginRight: "6px" }} />
        Loading...
      </div>
    );
  }

  return (
    <div id="service-list" style={{ ...win95Font }}>
      {/* Main Win95 Window */}
      <div style={{ ...win95Window }}>

        {/* Title Bar */}
        <div style={win95TitleBar}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Globe size={14} />
            <span>Quick Online Work &amp; Govt Portals Hub</span>
          </div>
          <span
            style={{
              background: "#d4d0c8",
              color: "#000",
              padding: "1px 8px",
              fontSize: "11px",
              borderTop: "1px solid #ffffff",
              borderLeft: "1px solid #ffffff",
              borderRight: "1px solid #404040",
              borderBottom: "1px solid #404040",
            }}
          >
            {serviceGroups.length} Portals
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "8px", background: "#d4d0c8" }}>

          {/* Search / Header Panel */}
          <div
            style={{
              background: "#d4d0c8",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              padding: "6px 8px",
              marginBottom: "8px",
              display: "flex",
              flexWrap: "wrap" as const,
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", marginBottom: "2px" }}>
                <Sparkles size={13} />
                Select Portal Category
              </div>
              <div style={{ color: "#404040", fontSize: "11px" }}>
                Click any category to view official portal links and direct access
              </div>
            </div>

            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "220px" }}>
              <Search size={12} style={{ color: "#404040", flexShrink: 0 }} />
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search: Aadhaar, PAN, Voter, RTPS..."
                  style={{ ...win95Input }}
                />
              </div>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{ ...win95Button, padding: "2px 6px" }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "6px",
            }}
          >
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => setActiveCategoryModal(group)}
                title={group.title}
                style={{
                  background: "#ffffff",
                  border: "1px solid #808080",
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column" as const,
                  justifyContent: "space-between",
                  minHeight: "80px",
                  boxSizing: "border-box" as const,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = "2px solid #000080";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid #808080";
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        background: "#000080",
                        color: "#ffffff",
                        padding: "1px 5px",
                        fontSize: "10px",
                        fontFamily: "'Tahoma','MS Sans Serif',sans-serif",
                      }}
                    >
                      {group.links.length} Links
                    </span>
                    <ExternalLink size={11} style={{ color: "#808080" }} />
                  </div>

                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#000",
                      marginBottom: "2px",
                      whiteSpace: "nowrap" as const,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {group.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#404040",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                    }}
                  >
                    {group.subtitle}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    borderTop: "1px solid #808080",
                    paddingTop: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "10px",
                    color: "#404040",
                  }}
                >
                  <span>Click for Direct Links</span>
                  <span style={{ fontWeight: "bold" }}>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredGroups.length === 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "2px solid #808080",
                padding: "24px",
                textAlign: "center" as const,
                marginTop: "8px",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                No portal category matching &quot;{query}&quot;
              </div>
              <div style={{ color: "#404040", fontSize: "11px" }}>
                Try searching for Aadhaar, PAN, Voter, or RTPS
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Win95 Category Popup Modal ── */}
      {activeCategoryModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          {/* Modal Win95 Window */}
          <div
            style={{
              ...win95Window,
              maxWidth: "560px",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column" as const,
              overflow: "hidden",
            }}
          >
            {/* Modal Title Bar */}
            <div style={{ ...win95TitleBar, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Globe size={13} />
                <span>{activeCategoryModal.title}</span>
              </div>
              <button
                onClick={() => setActiveCategoryModal(null)}
                style={{
                  ...win95Button,
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  lineHeight: "1",
                  minWidth: "20px",
                  justifyContent: "center",
                }}
                title="Close"
              >
                <X size={12} />
              </button>
            </div>

            {/* Modal Sub-header */}
            <div
              style={{
                background: "#d4d0c8",
                borderBottom: "1px solid #808080",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
                fontSize: "11px",
                color: "#000",
              }}
            >
              <LinkIcon size={12} style={{ color: "#000080", flexShrink: 0 }} />
              <span>
                {activeCategoryModal.links.length} Official Direct Links &mdash; {activeCategoryModal.subtitle}
              </span>
            </div>

            {/* Modal Links Content */}
            <div
              style={{
                padding: "6px",
                overflowY: "auto" as const,
                flex: 1,
                background: "#d4d0c8",
                display: "flex",
                flexDirection: "column" as const,
                gap: "4px",
              }}
            >
              {activeCategoryModal.links && activeCategoryModal.links.length > 0 ? (
                activeCategoryModal.links.map((link: any, idx: number) => (
                  <div
                    key={link.id || idx}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #808080",
                      padding: "5px 7px",
                      display: "flex",
                      flexWrap: "wrap" as const,
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "bold", color: "#000", marginBottom: "1px" }}>
                        {link.title}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#808080",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                          maxWidth: "280px",
                        }}
                      >
                        {link.href}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleCopyLink(link.href, link.id || `${idx}`)}
                        style={{ ...win95Button }}
                        title="Copy Link URL"
                      >
                        {copiedLinkId === (link.id || `${idx}`) ? (
                          <>
                            <Check size={12} style={{ color: "#008000" }} />
                            <span style={{ color: "#008000", fontWeight: "bold" }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>

                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          ...win95Button,
                          background: "#000080",
                          color: "#ffffff",
                          borderTop: "2px solid #1084d0",
                          borderLeft: "2px solid #1084d0",
                          borderRight: "2px solid #000040",
                          borderBottom: "2px solid #000040",
                          textDecoration: "none",
                          fontWeight: "bold",
                        }}
                      >
                        Open Portal
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center" as const,
                    padding: "24px",
                    color: "#404040",
                    background: "#ffffff",
                    border: "1px solid #808080",
                  }}
                >
                  No links added for this category yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                background: "#d4d0c8",
                borderTop: "1px solid #808080",
                padding: "5px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
                fontSize: "11px",
                color: "#404040",
              }}
            >
              <span>⚠️ Verify URL before submitting applicant details.</span>
              <button
                onClick={() => setActiveCategoryModal(null)}
                style={{ ...win95Button, fontWeight: "bold" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
