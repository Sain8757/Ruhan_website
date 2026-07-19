"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Trash2, FileText, Loader2, X, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function DeletePagesTool() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming); setSelectedPages(new Set());
    try {
      const buf = await incoming.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setTotalPages(doc.getPageCount());
    } catch { toast.error("Failed to read PDF"); }
  };

  const togglePage = (i: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!file || selectedPages.size === 0) { toast.error("Select at least one page to delete"); return; }
    if (selectedPages.size >= totalPages) { toast.error("Cannot delete all pages"); return; }
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => !selectedPages.has(i));
      const pages = await newDoc.copyPages(srcDoc, keepIndices);
      pages.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `RA_Deleted.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${selectedPages.size} page(s) deleted!`);
    } catch { toast.error("Failed to delete pages"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-red-400 hover:bg-red-50/30"}`}
        >
          <Trash2 size={40} className="mx-auto mb-4 text-red-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop PDF to delete pages</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{totalPages} pages total</p>
            </div>
            <button onClick={() => { setFile(null); setTotalPages(0); setSelectedPages(new Set()); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label mb-0">Select pages to DELETE <span className="text-red-500">({selectedPages.size} selected)</span></p>
              <button onClick={() => setSelectedPages(selectedPages.size === totalPages ? new Set() : new Set(Array.from({ length: totalPages }, (_, i) => i)))} className="text-xs text-blue-500 underline">
                {selectedPages.size === totalPages ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => togglePage(i)}
                  className={`aspect-square rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2 ${selectedPages.has(i) ? "border-red-500 bg-red-100 text-red-700" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                  {selectedPages.has(i) ? <CheckSquare size={14} /> : <Square size={14} />}
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleDelete} disabled={loading || selectedPages.size === 0}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> Deleting...</> : <><Trash2 size={22} /> Delete {selectedPages.size} Page{selectedPages.size !== 1 ? "s" : ""}</>}
          </button>
        </div>
      )}
    </div>
  );
}
