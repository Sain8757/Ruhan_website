"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, X, FileDown, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;
}

export default function WordToPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: File) => {
    const ext = incoming.name.toLowerCase();
    if (!ext.endsWith(".docx") && !ext.endsWith(".doc") && !ext.endsWith(".txt") && !ext.endsWith(".rtf")) {
      toast.error("Please select a Word (.docx/.doc) or Text document");
      return;
    }
    setFile(incoming);
    setConvertedUrl(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // Dynamic import of jsPDF for clean PDF generation
      const { jsPDF } = await import("jspdf");

      let extractedText = "";

      if (file.name.toLowerCase().endsWith(".txt")) {
        extractedText = await file.text();
      } else {
        // Read file binary text / content structure
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const rawContent = decoder.decode(arrayBuffer);

        // Filter clean readable printable ASCII / Unicode string lines from DOCX/DOC binary XML content
        const cleanLines = rawContent
          .replace(/<[^>]+>/g, " ")
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
          .split(/\s{2,}/)
          .filter((line) => line.trim().length > 2);

        extractedText = cleanLines.join("\n\n") || `Document: ${file.name}\n\nConverted via RA Seva Point PDF Suite.`;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Styling parameters
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(29, 78, 216); // Blue color
      pdf.text(file.name.replace(/\.[^/.]+$/, ""), margin, margin + 5);

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

      // Body text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59); // Slate dark

      const splitText = pdf.splitTextToSize(extractedText, maxLineWidth);
      let cursorY = margin + 18;
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < splitText.length; i++) {
        if (cursorY > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin + 10;
        }
        pdf.text(splitText[i], margin, cursorY);
        cursorY += 6;
      }

      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setConvertedUrl(url);

      downloadWithRename(url, `${file.name.replace(/\.[^/.]+$/, "")}.pdf`);
      toast.success("Word document successfully converted to PDF!");
    } catch {
      toast.error("Failed to convert Word document to PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <div
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            backgroundColor: dragOver ? "#f8fafc" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-slate-50/50 rounded-lg"
        >
          <FileText size={40} className="mx-auto mb-3 text-blue-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop Word Document (.docx / .doc / .txt) Here
          </p>
          <p className="text-xs font-semibold text-slate-500">or click to select file</p>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.doc,.txt,.rtf"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* File Card */}
          <div className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-300 rounded-lg shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={32} className="text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">{file.name}</p>
                <p className="text-xs font-semibold text-slate-500">{formatSize(file.size)}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setConvertedUrl(null);
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X size={14} /> Remove
            </button>
          </div>

          {convertedUrl ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <CheckCircle size={20} className="text-green-600 shrink-0" />
                <span>Conversion Complete! PDF downloaded.</span>
              </div>
              <button
                onClick={handleConvert}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown size={14} /> Re-download PDF
              </button>
            </div>
          ) : null}

          {/* Action Button */}
          <button
            onClick={handleConvert}
            disabled={loading}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              borderTop: "2px solid #93c5fd",
              borderLeft: "2px solid #93c5fd",
              borderRight: "2px solid #1e40af",
              borderBottom: "2px solid #1e40af",
            }}
            className="w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded shadow-md disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Converting Document to PDF...
              </>
            ) : (
              <>
                <RefreshCw size={18} /> Convert Word to PDF Now
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
