"use client";

import { useRef, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { RefreshCw, RotateCcw, RotateCw, FileText, Loader2, X, Eye, Check, Undo2 } from "lucide-react";
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

export default function RotatePdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Per-page rotation angles in degrees (0, 90, 180, 270)
  const [pageRotations, setPageRotations] = useState<{ [pageIdx: number]: number }>({});

  // Page Thumbnails
  const [thumbnails, setThumbnails] = useState<{ [pageIdx: number]: string }>({});

  // Modal preview
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    setFile(incoming);
    setPageRotations({});
    setThumbnails({});
    setLoadingPreviews(true);

    try {
      const buf = await incoming.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = doc.getPageCount();
      setTotalPages(total);

      // Initial rotations set to 0
      const initRot: { [key: number]: number } = {};
      for (let i = 0; i < total; i++) initRot[i] = 0;
      setPageRotations(initRot);

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

  const rotateSinglePage = (pageIdx: number, delta: number) => {
    setPageRotations((prev) => {
      const current = prev[pageIdx] || 0;
      const nextAngle = (current + delta + 360) % 360;
      return { ...prev, [pageIdx]: nextAngle };
    });
  };

  const rotateAll = (delta: number) => {
    setPageRotations((prev) => {
      const next: { [key: number]: number } = {};
      for (let i = 0; i < totalPages; i++) {
        const current = prev[i] || 0;
        next[i] = (current + delta + 360) % 360;
      }
      return next;
    });
  };

  const resetAllRotations = () => {
    const resetRot: { [key: number]: number } = {};
    for (let i = 0; i < totalPages; i++) resetRot[i] = 0;
    setPageRotations(resetRot);
    toast.success("All rotations reset to 0°");
  };

  const rotateOdd = (delta: number) => {
    setPageRotations((prev) => {
      const next = { ...prev };
      for (let i = 0; i < totalPages; i += 2) {
        const current = prev[i] || 0;
        next[i] = (current + delta + 360) % 360;
      }
      return next;
    });
  };

  const rotateEven = (delta: number) => {
    setPageRotations((prev) => {
      const next = { ...prev };
      for (let i = 1; i < totalPages; i += 2) {
        const current = prev[i] || 0;
        next[i] = (current + delta + 360) % 360;
      }
      return next;
    });
  };

  const handleSaveRotatedPdf = async () => {
    if (!file) return;

    // Check if any page was rotated
    const hasRotations = Object.values(pageRotations).some((angle) => angle !== 0);
    if (!hasRotations) {
      toast.error("No rotations applied. Rotate at least 1 page before saving.");
      return;
    }

    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });

      for (let i = 0; i < totalPages; i++) {
        const rotAngle = pageRotations[i] || 0;
        if (rotAngle !== 0) {
          const page = doc.getPage(i);
          const existingAngle = page.getRotation().angle;
          page.setRotation(degrees((existingAngle + rotAngle) % 360));
        }
      }

      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Rotated.pdf`);
      toast.success("Rotated PDF created and downloaded!");
    } catch {
      toast.error("Failed to save rotated PDF");
    } finally {
      setLoading(false);
    }
  };

  const rotatedCount = Object.values(pageRotations).filter((a) => a !== 0).length;

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
            backgroundColor: dragOver ? "#faf5ff" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-purple-50/50 rounded-lg"
        >
          <RefreshCw size={40} className="mx-auto mb-3 text-purple-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here to see Visual Page Rotator
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
                setPageRotations({});
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X size={16} /> Remove PDF
            </button>
          </div>

          {/* Global Bulk Rotation Helper Toolbar */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  Rotated <span className="text-purple-700">{rotatedCount}</span> of {totalPages} pages
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => rotateAll(90)}
                  className="px-2.5 py-1 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded border border-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw size={13} /> Rotate All 90° CW
                </button>
                <button
                  type="button"
                  onClick={() => rotateAll(-90)}
                  className="px-2.5 py-1 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded border border-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} /> Rotate All 90° CCW
                </button>
                <button
                  type="button"
                  onClick={() => rotateAll(180)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 cursor-pointer"
                >
                  Flip All 180°
                </button>
                <button
                  type="button"
                  onClick={resetAllRotations}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 size={13} /> Reset All 0°
                </button>
              </div>
            </div>

            {/* Odd/Even Quick Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-xs font-bold text-slate-700">
              <span>Quick Batch:</span>
              <button
                type="button"
                onClick={() => rotateOdd(90)}
                className="px-2.5 py-0.5 bg-white hover:bg-slate-200 rounded border border-slate-300 cursor-pointer text-slate-800"
              >
                Rotate Odd (1, 3, 5) 90°
              </button>
              <button
                type="button"
                onClick={() => rotateEven(90)}
                className="px-2.5 py-0.5 bg-white hover:bg-slate-200 rounded border border-slate-300 cursor-pointer text-slate-800"
              >
                Rotate Even (2, 4, 6) 90°
              </button>
            </div>
          </div>

          {/* Visual Page Grid with Real-Time CSS Rotation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
            {Array.from({ length: totalPages }, (_, idx) => {
              const rotAngle = pageRotations[idx] || 0;
              const thumb = thumbnails[idx];

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: rotAngle !== 0 ? "#faf5ff" : "#ffffff",
                    borderColor: rotAngle !== 0 ? "#a855f7" : "#cbd5e1",
                  }}
                  className={`relative p-2 rounded-lg border-2 transition-all flex flex-col justify-between group ${
                    rotAngle !== 0 ? "shadow-md ring-2 ring-purple-500/20" : "hover:border-slate-400"
                  }`}
                >
                  {/* Badge & Status Header */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      rotAngle !== 0 ? "bg-purple-700 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      Page {idx + 1}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      rotAngle !== 0 ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {rotAngle}°
                    </span>
                  </div>

                  {/* Thumbnail Image Container with Animated CSS Rotation */}
                  <div className="relative bg-white border border-slate-200 rounded overflow-hidden min-h-[140px] flex items-center justify-center p-2">
                    {loadingPreviews ? (
                      <Loader2 size={16} className="animate-spin text-purple-600" />
                    ) : thumb ? (
                      <img
                        src={thumb}
                        alt={`Page ${idx + 1}`}
                        style={{
                          transform: `rotate(${rotAngle}deg)`,
                        }}
                        className="w-full h-full object-contain max-h-[130px] transition-transform duration-300 ease-out"
                      />
                    ) : (
                      <FileText size={28} className="text-slate-300" />
                    )}

                    {/* Zoom button */}
                    <button
                      type="button"
                      onClick={() => setPreviewPageIndex(idx)}
                      className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Eye size={12} />
                    </button>
                  </div>

                  {/* Per-Page Quick Rotation Action Buttons */}
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => rotateSinglePage(idx, -90)}
                      title="Rotate 90° Left"
                      className="py-1 bg-purple-50 hover:bg-purple-200 text-purple-900 rounded border border-purple-200 text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw size={11} /> ↺ 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateSinglePage(idx, 90)}
                      title="Rotate 90° Right"
                      className="py-1 bg-purple-50 hover:bg-purple-200 text-purple-900 rounded border border-purple-200 text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      ↻ 90° <RotateCw size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotate & Save Action Button */}
          <button
            onClick={handleSaveRotatedPdf}
            disabled={loading || loadingPreviews}
            style={{
              backgroundColor: "#9333ea",
              color: "#ffffff",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #6b21a8",
              borderBottom: "2px solid #6b21a8",
            }}
            className="w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-800 transition-colors shadow-md rounded disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Saving Rotated PDF...
              </>
            ) : (
              <>
                <RefreshCw size={20} /> Save Rotated PDF Now ({rotatedCount} Pages Modified)
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
              <span>Page {previewPageIndex + 1} Rotated Preview ({pageRotations[previewPageIndex] || 0}°)</span>
              <button
                onClick={() => setPreviewPageIndex(null)}
                className="w-5 h-5 bg-red-600 text-white font-bold text-xs flex items-center justify-center rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-400 mt-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px]">
              {thumbnails[previewPageIndex] ? (
                <img
                  src={thumbnails[previewPageIndex]}
                  alt={`Page ${previewPageIndex + 1}`}
                  style={{
                    transform: `rotate(${pageRotations[previewPageIndex] || 0}deg)`,
                  }}
                  className="max-h-[60vh] w-auto object-contain border border-slate-300 shadow-md transition-transform duration-300"
                />
              ) : (
                <div className="p-8 text-slate-500 text-xs">No preview</div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => rotateSinglePage(previewPageIndex, -90)}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded border border-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} /> Rotate 90° CCW
                </button>
                <button
                  onClick={() => rotateSinglePage(previewPageIndex, 90)}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded border border-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  Rotate 90° CW <RotateCw size={13} />
                </button>
              </div>

              <button
                onClick={() => setPreviewPageIndex(null)}
                className="px-4 py-1 bg-slate-300 hover:bg-slate-400 font-bold text-xs rounded border border-slate-500 cursor-pointer"
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
