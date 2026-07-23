"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { ListOrdered, GripVertical, FileText, Loader2, X } from "lucide-react";
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

export default function ReorderPagesTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
    setThumbnails({});
    try {
      setLoadingPreviews(true);
      const buf = await incoming.arrayBuffer();
      
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setPageOrder(Array.from({ length: count }, (_, i) => i));

      // Generate thumbnails with pdf.js
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument(buf).promise;
      const thumbs: { [key: number]: string } = {};
      
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        // Using scale 0.6 to ensure it stays sharp when zooming in on hover
        const viewport = page.getViewport({ scale: 0.6 }); 
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs[i - 1] = canvas.toDataURL("image/jpeg", 0.7); // key is 0-indexed original page
      }
      setThumbnails(thumbs);
    } catch { toast.error("Failed to read PDF"); } finally { setLoadingPreviews(false); }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...pageOrder];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPageOrder(updated);
  };

  const handleSave = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, pageOrder);
      pages.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Organized.pdf`);
      toast.success("PDF organized and downloaded!");
    } catch { toast.error("Failed to reorder PDF"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30"}`}
        >
          <ListOrdered size={40} className="mx-auto mb-4 text-indigo-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop PDF to reorder pages</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{pageOrder.length} pages — drag to reorder</p>
            </div>
            <button onClick={() => { setFile(null); setPageOrder([]); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
          </div>

          {loadingPreviews ? (
            <div className="p-10 flex flex-col items-center justify-center text-gray-400 border rounded-xl border-dashed">
              <Loader2 size={30} className="animate-spin mb-3 text-indigo-500" />
              <p>Generating previews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pt-4 pb-12">
              {pageOrder.map((originalPage, idx) => (
                <div
                  key={originalPage}
                  draggable
                  onDragStart={() => setDraggingIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (draggingIndex !== null && draggingIndex !== idx) handleReorder(draggingIndex, idx); setDraggingIndex(null); }}
                  className={`relative flex flex-col items-center gap-2 cursor-grab transition-transform duration-200 ease-out origin-center ${draggingIndex === idx ? "opacity-60 scale-75 z-0" : "hover:scale-[1.8] hover:z-50 hover:shadow-2xl"}`}
                >
                  <div className={`w-full aspect-[1/1.4] rounded-lg border-2 overflow-hidden bg-gray-50 flex items-center justify-center transition-all ${draggingIndex === idx ? "border-indigo-400 border-dashed" : "border-gray-200"}`}>
                    {thumbnails[originalPage] ? (
                      <img 
                        src={thumbnails[originalPage]} 
                        alt={`Page ${originalPage + 1}`} 
                        className="w-full h-full object-contain pointer-events-none bg-white"
                      />
                    ) : (
                      <span className="text-gray-300 font-bold">{originalPage + 1}</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs pointer-events-none shadow-sm">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleSave} disabled={loading || loadingPreviews} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> Saving...</> : <><ListOrdered size={22} /> Save Organized PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
