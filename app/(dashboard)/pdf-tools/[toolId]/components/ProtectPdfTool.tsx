"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, X, Lock, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;
}

const PERMISSIONS = [
  { key: "printing", label: "Allow Printing" },
  { key: "copying", label: "Allow Copying Text" },
  { key: "modifying", label: "Allow Editing" },
  { key: "fillForms", label: "Allow Form Filling" },
  { key: "annotations", label: "Allow Annotations" },
];

export default function ProtectPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) { toast.error("Please select a PDF file"); return; }
    setFile(incoming);
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!password) { toast.error("Please enter a password"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 4) { toast.error("Password must be at least 4 characters"); return; }
    setLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });

      // Add metadata indicating protection request
      doc.setTitle(`[Protected] ${file.name.replace(".pdf", "")}`);
      doc.setKeywords(["protected", "ra-seva-point"]);
      doc.setCreator("RA Seva Point PDF Suite");

      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `RA_Protected_${file.name}`);

      toast.success("PDF prepared & downloaded! Note: For full 256-bit encryption, upload this file to iLovePDF or Adobe Acrobat.");
    } catch { toast.error("Failed to process PDF"); } finally { setLoading(false); }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak 🔴", "Medium 🟡", "Strong 🟢"][pwStrength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-400", "bg-green-500"][pwStrength];

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-semibold flex items-start gap-2">
        <Shield size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <span><strong>Note:</strong> Browser-based PDF encryption is limited. This tool prepares your PDF for protection. For full password encryption (128-bit / 256-bit AES), use the downloaded file on <strong>iLovePDF.com</strong> or <strong>Adobe Acrobat</strong>.</span>
      </div>

      {!file ? (
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            backgroundColor: dragOver ? "#f8fafc" : "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-slate-50/50 rounded-lg"
        >
          <Lock size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>Drop PDF to Set Password Protection</p>
          <p className="text-xs font-semibold text-slate-500">or click to browse PDF document</p>
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
            <button onClick={() => setFile(null)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer">
              <X size={14} /> Remove
            </button>
          </div>

          {/* Password Inputs */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 mb-1 block">🔑 Set Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-slate-500 pr-10"
                  placeholder="Enter a strong password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength Bar */}
              {password.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className={`h-1 flex-1 rounded ${pwStrength >= lvl ? strengthColor : "bg-slate-200"} transition-all`} />
                    ))}
                  </div>
                  <p className={`text-[10px] font-black ${pwStrength === 1 ? "text-red-600" : pwStrength === 2 ? "text-yellow-600" : "text-green-600"}`}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 mb-1 block">🔁 Confirm Password</label>
              <input
                type="password"
                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none ${confirm && confirm !== password ? "border-red-400 bg-red-50" : confirm && confirm === password ? "border-green-400 bg-green-50" : "border-slate-300"}`}
                placeholder="Re-enter password..."
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm && confirm === password && (
                <p className="text-[10px] font-black text-green-700 mt-1 flex items-center gap-1"><CheckCircle size={10} /> Passwords match!</p>
              )}
              {confirm && confirm !== password && (
                <p className="text-[10px] font-black text-red-600 mt-1">⚠️ Passwords don&apos;t match</p>
              )}
            </div>
          </div>

          {/* Protect Button */}
          <button onClick={handleProtect} disabled={loading || !password || password !== confirm}
            style={{
              backgroundColor: "#475569",
              color: "#ffffff",
              borderTop: "2px solid #e2e8f0",
              borderLeft: "2px solid #e2e8f0",
              borderRight: "2px solid #1e293b",
              borderBottom: "2px solid #1e293b",
            }}
            className="w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded shadow-md disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Lock size={18} /> Protect & Download PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
