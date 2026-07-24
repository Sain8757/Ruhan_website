"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  FileText, Loader2, Eraser, Trash2, ArrowLeft, ArrowRight,
  MousePointer2, X, Search, ZoomIn, ZoomOut, RotateCcw,
  Layers, Undo, Filter, CheckSquare, Square, Type, AlertTriangle,
} from "lucide-react";
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
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve((window as any).pdfjsLib);
    };
    script.onerror = () => reject("Failed to load PDF.js");
    document.head.appendChild(script);
  });
}

function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Types ────────────────────────────────────────────────────────────────────

interface RedactRect {
  id: string;
  pageNum: number;
  x: number;
  y: number;
  w: number;
  h: number;
  fillColor: string;
  overlayText: string; // "REDACTED", "CONFIDENTIAL", "", custom
  overlayColor: string;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

type ToolMode = "draw" | "search" | "pattern";

// ─── Preset Patterns ─────────────────────────────────────────────────────────

const PATTERNS: { label: string; icon: string; regex: RegExp }[] = [
  { label: "Email Address", icon: "📧", regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  { label: "Phone Number", icon: "📞", regex: /(\+91[\-\s]?)?[6-9]\d{9}|(\+\d{1,3}[\-\s]?)?\(?\d{3}\)?[\-\s]?\d{3}[\-\s]?\d{4}/g },
  { label: "Aadhaar Number", icon: "🆔", regex: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g },
  { label: "PAN Number", icon: "💳", regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
  { label: "Date (DD/MM/YYYY)", icon: "📅", regex: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g },
  { label: "Credit Card", icon: "💰", regex: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g },
  { label: "IPv4 Address", icon: "🌐", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { label: "IFSC Code", icon: "🏦", regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
];

const FILL_COLORS = [
  { label: "Black", value: "#000000", style: "bg-black" },
  { label: "Navy", value: "#1e3a5f", style: "bg-blue-900" },
  { label: "Red", value: "#991b1b", style: "bg-red-800" },
  { label: "White", value: "#ffffff", style: "bg-white border border-slate-400" },
  { label: "Gray", value: "#374151", style: "bg-gray-700" },
];

const OVERLAY_TEXTS = [
  { label: "None", value: "" },
  { label: "REDACTED", value: "REDACTED" },
  { label: "CONFIDENTIAL", value: "CONFIDENTIAL" },
  { label: "[REDACTED]", value: "[REDACTED]" },
  { label: "TOP SECRET", value: "TOP SECRET" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function RedactPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragFileOver, setDragFileOver] = useState(false);
  const [pageNum, setPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  // All redaction marks (all pages)
  const [redactions, setRedactions] = useState<RedactRect[]>([]);

  // Drawing state
  const [toolMode, setToolMode] = useState<ToolMode>("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Redaction styling
  const [fillColor, setFillColor] = useState("#000000");
  const [overlayText, setOverlayText] = useState("");
  const [customOverlayText, setCustomOverlayText] = useState("");
  const [overlayTextColor, setOverlayTextColor] = useState("#ffffff");
  const [applyAllPages, setApplyAllPages] = useState(false);

  // Search mode
  const [searchQuery, setSearchQuery] = useState("");
  const [pageTextItems, setPageTextItems] = useState<TextItem[]>([]);
  const [matchedItems, setMatchedItems] = useState<TextItem[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());
  const [loadingText, setLoadingText] = useState(false);

  // Pattern mode
  const [activePattern, setActivePattern] = useState<number | null>(null);
  const [patternMatches, setPatternMatches] = useState<TextItem[]>([]);
  const [allPageText, setAllPageText] = useState<string>("");

  // Undo
  const [undoStack, setUndoStack] = useState<RedactRect[][]>([]);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Load PDF ──────────────────────────────────────────────────────────────

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setPdfFile(incoming);
    setPageNum(1);
    setRedactions([]);
    setUndoStack([]);
    setPageTextItems([]);
    setMatchedItems([]);
    setPatternMatches([]);
    setSearchQuery("");
  };

  // ─── Render PDF Page + extract text ──────────────────────────────────────

  const renderPage = useCallback(async (pageIndex: number) => {
    if (!pdfFile || !canvasRef.current || !containerRef.current) return;
    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      setPdfTotalPages(pdf.numPages);
      const validPage = Math.min(Math.max(1, pageIndex), pdf.numPages);
      const page = await pdf.getPage(validPage);

      const containerWidth = containerRef.current.clientWidth || 800;
      const unscaled = page.getViewport({ scale: 1 });
      const autoScale = containerWidth / unscaled.width;
      const scale = autoScale * zoom;
      setPdfScale(scale);

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;

      // Extract text items with canvas positions
      setLoadingText(true);
      const textContent = await page.getTextContent();
      const items: TextItem[] = [];
      let fullText = "";

      for (const item of textContent.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const tx = pdfjs.Util.transform(viewport.transform, item.transform);
        const canvasX = tx[4];
        const canvasBaseY = tx[5];
        const fontH = Math.abs(tx[3]) || Math.abs(item.transform[3]) * scale;
        const textW = item.width * scale;
        items.push({
          str: item.str,
          x: canvasX,
          y: canvasBaseY - fontH,
          w: textW,
          h: fontH + 2,
        });
        fullText += item.str + " ";
      }

      setPageTextItems(items);
      setAllPageText(fullText);
      setMatchedItems([]);
      setSelectedMatches(new Set());
      setPatternMatches([]);
      setLoadingText(false);
    } catch (err) {
      console.error("Render error:", err);
      setLoadingText(false);
    }
  }, [pdfFile, zoom]);

  useEffect(() => {
    renderPage(pageNum);
  }, [pdfFile, pageNum, zoom, renderPage]);

  // ─── Search ────────────────────────────────────────────────────────────────

  const handleSearch = () => {
    if (!searchQuery.trim()) { toast.error("Enter text to search"); return; }
    const q = searchQuery.toLowerCase().trim();
    const matches = pageTextItems.filter(item => item.str.toLowerCase().includes(q));
    if (matches.length === 0) {
      toast.error(`No matches found for "${searchQuery}" on this page`);
      setMatchedItems([]);
      return;
    }
    setMatchedItems(matches);
    setSelectedMatches(new Set(Array.from({ length: matches.length }, (_, i) => i)));
    toast.success(`${matches.length} match(es) found — select/deselect below`);
  };

  // ─── Pattern Search ────────────────────────────────────────────────────────

  const handlePatternSearch = (patternIdx: number) => {
    setActivePattern(patternIdx);
    const pattern = PATTERNS[patternIdx];
    const regex = new RegExp(pattern.regex.source, "gi");
    const matches = pageTextItems.filter(item => {
      regex.lastIndex = 0;
      return regex.test(item.str);
    });
    if (matches.length === 0) {
      toast.error(`No ${pattern.label} found on this page`);
      setPatternMatches([]);
      return;
    }
    setPatternMatches(matches);
    toast.success(`Found ${matches.length} ${pattern.label} instance(s) on page ${pageNum}`);
  };

  // ─── Redact from text items ─────────────────────────────────────────────

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), [...redactions]]);
  }, [redactions]);

  const addRedactionFromItems = (items: TextItem[], selectedIndices?: Set<number>) => {
    const toRedact = selectedIndices
      ? items.filter((_, i) => selectedIndices.has(i))
      : items;

    if (toRedact.length === 0) { toast.error("No items selected to redact"); return; }
    pushUndo();

    const effectiveOverlay = overlayText || customOverlayText;
    const newRects: RedactRect[] = toRedact.map(item => ({
      id: uid(),
      pageNum,
      x: item.x - 2,
      y: item.y - 2,
      w: item.w + 4,
      h: item.h + 4,
      fillColor,
      overlayText: effectiveOverlay,
      overlayColor: overlayTextColor,
    }));
    setRedactions(prev => [...prev, ...newRects]);
    toast.success(`${newRects.length} item(s) marked for redaction!`);
    setMatchedItems([]);
    setPatternMatches([]);
    setSelectedMatches(new Set());
    setSearchQuery("");
  };

  // ─── Draw Handlers ─────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent) => {
    if (toolMode !== "draw") return;
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
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing && currentRect && currentRect.w > 5 && currentRect.h > 5) {
      pushUndo();
      const effectiveOverlay = overlayText || customOverlayText;
      const pagesToApply = applyAllPages
        ? Array.from({ length: pdfTotalPages }, (_, i) => i + 1)
        : [pageNum];

      const newRects: RedactRect[] = pagesToApply.map(p => ({
        id: uid(),
        pageNum: p,
        x: currentRect.x,
        y: currentRect.y,
        w: currentRect.w,
        h: currentRect.h,
        fillColor,
        overlayText: effectiveOverlay,
        overlayColor: overlayTextColor,
      }));
      setRedactions(prev => [...prev, ...newRects]);
      if (applyAllPages) toast.success(`Redaction marked on all ${pdfTotalPages} pages!`);
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleUndo = () => {
    if (undoStack.length === 0) { toast.error("Nothing to undo"); return; }
    setRedactions(undoStack[undoStack.length - 1]);
    setUndoStack(prev => prev.slice(0, -1));
    toast.success("Undo!");
  };

  const clearPage = () => {
    pushUndo();
    setRedactions(prev => prev.filter(r => r.pageNum !== pageNum));
    toast.success(`Cleared all redactions on page ${pageNum}`);
  };

  const clearAll = () => {
    pushUndo();
    setRedactions([]);
    toast.success("All redactions cleared");
  };

  const deleteRect = (id: string) => {
    pushUndo();
    setRedactions(prev => prev.filter(r => r.id !== id));
  };

  // ─── Apply / Export ────────────────────────────────────────────────────────

  const handleApply = async () => {
    if (!pdfFile) return;
    const total = redactions.length;
    if (total === 0) { toast.error("Draw at least one redaction mark first"); return; }
    setLoading(true);

    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const r of redactions) {
        const pageIdx = r.pageNum - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const { height } = page.getSize();

        const pdfX = r.x / pdfScale;
        const pdfW = r.w / pdfScale;
        const pdfH = r.h / pdfScale;
        // Convert canvas y (top-down) to PDF y (bottom-up)
        const pdfY = height - r.y / pdfScale - pdfH;

        // Parse fill color
        const hex = r.fillColor.replace("#", "");
        const fr = parseInt(hex.slice(0, 2), 16) / 255;
        const fg = parseInt(hex.slice(2, 4), 16) / 255;
        const fb = parseInt(hex.slice(4, 6), 16) / 255;

        // Draw fill rectangle
        page.drawRectangle({
          x: Math.max(0, pdfX),
          y: Math.max(0, pdfY),
          width: pdfW,
          height: pdfH,
          color: rgb(fr, fg, fb),
          borderWidth: 0,
        });

        // Draw overlay text (centered in box)
        if (r.overlayText) {
          const ohex = r.overlayColor.replace("#", "");
          const or2 = parseInt(ohex.slice(0, 2), 16) / 255;
          const og = parseInt(ohex.slice(2, 4), 16) / 255;
          const ob = parseInt(ohex.slice(4, 6), 16) / 255;
          const fontSize = Math.min(10, Math.max(5, pdfH * 0.55));
          const textWidth = font.widthOfTextAtSize(r.overlayText, fontSize);
          const textX = pdfX + (pdfW - textWidth) / 2;
          const textY = pdfY + (pdfH - fontSize) / 2;
          if (textX >= 0 && textY >= 0) {
            page.drawText(r.overlayText, {
              x: textX,
              y: textY,
              size: fontSize,
              font,
              color: rgb(or2, og, ob),
            });
          }
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Redacted_${pdfFile.name}`);
      toast.success(`✅ ${total} redaction(s) applied and PDF downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply redactions");
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────

  const currentPageRects = redactions.filter(r => r.pageNum === pageNum);
  const totalRedactions = redactions.length;
  const effectiveOverlay = overlayText || customOverlayText;

  // Page counts for navigator
  const pageCount = (p: number) => redactions.filter(r => r.pageNum === p).length;

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {!pdfFile ? (
        /* ── Drop Zone ── */
        <div
          onDrop={(e) => { e.preventDefault(); setDragFileOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragFileOver(true); }}
          onDragLeave={() => setDragFileOver(false)}
          onClick={() => pdfInputRef.current?.click()}
          style={{
            backgroundColor: dragFileOver ? "#fef2f2" : "#ffffff",
            borderTop: "2px solid #808080", borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer rounded-lg hover:bg-red-50/50 transition-all"
        >
          <Eraser size={44} className="mx-auto mb-3 text-red-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here — Professional Redaction Suite
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Draw • Search & Redact • Pattern Redact (Email, Phone, Aadhaar, PAN…) • Overlay Text
          </p>
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">

          {/* ── File Bar ── */}
          <div className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-300 rounded-lg shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={22} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-slate-900 truncate max-w-[200px]">{pdfFile.name}</p>
                <p className="text-[10px] text-slate-500">{formatSize(pdfFile.size)} • {pdfTotalPages} pages • <strong className="text-red-700">{totalRedactions} redaction mark(s)</strong></p>
              </div>
              <button onClick={() => { setPdfFile(null); setRedactions([]); }}
                className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-200 cursor-pointer shrink-0"><X size={12} /></button>
            </div>

            {/* Apply Button */}
            <button onClick={handleApply} disabled={loading || totalRedactions === 0}
              style={{ backgroundColor: "#1e1b4b", color: "#fff", borderTop: "2px solid #a5b4fc", borderLeft: "2px solid #a5b4fc", borderRight: "2px solid #0f0a2e", borderBottom: "2px solid #0f0a2e" }}
              className="px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 rounded shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
              Apply {totalRedactions} Redaction(s) & Download
            </button>
          </div>

          {/* ── Mode Selector Tabs ── */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-lg p-1">
            {[
              { id: "draw" as ToolMode, icon: <MousePointer2 size={13} />, label: "✏️ Draw Redact" },
              { id: "search" as ToolMode, icon: <Search size={13} />, label: "🔍 Search & Redact" },
              { id: "pattern" as ToolMode, icon: <Filter size={13} />, label: "⚡ Pattern Redact" },
            ].map(m => (
              <button key={m.id} onClick={() => setToolMode(m.id)}
                style={toolMode === m.id ? { backgroundColor: "#000080", color: "#fff" } : {}}
                className={`flex-1 py-1.5 text-[10px] font-extrabold rounded flex items-center justify-center gap-1 cursor-pointer transition-all ${toolMode === m.id ? "shadow-inner" : "text-slate-700 hover:bg-slate-200"}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* ── Styling Options Bar ── */}
          <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap items-center gap-3">
            {/* Fill Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-600">FILL:</span>
              {FILL_COLORS.map(c => (
                <button key={c.value} onClick={() => setFillColor(c.value)} title={c.label}
                  style={{ backgroundColor: c.value, outline: fillColor === c.value ? "2px solid #6366f1" : "none", outlineOffset: "2px" }}
                  className={`w-5 h-5 rounded border border-slate-400 cursor-pointer transition-all ${fillColor === c.value ? "scale-110" : ""}`} />
              ))}
            </div>

            {/* Overlay Text */}
            <div className="flex items-center gap-1.5">
              <Type size={11} className="text-slate-600 shrink-0" />
              <span className="text-[10px] font-extrabold text-slate-600">LABEL:</span>
              <select value={overlayText} onChange={(e) => setOverlayText(e.target.value)}
                className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer bg-white">
                {OVERLAY_TEXTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Custom Label */}
            <input type="text" placeholder="Custom label..."
              value={customOverlayText} onChange={(e) => { setCustomOverlayText(e.target.value); setOverlayText(""); }}
              className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5 w-28 bg-white" />

            {/* Overlay text color */}
            {effectiveOverlay && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-slate-600">TEXT:</span>
                <input type="color" value={overlayTextColor} onChange={(e) => setOverlayTextColor(e.target.value)}
                  className="w-5 h-5 p-0 border-0 cursor-pointer rounded" title="Overlay text color" />
              </div>
            )}

            {/* Apply to all pages (Draw mode only) */}
            {toolMode === "draw" && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={applyAllPages} onChange={(e) => setApplyAllPages(e.target.checked)} className="accent-red-600 w-3.5 h-3.5" />
                <span className="text-[10px] font-extrabold text-slate-700">Apply to All Pages</span>
              </label>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={handleUndo} disabled={undoStack.length === 0}
                className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-300 rounded hover:bg-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-40">
                <Undo size={10} /> Undo
              </button>
              <button onClick={clearPage}
                className="px-2 py-1 text-[10px] font-bold bg-red-50 border border-red-200 rounded hover:bg-red-100 text-red-700 flex items-center gap-1 cursor-pointer">
                <Trash2 size={10} /> Page
              </button>
              <button onClick={clearAll}
                className="px-2 py-1 text-[10px] font-bold bg-red-100 border border-red-300 rounded hover:bg-red-200 text-red-800 flex items-center gap-1 cursor-pointer">
                <Trash2 size={10} /> All
              </button>
            </div>
          </div>

          {/* ── Search Mode Panel ── */}
          {toolMode === "search" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <p className="text-xs font-extrabold text-blue-900 flex items-center gap-1"><Search size={13} /> Search Text on Page {pageNum} to Redact</p>
              <div className="flex gap-2">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Type text to find and redact..."
                  className="flex-1 px-3 py-1.5 text-xs font-bold border border-blue-300 rounded focus:outline-none focus:border-blue-600 bg-white" />
                <button onClick={handleSearch}
                  className="px-3 py-1.5 text-xs font-extrabold bg-blue-700 text-white rounded hover:bg-blue-800 cursor-pointer flex items-center gap-1">
                  <Search size={12} /> Search
                </button>
              </div>

              {matchedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-800">{matchedItems.length} match(es) found — select to redact:</span>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedMatches(new Set(Array.from({ length: matchedItems.length }, (_, i) => i)))}
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded cursor-pointer hover:bg-blue-200 flex items-center gap-0.5">
                        <CheckSquare size={9} /> All
                      </button>
                      <button onClick={() => setSelectedMatches(new Set())}
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-white text-slate-700 border border-slate-300 rounded cursor-pointer hover:bg-slate-100 flex items-center gap-0.5">
                        <Square size={9} /> None
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {matchedItems.map((item, idx) => (
                      <button key={idx} onClick={() => setSelectedMatches(prev => {
                        const n = new Set(prev);
                        n.has(idx) ? n.delete(idx) : n.add(idx);
                        return n;
                      })}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer transition-all ${selectedMatches.has(idx) ? "bg-red-600 text-white border-red-700" : "bg-white text-slate-700 border-slate-300 hover:border-red-400"}`}>
                        {selectedMatches.has(idx) ? "✓ " : ""}{item.str.slice(0, 30)}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => addRedactionFromItems(matchedItems, selectedMatches)}
                    disabled={selectedMatches.size === 0}
                    className="w-full py-2 text-xs font-extrabold bg-red-700 text-white rounded hover:bg-red-800 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
                    <Eraser size={13} /> Redact {selectedMatches.size} Selected Match(es)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Pattern Mode Panel ── */}
          {toolMode === "pattern" && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
              <p className="text-xs font-extrabold text-purple-900 flex items-center gap-1"><Filter size={13} /> Auto-Detect & Redact Patterns on Page {pageNum}</p>
              {loadingText ? (
                <div className="flex items-center gap-2 text-xs text-purple-700"><Loader2 size={14} className="animate-spin" /> Extracting text from page…</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PATTERNS.map((p, idx) => (
                      <button key={idx} onClick={() => handlePatternSearch(idx)}
                        style={activePattern === idx ? { backgroundColor: "#4c1d95", color: "#fff" } : {}}
                        className={`px-2 py-1.5 text-[10px] font-extrabold rounded border cursor-pointer transition-all ${activePattern === idx ? "border-purple-900" : "bg-white border-purple-200 text-purple-800 hover:bg-purple-100"}`}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>

                  {patternMatches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {patternMatches.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 rounded border border-purple-300">
                            {item.str.slice(0, 40)}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => addRedactionFromItems(patternMatches)}
                        className="w-full py-2 text-xs font-extrabold bg-purple-700 text-white rounded hover:bg-purple-800 cursor-pointer flex items-center justify-center gap-1">
                        <Eraser size={13} /> Redact All {patternMatches.length} {activePattern !== null ? PATTERNS[activePattern].label : "Pattern"} Match(es)
                      </button>
                    </div>
                  )}

                  {patternMatches.length === 0 && activePattern !== null && (
                    <p className="text-[10px] font-semibold text-purple-700 flex items-center gap-1">
                      <AlertTriangle size={11} /> No matches found on this page. Try another page or pattern.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Draw Mode Hint ── */}
          {toolMode === "draw" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-800 font-semibold flex items-center gap-2">
              <MousePointer2 size={13} className="shrink-0" />
              Click and drag on the page to draw redaction boxes. Styling options above apply to each drawn box.
              {applyAllPages && <span className="font-extrabold text-red-700 ml-1">⚠️ Will apply to ALL {pdfTotalPages} pages</span>}
            </div>
          )}

          {/* ── Page Navigator + Zoom ── */}
          <div className="flex items-center justify-between gap-3">
            {/* Page Nav */}
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
              <button disabled={pageNum <= 1} onClick={() => setPageNum(p => p - 1)}
                className="p-1 bg-white border border-slate-300 rounded disabled:opacity-40 cursor-pointer"><ArrowLeft size={13} /></button>
              <div className="flex gap-1 items-center">
                {Array.from({ length: Math.min(pdfTotalPages, 9) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPageNum(p)}
                    className={`w-7 h-7 rounded text-[10px] font-extrabold border relative cursor-pointer transition-all ${pageNum === p ? "bg-slate-800 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"}`}>
                    {p}
                    {pageCount(p) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[7px] font-black flex items-center justify-center">{pageCount(p)}</span>
                    )}
                  </button>
                ))}
                {pdfTotalPages > 9 && <span className="text-slate-500 text-[10px]">… pg {pageNum}/{pdfTotalPages}</span>}
              </div>
              <button disabled={pageNum >= pdfTotalPages} onClick={() => setPageNum(p => p + 1)}
                className="p-1 bg-white border border-slate-300 rounded disabled:opacity-40 cursor-pointer"><ArrowRight size={13} /></button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.2).toFixed(1)))}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"><ZoomOut size={12} /></button>
              <span className="text-[10px] font-extrabold text-slate-700 w-9 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3.0, +(z + 0.2).toFixed(1)))}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"><ZoomIn size={12} /></button>
              <button onClick={() => setZoom(1)} title="Reset zoom"
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"><RotateCcw size={11} /></button>
            </div>
          </div>

          {/* ── PDF Canvas with Overlays ── */}
          <div className="bg-slate-300 border border-slate-400 rounded-lg shadow-inner overflow-auto" style={{ maxHeight: "70vh" }}>
            <div className="flex justify-center p-3">
              <div
                ref={containerRef}
                className="relative border border-slate-500 bg-white shadow-xl overflow-hidden select-none touch-none"
                style={{
                  width: "100%", maxWidth: 900,
                  cursor: toolMode === "draw" ? "crosshair" : "default",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <canvas ref={canvasRef} className="block" />

                {/* Existing redaction marks on current page */}
                {currentPageRects.map((r) => (
                  <div key={r.id} className="absolute group"
                    style={{ left: r.x, top: r.y, width: r.w, height: r.h, backgroundColor: r.fillColor, border: "1px solid rgba(99,102,241,0.5)", zIndex: 10 }}>
                    {/* Overlay text */}
                    {r.overlayText && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span style={{
                          color: r.overlayColor,
                          fontSize: Math.min(12, Math.max(6, r.h * 0.45)),
                          fontFamily: "Arial Black, Helvetica, sans-serif",
                          fontWeight: 900,
                          letterSpacing: "0.05em",
                          userSelect: "none",
                          textAlign: "center",
                          lineHeight: 1,
                        }}>
                          {r.overlayText}
                        </span>
                      </div>
                    )}
                    {/* Delete button on hover */}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); deleteRect(r.id); }}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-red-500 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-20 text-[10px] font-black">
                      ×
                    </button>
                    {/* Size indicator */}
                    <div className="absolute -bottom-5 left-0 text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {Math.round(r.w)}×{Math.round(r.h)}
                    </div>
                  </div>
                ))}

                {/* Text search match highlights (orange preview) */}
                {toolMode === "search" && matchedItems.map((item, idx) => (
                  <div key={idx}
                    onClick={() => setSelectedMatches(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
                    className="absolute border-2 cursor-pointer transition-all"
                    style={{
                      left: item.x - 2, top: item.y - 2, width: item.w + 4, height: item.h + 4,
                      backgroundColor: selectedMatches.has(idx) ? "rgba(220,38,38,0.4)" : "rgba(251,146,60,0.3)",
                      borderColor: selectedMatches.has(idx) ? "#dc2626" : "#f97316",
                      zIndex: 15,
                    }}
                    title={`Click to ${selectedMatches.has(idx) ? "deselect" : "select"}: "${item.str}"`}
                  />
                ))}

                {/* Pattern match highlights (purple preview) */}
                {toolMode === "pattern" && patternMatches.map((item, idx) => (
                  <div key={idx} className="absolute border-2 pointer-events-none"
                    style={{
                      left: item.x - 2, top: item.y - 2, width: item.w + 4, height: item.h + 4,
                      backgroundColor: "rgba(147,51,234,0.35)",
                      borderColor: "#9333ea",
                      zIndex: 15,
                    }} />
                ))}

                {/* Active drawing rectangle preview */}
                {isDrawing && currentRect && (
                  <div className="absolute pointer-events-none"
                    style={{
                      left: currentRect.x, top: currentRect.y,
                      width: currentRect.w, height: currentRect.h,
                      backgroundColor: fillColor + "cc",
                      border: "2px dashed white",
                      zIndex: 20,
                    }}>
                    {effectiveOverlay && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ color: overlayTextColor, fontSize: Math.min(12, Math.max(6, currentRect.h * 0.45)), fontWeight: 900 }}>
                          {effectiveOverlay}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Redaction Summary Panel ── */}
          {totalRedactions > 0 && (
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <p className="text-[10px] font-extrabold text-slate-700 mb-2 flex items-center gap-1">
                <Layers size={11} /> Redaction Marks ({totalRedactions} total across {new Set(redactions.map(r => r.pageNum)).size} page(s)):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {redactions.map((r, i) => (
                  <button key={r.id}
                    onClick={() => { setPageNum(r.pageNum); }}
                    className="px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer flex items-center gap-1 bg-slate-100 text-slate-700 border-slate-300 hover:bg-red-50 hover:border-red-300">
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, backgroundColor: r.fillColor, border: "1px solid #94a3b8" }} />
                    #{i + 1} p{r.pageNum} {r.overlayText && `"${r.overlayText}"`}
                    <span onClick={(e) => { e.stopPropagation(); deleteRect(r.id); }} className="text-red-500 hover:text-red-700 ml-1">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
