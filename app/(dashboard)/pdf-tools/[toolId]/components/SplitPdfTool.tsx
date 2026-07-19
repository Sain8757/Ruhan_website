"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Scissors, FileText, Loader2, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function SplitPdfTool() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitMode, setSplitMode] = useState<"range" | "all">("range");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
    try {
      const buf = await incoming.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = doc.getPageCount();
      setTotalPages(total);
      setFrom(1); setTo(total);
    } catch { toast.error("Failed to read PDF"); }
  };

  const handleSplit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      
      if (splitMode === "all") {
        // Split into individual pages
        for (let i = 0; i < totalPages; i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `RA_Page_${i + 1}.pdf`; a.click();
          URL.revokeObjectURL(url);
        }
        toast.success(`Split into ${totalPages} individual PDF files!`);
      } else {
        const newDoc = await PDFDocument.create();
        const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
        const pages = await newDoc.copyPages(srcDoc, indices);
        pages.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `RA_Split_P${from}-${to}.pdf`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`Pages ${from}–${to} extracted!`);
      }
    } catch { toast.error("Failed to split PDF"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-orange-400 bg-orange-50 scale-[1.01]" : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/30"}`}
        >
          <Scissors size={40} className="mx-auto mb-4 text-orange-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop a PDF to split</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Selected file */}
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{totalPages} pages</p>
            </div>
            <button onClick={() => { setFile(null); setTotalPages(0); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Mode */}
          <div className="flex gap-3">
            {[{ id: "range", label: "Extract Range" }, { id: "all", label: "Split All Pages" }].map((m) => (
              <button key={m.id} onClick={() => setSplitMode(m.id as any)}
                className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all ${splitMode === m.id ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-orange-300"}`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Range Picker */}
          {splitMode === "range" && (
            <div className="flex items-center gap-4 bg-white p-5 rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex-1">
                <label className="label mb-1">From Page</label>
                <input type="number" min={1} max={to} value={from} onChange={(e) => setFrom(Math.max(1, Math.min(to, +e.target.value)))} className="input-field w-full text-center text-2xl font-bold" />
              </div>
              <span className="text-2xl font-bold text-gray-300 mt-6">—</span>
              <div className="flex-1">
                <label className="label mb-1">To Page</label>
                <input type="number" min={from} max={totalPages} value={to} onChange={(e) => setTo(Math.max(from, Math.min(totalPages, +e.target.value)))} className="input-field w-full text-center text-2xl font-bold" />
              </div>
              <div className="text-sm mt-6 text-gray-400 min-w-[100px] text-center">of {totalPages} pages</div>
            </div>
          )}

          {splitMode === "all" && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="font-semibold text-orange-700">Will create {totalPages} individual PDF files</p>
            </div>
          )}

          <button onClick={handleSplit} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> Splitting...</> : <><Scissors size={22} /> Split PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
