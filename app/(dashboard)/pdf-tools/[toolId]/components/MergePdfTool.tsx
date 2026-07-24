"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { GripVertical, X, FileText, Combine, Loader2, LayoutGrid, List, Trash2, ArrowLeft, ArrowRight, Eye } from "lucide-react";
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

interface PdfItem {
  id: string;
  file: File;
  previewUrl?: string;
  pageCount?: number;
  loadingPreview?: boolean;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function MergePdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [items, setItems] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal preview state
  const [modalItem, setModalItem] = useState<PdfItem | null>(null);

  // Generate 1st page visual thumbnail
  const generatePreview = async (item: PdfItem) => {
    try {
      const buf = await item.file.arrayBuffer();
      const pdfjs = await loadPdfJs();
      const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const count = pdfDoc.numPages;

      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 0.6 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const url = canvas.toDataURL("image/jpeg", 0.85);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, previewUrl: url, pageCount: count, loadingPreview: false }
            : i
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, loadingPreview: false } : i
        )
      );
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (valid.length === 0) {
      toast.error("Please select PDF files only");
      return;
    }

    const newItems: PdfItem[] = valid.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      loadingPreview: true,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Generate previews asynchronously
    newItems.forEach((item) => {
      generatePreview(item);
    });
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      toast.error("Please add at least 2 PDF files");
      return;
    }
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of items) {
        const buf = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, "RA_Merged.pdf");
      toast.success("PDF merged and downloaded!");
    } catch {
      toast.error("Failed to merge PDFs. Please check if the files are valid.");
    } finally {
      setLoading(false);
    }
  };

  const totalPagesSum = items.reduce((acc, curr) => acc + (curr.pageCount || 1), 0);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          backgroundColor: dragOver ? "#e0f2fe" : "#ffffff",
          borderTop: "2px solid #808080",
          borderLeft: "2px solid #808080",
          borderRight: "2px solid #ffffff",
          borderBottom: "2px solid #ffffff",
          boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
        }}
        className="p-8 text-center cursor-pointer transition-all hover:bg-blue-50/50 rounded-lg"
      >
        <Combine size={36} className="mx-auto mb-3 text-blue-600" />
        <p className="text-base font-extrabold mb-1" style={{ color: "#000080" }}>
          Drop PDF files here to see Visual Preview
        </p>
        <p className="text-xs font-semibold text-slate-500">or click to browse from computer</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Files Control Header */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 rounded-lg border border-slate-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-800">
              {items.length} PDF File{items.length > 1 ? "s" : ""} ({totalPagesSum} total pages)
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Drag cards to reorder sequence
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-300 rounded-md p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-colors ${
                  viewMode === "grid" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid size={13} /> Visual Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-colors ${
                  viewMode === "list" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <List size={13} /> Detailed List
              </button>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-extrabold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded border border-slate-400 transition-colors"
            >
              + Add More PDFs
            </button>
          </div>
        </div>
      )}

      {/* Visual Grid View */}
      {items.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggingIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingIndex !== null && draggingIndex !== i) handleReorder(draggingIndex, i);
                setDraggingIndex(null);
              }}
              style={{
                backgroundColor: "#d4d0c8",
                borderTop: "2px solid #ffffff",
                borderLeft: "2px solid #ffffff",
                borderRight: "2px solid #404040",
                borderBottom: "2px solid #404040",
                boxShadow: "2px 2px 5px rgba(0,0,0,0.15)",
              }}
              className={`relative p-2 rounded flex flex-col justify-between transition-all ${
                draggingIndex === i ? "opacity-40 scale-95" : "hover:border-blue-400"
              }`}
            >
              {/* Order Number Badge */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="bg-blue-950 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                  #{i + 1}
                </span>
                <span className="text-[10px] font-extrabold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-300">
                  {item.pageCount ? `${item.pageCount} Pg` : "PDF"}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] cursor-pointer transition-colors"
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              </div>

              {/* PDF 1st Page Live Canvas Thumbnail */}
              <div
                className="relative bg-white border border-slate-400 rounded overflow-hidden flex items-center justify-center min-h-[140px] max-h-[160px] cursor-pointer group shadow-inner"
                onClick={() => setModalItem(item)}
                title="Click to view preview"
              >
                {item.loadingPreview ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-slate-400 text-xs font-semibold">
                    <Loader2 size={20} className="animate-spin text-blue-600" />
                    <span>Loading preview...</span>
                  </div>
                ) : item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-contain max-h-[160px] p-1 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-red-500">
                    <FileText size={32} />
                    <span className="text-[10px] font-bold mt-1 text-slate-600">PDF Document</span>
                  </div>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                  <Eye size={14} /> Preview
                </div>
              </div>

              {/* File Info */}
              <div className="mt-2 pt-1.5 border-t border-slate-300">
                <p className="text-xs font-extrabold text-slate-900 truncate" title={item.file.name}>
                  {item.file.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-semibold mt-0.5">
                  <span>{formatFileSize(item.file.size)}</span>
                  <div className="flex items-center gap-1">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => handleReorder(i, i - 1)}
                        className="hover:text-blue-700 font-bold px-1"
                        title="Move Up"
                      >
                        ←
                      </button>
                    )}
                    {i < items.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleReorder(i, i + 1)}
                        className="hover:text-blue-700 font-bold px-1"
                        title="Move Down"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed List View */}
      {items.length > 0 && viewMode === "list" && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggingIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingIndex !== null && draggingIndex !== i) handleReorder(draggingIndex, i);
                setDraggingIndex(null);
              }}
              style={{
                backgroundColor: "#ffffff",
                borderTop: "2px solid #808080",
                borderLeft: "2px solid #808080",
                borderRight: "2px solid #ffffff",
                borderBottom: "2px solid #ffffff",
              }}
              className={`flex items-center gap-3 p-2.5 rounded transition-all ${
                draggingIndex === i ? "opacity-50 scale-95" : "hover:bg-blue-50/50"
              }`}
            >
              <GripVertical size={18} className="cursor-grab text-slate-400 shrink-0" />
              
              <span className="text-xs font-black bg-blue-900 text-white px-2 py-0.5 rounded shrink-0">
                #{i + 1}
              </span>

              {/* PDF Thumbnail */}
              <div
                className="w-12 h-14 bg-slate-100 border border-slate-300 rounded overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-xs"
                onClick={() => setModalItem(item)}
              >
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText size={20} className="text-red-500" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">{item.file.name}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold mt-0.5">
                  <span>{formatFileSize(item.file.size)}</span>
                  <span>•</span>
                  <span>{item.pageCount ? `${item.pageCount} Pages` : "PDF"}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merge Action Button */}
      {items.length > 0 && (
        <button
          onClick={handleMerge}
          disabled={loading}
          style={{
            backgroundColor: "#166534",
            color: "#ffffff",
            borderTop: "2px solid #ffffff",
            borderLeft: "2px solid #ffffff",
            borderRight: "2px solid #14532d",
            borderBottom: "2px solid #14532d",
          }}
          className="w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-700 transition-colors shadow-md rounded"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Merging {items.length} PDFs...
            </>
          ) : (
            <>
              <Combine size={20} /> Merge {items.length} PDF Files Now
            </>
          )}
        </button>
      )}

      {/* Modal Preview Window */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            style={{
              backgroundColor: "#d4d0c8",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
            }}
            className="max-w-xl w-full p-2 rounded shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div
              style={{
                background: "linear-gradient(to right, #000080 0%, #1084d0 100%)",
                color: "#ffffff",
              }}
              className="px-3 py-1.5 font-bold text-xs flex justify-between items-center"
            >
              <span className="truncate">Preview: {modalItem.file.name}</span>
              <button
                onClick={() => setModalItem(null)}
                className="w-5 h-5 bg-red-600 text-white font-bold text-xs flex items-center justify-center rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-400 mt-1 overflow-y-auto flex flex-col items-center justify-center">
              {modalItem.previewUrl ? (
                <img
                  src={modalItem.previewUrl}
                  alt={modalItem.file.name}
                  className="max-h-[65vh] w-auto object-contain border border-slate-300 shadow-md"
                />
              ) : (
                <div className="p-8 text-slate-500 text-xs">No preview available</div>
              )}
              <div className="mt-3 text-center text-xs font-bold text-slate-700">
                {modalItem.file.name} ({formatFileSize(modalItem.file.size)}) — {modalItem.pageCount || 1} Total Pages
              </div>
            </div>

            <div className="mt-2 text-right">
              <button
                onClick={() => setModalItem(null)}
                className="px-4 py-1 bg-slate-300 hover:bg-slate-400 font-bold text-xs rounded border border-slate-500"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
