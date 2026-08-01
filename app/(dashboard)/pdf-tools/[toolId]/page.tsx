"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { PDF_TOOLS, PdfToolId } from "@/lib/pdf-tools-config";
import { ArrowLeft, Grid3X3, Sparkles } from "lucide-react";
import Link from "next/link";

// Tool Components (to be implemented)
import MergePdfTool from "./components/MergePdfTool";
import SplitPdfTool from "./components/SplitPdfTool";
import CompressPdfTool from "./components/CompressPdfTool";
import PdfToJpgTool from "./components/PdfToJpgTool";
import JpgToPdfTool from "./components/JpgToPdfTool";
import ProtectPdfTool from "./components/ProtectPdfTool";
import UnlockPdfTool from "./components/UnlockPdfTool";
import RotatePdfTool from "./components/RotatePdfTool";
import DeletePagesTool from "./components/DeletePagesTool";
import ExtractPagesTool from "./components/ExtractPagesTool";
import ReorderPagesTool from "./components/ReorderPagesTool";
import AddSignatureTool from "./components/AddSignatureTool";
import RedactPdfTool from "./components/RedactPdfTool";
import EditPdfTool from "./components/EditPdfTool";
import WordToPdfTool from "./components/WordToPdfTool";

const toolColorMap: Record<string, { bg: string; soft: string; border: string }> = {
  "bg-blue-500": { bg: "#2563eb", soft: "#eff6ff", border: "#bfdbfe" },
  "bg-orange-500": { bg: "#f97316", soft: "#fff7ed", border: "#fed7aa" },
  "bg-red-500": { bg: "#ef4444", soft: "#fef2f2", border: "#fecaca" },
  "bg-green-600": { bg: "#16a34a", soft: "#f0fdf4", border: "#bbf7d0" },
  "bg-indigo-500": { bg: "#6366f1", soft: "#eef2ff", border: "#c7d2fe" },
  "bg-purple-500": { bg: "#a855f7", soft: "#faf5ff", border: "#e9d5ff" },
  "bg-teal-500": { bg: "#14b8a6", soft: "#f0fdfa", border: "#99f6e4" },
  "bg-amber-500": { bg: "#f59e0b", soft: "#fffbeb", border: "#fde68a" },
  "bg-yellow-500": { bg: "#eab308", soft: "#fefce8", border: "#fef08a" },
  "bg-blue-600": { bg: "#1d4ed8", soft: "#eff6ff", border: "#bfdbfe" },
  "bg-slate-700": { bg: "#334155", soft: "#f8fafc", border: "#cbd5e1" },
  "bg-emerald-500": { bg: "#10b981", soft: "#ecfdf5", border: "#a7f3d0" },
  "bg-pink-500": { bg: "#ec4899", soft: "#fdf2f8", border: "#fbcfe8" },
  "bg-zinc-800": { bg: "#27272a", soft: "#fafafa", border: "#d4d4d8" },
  "bg-sky-500": { bg: "#0ea5e9", soft: "#f0f9ff", border: "#bae6fd" },
};

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.toolId as PdfToolId;

  const toolConfig = PDF_TOOLS.find((t) => t.id === toolId);

  if (!toolConfig) {
    notFound();
  }

  const ToolIcon = toolConfig.icon;
  const color = toolColorMap[toolConfig.color] || toolColorMap["bg-blue-500"];
  const relatedTools = PDF_TOOLS.filter((tool) => tool.category === toolConfig.category && tool.id !== toolConfig.id).slice(0, 6);

  const renderTool = () => {
    switch (toolId) {
      case "merge": return <MergePdfTool />;
      case "split": return <SplitPdfTool />;
      case "compress": return <CompressPdfTool />;
      case "pdf-to-jpg": return <PdfToJpgTool />;
      case "jpg-to-pdf": return <JpgToPdfTool />;
      case "protect": return <ProtectPdfTool />;
      case "unlock": return <UnlockPdfTool />;
      case "rotate": return <RotatePdfTool />;
      case "delete-pages": return <DeletePagesTool />;
      case "extract-pages": return <ExtractPagesTool />;
      case "reorder-pages": return <ReorderPagesTool />;
      case "add-signature": return <AddSignatureTool />;
      case "redact": return <RedactPdfTool />;
      case "edit": return <EditPdfTool />;
      case "word-to-pdf": return <WordToPdfTool />;
      default:
        return <div>Tool not found</div>;
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100%", padding: "14px", background: "#d4d0c8", color: "#0f172a" }}>
      <div
        style={{
          background: "#ffffff",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderRight: "2px solid #808080",
          borderBottom: "2px solid #808080",
          boxShadow: "inset 1px 1px #f7f7f7, 0 12px 28px rgba(15,23,42,0.14)",
          marginBottom: "14px",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "8px", background: `linear-gradient(90deg, ${color.bg}, #0f172a)` }} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: "18px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0 }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                background: color.soft,
                border: `1px solid ${color.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ToolIcon size={34} color={color.bg} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                <Link
                  href="/pdf-tools"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 8px",
                    background: "#d4d0c8",
                    color: "#000",
                    textDecoration: "none",
                    borderTop: "1px solid #fff",
                    borderLeft: "1px solid #fff",
                    borderRight: "1px solid #404040",
                    borderBottom: "1px solid #404040",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  <ArrowLeft size={13} />
                  Back
                </Link>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: color.bg, background: color.soft, border: `1px solid ${color.border}`, padding: "4px 8px" }}>
                  {toolConfig.category}
                </span>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 8px" }}>
                  Ready
                </span>
              </div>

              <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px", lineHeight: 1.08, fontWeight: 900, letterSpacing: 0 }}>
                {toolConfig.title}
              </h1>
              <p style={{ margin: "8px 0 0", color: "#475569", fontSize: "14px", lineHeight: 1.45, maxWidth: "680px" }}>
                {toolConfig.description}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px", color: "#334155", fontSize: "12px", fontWeight: 700 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Sparkles size={13} color={color.bg} /> Visual workflow</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Grid3X3 size={13} color={color.bg} /> Professional PDF output</span>
              </div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #dbe3ef", padding: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
              More {toolConfig.category} Tools
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "5px" }}>
              {relatedTools.map((tool) => {
                const RelatedIcon = tool.icon;
                const relatedColor = toolColorMap[tool.color] || color;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => router.push(`/pdf-tools/${tool.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 8px",
                      background: "#ffffff",
                      color: "#0f172a",
                      border: "1px solid #dbe3ef",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    <RelatedIcon size={14} color={relatedColor.bg} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tool.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#f8fafc",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderRight: "2px solid #808080",
          borderBottom: "2px solid #808080",
          minHeight: "calc(100vh - 260px)",
          padding: "18px",
        }}
      >
        {renderTool()}
      </div>
    </div>
  );
}
