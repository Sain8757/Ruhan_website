"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, X, FileText, Download, CheckSquare, Square } from "lucide-react";
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

export default function PdfToJpgTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [scale, setScale] = useState(2);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
    setThumbnails({});
    setLoadingPreviews(true);

    try {
      const pdfjs = await loadPdfJs();
      const buf = await incoming.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const count = pdf.numPages;
      setTotalPages(count);
      setSelectedPages(new Set(Array.from({ length: count }, (_, i) => i + 1)));

      const thumbs: { [key: number]: string } = {};
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs[i] = canvas.toDataURL("image/jpeg", 0.7);
      }
      setThumbnails(thumbs);
    } catch { toast.error("Failed to read PDF"); } finally { setLoadingPreviews(false); }
  };

  const togglePage = (num: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const handleConvert = async () => {
    if (!file) return;
    if (selectedPages.size === 0) { toast.error("Select at least one page to convert"); return; }
    setLoading(true);
    setProgress("Loading PDF.js...");
    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

      const sorted = Array.from(selectedPages).sort((a, b) => a - b);
      for (const i of sorted) {
        setProgress(`Converting page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;

        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const quality = format === "jpg" ? 0.95 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        downloadWithRename(dataUrl, `RA_Page_${i}.${format}`);
        await new Promise((r) => setTimeout(r, 200));
      }
      toast.success(`${sorted.length} page(s) converted to ${format.toUpperCase()} and downloaded!`);
    } catch { toast.error("Failed to convert PDF"); } finally { setLoading(false); setProgress(""); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            backgroundColor: dragOver ? "#fffbeb" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-amber-50/50 rounded-lg"
        >
          <ImageIcon size={40} className="mx-auto mb-3 text-amber-500" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>Drop PDF here to Convert Pages to Images</p>
          <p className="text-xs font-semibold text-slate-500">Supports JPG & PNG — Select which pages to convert</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* File Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-300 rounded-lg shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={26} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">{file.name}</p>
                <p className="text-xs font-semibold text-slate-500">{formatFileSize(file.size)} • {totalPages} Pages</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setThumbnails({}); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer">
              <X size={14} /> Remove
            </button>
          </div>

          {/* Settings Row */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap items-center gap-4">
            {/* Format Picker */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-600 mb-1">OUTPUT FORMAT</p>
              <div className="flex gap-2">
                {(["jpg", "png"] as const).map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`px-3 py-1 rounded border text-xs font-black uppercase cursor-pointer ${format === f ? "bg-amber-600 text-white border-amber-700" : "bg-white text-slate-700 border-slate-300 hover:bg-amber-50"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div className="flex-1 min-w-[140px]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-extrabold text-slate-600">QUALITY / SCALE</p>
                <span className="text-xs font-black text-amber-700">{scale}x</span>
              </div>
              <input type="range" min={1} max={4} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-amber-500" />
              <div className="flex justify-between text-[9px] font-semibold text-slate-500 mt-0.5">
                <span>1x Fast</span><span>4x HD</span>
              </div>
            </div>

            {/* Select All / Deselect All */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)))}
                className="px-2 py-1 text-[10px] font-bold bg-green-100 hover:bg-green-200 text-green-900 rounded border border-green-300 cursor-pointer flex items-center gap-1">
                <CheckSquare size={11} /> All
              </button>
              <button onClick={() => setSelectedPages(new Set())}
                className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 cursor-pointer flex items-center gap-1">
                <Square size={11} /> None
              </button>
            </div>
          </div>

          {/* Page Selection Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[380px] overflow-y-auto p-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
              const selected = selectedPages.has(num);
              return (
                <div key={num} onClick={() => togglePage(num)}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all p-1 ${selected ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-400"}`}>
                  {/* Checkbox overlay */}
                  <div className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-black ${selected ? "bg-amber-600" : "bg-slate-300"}`}>
                    {selected ? "✓" : ""}
                  </div>
                  {/* Thumbnail */}
                  <div className="min-h-[90px] flex items-center justify-center bg-white rounded border border-slate-100 overflow-hidden">
                    {loadingPreviews ? (
                      <Loader2 size={14} className="animate-spin text-amber-500" />
                    ) : thumbnails[num] ? (
                      <img src={thumbnails[num]} alt={`Page ${num}`} className="w-full object-contain max-h-[88px]" />
                    ) : (
                      <FileText size={20} className="text-slate-300" />
                    )}
                  </div>
                  <p className="text-center text-[10px] font-black text-slate-700 mt-1">Pg {num}</p>
                </div>
              );
            })}
          </div>

          {/* Convert Button */}
          <button onClick={handleConvert} disabled={loading || loadingPreviews || selectedPages.size === 0}
            style={{
              backgroundColor: "#d97706",
              color: "#ffffff",
              borderTop: "2px solid #fef3c7",
              borderLeft: "2px solid #fef3c7",
              borderRight: "2px solid #78350f",
              borderBottom: "2px solid #78350f",
            }}
            className="w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded shadow-md disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 size={18} className="animate-spin" /> {progress || "Converting..."}</> : <><Download size={18} /> Convert {selectedPages.size} Page(s) to {format.toUpperCase()}</>}
          </button>
        </div>
      )}
    </div>
  );
}
