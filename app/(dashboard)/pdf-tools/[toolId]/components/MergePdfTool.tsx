"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { GripVertical, X, FileText, Combine, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function MergePdfTool() {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (valid.length === 0) { toast.error("Please select PDF files only"); return; }
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  const handleMerge = async () => {
    if (files.length < 2) { toast.error("Please add at least 2 PDF files"); return; }
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "RA_Merged.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF merged and downloaded!");
    } catch (e) {
      toast.error("Failed to merge PDFs. Please check if the files are valid.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"}`}
      >
        <Combine size={40} className="mx-auto mb-4 text-blue-500" />
        <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop PDF files here</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="label mb-2">{files.length} file{files.length > 1 ? "s" : ""} — drag to reorder</p>
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              draggable
              onDragStart={() => setDraggingIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (draggingIndex !== null && draggingIndex !== i) handleReorder(draggingIndex, i); setDraggingIndex(null); }}
              className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all ${draggingIndex === i ? "opacity-50 scale-95" : "hover:border-blue-300 hover:shadow-sm"}`}
              style={{ borderColor: "var(--border-color)" }}
            >
              <GripVertical size={18} className="cursor-grab text-gray-400" />
              <FileText size={18} className="text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatFileSize(file.size)}</p>
              </div>
              <span className="text-xs font-bold text-gray-400 mr-2">#{i + 1}</span>
              <button onClick={() => removeFile(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {files.length > 0 && (
        <button onClick={handleMerge} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3">
          {loading ? <><Loader2 size={22} className="animate-spin" /> Merging PDFs...</> : <><Combine size={22} /> Merge {files.length} PDFs</>}
        </button>
      )}
    </div>
  );
}
