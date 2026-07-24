"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  FileText, Loader2, Edit, Trash2, ArrowLeft, ArrowRight,
  Type, Image as ImageIcon, Square, X, Bold, Italic,
  Underline, Highlighter, AlignLeft, AlignCenter, AlignRight,
  Copy, Layers, ChevronUp, ChevronDown, Download, MousePointer,
  ZoomIn, ZoomOut, Undo, RotateCcw,
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

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ─── Types ──────────────────────────────────────────────────────────────────

type FontFamily = "Helvetica" | "Times-Roman" | "Courier" | "Dancing Script, cursive" | "Georgia, serif";
type Align = "left" | "center" | "right";
type HighlightColor = "none" | "#FFFF00" | "#AAFFAA" | "#FFB3BA" | "#B3D9FF";

interface TextOverlay {
  id: string;
  pageNum: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily: FontFamily;
  align: Align;
  highlight: HighlightColor;
  opacity: number;
}

interface ImageOverlay {
  id: string;
  pageNum: number;
  file: File;
  previewUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface WhiteoutOverlay {
  id: string;
  pageNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // can be any cover color
  label?: string; // "whiteout" | "blackout" | "custom"
}

const FONT_FAMILIES: { label: string; value: FontFamily }[] = [
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times Roman", value: "Times-Roman" },
  { label: "Courier", value: "Courier" },
  { label: "Cursive", value: "Dancing Script, cursive" },
  { label: "Georgia", value: "Georgia, serif" },
];

const HIGHLIGHT_OPTIONS: { label: string; value: HighlightColor; style: string }[] = [
  { label: "None", value: "none", style: "bg-transparent border border-slate-300" },
  { label: "Yellow", value: "#FFFF00", style: "bg-yellow-300" },
  { label: "Green", value: "#AAFFAA", style: "bg-green-300" },
  { label: "Pink", value: "#FFB3BA", style: "bg-pink-300" },
  { label: "Blue", value: "#B3D9FF", style: "bg-blue-300" },
];

const COVER_COLORS = [
  { label: "⬜ White", value: "#ffffff" },
  { label: "⬛ Black", value: "#000000" },
  { label: "🟦 Navy", value: "#000080" },
  { label: "🟥 Red", value: "#b91c1c" },
  { label: "🟧 Orange", value: "#f97316" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function EditPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragFileOver, setDragFileOver] = useState(false);

  const [pageNum, setPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1);
  const [zoom, setZoom] = useState(1.0); // User-controlled zoom

  // Layer Overlays
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [images, setImages] = useState<ImageOverlay[]>([]);
  const [whiteouts, setWhiteouts] = useState<WhiteoutOverlay[]>([]);

  // Undo stack (stores snapshots of all overlays)
  type Snapshot = { texts: TextOverlay[]; images: ImageOverlay[]; whiteouts: WhiteoutOverlay[] };
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);

  // Selected/Active element
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"text" | "image" | "whiteout" | null>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<"text" | "image" | "whiteout" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Cover box color picker
  const [coverColor, setCoverColor] = useState("#ffffff");

  // Active tool mode
  type ToolMode = "select" | "text" | "image" | "cover";
  const [toolMode, setToolMode] = useState<ToolMode>("select");

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Push to undo stack ───────────────────────────────────────────────────

  const pushUndo = useCallback(() => {
    setUndoStack(prev => {
      const snap: Snapshot = {
        texts: JSON.parse(JSON.stringify(texts)),
        images: images.map(i => ({ ...i })),
        whiteouts: JSON.parse(JSON.stringify(whiteouts)),
      };
      return [...prev.slice(-19), snap]; // max 20 undos
    });
  }, [texts, images, whiteouts]);

  const handleUndo = () => {
    if (undoStack.length === 0) { toast.error("Nothing to undo"); return; }
    const prev = undoStack[undoStack.length - 1];
    setTexts(prev.texts);
    setImages(prev.images);
    setWhiteouts(prev.whiteouts);
    setUndoStack(s => s.slice(0, -1));
    toast.success("Undo successful");
  };

  // ─── PDF File Upload ──────────────────────────────────────────────────────

  const handlePdfChange = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }
    setPdfFile(incoming);
    setPageNum(1);
    setTexts([]);
    setImages([]);
    setWhiteouts([]);
    setUndoStack([]);
    setSelectedId(null);

    try {
      const pdfjs = await loadPdfJs();
      const buf = await incoming.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      setPdfTotalPages(pdf.numPages);
    } catch {
      toast.error("Failed to read PDF file");
    }
  };

  // ─── Render PDF Page Canvas ───────────────────────────────────────────────

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

          const containerWidth = (containerRef.current?.clientWidth || 800);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const autoScale = containerWidth / unscaledViewport.width;
          const scale = autoScale * zoom;
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
  }, [pdfFile, pageNum, zoom]);

  // ─── Canvas Click: Add element in tool mode ───────────────────────────────

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === "text") {
      pushUndo();
      const newText: TextOverlay = {
        id: uid(), pageNum, text: "Type your text here",
        x, y, color: "#000000", size: 18,
        bold: false, italic: false, underline: false,
        fontFamily: "Helvetica", align: "left",
        highlight: "none", opacity: 100,
      };
      setTexts(prev => [...prev, newText]);
      setSelectedId(newText.id);
      setSelectedType("text");
      toast.success("Text box placed — click on it to edit!");
    } else if (toolMode === "cover") {
      pushUndo();
      const newW: WhiteoutOverlay = {
        id: uid(), pageNum,
        x, y, width: 160, height: 40,
        color: coverColor,
      };
      setWhiteouts(prev => [...prev, newW]);
      setSelectedId(newW.id);
      setSelectedType("whiteout");
    }
  };

  // ─── Add Image ────────────────────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pushUndo();
    const url = URL.createObjectURL(file);
    const newImage: ImageOverlay = {
      id: uid(), pageNum, file, previewUrl: url,
      x: 60, y: 60, width: 180, height: 120, opacity: 100,
    };
    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      setImages(prev => prev.map(i => i.id === newImage.id ? { ...i, height: 180 / aspect } : i));
    };
    img.src = url;
    setImages(prev => [...prev, newImage]);
    setSelectedId(newImage.id);
    setSelectedType("image");
    toast.success("Image placed — drag to reposition!");
    e.target.value = "";
  };

  // ─── Dragging ─────────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent, id: string, type: "text" | "image" | "whiteout") => {
    e.stopPropagation();
    setSelectedId(id);
    setSelectedType(type);
    setDraggingId(id);
    setDraggingType(type);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    if (draggingType === "text") {
      setTexts(prev => prev.map(t => t.id === draggingId ? { ...t, x: newX, y: newY } : t));
    } else if (draggingType === "image") {
      setImages(prev => prev.map(i => i.id === draggingId ? { ...i, x: newX, y: newY } : i));
    } else if (draggingType === "whiteout") {
      setWhiteouts(prev => prev.map(w => w.id === draggingId ? { ...w, x: newX, y: newY } : w));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      setDraggingType(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  // ─── Duplicate element ────────────────────────────────────────────────────

  const handleDuplicate = (id: string, type: "text" | "image" | "whiteout") => {
    pushUndo();
    if (type === "text") {
      const orig = texts.find(t => t.id === id);
      if (orig) setTexts(prev => [...prev, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]);
    } else if (type === "image") {
      const orig = images.find(i => i.id === id);
      if (orig) setImages(prev => [...prev, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]);
    } else {
      const orig = whiteouts.find(w => w.id === id);
      if (orig) setWhiteouts(prev => [...prev, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]);
    }
    toast.success("Duplicated!");
  };

  // ─── Layer ordering ───────────────────────────────────────────────────────

  const moveLayer = (id: string, dir: "up" | "down") => {
    setTexts(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = (id: string, type: "text" | "image" | "whiteout") => {
    pushUndo();
    if (type === "text") setTexts(prev => prev.filter(t => t.id !== id));
    else if (type === "image") setImages(prev => prev.filter(i => i.id !== id));
    else setWhiteouts(prev => prev.filter(w => w.id !== id));
    setSelectedId(null);
    setSelectedType(null);
  };

  // ─── Hex to pdf-lib rgb ───────────────────────────────────────────────────

  const hexToPdfRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? rgb(parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255) : rgb(0, 0, 0);
  };

  // ─── Save / Export PDF ────────────────────────────────────────────────────

  const handleSavePdf = async () => {
    if (!pdfFile) return;
    setLoading(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      // 1. Whiteout / Cover Boxes
      for (const box of whiteouts) {
        const pageIdx = box.pageNum - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const { height } = page.getSize();
        const pdfX = box.x / pdfScale;
        const pdfW = box.width / pdfScale;
        const pdfH = box.height / pdfScale;
        const pdfY = height - box.y / pdfScale - pdfH;
        page.drawRectangle({ x: pdfX, y: pdfY, width: pdfW, height: pdfH, color: hexToPdfRgb(box.color) });
      }

      // 2. Images
      for (const img of images) {
        const pageIdx = img.pageNum - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const { height } = page.getSize();
        const imageBytes = await img.file.arrayBuffer();
        const pdfImage = img.file.type === "image/png"
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
        const pdfX = img.x / pdfScale;
        const pdfW = img.width / pdfScale;
        const pdfH = img.height / pdfScale;
        const pdfY = height - img.y / pdfScale - pdfH;
        page.drawImage(pdfImage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH, opacity: img.opacity / 100 });
      }

      // 3. Text Overlays
      for (const text of texts) {
        const pageIdx = text.pageNum - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const { height, width } = page.getSize();

        const fontSize = text.size / pdfScale;
        const pdfX = text.x / pdfScale;
        const pdfY = height - text.y / pdfScale - fontSize;

        // Draw highlight background
        if (text.highlight !== "none") {
          const approxWidth = text.text.length * fontSize * 0.6;
          page.drawRectangle({
            x: pdfX - 2,
            y: pdfY - 2,
            width: approxWidth + 4,
            height: fontSize + 6,
            color: hexToPdfRgb(text.highlight),
            opacity: 0.6,
          });
        }

        // Draw underline
        if (text.underline) {
          const approxWidth = text.text.length * fontSize * 0.6;
          page.drawLine({
            start: { x: pdfX, y: pdfY - 2 },
            end: { x: pdfX + approxWidth, y: pdfY - 2 },
            thickness: 1,
            color: hexToPdfRgb(text.color),
          });
        }

        // Pick font (pdf-lib has only standard fonts; bold/italic handled via font selection)
        let fontName: typeof StandardFonts[keyof typeof StandardFonts] = StandardFonts.Helvetica;
        if (text.fontFamily === "Helvetica") {
          fontName = text.bold && text.italic ? StandardFonts.HelveticaBoldOblique
            : text.bold ? StandardFonts.HelveticaBold
            : text.italic ? StandardFonts.HelveticaOblique
            : StandardFonts.Helvetica;
        } else if (text.fontFamily === "Times-Roman") {
          fontName = text.bold && text.italic ? StandardFonts.TimesRomanBoldItalic
            : text.bold ? StandardFonts.TimesRomanBold
            : text.italic ? StandardFonts.TimesRomanItalic
            : StandardFonts.TimesRoman;
        } else if (text.fontFamily === "Courier") {
          fontName = text.bold && text.italic ? StandardFonts.CourierBoldOblique
            : text.bold ? StandardFonts.CourierBold
            : text.italic ? StandardFonts.CourierOblique
            : StandardFonts.Courier;
        }

        const font = await pdfDoc.embedFont(fontName);
        const textWidth = font.widthOfTextAtSize(text.text, fontSize);
        let drawX = pdfX;
        if (text.align === "center") drawX = Math.max(0, (width / 2) - textWidth / 2);
        else if (text.align === "right") drawX = Math.max(0, width - textWidth - 20);

        page.drawText(text.text, {
          x: drawX,
          y: pdfY,
          size: fontSize,
          font,
          color: hexToPdfRgb(text.color),
          opacity: text.opacity / 100,
        });
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `Edited_${pdfFile.name}`);
      toast.success("Edited PDF saved and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save edited PDF.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Computed helpers ─────────────────────────────────────────────────────

  const currentTexts = texts.filter(t => t.pageNum === pageNum);
  const currentImages = images.filter(i => i.pageNum === pageNum);
  const currentWhiteouts = whiteouts.filter(w => w.pageNum === pageNum);
  const totalAnnotations = texts.length + images.length + whiteouts.length;
  const selectedText = selectedType === "text" ? texts.find(t => t.id === selectedId) ?? null : null;

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {!pdfFile ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragFileOver(false); if (e.dataTransfer.files[0]) handlePdfChange(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragFileOver(true); }}
          onDragLeave={() => setDragFileOver(false)}
          onClick={() => pdfInputRef.current?.click()}
          style={{
            backgroundColor: dragFileOver ? "#eff6ff" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer rounded-lg hover:bg-blue-50/50 transition-all"
        >
          <Edit size={40} className="mx-auto mb-3 text-blue-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here — Edit Text, Images & Cover Boxes
          </p>
          <p className="text-xs font-semibold text-slate-500">Full pro editing: bold/italic/highlight, font families, opacity, undo, layers & more</p>
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden
            onChange={(e) => e.target.files?.[0] && handlePdfChange(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">

          {/* ─── Top Toolbar ─── */}
          <div className="p-2 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap items-center gap-2 shadow-xs">

            {/* File Info */}
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <FileText size={18} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-[10px] text-slate-900 truncate max-w-[120px]">{pdfFile.name}</p>
                <p className="text-[9px] text-slate-500">{formatFileSize(pdfFile.size)} • {pdfTotalPages}p</p>
              </div>
              <button onClick={() => { setPdfFile(null); setTexts([]); setImages([]); setWhiteouts([]); }}
                className="p-0.5 text-red-600 hover:bg-red-50 rounded border border-red-200 cursor-pointer shrink-0">
                <X size={11} />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-300 mx-1" />

            {/* Tool Modes */}
            {[
              { id: "select" as ToolMode, icon: <MousePointer size={13} />, label: "Select" },
              { id: "text" as ToolMode, icon: <Type size={13} />, label: "Add Text" },
              { id: "cover" as ToolMode, icon: <Square size={13} />, label: "Cover Box" },
            ].map((tool) => (
              <button key={tool.id} onClick={() => setToolMode(tool.id)}
                style={toolMode === tool.id ? { backgroundColor: "#000080", color: "#fff" } : {}}
                className={`px-2 py-1 rounded border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${toolMode === tool.id ? "border-blue-900 shadow-inner" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-200"}`}>
                {tool.icon} {tool.label}
              </button>
            ))}

            {/* Image Upload */}
            <button onClick={() => imgInputRef.current?.click()}
              className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-200 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer">
              <ImageIcon size={13} className="text-pink-600" /> Add Image
              <input type="file" ref={imgInputRef} onChange={handleImageChange} accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" />
            </button>

            {/* Cover Color picker (only when cover mode) */}
            {toolMode === "cover" && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-extrabold text-slate-600">COLOR:</span>
                {COVER_COLORS.map(c => (
                  <button key={c.value} onClick={() => setCoverColor(c.value)} title={c.label}
                    style={{ backgroundColor: c.value, borderColor: coverColor === c.value ? "#6366f1" : "#cbd5e1" }}
                    className={`w-5 h-5 rounded border-2 cursor-pointer ${coverColor === c.value ? "scale-110 ring-2 ring-indigo-400" : ""} ${c.value === "#ffffff" ? "ring-1 ring-slate-300" : ""}`} />
                ))}
              </div>
            )}

            <div className="w-px h-6 bg-slate-300 mx-1" />

            {/* Undo */}
            <button onClick={handleUndo} disabled={undoStack.length === 0}
              className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-200 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-40">
              <Undo size={12} /> Undo ({undoStack.length})
            </button>

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-200 cursor-pointer"><ZoomOut size={12} /></button>
              <span className="text-[10px] font-extrabold text-slate-700 w-8 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-200 cursor-pointer"><ZoomIn size={12} /></button>
              <button onClick={() => setZoom(1)} title="Reset zoom"
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-200 cursor-pointer"><RotateCcw size={11} /></button>
            </div>

            {/* Page navigator */}
            <div className="flex items-center gap-1 text-[10px] font-bold ml-auto">
              <button disabled={pageNum <= 1} onClick={() => setPageNum(p => Math.max(1, p - 1))}
                className="p-1 bg-white rounded border border-slate-300 disabled:opacity-40 cursor-pointer"><ArrowLeft size={12} /></button>
              <span className="text-slate-800">Pg {pageNum}/{pdfTotalPages}</span>
              <button disabled={pageNum >= pdfTotalPages} onClick={() => setPageNum(p => Math.min(pdfTotalPages, p + 1))}
                className="p-1 bg-white rounded border border-slate-300 disabled:opacity-40 cursor-pointer"><ArrowRight size={12} /></button>
            </div>

            {/* Save */}
            <button onClick={handleSavePdf} disabled={loading}
              style={{ backgroundColor: "#000080", color: "#fff", borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRight: "2px solid #000040", borderBottom: "2px solid #000040" }}
              className="px-3 py-1.5 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer rounded shadow-xs disabled:opacity-60">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Save & Download
            </button>
          </div>

          {/* ─── Selected Text Formatting Toolbar ─── */}
          {selectedText && (
            <div className="p-2 bg-white border border-blue-300 rounded-lg flex flex-wrap items-center gap-2 shadow-xs animate-fade-in">
              <span className="text-[10px] font-extrabold text-blue-800 mr-1">📝 Text Format:</span>

              {/* Font Family */}
              <select value={selectedText.fontFamily}
                onChange={(e) => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, fontFamily: e.target.value as FontFamily } : t))}
                className="text-[10px] font-bold border border-slate-300 rounded px-1 py-0.5 cursor-pointer">
                {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>

              {/* Font Size */}
              <input type="number" min={8} max={120} value={selectedText.size}
                onChange={(e) => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, size: +e.target.value } : t))}
                className="w-12 text-[10px] border border-slate-300 rounded px-1 py-0.5 font-bold" />

              {/* Color */}
              <input type="color" value={selectedText.color}
                onChange={(e) => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, color: e.target.value } : t))}
                className="w-6 h-6 p-0 border-0 cursor-pointer rounded" title="Text color" />

              {/* Bold / Italic / Underline */}
              {[
                { key: "bold" as const, icon: <Bold size={11} />, title: "Bold" },
                { key: "italic" as const, icon: <Italic size={11} />, title: "Italic" },
                { key: "underline" as const, icon: <Underline size={11} />, title: "Underline" },
              ].map(({ key, icon, title }) => (
                <button key={key} title={title}
                  onClick={() => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, [key]: !t[key] } : t))}
                  className={`p-1 rounded border text-[10px] font-black cursor-pointer ${selectedText[key] ? "bg-blue-700 text-white border-blue-800" : "bg-white border-slate-300 hover:bg-slate-100"}`}>
                  {icon}
                </button>
              ))}

              {/* Alignment */}
              {[
                { val: "left" as Align, icon: <AlignLeft size={11} /> },
                { val: "center" as Align, icon: <AlignCenter size={11} /> },
                { val: "right" as Align, icon: <AlignRight size={11} /> },
              ].map(({ val, icon }) => (
                <button key={val} onClick={() => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, align: val } : t))}
                  className={`p-1 rounded border cursor-pointer ${selectedText.align === val ? "bg-blue-700 text-white border-blue-800" : "bg-white border-slate-300 hover:bg-slate-100"}`}>
                  {icon}
                </button>
              ))}

              {/* Highlight */}
              <div className="flex items-center gap-1">
                <Highlighter size={11} className="text-yellow-600" />
                {HIGHLIGHT_OPTIONS.map(h => (
                  <button key={h.value} title={h.label} onClick={() => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, highlight: h.value } : t))}
                    className={`w-4 h-4 rounded ${h.style} border cursor-pointer ${selectedText.highlight === h.value ? "ring-2 ring-blue-500 scale-110" : ""}`} />
                ))}
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-extrabold text-slate-600">OPC:</span>
                <input type="range" min={10} max={100} step={5} value={selectedText.opacity}
                  onChange={(e) => setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, opacity: +e.target.value } : t))}
                  className="w-16 accent-blue-600" />
                <span className="text-[9px] font-bold text-slate-700">{selectedText.opacity}%</span>
              </div>

              {/* Layer Controls */}
              <div className="flex items-center gap-1 ml-1">
                <button onClick={() => moveLayer(selectedId!, "up")} title="Bring forward"
                  className="p-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"><ChevronUp size={11} /></button>
                <button onClick={() => moveLayer(selectedId!, "down")} title="Send back"
                  className="p-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"><ChevronDown size={11} /></button>
              </div>

              {/* Duplicate & Delete */}
              <button onClick={() => handleDuplicate(selectedId!, "text")}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer" title="Duplicate">
                <Copy size={11} />
              </button>
              <button onClick={() => handleDelete(selectedId!, "text")}
                className="p-1 bg-red-50 border border-red-200 rounded hover:bg-red-100 cursor-pointer text-red-600" title="Delete">
                <Trash2 size={11} />
              </button>
            </div>
          )}

          {/* ─── Status Bar ─── */}
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 px-1">
            <Layers size={11} />
            <span>{totalAnnotations} annotation{totalAnnotations !== 1 ? "s" : ""} on PDF</span>
            {toolMode !== "select" && <span className="text-blue-700 font-extrabold">• Click on page to place {toolMode === "text" ? "text box" : "cover box"}</span>}
          </div>

          {/* ─── PDF Canvas Area ─── */}
          <div className="bg-slate-300 border border-slate-400 rounded-lg shadow-inner overflow-auto" style={{ maxHeight: "72vh" }}>
            <div className="flex justify-center p-3">
              <div
                ref={containerRef}
                className="relative shadow-xl bg-white select-none touch-none overflow-hidden"
                style={{ cursor: toolMode === "select" ? "default" : "crosshair", minHeight: 300, width: "100%", maxWidth: 900 }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClick={handleCanvasClick}
              >
                <canvas ref={canvasRef} className="block mx-auto" />

                {/* ── Whiteout / Cover Boxes ── */}
                {currentWhiteouts.map((w) => (
                  <div key={w.id}
                    className={`absolute group border-2 ${selectedId === w.id ? "border-blue-500" : "border-dashed border-slate-400"}`}
                    style={{ left: w.x, top: w.y, width: w.width, height: w.height, backgroundColor: w.color, cursor: "move" }}
                    onPointerDown={(e) => handlePointerDown(e, w.id, "whiteout")}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(w.id); setSelectedType("whiteout"); }}
                  >
                    {/* Resize handle bottom-right */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 cursor-se-resize opacity-0 group-hover:opacity-100 rounded-tl"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startW = w.width;
                        const startH = w.height;
                        const onMove = (mv: PointerEvent) => {
                          const newW = Math.max(30, startW + mv.clientX - startX);
                          const newH = Math.max(15, startH + mv.clientY - startY);
                          setWhiteouts(prev => prev.map(box => box.id === w.id ? { ...box, width: newW, height: newH } : box));
                        };
                        const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                      }}
                    />
                    {/* Controls on hover */}
                    <div className="absolute -top-6 left-0 bg-white shadow border border-slate-300 rounded flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 z-30 text-[9px] font-bold whitespace-nowrap">
                      <span className="text-slate-500">{Math.round(w.width)}×{Math.round(w.height)}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDuplicate(w.id, "whiteout"); }} className="text-blue-600 hover:bg-blue-50 rounded p-0.5 cursor-pointer"><Copy size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(w.id, "whiteout"); }} className="text-red-600 hover:bg-red-50 rounded p-0.5 cursor-pointer"><Trash2 size={10} /></button>
                    </div>
                  </div>
                ))}

                {/* ── Image Overlays ── */}
                {currentImages.map((img) => (
                  <div key={img.id}
                    className={`absolute group border-2 ${selectedId === img.id ? "border-blue-500" : "border-transparent hover:border-blue-400"}`}
                    style={{ left: img.x, top: img.y, width: img.width, height: img.height, cursor: "move", opacity: img.opacity / 100 }}
                    onPointerDown={(e) => handlePointerDown(e, img.id, "image")}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(img.id); setSelectedType("image"); }}
                  >
                    <img src={img.previewUrl} alt="overlay" className="w-full h-full object-contain pointer-events-none" />

                    {/* Resize handle bottom-right */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 cursor-se-resize opacity-0 group-hover:opacity-100 rounded-tl"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startW = img.width;
                        const aspect = img.height / img.width;
                        const onMove = (mv: PointerEvent) => {
                          const newW = Math.max(40, startW + mv.clientX - startX);
                          setImages(prev => prev.map(i => i.id === img.id ? { ...i, width: newW, height: newW * aspect } : i));
                        };
                        const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                      }}
                    />

                    <div className="absolute -top-6 left-0 bg-white shadow border border-slate-300 rounded flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 z-30 text-[9px] font-bold">
                      <span className="text-slate-500">Img</span>
                      {/* Opacity slider */}
                      <input type="range" min={10} max={100} step={5} value={img.opacity}
                        onChange={(e) => { e.stopPropagation(); setImages(prev => prev.map(i => i.id === img.id ? { ...i, opacity: +e.target.value } : i)); }}
                        className="w-14 accent-blue-600" onClick={(e) => e.stopPropagation()} />
                      <span>{img.opacity}%</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDuplicate(img.id, "image"); }} className="text-blue-600 hover:bg-blue-50 rounded p-0.5 cursor-pointer"><Copy size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(img.id, "image"); }} className="text-red-600 hover:bg-red-50 rounded p-0.5 cursor-pointer"><Trash2 size={10} /></button>
                    </div>
                  </div>
                ))}

                {/* ── Text Overlays ── */}
                {currentTexts.map((text) => (
                  <div key={text.id}
                    className={`absolute group border-2 ${selectedId === text.id ? "border-blue-500" : "border-dashed border-transparent hover:border-blue-300"}`}
                    style={{ left: text.x, top: text.y, cursor: "move", zIndex: 10 }}
                    onPointerDown={(e) => handlePointerDown(e, text.id, "text")}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(text.id); setSelectedType("text"); }}
                  >
                    {/* Inline editable input */}
                    <textarea
                      value={text.text}
                      onChange={(e) => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, text: e.target.value } : t))}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        color: text.color,
                        fontSize: `${text.size}px`,
                        fontFamily: text.fontFamily,
                        fontWeight: text.bold ? "bold" : "normal",
                        fontStyle: text.italic ? "italic" : "normal",
                        textDecoration: text.underline ? "underline" : "none",
                        textAlign: text.align,
                        backgroundColor: text.highlight !== "none" ? text.highlight + "99" : "transparent",
                        opacity: text.opacity / 100,
                        border: "none",
                        outline: "none",
                        resize: "both",
                        minWidth: 120,
                        minHeight: text.size + 8,
                        overflow: "hidden",
                        lineHeight: "1.3",
                        padding: "2px 4px",
                      }}
                      rows={1}
                      className="block"
                    />

                    {/* Quick delete on hover (when not selected) */}
                    {selectedId !== text.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(text.id, "text"); }}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px]"
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Layers Panel ─── */}
          {totalAnnotations > 0 && (
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <p className="text-[10px] font-extrabold text-slate-700 mb-2 flex items-center gap-1">
                <Layers size={11} /> All Annotations ({totalAnnotations})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {texts.map((t, i) => (
                  <button key={t.id} onClick={() => { setSelectedId(t.id); setSelectedType("text"); setPageNum(t.pageNum); }}
                    className={`px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer truncate max-w-[120px] ${selectedId === t.id ? "bg-blue-700 text-white border-blue-800" : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"}`}>
                    T{i + 1}: "{t.text.slice(0, 10)}" p{t.pageNum}
                  </button>
                ))}
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => { setSelectedId(img.id); setSelectedType("image"); setPageNum(img.pageNum); }}
                    className={`px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer ${selectedId === img.id ? "bg-pink-700 text-white border-pink-800" : "bg-pink-50 text-pink-800 border-pink-200 hover:bg-pink-100"}`}>
                    🖼 Img{i + 1} p{img.pageNum}
                  </button>
                ))}
                {whiteouts.map((w, i) => (
                  <button key={w.id} onClick={() => { setSelectedId(w.id); setSelectedType("whiteout"); setPageNum(w.pageNum); }}
                    className={`px-2 py-0.5 rounded border text-[9px] font-bold cursor-pointer ${selectedId === w.id ? "bg-slate-700 text-white border-slate-800" : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"}`}>
                    ▪ Box{i + 1} p{w.pageNum}
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
