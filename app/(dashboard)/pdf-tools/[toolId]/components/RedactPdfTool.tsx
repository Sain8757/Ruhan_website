"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { FileText, Loader2, Eraser, Trash2, ArrowLeft, ArrowRight, MousePointer2, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

declare const pdfjsLib: any;

async function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("No browser");
    if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve((window as any).pdfjsLib);
    };
    script.onerror = () => reject("Failed to load PDF.js");
    document.head.appendChild(script);
  });
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;
}

const REDACT_COLORS = [
  { label: "⬛ Black", value: "#000000" },
  { label: "🟦 Navy", value: "#1e3a5f" },
  { label: "🟥 Red", value: "#b91c1c" },
  { label: "⬜ White (Cover)", value: "#ffffff" },
];

export default function RedactPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [redactColor, setRedactColor] = useState("#000000");

  // Store redactions per page
  const [redactions, setRedactions] = useState<{ [key: number]: Rect[] }>({});

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setPdfFile(incoming);
    setPageNum(1);
    setRedactions({});
  };

  // Render PDF Page
  useEffect(() => {
    if (pdfFile && canvasRef.current && containerRef.current) {
      let renderTask: any = null;
      let isSubscribed = true;

      const renderPage = async () => {
        try {
          const pdfjs = await loadPdfJs();
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          if (!isSubscribed) return;

          setPdfTotalPages(pdf.numPages);
          const validPageNum = Math.min(Math.max(1, pageNum), pdf.numPages);

          const page = await pdf.getPage(validPageNum);
          if (!isSubscribed) return;

          const containerWidth = containerRef.current?.clientWidth || 800;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / unscaledViewport.width;
          setPdfScale(scale);

          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext("2d");
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          renderTask = page.render({ canvasContext: context, viewport });
          await renderTask.promise;
        } catch (error) {
          console.error("Error rendering PDF:", error);
        }
      };

      renderPage();

      return () => {
        isSubscribed = false;
        if (renderTask) renderTask.cancel();
      };
    }
  }, [pdfFile, pageNum]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      w: Math.abs(x - startPos.x),
      h: Math.abs(y - startPos.y),
      color: redactColor,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing && currentRect && currentRect.w > 5 && currentRect.h > 5) {
      setRedactions((prev) => ({
        ...prev,
        [pageNum]: [...(prev[pageNum] || []), currentRect],
      }));
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const clearCurrentPage = () => {
    setRedactions((prev) => ({ ...prev, [pageNum]: [] }));
    toast.success(`Cleared all redactions on page ${pageNum}`);
  };

  const clearAllPages = () => {
    setRedactions({});
    toast.success("All redactions cleared!");
  };

  const undoLast = () => {
    setRedactions((prev) => {
      const current = prev[pageNum] || [];
      if (current.length === 0) { toast.error("No redactions to undo"); return prev; }
      return { ...prev, [pageNum]: current.slice(0, -1) };
    });
  };

  const totalRedactions = Object.values(redactions).reduce((sum, rects) => sum + rects.length, 0);

  const handleApplyRedactions = async () => {
    if (!pdfFile) return;
    if (totalRedactions === 0) { toast.error("Please draw at least one redaction box first"); return; }

    setLoading(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      Object.entries(redactions).forEach(([pageNumStr, rects]) => {
        const pageIdx = parseInt(pageNumStr) - 1;
        if (pageIdx >= 0 && pageIdx < pages.length) {
          const page = pages[pageIdx];
          const { height } = page.getSize();

          rects.forEach((r) => {
            const pdfX = r.x / pdfScale;
            const pdfW = r.w / pdfScale;
            const pdfH = r.h / pdfScale;
            const pdfY = height - r.y / pdfScale - pdfH;

            // Parse hex color
            const hex = r.color.replace("#", "");
            const rVal = parseInt(hex.slice(0, 2), 16) / 255;
            const gVal = parseInt(hex.slice(2, 4), 16) / 255;
            const bVal = parseInt(hex.slice(4, 6), 16) / 255;

            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(rVal, gVal, bVal),
            });
          });
        }
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Redacted_${pdfFile.name}`);
      toast.success(`${totalRedactions} redaction(s) applied and PDF downloaded!`);
    } catch {
      toast.error("Failed to apply redactions.");
    } finally {
      setLoading(false);
    }
  };

  const currentPageRedactions = redactions[pageNum] || [];

  return (
    <div className="space-y-5">
      {!pdfFile ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => pdfInputRef.current?.click()}
          style={{
            backgroundColor: dragOver ? "#fef2f2" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-red-50/50 rounded-lg"
        >
          <Eraser size={40} className="mx-auto mb-3 text-red-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>Drop PDF to Redact Sensitive Content</p>
          <p className="text-xs font-semibold text-slate-500">Draw boxes over text/images to permanently black out sensitive info</p>
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Toolbar */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between flex-wrap gap-3">
            {/* File Name */}
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={20} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-slate-900 truncate max-w-[150px]">{pdfFile.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{formatSize(pdfFile.size)} • {pdfTotalPages} pages</p>
              </div>
              <button onClick={() => { setPdfFile(null); setRedactions({}); }} className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold cursor-pointer shrink-0">
                <X size={12} />
              </button>
            </div>

            {/* Redact Color Picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-slate-600">COLOR:</span>
              {REDACT_COLORS.map((c) => (
                <button key={c.value} onClick={() => setRedactColor(c.value)}
                  title={c.label}
                  style={{ backgroundColor: c.value, borderColor: redactColor === c.value ? "#6366f1" : "#cbd5e1" }}
                  className={`w-6 h-6 rounded border-2 cursor-pointer transition-all ${redactColor === c.value ? "scale-110 ring-2 ring-indigo-400" : ""} ${c.value === "#ffffff" ? "ring-1 ring-slate-300" : ""}`}
                />
              ))}
            </div>

            {/* Page Navigator */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <button disabled={pageNum <= 1} onClick={() => setPageNum((p) => Math.max(1, p - 1))} className="p-1 bg-white hover:bg-slate-200 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"><ArrowLeft size={13} /></button>
              <span>Page {pageNum}/{pdfTotalPages}</span>
              <button disabled={pageNum >= pdfTotalPages} onClick={() => setPageNum((p) => Math.min(pdfTotalPages, p + 1))} className="p-1 bg-white hover:bg-slate-200 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"><ArrowRight size={13} /></button>
            </div>

            {/* Helper Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={undoLast} className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 cursor-pointer">↩ Undo</button>
              <button onClick={clearCurrentPage} className="px-2 py-1 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 cursor-pointer flex items-center gap-1">
                <Trash2 size={10} /> Clear Page
              </button>
              <button onClick={clearAllPages} className="px-2 py-1 text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-800 rounded border border-red-300 cursor-pointer">Clear All</button>
            </div>
          </div>

          {/* Instruction Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 font-semibold flex items-center gap-2">
            <MousePointer2 size={14} className="shrink-0" />
            <span>Click and drag on the page below to draw redaction boxes. Choose a color above. <strong>{totalRedactions}</strong> total box(es) drawn across all pages.</span>
          </div>

          {/* PDF Canvas */}
          <div className="flex justify-center bg-slate-200 border border-slate-400 rounded-lg p-3 shadow-inner overflow-x-auto min-h-[400px]">
            <div
              ref={containerRef}
              className="relative border border-slate-400 bg-white shadow-lg overflow-hidden select-none touch-none max-w-full"
              style={{ width: "100%", maxWidth: "800px", cursor: "crosshair" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <canvas ref={canvasRef} className="block mx-auto" />

              {/* Draw stored redactions for current page */}
              {currentPageRedactions.map((rect, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.w,
                    height: rect.h,
                    backgroundColor: rect.color,
                    pointerEvents: "none",
                    border: rect.color === "#ffffff" ? "1px dashed #94a3b8" : "none",
                  }}
                />
              ))}

              {/* Active drawing rectangle */}
              {isDrawing && currentRect && (
                <div
                  className="absolute border-2 border-dashed border-white"
                  style={{
                    left: currentRect.x,
                    top: currentRect.y,
                    width: currentRect.w,
                    height: currentRect.h,
                    backgroundColor: currentRect.color + "cc",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>

          {/* Apply Redactions Button */}
          <button
            onClick={handleApplyRedactions}
            disabled={loading || totalRedactions === 0}
            style={{
              backgroundColor: "#1e293b",
              color: "#ffffff",
              borderTop: "2px solid #94a3b8",
              borderLeft: "2px solid #94a3b8",
              borderRight: "2px solid #020617",
              borderBottom: "2px solid #020617",
            }}
            className="w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Applying Redactions...</> : <><Eraser size={18} /> Apply {totalRedactions} Redaction(s) & Download PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
