"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Minimize, FileText, Loader2, X } from "lucide-react";
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

function formatSize(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`;
}

export default function CompressPdfTool() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [quality, setQuality] = useState<number>(50); // 1 to 100
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<{ original: number; compressed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
    setResult(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      setProgress("Loading PDF Engine...");
      const pdfjs = await loadPdfJs();
      
      const buf = await file.arrayBuffer();
      setProgress("Reading PDF...");
      const pdf = await pdfjs.getDocument(buf).promise;
      const totalPages = pdf.numPages;

      const newPdfDoc = await PDFDocument.create();

      // Adjust scale dynamically based on quality to reach very small KB sizes
      let scale = 1.5;
      if (quality <= 30) scale = 1.0;
      if (quality <= 15) scale = 0.7;

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Compressing page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Force a minimum quality of 0.05 so it doesn't break
        const imgData = canvas.toDataURL("image/jpeg", Math.max(0.05, quality / 100));
        const img = await newPdfDoc.embedJpg(imgData);
        
        const pdfPage = newPdfDoc.addPage([viewport.width / scale, viewport.height / scale]);
        pdfPage.drawImage(img, {
          x: 0,
          y: 0,
          width: viewport.width / scale,
          height: viewport.height / scale,
        });
      }

      setProgress("Saving compressed PDF...");
      const bytes = await newPdfDoc.save();

      const originalSize = file.size;
      const compressedSize = bytes.length;
      setResult({ original: originalSize, compressed: compressedSize });

      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `RA_Compressed_${quality}q.pdf`; a.click();
      URL.revokeObjectURL(url);
      
      if (compressedSize < originalSize) {
        toast.success(`Success! Saved ${((1 - compressedSize / originalSize) * 100).toFixed(1)}% space.`);
      } else {
        toast.info("Compressed file is larger. Try a lower quality percentage.");
      }
    } catch { toast.error("Failed to compress PDF"); } finally { setLoading(false); setProgress(""); }
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val < 1) val = 1;
    if (val > 100) val = 100;
    setQuality(val);
  };

  // Rough estimation formula: a mix of linear and exponential scaling to simulate JPEG size reduction
  const estimatedSize = file ? file.size * Math.pow(quality / 100, 1.3) : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-teal-400 bg-teal-50" : "border-gray-300 hover:border-teal-400 hover:bg-teal-50/30"}`}
        >
          <Minimize size={40} className="mx-auto mb-4 text-teal-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop PDF to compress</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Original Size: <strong className="text-red-500">{formatSize(file.size)}</strong></p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
          </div>

          <div className="bg-white border p-5 rounded-xl space-y-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="label mb-0">Compression Quality</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={quality} 
                  onChange={handleQualityChange}
                  className="w-16 p-1 border rounded text-center font-bold text-teal-600 focus:outline-none focus:border-teal-500"
                  style={{ borderColor: "var(--border-color)" }}
                />
                <span className="text-xl font-bold text-teal-600">%</span>
              </div>
            </div>
            <input 
              type="range" 
              min={1} 
              max={100} 
              step={1} 
              value={quality} 
              onChange={(e) => setQuality(+e.target.value)} 
              className="w-full accent-teal-500" 
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>Smallest Size (1%)</span>
              <span>Highest Quality (100%)</span>
            </div>
            
            <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-lg flex justify-between items-center text-teal-800">
              <span className="font-medium text-sm">Estimated Size:</span>
              <span className="font-bold text-lg">{formatSize(estimatedSize)}</span>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
              <strong>Note:</strong> Very low quality (under 20%) will reduce image resolution to achieve extreme small sizes (like 50kb). Text may become blurry.
            </p>
          </div>

          {result && (
            <div className={`p-4 rounded-xl border flex items-center justify-between ${result.compressed < result.original ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <div>
                <p className="text-sm font-semibold mb-1">Compression Result</p>
                <div className="text-2xl font-bold">
                  {formatSize(result.compressed)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Reduced by</p>
                <p className="text-xl font-bold">
                  {result.compressed < result.original 
                    ? ((1 - result.compressed / result.original) * 100).toFixed(1) + "%" 
                    : "+0%"}
                </p>
              </div>
            </div>
          )}

          <button onClick={handleCompress} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> {progress}</> : <><Minimize size={22} /> Compress & Download PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
