"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, X, FileText } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from \"@/contexts/DownloadContext\";

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

export default function PdfToJpgTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [scale, setScale] = useState(2);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setProgress("Loading PDF.js...");
    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      setProgress("Reading PDF...");
      const pdf = await pdfjs.getDocument(buf).promise;
      const totalPages = pdf.numPages;

      setProgress(`Converting ${totalPages} pages...`);

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Converting page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const quality = format === "jpg" ? 1.0 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        downloadWithRename(dataUrl, `RA_Page_${i}.${format}`);
        await new Promise((r) => setTimeout(r, 200)); // Small delay between downloads
      }
      toast.success(`${totalPages} page(s) converted to ${format.toUpperCase()}!`);
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
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-amber-400 bg-amber-50" : "border-gray-300 hover:border-amber-400 hover:bg-amber-50/30"}`}
        >
          <ImageIcon size={40} className="mx-auto mb-4 text-amber-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop PDF to convert to images</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
          </div>

          {/* Format */}
          <div>
            <p className="label mb-2">Output Format</p>
            <div className="flex gap-3">
              {(["jpg", "png"] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 uppercase transition-all ${format === f ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-amber-300"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label mb-0">Quality / Scale</p>
              <span className="text-sm font-bold text-amber-600">{scale}x</span>
            </div>
            <input type="range" min={1} max={4} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-amber-500" />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>1x (Fast)</span><span>4x (High Quality)</span>
            </div>
          </div>

          <button onClick={handleConvert} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> {progress || "Converting..."}</> : <><ImageIcon size={22} /> Convert to {format.toUpperCase()}</>}
          </button>
        </div>
      )}
    </div>
  );
}
