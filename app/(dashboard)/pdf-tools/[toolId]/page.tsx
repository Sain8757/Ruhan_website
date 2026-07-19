"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { PDF_TOOLS, PdfToolId } from "@/lib/pdf-tools-config";
import PageHeader from "@/components/layout/PageHeader";
import { ArrowLeft } from "lucide-react";
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

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.toolId as PdfToolId;

  const toolConfig = PDF_TOOLS.find((t) => t.id === toolId);

  if (!toolConfig) {
    notFound();
  }

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
      case "word-to-pdf":
        return (
          <div className="text-center py-20 animate-fade-in">
            <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Word to PDF Component Coming Soon</h3>
            <p style={{ color: "var(--text-muted)" }}>This feature is currently under development.</p>
          </div>
        );
      default:
        return <div>Tool not found</div>;
    }
  };

  return (
    <div className="page-shell page-shell-tool relative pt-12">
      <Link href="/pdf-tools" className="absolute top-4 left-6 z-10 flex items-center gap-2 text-sm font-semibold hover:opacity-75 transition-opacity" style={{ color: "var(--text-primary)" }}>
        <ArrowLeft size={18} />
        Back to Tools
      </Link>
      
      <PageHeader
        title={toolConfig.title}
        subtitle={toolConfig.description}
      />
      
      <div className="mt-8">
        {renderTool()}
      </div>
    </div>
  );
}
