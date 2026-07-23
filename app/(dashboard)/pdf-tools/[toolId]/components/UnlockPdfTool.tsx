"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Loader2, X, Unlock } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

export default function UnlockPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
  };

  const handleUnlock = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      // Try loading with the password
      const doc = await PDFDocument.load(buf, { 
        password: password || undefined,
        ignoreEncryption: !password 
      } as any);
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Unlocked.pdf`);
      toast.success("PDF unlocked and downloaded!");
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes("password")) {
        toast.error("Wrong password. Please try again.");
      } else {
        toast.error("Failed to unlock PDF. The file may not be password-protected.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30"}`}
        >
          <Unlock size={40} className="mx-auto mb-4 text-emerald-500" />
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Drop password-protected PDF</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>or click to browse</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl" style={{ borderColor: "var(--border-color)" }}>
            <FileText size={24} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.name}</p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
          </div>

          <div className="bg-white p-5 border rounded-xl space-y-4" style={{ borderColor: "var(--border-color)" }}>
            <div>
              <label className="label">Current PDF Password</label>
              <input type="password" className="input-field w-full" placeholder="Enter the PDF password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()} />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Leave blank if you only want to strip restrictions.</p>
            </div>
          </div>

          <button onClick={handleUnlock} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            {loading ? <><Loader2 size={22} className="animate-spin" /> Unlocking...</> : <><Unlock size={22} /> Unlock & Download PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
