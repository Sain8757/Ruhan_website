"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { RefreshCw, FileText, Loader2, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

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

const ROTATION_OPTIONS = [
  { label: "90° CW", value: 90 },
  { label: "180°", value: 180 },
  { label: "90° CCW", value: 270 },
];

export default function RotatePdfTool() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [rotation, setRotation] = useState(90);
  const [selectedPages, setSelectedPages] = useState<"all" | Set<number>>("all");
  const [loading, setLoading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming); setSelectedPages("all"); setThumbnails([]);
    try {
      setLoadingPreviews(true);
      const buf = await incoming.arrayBuffer();
      
      // Load with pdf-lib to get count
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setTotalPages(count);

      // Generate thumbnails with pdf.js
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument(buf).promise;
      const thumbs: string[] = [];
      
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnail
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL("image/jpeg", 0.5));
      }
      setThumbnails(thumbs);
    } catch { toast.error("Failed to read PDF"); } finally { setLoadingPreviews(false); }
  };

  const togglePage = (i: number) => {
    if (selectedPages === "all") {
      const set = new Set<number>();
      for (let p = 0; p < totalPages; p++) {
        if (p !== i) set.add(p);
      }
      setSelectedPages(set);
    } else {
      const next = new Set(selectedPages);
      if (next.has(i)) { 
        next.delete(i); 
        if (next.size === 0) setSelectedPages("all"); else setSelectedPages(next); 
      } else { 
        next.add(i); 
        if (next.size === totalPages) setSelectedPages("all"); else setSelectedPages(next); 
      }
    }
  };

  const handleRotate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pagesToRotate = selectedPages === "all" 
        ? Array.from({ length: totalPages }, (_, i) => i) 
        : Array.from(selectedPages as Set<number>);
      pagesToRotate.forEach((i) => {
        const page = doc.getPage(i);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotation) % 360));
      });
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `RA_Rotated.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF rotated and downloaded!");
    } catch { toast.error("Failed to rotate PDF"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-purple-400 bg-purple-50" : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/30"}`}
        >
          <RefreshCw size={40} className="mx-auto mb-4 text-purple-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop PDF to rotate pages</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{totalPages} pages</p>
            </div>
            <button onClick={() => { setFile(null); setTotalPages(0); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
          </div>

          {/* Rotation Amount */}
          <div>
            <p className="label mb-3">Rotation Amount</p>
            <div className="flex gap-3">
              {ROTATION_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setRotation(opt.value)}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${rotation === opt.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label mb-0">Pages to rotate</p>
              <button onClick={() => setSelectedPages("all")} className="text-xs text-blue-500 underline">Rotate All</button>
            </div>
            
            {loadingPreviews ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400 border rounded-xl border-dashed">
                <Loader2 size={30} className="animate-spin mb-3 text-purple-500" />
                <p>Generating previews...</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {Array.from({ length: totalPages }, (_, i) => {
                  const isSelected = selectedPages === "all" || (selectedPages as Set<number>).has(i);
                  const rotationAngle = isSelected ? rotation : 0;
                  
                  return (
                    <button key={i} onClick={() => togglePage(i)}
                      className={`relative flex flex-col items-center gap-2 group`}>
                      <div className={`w-full aspect-[1/1.4] rounded-lg border-2 overflow-hidden bg-gray-50 flex items-center justify-center transition-all ${isSelected ? "border-purple-500 shadow-md" : "border-gray-200 hover:border-gray-400"}`}>
                        {thumbnails[i] ? (
                          <img 
                            src={thumbnails[i]} 
                            alt={`Page ${i+1}`} 
                            className="w-full h-full object-contain transition-transform duration-300"
                            style={{ transform: `rotate(${rotationAngle}deg)` }}
                          />
                        ) : (
                          <span className="text-gray-300 font-bold">{i + 1}</span>
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                        {i + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={handleRotate} disabled={loading || loadingPreviews} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #a855f7, #9333ea)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> Rotating...</> : <><RefreshCw size={22} /> Rotate & Download</>}
          </button>
        </div>
      )}
    </div>
  );
}
