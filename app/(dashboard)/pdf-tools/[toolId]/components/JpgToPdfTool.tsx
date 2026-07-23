"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileDown, Image, GripVertical, X, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function JpgToPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "fit">("a4");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) { toast.error("Please select image files (JPG, PNG)"); return; }
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleReorder = (fromIndex: number, toIndex: number) => {
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
        let page;
        if (pageSize === "a4") {
          page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
          const { width, height } = img.scaleToFit(595.28, 841.89);
          const x = (595.28 - width) / 2;
          const y = (841.89 - height) / 2;
          page.drawImage(img, { x, y, width, height });
        } else {
          page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
      }
      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, "RA_Images.pdf");
      toast.success(`${files.length} image(s) converted to PDF!`);
    } catch { toast.error("Failed to convert images to PDF"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-yellow-400 bg-yellow-50" : "border-gray-300 hover:border-yellow-400 hover:bg-yellow-50/30"}`}
      >
        <Image size={36} className="mx-auto mb-3 text-yellow-500" />
        <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop JPG/PNG images here</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Multiple images supported — drag to reorder</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <>
          <div>
            <p className="label mb-2">Page Size</p>
            <div className="flex gap-3">
              {[{ id: "a4", label: "A4 (Fit to Page)" }, { id: "fit", label: "Original Size" }].map((opt) => (
                <button key={opt.id} onClick={() => setPageSize(opt.id as any)}
                  className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all ${pageSize === opt.id ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-600 hover:border-yellow-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="label mb-2">{files.length} image{files.length > 1 ? "s" : ""} — drag to reorder</p>
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                draggable
                onDragStart={() => setDraggingIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (draggingIndex !== null && draggingIndex !== i) handleReorder(draggingIndex, i); setDraggingIndex(null); }}
                className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all ${draggingIndex === i ? "opacity-50 scale-95" : "hover:border-yellow-300"}`}
                style={{ borderColor: "var(--border-color)" }}
              >
                <GripVertical size={18} className="cursor-grab text-gray-400" />
                {/* Image thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-12 h-12 object-cover rounded-lg border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatFileSize(file.size)}</p>
                </div>
                <span className="text-xs font-bold text-gray-400 mr-2">#{i + 1}</span>
                <button onClick={() => removeFile(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleConvert} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #eab308, #ca8a04)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> Converting...</> : <><FileDown size={22} /> Convert {files.length} Image{files.length > 1 ? "s" : ""} to PDF</>}
          </button>
        </>
      )}
    </div>
  );
}
