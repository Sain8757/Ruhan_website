"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileDown, Image, GripVertical, X, Loader2, ArrowLeft, ArrowRight, CheckSquare, Plus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

type PageSize = "a4" | "a3" | "letter" | "fit";
type Orientation = "portrait" | "landscape";

const PAGE_DIMENSIONS: Record<PageSize, { w: number; h: number; label: string }> = {
  a4:     { w: 595.28, h: 841.89, label: "A4" },
  a3:     { w: 841.89, h: 1190.55, label: "A3" },
  letter: { w: 612, h: 792, label: "Letter" },
  fit:    { w: 0, h: 0, label: "Fit to Image" },
};

export default function JpgToPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState(20); // points
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) { toast.error("Please select image files (JPG, PNG, WebP)"); return; }
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  const handleConvert = async () => {
    if (files.length === 0) { toast.error("Please add at least one image"); return; }
    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const buf = await file.arrayBuffer();
        let img;
        if (file.type === "image/png") {
          img = await pdfDoc.embedPng(buf);
        } else {
          img = await pdfDoc.embedJpg(buf);
        }

        if (pageSize === "fit") {
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } else {
          let pw = PAGE_DIMENSIONS[pageSize].w;
          let ph = PAGE_DIMENSIONS[pageSize].h;
          if (orientation === "landscape") [pw, ph] = [ph, pw];
          const page = pdfDoc.addPage([pw, ph]);
          const drawW = pw - margin * 2;
          const drawH = ph - margin * 2;
          const { width, height } = img.scaleToFit(drawW, drawH);
          const x = (pw - width) / 2;
          const y = (ph - height) / 2;
          page.drawImage(img, { x, y, width, height });
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, "RA_Images.pdf");
      toast.success(`${files.length} image(s) converted to PDF and downloaded!`);
    } catch { toast.error("Failed to convert images to PDF"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Drop Zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          backgroundColor: dragOver ? "#fefce8" : "#ffffff",
          borderTop: "2px solid #808080",
          borderLeft: "2px solid #808080",
          borderRight: "2px solid #ffffff",
          borderBottom: "2px solid #ffffff",
          boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
        }}
        className="p-8 text-center cursor-pointer transition-all hover:bg-yellow-50/50 rounded-lg"
      >
        <Image size={36} className="mx-auto mb-2 text-yellow-600" />
        <p className="text-base font-black mb-1" style={{ color: "#000080" }}>Drop JPG / PNG images here</p>
        <p className="text-xs font-semibold text-slate-500">Multiple images supported — Drag to reorder</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <>
          {/* Settings Row */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap gap-4 items-end">
            {/* Page Size */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-600 mb-1">PAGE SIZE</p>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(PAGE_DIMENSIONS) as PageSize[]).map((s) => (
                  <button key={s} onClick={() => setPageSize(s)}
                    className={`px-2.5 py-1 rounded border text-xs font-black cursor-pointer ${pageSize === s ? "bg-yellow-600 text-white border-yellow-700" : "bg-white text-slate-700 border-slate-300 hover:bg-yellow-50"}`}>
                    {PAGE_DIMENSIONS[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation (only when not Fit) */}
            {pageSize !== "fit" && (
              <div>
                <p className="text-[10px] font-extrabold text-slate-600 mb-1">ORIENTATION</p>
                <div className="flex gap-1.5">
                  {(["portrait", "landscape"] as Orientation[]).map((o) => (
                    <button key={o} onClick={() => setOrientation(o)}
                      className={`px-2.5 py-1 rounded border text-xs font-black cursor-pointer capitalize ${orientation === o ? "bg-yellow-600 text-white border-yellow-700" : "bg-white text-slate-700 border-slate-300 hover:bg-yellow-50"}`}>
                      {o === "portrait" ? "📄 Portrait" : "🖼️ Landscape"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Margin Slider */}
            {pageSize !== "fit" && (
              <div className="flex-1 min-w-[120px]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-extrabold text-slate-600">MARGIN</p>
                  <span className="text-[10px] font-black text-yellow-700">{margin}pt</span>
                </div>
                <input type="range" min={0} max={60} step={5} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full accent-yellow-500" />
              </div>
            )}

            {/* Add More Images */}
            <button onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer">
              <Plus size={12} /> Add More Images
            </button>
          </div>

          {/* Image List with Thumbnails & Drag-to-Reorder */}
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
            <p className="text-xs font-extrabold text-slate-700 px-1">{files.length} Image{files.length > 1 ? "s" : ""} — Drag cards or use ↑↓ buttons to reorder</p>
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                draggable
                onDragStart={() => setDraggingIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (draggingIndex !== null && draggingIndex !== i) moveFile(draggingIndex, i); setDraggingIndex(null); }}
                className={`flex items-center gap-3 p-2 bg-white border-2 rounded-lg transition-all cursor-grab ${draggingIndex === i ? "opacity-50 scale-95 border-yellow-400" : "border-slate-200 hover:border-yellow-300"}`}
              >
                <GripVertical size={16} className="text-slate-400 shrink-0" />
                {/* Image thumbnail */}
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate">{file.name}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <span className="text-[10px] font-black text-slate-500 shrink-0">#{i + 1}</span>
                {/* Move Up / Down */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button disabled={i === 0} onClick={() => moveFile(i, i - 1)}
                    className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] disabled:opacity-30 cursor-pointer"><ArrowLeft size={10} /></button>
                  <button disabled={i === files.length - 1} onClick={() => moveFile(i, i + 1)}
                    className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] disabled:opacity-30 cursor-pointer"><ArrowRight size={10} /></button>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Convert Button */}
          <button onClick={handleConvert} disabled={loading}
            style={{
              backgroundColor: "#ca8a04",
              color: "#ffffff",
              borderTop: "2px solid #fef9c3",
              borderLeft: "2px solid #fef9c3",
              borderRight: "2px solid #713f12",
              borderBottom: "2px solid #713f12",
            }}
            className="w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded shadow-md disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Building PDF...</> : <><FileDown size={18} /> Convert {files.length} Image{files.length > 1 ? "s" : ""} → PDF</>}
          </button>
        </>
      )}
    </div>
  );
}
