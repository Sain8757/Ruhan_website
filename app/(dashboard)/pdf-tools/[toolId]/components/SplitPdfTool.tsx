"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Scissors, FileText, Loader2, X, CheckSquare, Square, Eye, Check, Layers, Sliders, Layers2, Download } from "lucide-react";
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

type SplitMode = "visual" | "range" | "every" | "interval";

export default function SplitPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>("visual");
  const [loading, setLoading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Page Thumbnails & Selection
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Mode settings
  const [rangeInput, setRangeInput] = useState("");
  const [intervalPages, setIntervalPages] = useState(2);
  const [exportOption, setExportOption] = useState<"merged" | "individual">("merged");

  // Modal preview
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    setFile(incoming);
    setThumbnails({});
    setSelectedPages([]);
    setLoadingPreviews(true);

    try {
      const buf = await incoming.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = doc.getPageCount();
      setTotalPages(total);
      
      // Default select all pages
      const allIndices = Array.from({ length: total }, (_, i) => i);
      setSelectedPages(allIndices);
      setRangeInput(`1-${total}`);

      // Generate page thumbnails using PDF.js
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
    setSelectedPages((prev) =>
      prev.includes(pageIdx) ? prev.filter((p) => p !== pageIdx) : [...prev, pageIdx].sort((a, b) => a - b)
    );
  };

  const selectAll = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
  };

  const deselectAll = () => {
    setSelectedPages([]);
  };

  const invertSelection = () => {
    setSelectedPages((prev) =>
      Array.from({ length: totalPages }, (_, i) => i).filter((i) => !prev.includes(i))
    );
  };

  // Parse page range input (e.g. "1-3, 5, 8-10")
  const parseRangeString = (str: string, maxPages: number): number[] => {
    const pagesSet = new Set<number>();
    const parts = str.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let i = min; i <= max; i++) {
            pagesSet.add(i - 1);
          }
        }
      } else {
        const val = parseInt(trimmed, 10);
        if (!isNaN(val) && val >= 1 && val <= maxPages) {
          pagesSet.add(val - 1);
        }
      }
    }
    return Array.from(pagesSet).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });

      if (splitMode === "visual") {
        if (selectedPages.length === 0) {
          toast.error("Please select at least 1 page to extract");
          setLoading(false);
          return;
        }

        if (exportOption === "individual") {
          for (const pageIdx of selectedPages) {
            const newDoc = await PDFDocument.create();
            const [page] = await newDoc.copyPages(srcDoc, [pageIdx]);
            newDoc.addPage(page);
            const bytes = await newDoc.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            downloadWithRename(url, `RA_Page_${pageIdx + 1}.pdf`);
          }
          toast.success(`Exported ${selectedPages.length} individual page PDFs!`);
        } else {
          const newDoc = await PDFDocument.create();
          const pages = await newDoc.copyPages(srcDoc, selectedPages);
          pages.forEach((p) => newDoc.addPage(p));
          const bytes = await newDoc.save();
          const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          downloadWithRename(url, `RA_Extracted_Pages.pdf`);
          toast.success(`Extracted ${selectedPages.length} pages into 1 merged PDF!`);
        }
      } else if (splitMode === "range") {
        const pagesToExtract = parseRangeString(rangeInput, totalPages);
        if (pagesToExtract.length === 0) {
          toast.error("Invalid page range entered. E.g. use '1-3, 5'");
          setLoading(false);
          return;
        }

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, pagesToExtract);
        pages.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        downloadWithRename(url, `RA_Split_Range.pdf`);
        toast.success(`Extracted range ${rangeInput} into PDF!`);
      } else if (splitMode === "every") {
        for (let i = 0; i < totalPages; i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          downloadWithRename(url, `RA_Page_${i + 1}.pdf`);
        }
        toast.success(`Split into ${totalPages} individual page PDFs!`);
      } else if (splitMode === "interval") {
        const numChunks = Math.ceil(totalPages / intervalPages);
        for (let c = 0; c < numChunks; c++) {
          const start = c * intervalPages;
          const end = Math.min(start + intervalPages, totalPages);
          const indices = Array.from({ length: end - start }, (_, i) => start + i);

          const newDoc = await PDFDocument.create();
          const pages = await newDoc.copyPages(srcDoc, indices);
          pages.forEach((p) => newDoc.addPage(p));
          const bytes = await newDoc.save();
          const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          downloadWithRename(url, `RA_Part_${c + 1}_P${start + 1}-${end}.pdf`);
        }
        toast.success(`Split into ${numChunks} PDF files (every ${intervalPages} pages)!`);
      }
    } catch {
      toast.error("Failed to split PDF file");
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
            backgroundColor: dragOver ? "#fff7ed" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-orange-50/50 rounded-lg"
        >
          <Scissors size={40} className="mx-auto mb-3 text-orange-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here to see Visual Page Splitter
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
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <X size={16} /> Remove PDF
            </button>
          </div>

          {/* 4 Pro Split Modes Selection Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "visual", label: "🔲 Select Pages Visually", desc: "Click pages to pick" },
              { id: "range", label: "📏 Custom Range", desc: "e.g. 1-3, 5, 8" },
              { id: "every", label: "✂️ Split All Pages", desc: "Extract 1 by 1" },
              { id: "interval", label: "📊 Fixed Interval", desc: "Split every N pages" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSplitMode(m.id as SplitMode)}
                style={{
                  backgroundColor: splitMode === m.id ? "#ea580c" : "#d4d0c8",
                  color: splitMode === m.id ? "#ffffff" : "#000000",
                  borderTop: "2px solid #ffffff",
                  borderLeft: "2px solid #ffffff",
                  borderRight: "2px solid #404040",
                  borderBottom: "2px solid #404040",
                }}
                className="p-2.5 text-left rounded cursor-pointer transition-all shadow-xs"
              >
                <div className="font-black text-xs">{m.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Mode 1: Interactive Visual Page Grid */}
          {splitMode === "visual" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800">
                    Selected {selectedPages.length} of {totalPages} pages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={invertSelection}
                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300"
                  >
                    Invert
                  </button>
                </div>
              </div>

              {/* Export Mode Toggle */}
              <div className="flex items-center gap-4 bg-orange-50/70 p-3 rounded-lg border border-orange-200 text-xs">
                <span className="font-bold text-orange-950">Export Selected Pages as:</span>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="exportOpt"
                    checked={exportOption === "merged"}
                    onChange={() => setExportOption("merged")}
                    className="accent-orange-600"
                  />
                  Single Merged PDF
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="exportOpt"
                    checked={exportOption === "individual"}
                    onChange={() => setExportOption("individual")}
                    className="accent-orange-600"
                  />
                  Individual Separate PDFs
                </label>
              </div>

              {/* Visual Page Thumbnails Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
                {Array.from({ length: totalPages }, (_, idx) => {
                  const isSelected = selectedPages.includes(idx);
                  const thumb = thumbnails[idx];

                  return (
                    <div
                      key={idx}
                      onClick={() => togglePageSelection(idx)}
                      style={{
                        backgroundColor: isSelected ? "#fff7ed" : "#ffffff",
                        borderColor: isSelected ? "#ea580c" : "#cbd5e1",
                      }}
                      className={`relative p-2 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between group ${
                        isSelected ? "shadow-md ring-2 ring-orange-500/20" : "opacity-80 hover:opacity-100 hover:border-slate-400"
                      }`}
                    >
                      {/* Checkbox badge */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-700"
                        }`}>
                          Page {idx + 1}
                        </span>
                        {isSelected ? (
                          <CheckSquare size={16} className="text-orange-600" />
                        ) : (
                          <Square size={16} className="text-slate-400" />
                        )}
                      </div>

                      {/* Thumbnail Image */}
                      <div className="relative bg-white border border-slate-200 rounded overflow-hidden min-h-[130px] flex items-center justify-center">
                        {loadingPreviews ? (
                          <Loader2 size={16} className="animate-spin text-orange-500" />
                        ) : thumb ? (
                          <img src={thumb} alt={`Page ${idx + 1}`} className="w-full h-full object-contain max-h-[140px] p-1" />
                        ) : (
                          <FileText size={28} className="text-slate-300" />
                        )}
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPageIndex(idx);
                          }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[11px] font-bold"
                        >
                          <Eye size={14} /> Zoom
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Range Input */}
          {splitMode === "range" && (
            <div className="bg-white p-5 rounded-lg border border-slate-300 space-y-3">
              <label className="text-xs font-black text-slate-800 block">
                Enter Page Numbers / Ranges (e.g., "1-3, 5, 8-10"):
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-3, 5, 7-9"
                className="w-full p-2.5 text-base font-extrabold border border-slate-400 rounded outline-none focus:border-orange-500"
              />
              <p className="text-xs text-slate-500">
                Total available pages in this PDF: <strong className="text-slate-800">{totalPages} pages</strong>
              </p>
            </div>
          )}

          {/* Mode 3: Split Every Page */}
          {splitMode === "every" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="font-extrabold text-sm text-orange-900">
                ✂️ Will extract every page into {totalPages} separate individual 1-page PDF files.
              </p>
            </div>
          )}

          {/* Mode 4: Fixed Interval */}
          {splitMode === "interval" && (
            <div className="bg-white p-5 rounded-lg border border-slate-300 space-y-3">
              <label className="text-xs font-black text-slate-800 block">
                Split PDF every N pages:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={intervalPages}
                  onChange={(e) => setIntervalPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 p-2.5 text-xl font-extrabold text-center border border-slate-400 rounded"
                />
                <span className="text-xs font-bold text-slate-700">
                  Will create {Math.ceil(totalPages / intervalPages)} PDF files ({intervalPages} pages per file)
                </span>
              </div>
            </div>
          )}

          {/* Split Action Button */}
          <button
            onClick={handleSplit}
            disabled={loading}
            style={{
              backgroundColor: "#ea580c",
              color: "#ffffff",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #9a3412",
              borderBottom: "2px solid #9a3412",
            }}
            className="w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-orange-700 transition-colors shadow-md rounded"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Splitting PDF...
              </>
            ) : (
              <>
                <Scissors size={20} /> Execute Split PDF Now
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
