"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Loader2, X, Unlock, Eye, EyeOff, KeyRound, ShieldOff } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;
}

export default function UnlockPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
    setUnlocked(false);
    setPassword("");
  };

  const handleUnlock = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, {
        password: password || undefined,
        ignoreEncryption: !password
      } as any);
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Unlocked_${file.name}`);
      setUnlocked(true);
      toast.success("PDF unlocked and downloaded successfully!");
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes("password")) {
        toast.error("Wrong password. Please try again.");
      } else {
        toast.error("Failed to unlock PDF. The file may not be password-protected or uses unsupported encryption.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-start gap-2">
        <ShieldOff size={16} className="shrink-0 mt-0.5 text-emerald-600" />
        <span>This tool strips PDF restrictions and removes known passwords using <strong>pdf-lib</strong>. If the PDF uses strong 256-bit AES encryption, it may require the correct password to unlock.</span>
      </div>

      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            backgroundColor: dragOver ? "#ecfdf5" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-emerald-50/50 rounded-lg"
        >
          <Unlock size={40} className="mx-auto mb-3 text-emerald-500" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>Drop Password-Protected PDF Here</p>
          <p className="text-xs font-semibold text-slate-500">Strips restrictions & removes password lock</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* File Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-300 rounded-lg shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={26} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">{file.name}</p>
                <p className="text-xs font-semibold text-slate-500">{formatSize(file.size)}</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setUnlocked(false); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer">
              <X size={14} /> Remove
            </button>
          </div>

          {unlocked && (
            <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-xs font-extrabold text-green-800 flex items-center gap-2">
              ✅ PDF successfully unlocked and downloaded!
            </div>
          )}

          {/* Password Input */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-3">
            <div>
              <label className="text-xs font-extrabold text-slate-700 mb-1 block flex items-center gap-1">
                <KeyRound size={13} /> Current PDF Password (if required)
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-slate-500 pr-10"
                  placeholder="Enter password (leave blank to strip restrictions only)..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">💡 Leave blank if you only want to strip print/copy restrictions from an already-open PDF.</p>
            </div>
          </div>

          {/* Two buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={handleUnlock} disabled={loading}
              style={{
                backgroundColor: "#059669",
                color: "#ffffff",
                borderTop: "2px solid #d1fae5",
                borderLeft: "2px solid #d1fae5",
                borderRight: "2px solid #064e3b",
                borderBottom: "2px solid #064e3b",
              }}
              className="py-3 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded shadow-md disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Unlocking...</> : <><Unlock size={18} /> Unlock & Download PDF</>}
            </button>
            <button onClick={() => { setFile(null); setPassword(""); setUnlocked(false); }}
              className="py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700">
              <X size={16} /> Clear & Start Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
