"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileText, Loader2, X, Eye, Check, CheckSquare, Square, Layers } from "lucide-react";
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

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function ExtractPagesTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Page Thumbnails
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});

  // Export option: single merged PDF or individual PDF per page
  const [exportOption, setExportOption] = useState<"merged" | "individual">("merged");

  // Bulk range input
  const [bulkInput, setBulkInput] = useState("");

  // Modal preview
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    setFile(incoming);
    setSelectedPages(new Set());
    setThumbnails({});
    setLoadingPreviews(true);

    try {
      const buf = await incoming.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = doc.getPageCount();
      setTotalPages(total);

      // Default select all pages
      setSelectedPages(new Set(Array.from({ length: total }, (_, i) => i)));
      setBulkInput(`1-${total}`);

      // Render page thumbnails using PDF.js
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const thumbs: { [key: number]: string } = {};

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs[i - 1] = canvas.toDataURL("image/jpeg", 0.85);
      }
      setThumbnails(thumbs);
    } catch {
      toast.error("Failed to read PDF pages");
    } finally {
      setLoadingPreviews(false);
    }
  };

  const togglePageSelection = (pageIdx: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIdx)) next.delete(pageIdx);
      else next.add(pageIdx);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const selectOdd = () => {
    const odds = new Set<number>();
    for (let i = 0; i < totalPages; i += 2) odds.add(i); // Page 1, 3, 5... (0-indexed 0, 2, 4...)
    setSelectedPages(odds);
  };

  const selectEven = () => {
    const evens = new Set<number>();
    for (let i = 1; i < totalPages; i += 2) evens.add(i); // Page 2, 4, 6... (0-indexed 1, 3, 5...)
    setSelectedPages(evens);
  };

  const applyBulkRange = () => {
    if (!bulkInput.trim()) return;
    const toSelect = new Set<number>();
    const parts = bulkInput.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(totalPages, Math.max(start, end));
          for (let i = min; i <= max; i++) toSelect.add(i - 1);
        }
      } else {
        const val = parseInt(trimmed, 10);
        if (!isNaN(val) && val >= 1 && val <= totalPages) toSelect.add(val - 1);
      }
    }

    setSelectedPages(toSelect);
    toast.success(`Selected ${toSelect.size} page(s) for extraction!`);
  };

  const handleExtract = async () => {
    if (!file || selectedPages.size === 0) {
      toast.error("Please select at least 1 page to extract");
      return;
    }

    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const indices = Array.from(selectedPages).sort((a, b) => a - b);

      if (exportOption === "individual") {
        for (const pageIdx of indices) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [pageIdx]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          downloadWithRename(url, `RA_Page_${pageIdx + 1}.pdf`);
        }
        toast.success(`Exported ${indices.length} individual page PDF files!`);
      } else {
        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, indices);
        pages.forEach((p) => newDoc.addPage(p));

        const bytes = await newDoc.save();
        const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        downloadWithRename(url, `RA_Extracted_Pages.pdf`);
        toast.success(`Extracted ${indices.length} page(s) into 1 merged PDF!`);
      }
    } catch {
      toast.error("Failed to extract PDF pages");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
            backgroundColor: dragOver ? "#f0fdf4" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-emerald-50/50 rounded-lg"
        >
          <Download size={40} className="mx-auto mb-3 text-emerald-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here to see Visual Page Extractor
          </p>
          <p className="text-xs font-semibold text-slate-500">or click to browse PDF document</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* File Overview Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-300 rounded-lg shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={28} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">{file.name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {formatFileSize(file.size)} • {totalPages} Total Pages
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setTotalPages(0);
                setSelectedPages(new Set());
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X size={16} /> Remove PDF
            </button>
          </div>

          {/* Helper Selection & Export Options Controls */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  Selected <span className="text-emerald-700">{selectedPages.size}</span> of {totalPages} pages for extraction
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded border border-emerald-300 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 cursor-pointer"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={selectOdd}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 cursor-pointer"
                >
                  Select Odd (1, 3, 5)
                </button>
                <button
                  type="button"
                  onClick={selectEven}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 cursor-pointer"
                >
                  Select Even (2, 4, 6)
                </button>
              </div>
            </div>

            {/* Export Format Radio Toggle */}
            <div className="flex items-center gap-4 bg-emerald-50/80 p-2.5 rounded border border-emerald-200 text-xs">
              <span className="font-bold text-emerald-950">Export Extracted Pages as:</span>
              <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="exportOpt"
                  checked={exportOption === "merged"}
                  onChange={() => setExportOption("merged")}
                  className="accent-emerald-600"
                />
                1 Single Merged PDF File
              </label>
              <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-800">
                <input
                  type="radio"
                  name="exportOpt"
                  checked={exportOption === "individual"}
                  onChange={() => setExportOption("individual")}
                  className="accent-emerald-600"
                />
                Individual Separate PDF Files
              </label>
            </div>

            {/* Bulk Range Entry */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 shrink-0">Bulk Range:</span>
              <input
                type="text"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
                className="flex-1 px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={applyBulkRange}
                className="px-3 py-1 text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer"
              >
                Select Range
              </button>
            </div>
          </div>

          {/* Visual Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
            {Array.from({ length: totalPages }, (_, idx) => {
              const isSelected = selectedPages.has(idx);
              const thumb = thumbnails[idx];

              return (
                <div
                  key={idx}
                  onClick={() => togglePageSelection(idx)}
                  style={{
                    backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                    borderColor: isSelected ? "#16a34a" : "#cbd5e1",
                  }}
                  className={`relative p-2 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between group ${
                    isSelected ? "shadow-md ring-2 ring-emerald-500/20" : "opacity-75 hover:opacity-100 hover:border-slate-400"
                  }`}
                >
                  {/* Badge & Status Header */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      Page {idx + 1}
                    </span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-emerald-600 text-white" : "bg-slate-400 text-white"
                    }`}>
                      {isSelected ? "EXTRACT" : "SKIP"}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative bg-white border border-slate-200 rounded overflow-hidden min-h-[130px] flex items-center justify-center">
                    {loadingPreviews ? (
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                    ) : thumb ? (
                      <img
                        src={thumb}
                        alt={`Page ${idx + 1}`}
                        className={`w-full h-full object-contain max-h-[140px] p-1 transition-all ${
                          !isSelected ? "opacity-40 grayscale" : ""
                        }`}
                      />
                    ) : (
                      <FileText size={28} className="text-slate-300" />
                    )}

                    {/* Green Selected Check Badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}

                    {/* Zoom button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewPageIndex(idx);
                      }}
                      className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extract Action Button */}
          <button
            onClick={handleExtract}
            disabled={loading || selectedPages.size === 0}
            style={{
              backgroundColor: selectedPages.size > 0 ? "#15803d" : "#94a3b8",
              color: "#ffffff",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #14532d",
              borderBottom: "2px solid #14532d",
            }}
            className="w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-800 transition-colors shadow-md rounded disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Extracting PDF Pages...
              </>
            ) : (
              <>
                <Download size={20} /> Extract {selectedPages.size} Selected Page{selectedPages.size !== 1 ? "s" : ""} Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Page Zoom Preview Modal */}
      {previewPageIndex !== null && (
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
              <span>Page {previewPageIndex + 1} Preview</span>
              <button
                onClick={() => setPreviewPageIndex(null)}
                className="w-5 h-5 bg-red-600 text-white font-bold text-xs flex items-center justify-center rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-400 mt-1 overflow-y-auto flex flex-col items-center justify-center">
              {thumbnails[previewPageIndex] ? (
                <img
                  src={thumbnails[previewPageIndex]}
                  alt={`Page ${previewPageIndex + 1}`}
                  className="max-h-[65vh] w-auto object-contain border border-slate-300 shadow-md"
                />
              ) : (
                <div className="p-8 text-slate-500 text-xs">No preview</div>
              )}
            </div>

            <div className="mt-2 text-right">
              <button
                onClick={() => setPreviewPageIndex(null)}
                className="px-4 py-1 bg-slate-300 hover:bg-slate-400 font-bold text-xs rounded border border-slate-500"
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
