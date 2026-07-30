"use client";

import { useState, useRef } from "react";
import { Download, CreditCard, RefreshCw, Eye, FileText, User } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import jsPDF from "jspdf";

// ─── Types ─────────────────────────────────────
type Tool = "pan" | "aadhaar";

interface PanData {
  name: string;
  fatherName: string;
  dob: string;
  panNumber: string;
  gender: string;
  photoDataUrl: string | null;
  signatureDataUrl: string | null;
}

interface AadhaarData {
  name: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;
  address: string;
  pincode: string;
  mobile: string;
  photoDataUrl: string | null;
}

const EMPTY_PAN: PanData = {
  name: "",
  fatherName: "",
  dob: "",
  panNumber: "",
  gender: "Male",
  photoDataUrl: null,
  signatureDataUrl: null,
};

const EMPTY_AADHAAR: AadhaarData = {
  name: "",
  dob: "",
  gender: "Male",
  aadhaarNumber: "",
  address: "",
  pincode: "",
  mobile: "",
  photoDataUrl: null,
};

// ─── PAN Card Renderer ──────────────────────────
function PanCardPreview({ data }: { data: PanData }) {
  const pan = data.panNumber.toUpperCase().padEnd(10, "_").slice(0, 10);
  const chunks = pan.match(/.{1,10}/)?.[0] ?? pan;
  return (
    <div
      id="pan-card-preview"
      style={{
        width: "342px",
        height: "216px",
        background: "linear-gradient(135deg, #f5f0e8 0%, #fffdf6 60%, #f0e8d0 100%)",
        border: "1px solid #c8b878",
        borderRadius: "8px",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        flexShrink: 0,
      }}
    >
      {/* Background watermark pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(180,150,70,0.05) 0, rgba(180,150,70,0.05) 1px, transparent 0, transparent 50%)",
        backgroundSize: "8px 8px",
      }} />

      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #1a3a5c 0%, #0d5c99 50%, #1a3a5c 100%)",
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderRadius: "7px 7px 0 0",
      }}>
        {/* Emblem placeholder */}
        <div style={{
          width: "28px", height: "28px",
          background: "radial-gradient(circle, #f5c518 0%, #e6a200 100%)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", flexShrink: 0,
        }}>🏛</div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ color: "#ffd700", fontWeight: "bold", fontSize: "8px", letterSpacing: "1px" }}>
            INCOME TAX DEPARTMENT — GOVT. OF INDIA
          </div>
          <div style={{ color: "#fff", fontWeight: "900", fontSize: "11px", letterSpacing: "0.5px" }}>
            PERMANENT ACCOUNT NUMBER CARD
          </div>
        </div>
        <div style={{
          width: "28px", height: "28px",
          background: "linear-gradient(135deg, #ff9933 33%, #fff 33%, #fff 66%, #138808 66%)",
          borderRadius: "4px",
          border: "1px solid rgba(255,255,255,0.3)",
          flexShrink: 0,
        }} />
      </div>

      {/* Body */}
      <div style={{ display: "flex", padding: "8px 10px", gap: "10px", height: "calc(100% - 40px)" }}>
        {/* Left: Photo + Signature */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
          {/* Photo */}
          <div style={{
            width: "62px", height: "74px",
            background: data.photoDataUrl ? "transparent" : "linear-gradient(135deg, #e0d5c5, #cfc3a8)",
            border: "1.5px solid #9a7d3a",
            borderRadius: "3px",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {data.photoDataUrl
              ? <img src={data.photoDataUrl} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "22px" }}>👤</span>
            }
          </div>
          {/* Signature */}
          <div style={{
            width: "62px", height: "20px",
            background: data.signatureDataUrl ? "transparent" : "#fff",
            border: "1px solid #9a7d3a",
            borderRadius: "2px",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {data.signatureDataUrl
              ? <img src={data.signatureDataUrl} alt="Sign" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <span style={{ fontSize: "7px", color: "#888", fontStyle: "italic" }}>Signature</span>
            }
          </div>
        </div>

        {/* Right: Details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", justifyContent: "center" }}>
          <Field label="Name" value={data.name || "YOUR NAME"} big />
          <Field label="Father's Name" value={data.fatherName || "FATHER'S NAME"} />
          <Field label="Date of Birth" value={data.dob ? formatDobDisplay(data.dob) : "DD/MM/YYYY"} />
          <div style={{ marginTop: "4px" }}>
            <div style={{ fontSize: "7.5px", color: "#555", letterSpacing: "0.5px", marginBottom: "1px" }}>
              Permanent Account Number
            </div>
            <div style={{
              fontFamily: "Courier New, monospace",
              fontSize: "16px",
              fontWeight: "900",
              letterSpacing: "3px",
              color: "#000",
              lineHeight: 1,
            }}>
              {chunks || "ABCDE1234F"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        background: "linear-gradient(90deg, #1a3a5c, #0d5c99, #1a3a5c)",
        height: "4px",
      }} />
    </div>
  );
}

function Field({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "7px", color: "#666", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: big ? "12px" : "10.5px", fontWeight: big ? "900" : "700", color: "#000", lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

// ─── Aadhaar Card Renderer ──────────────────────
function AadhaarCardPreview({ data }: { data: AadhaarData }) {
  const num = data.aadhaarNumber.replace(/\D/g, "").padEnd(12, "_");
  const formatted = `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)}`;
  const maskedNum = `XXXX XXXX ${num.slice(8,12)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
      {/* FRONT */}
      <div
        id="aadhaar-front-preview"
        style={{
          width: "342px", height: "216px",
          background: "linear-gradient(135deg, #fff 0%, #f5f9ff 100%)",
          border: "1px solid #ccd9e8",
          borderRadius: "10px",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      >
        {/* Left navy stripe */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: "72px",
          background: "linear-gradient(180deg, #1a3a6c 0%, #0a2050 100%)",
        }} />

        {/* GOI Emblem strip */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: "72px",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "8px 4px", gap: "4px",
        }}>
          <div style={{
            width: "36px", height: "36px",
            background: "radial-gradient(circle, #ffd700 0%, #e6a200 100%)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
          }}>🏛</div>
          <div style={{ color: "#ffd700", fontSize: "6px", fontWeight: "bold", textAlign: "center", letterSpacing: "0.3px" }}>
            भारत सरकार
          </div>
          <div style={{ color: "#fff", fontSize: "5.5px", fontWeight: "bold", textAlign: "center" }}>
            Govt. of India
          </div>
          {/* Photo */}
          <div style={{
            width: "52px", height: "62px",
            background: data.photoDataUrl ? "transparent" : "linear-gradient(135deg, #d4e8ff, #bbd4f0)",
            border: "2px solid #ffd700",
            borderRadius: "4px",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: "4px",
          }}>
            {data.photoDataUrl
              ? <img src={data.photoDataUrl} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "22px" }}>👤</span>
            }
          </div>
        </div>

        {/* Main content area */}
        <div style={{ marginLeft: "80px", padding: "6px 10px 6px 0", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Header */}
          <div>
            <div style={{ fontSize: "15px", fontWeight: "900", color: "#1a3a6c", letterSpacing: "0.5px" }}>
              आधार
            </div>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "#1a3a6c", letterSpacing: "2px" }}>
              AADHAAR
            </div>
            <div style={{ fontSize: "7px", color: "#555", marginTop: "1px" }}>
              mAadhaar | <span style={{ color: "#1a3a6c", fontWeight: "bold" }}>uidai.gov.in</span>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ fontSize: "14px", fontWeight: "900", color: "#000", lineHeight: 1 }}>
              {data.name || "YOUR NAME"}
            </div>
            <div style={{ fontSize: "9px", color: "#333" }}>
              <span style={{ color: "#666" }}>DOB:</span>{" "}
              <strong>{data.dob ? formatDobDisplay(data.dob) : "DD/MM/YYYY"}</strong>
              {"  "}
              <span style={{ color: "#666" }}>Gender:</span>{" "}
              <strong>{data.gender === "Male" ? "पुरुष / Male" : data.gender === "Female" ? "महिला / Female" : "अन्य / Other"}</strong>
            </div>
          </div>

          {/* Aadhaar number */}
          <div>
            <div style={{
              fontFamily: "OCR-A, Courier New, monospace",
              fontSize: "18px",
              fontWeight: "900",
              letterSpacing: "4px",
              color: "#1a3a6c",
              lineHeight: 1,
            }}>
              {formatted || "XXXX XXXX XXXX"}
            </div>
            <div style={{ fontSize: "6.5px", color: "#888", marginTop: "1px" }}>
              VID: Click mAadhaar App
            </div>
          </div>

          {/* Bottom logos row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "6px", color: "#aaa" }}>© UIDAI</div>
            <div style={{
              background: "#ff6600",
              color: "#fff",
              fontSize: "6px",
              fontWeight: "bold",
              padding: "1px 4px",
              borderRadius: "2px",
            }}>
              mAadhaar
            </div>
          </div>
        </div>

        {/* Right color bands */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "8px", display: "flex", flexDirection: "column" }}>
          {["#ff9933", "#fff", "#138808"].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>

      {/* BACK */}
      <div
        id="aadhaar-back-preview"
        style={{
          width: "342px", height: "216px",
          background: "linear-gradient(135deg, #f5f9ff 0%, #fff 100%)",
          border: "1px solid #ccd9e8",
          borderRadius: "10px",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      >
        {/* Top navy band */}
        <div style={{
          background: "linear-gradient(90deg, #1a3a6c 0%, #0a2050 100%)",
          padding: "6px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "#ffd700", fontSize: "8px", fontWeight: "900", letterSpacing: "1px" }}>आधार AADHAAR</div>
            <div style={{ color: "#fff", fontSize: "6.5px" }}>Unique Identification Authority of India</div>
          </div>
          <div style={{ color: "#ffd700", fontSize: "16px" }}>🏛</div>
        </div>

        {/* Address block */}
        <div style={{ padding: "8px 14px", display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "8px", color: "#666", fontWeight: "bold", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Address / पता
            </div>
            <div style={{ fontSize: "9px", color: "#000", lineHeight: 1.4, wordBreak: "break-word" }}>
              {data.address || "123, Village Name, District, State"}
              {data.pincode ? `, PIN - ${data.pincode}` : ""}
            </div>
          </div>
          {/* QR placeholder */}
          <div style={{
            width: "70px", height: "70px",
            background: "#fff",
            border: "1px solid #ddd",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            borderRadius: "4px",
          }}>
            <div style={{ fontSize: "7px", color: "#aaa", textAlign: "center", lineHeight: 1.3 }}>
              QR<br />Code
            </div>
          </div>
        </div>

        {/* Masked number */}
        <div style={{ padding: "0 14px" }}>
          <div style={{ fontSize: "7.5px", color: "#555", marginBottom: "2px" }}>Your Aadhaar Number (Masked)</div>
          <div style={{
            fontFamily: "OCR-A, Courier New, monospace",
            fontSize: "16px",
            fontWeight: "900",
            letterSpacing: "3px",
            color: "#1a3a6c",
          }}>
            {maskedNum || "XXXX XXXX XXXX"}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(90deg, #1a3a6c, #0a5a9c, #1a3a6c)",
          padding: "4px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ color: "#ffd700", fontSize: "7px", fontWeight: "bold" }}>
            uidai.gov.in | 1947 (Toll Free)
          </div>
          <div style={{ color: "#fff", fontSize: "6px" }}>
            {data.mobile ? `Mobile: XXXXXXX${data.mobile.slice(-3)}` : ""}
          </div>
        </div>

        {/* Right color bands */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "8px", display: "flex", flexDirection: "column" }}>
          {["#ff9933", "#fff", "#138808"].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────
function formatDobDisplay(dob: string) {
  if (!dob) return "";
  const [y, m, d] = dob.split("-");
  return `${d}/${m}/${y}`;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function downloadCardAsPDF(elementId: string, fileName: string) {
  const html2canvas = (await import("html2canvas")).default;
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
  const imgData = canvas.toDataURL("image/png");

  // 85.6mm × 54mm = standard card size in A4 portrait
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const cardW = 85.6;
  const cardH = 54;
  const x = (210 - cardW) / 2;
  const y = 20;
  pdf.addImage(imgData, "PNG", x, y, cardW, cardH);
  pdf.save(fileName);
}

async function downloadAadhaarAsPDF(frontId: string, backId: string, fileName: string) {
  const html2canvas = (await import("html2canvas")).default;
  const frontEl = document.getElementById(frontId);
  const backEl = document.getElementById(backId);
  if (!frontEl || !backEl) return;

  const cardW = 85.6;
  const cardH = 54;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const x = (210 - cardW) / 2;

  const frontCanvas = await html2canvas(frontEl, { scale: 3, useCORS: true, backgroundColor: null });
  pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", x, 20, cardW, cardH);

  const backCanvas = await html2canvas(backEl, { scale: 3, useCORS: true, backgroundColor: null });
  pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", x, 82, cardW, cardH);

  pdf.save(fileName);
}

// ─── Main Page ──────────────────────────────────
export default function ManualIdGeneratorPage() {
  const [tool, setTool] = useState<Tool>("pan");
  const [pan, setPan] = useState<PanData>(EMPTY_PAN);
  const [aadhaar, setAadhaar] = useState<AadhaarData>(EMPTY_AADHAAR);
  const [downloading, setDownloading] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const aadhaarPhotoRef = useRef<HTMLInputElement>(null);

  const handlePanPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readImageFile(file);
    setPan((p) => ({ ...p, photoDataUrl: url }));
    e.target.value = "";
  };

  const handlePanSign = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readImageFile(file);
    setPan((p) => ({ ...p, signatureDataUrl: url }));
    e.target.value = "";
  };

  const handleAadhaarPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readImageFile(file);
    setAadhaar((a) => ({ ...a, photoDataUrl: url }));
    e.target.value = "";
  };

  const handleDownloadPan = async () => {
    setDownloading(true);
    try {
      await downloadCardAsPDF("pan-card-preview", `PAN_${pan.panNumber || "Card"}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAadhaar = async () => {
    setDownloading(true);
    try {
      await downloadAadhaarAsPDF(
        "aadhaar-front-preview",
        "aadhaar-back-preview",
        `Aadhaar_${aadhaar.aadhaarNumber.replace(/\s/g, "_") || "Card"}.pdf`
      );
    } finally {
      setDownloading(false);
    }
  };

  const panFormatted = (val: string) =>
    val.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);

  const aadhaarFormatted = (val: string) =>
    val.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );

  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="Manual ID Card Generator"
        subtitle="PAN Card & Aadhaar Card — Details bharke Government-style PDF download karo"
      />

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
        {(["pan", "aadhaar"] as Tool[]).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tool === t ? "text-white shadow-md" : ""}`}
            style={{
              background: tool === t ? (t === "pan" ? "linear-gradient(135deg, #1a3a6c, #0d5c99)" : "linear-gradient(135deg, #0a5a3a, #138808)") : "transparent",
              color: tool === t ? "white" : "var(--text-secondary)",
            }}
          >
            {t === "pan" ? <CreditCard size={15} /> : <User size={15} />}
            {t === "pan" ? "PAN Card" : "Aadhaar Card"}
          </button>
        ))}
      </div>

      {/* ── PAN CARD ── */}
      {tool === "pan" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* Form */}
          <div className="glass-card p-6 space-y-5">
            <h2 className="section-title flex items-center gap-2">
              <CreditCard size={18} style={{ color: "#0d5c99" }} />
              PAN Card Details Bharo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name (As on PAN) *</label>
                <input
                  className="input-field w-full"
                  value={pan.name}
                  onChange={(e) => setPan((p) => ({ ...p, name: e.target.value.toUpperCase() }))}
                  placeholder="RAJESH KUMAR"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="label">Father&apos;s Name *</label>
                <input
                  className="input-field w-full"
                  value={pan.fatherName}
                  onChange={(e) => setPan((p) => ({ ...p, fatherName: e.target.value.toUpperCase() }))}
                  placeholder="RAMESH KUMAR"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={pan.dob}
                  onChange={(e) => setPan((p) => ({ ...p, dob: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">PAN Number *</label>
                <input
                  className="input-field w-full font-mono tracking-widest"
                  value={pan.panNumber}
                  onChange={(e) => setPan((p) => ({ ...p, panNumber: panFormatted(e.target.value) }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Format: AAAAA9999A</p>
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  className="input-field w-full"
                  value={pan.gender}
                  onChange={(e) => setPan((p) => ({ ...p, gender: e.target.value }))}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Photo + Signature Upload */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="label">Photo Upload (Optional)</label>
                <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={handlePanPhoto} />
                <button
                  onClick={() => photoRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:border-blue-400 hover:bg-blue-50/10 flex flex-col items-center gap-2"
                  style={{ borderColor: pan.photoDataUrl ? "#10b981" : "var(--border-primary)", color: "var(--text-muted)" }}
                >
                  {pan.photoDataUrl
                    ? <img src={pan.photoDataUrl} alt="" className="w-12 h-14 object-cover rounded" />
                    : <><span style={{ fontSize: "28px" }}>📷</span><span>Click to Upload Photo</span></>
                  }
                </button>
              </div>
              <div>
                <label className="label">Signature Upload (Optional)</label>
                <input type="file" ref={signRef} accept="image/*" className="hidden" onChange={handlePanSign} />
                <button
                  onClick={() => signRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:border-blue-400 hover:bg-blue-50/10 flex flex-col items-center gap-2"
                  style={{ borderColor: pan.signatureDataUrl ? "#10b981" : "var(--border-primary)", color: "var(--text-muted)" }}
                >
                  {pan.signatureDataUrl
                    ? <img src={pan.signatureDataUrl} alt="" className="w-16 h-10 object-contain rounded" />
                    : <><span style={{ fontSize: "28px" }}>✍️</span><span>Click to Upload Signature</span></>
                  }
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDownloadPan}
                disabled={downloading || !pan.name || !pan.panNumber}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {downloading ? "Generating PDF..." : "Download PAN PDF"}
              </button>
              <button
                onClick={() => setPan(EMPTY_PAN)}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={15} />
                Reset
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={15} style={{ color: "var(--brand-primary)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Live Preview</h3>
              </div>
              <div className="flex justify-center overflow-x-auto py-2">
                <PanCardPreview data={pan} />
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-xs"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--text-muted)" }}
            >
              <strong style={{ color: "#d97706" }}>⚠️ Note:</strong> Ye tool sirf internal record keeping / customer document preparation ke liye hai. Government authority ke bina use karna prohibited hai.
            </div>
          </div>
        </div>
      )}

      {/* ── AADHAAR CARD ── */}
      {tool === "aadhaar" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* Form */}
          <div className="glass-card p-6 space-y-5">
            <h2 className="section-title flex items-center gap-2">
              <FileText size={18} style={{ color: "#138808" }} />
              Aadhaar Card Details Bharo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Full Name *</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.name}
                  onChange={(e) => setAadhaar((a) => ({ ...a, name: e.target.value }))}
                  placeholder="Rajesh Kumar"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={aadhaar.dob}
                  onChange={(e) => setAadhaar((a) => ({ ...a, dob: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select
                  className="input-field w-full"
                  value={aadhaar.gender}
                  onChange={(e) => setAadhaar((a) => ({ ...a, gender: e.target.value }))}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Aadhaar Number *</label>
                <input
                  className="input-field w-full font-mono tracking-[4px] text-lg"
                  value={aadhaar.aadhaarNumber}
                  onChange={(e) => setAadhaar((a) => ({ ...a, aadhaarNumber: aadhaarFormatted(e.target.value) }))}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Full Address *</label>
                <textarea
                  className="input-field w-full"
                  rows={3}
                  value={aadhaar.address}
                  onChange={(e) => setAadhaar((a) => ({ ...a, address: e.target.value }))}
                  placeholder="S/O Ramesh Kumar, Village ABC, District XYZ, Bihar"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="label">PIN Code</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.pincode}
                  onChange={(e) => setAadhaar((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  placeholder="800001"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="label">Mobile Number (Registered)</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.mobile}
                  onChange={(e) => setAadhaar((a) => ({ ...a, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="9XXXXXXXXX"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="label">Photo Upload (Optional)</label>
              <input type="file" ref={aadhaarPhotoRef} accept="image/*" className="hidden" onChange={handleAadhaarPhoto} />
              <button
                onClick={() => aadhaarPhotoRef.current?.click()}
                className="w-full py-6 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:border-green-400 hover:bg-green-50/10 flex flex-col items-center gap-2"
                style={{ borderColor: aadhaar.photoDataUrl ? "#10b981" : "var(--border-primary)", color: "var(--text-muted)" }}
              >
                {aadhaar.photoDataUrl
                  ? <img src={aadhaar.photoDataUrl} alt="" className="w-12 h-14 object-cover rounded" />
                  : <><span style={{ fontSize: "28px" }}>📷</span><span>Click to Upload Photo</span></>
                }
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDownloadAadhaar}
                disabled={downloading || !aadhaar.name || !aadhaar.aadhaarNumber}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #0a5a3a, #138808)" }}
              >
                <Download size={16} />
                {downloading ? "Generating PDF..." : "Download Aadhaar PDF"}
              </button>
              <button
                onClick={() => setAadhaar(EMPTY_AADHAAR)}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={15} />
                Reset
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={15} style={{ color: "var(--brand-primary)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Live Preview (Front + Back)</h3>
              </div>
              <div className="flex justify-center overflow-x-auto py-2">
                <AadhaarCardPreview data={aadhaar} />
              </div>
            </div>
            <div
              className="p-3 rounded-xl text-xs"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--text-muted)" }}
            >
              <strong style={{ color: "#d97706" }}>⚠️ Note:</strong> Ye tool sirf internal record keeping / customer document preparation ke liye hai. Government authority ke bina use karna prohibited hai.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
