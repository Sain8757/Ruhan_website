"use client";

import { useState, useRef } from "react";
import { Download, CreditCard, RefreshCw, Eye, FileText, User } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";

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
  nameHi: string;
  nameEn: string;
  dob: string;
  genderHi: string;
  genderEn: string;
  aadhaarNumber: string;
  vidNumber: string;
  addressHi: string;
  addressEn: string;
  issueDate: string;
  downloadDate: string;
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
  nameHi: "",
  nameEn: "",
  dob: "",
  genderHi: "पुरुष",
  genderEn: "MALE",
  aadhaarNumber: "",
  vidNumber: "",
  addressHi: "",
  addressEn: "",
  issueDate: "",
  downloadDate: "",
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
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(180,150,70,0.05) 0, rgba(180,150,70,0.05) 1px, transparent 0, transparent 50%)",
        backgroundSize: "8px 8px",
      }} />

      <div style={{
        background: "linear-gradient(90deg, #1a3a5c 0%, #0d5c99 50%, #1a3a5c 100%)",
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderRadius: "7px 7px 0 0",
      }}>
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

      <div style={{ display: "flex", padding: "8px 10px", gap: "10px", height: "calc(100% - 40px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
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

// ─── SVG Assets ──────────────────────────────
// Replaced with actual images for perfect accuracy


// ─── Aadhaar Card Renderer ──────────────────────
function AadhaarCardPreview({ data }: { data: AadhaarData }) {
  const num = data.aadhaarNumber.replace(/\D/g, "").padEnd(12, "_");
  const formatted = `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)}`;

  return (
    <div
      id="aadhaar-combined-preview"
      style={{
        display: "flex",
        width: "740px",
        height: "235px",
        background: "#fff",
        border: "1px dashed #ccc",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      {/* FRONT SIDE */}
      <div style={{ width: "370px", height: "100%", display: "flex", position: "relative" }}>
        {/* Left vertical strip */}
        <div style={{
          width: "22px",
          borderRight: "1px dashed #999",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "8.5px",
            color: "#000",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}>
            Aadhaar no. issued: {data.issueDate || "DD/MM/YYYY"}
          </div>
        </div>

        {/* Main Front Body */}
        <div style={{ flex: 1, padding: "5px 10px 5px 10px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <img src="/gov-logo.png" alt="Government of India" style={{ height: "32px", objectFit: "contain" }} />
            <img src="/aadhaar-logo.png" alt="Aadhaar Logo" style={{ height: "32px", objectFit: "contain" }} />
          </div>

          <div style={{ height: "1px", background: "#ccc", margin: "0 -10px 5px -10px" }} />

          {/* Details Section */}
          <div style={{ display: "flex", flex: 1 }}>
            {/* Photo */}
            <div style={{
              width: "65px", height: "80px",
              border: "1px solid #999",
              background: data.photoDataUrl ? "transparent" : "#eaeaea",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginRight: "15px",
            }}>
              {data.photoDataUrl
                ? <img src={data.photoDataUrl} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "10px", color: "#666" }}>PHOTO</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", paddingTop: "2px" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#000" }}>{data.nameHi || "नाम"}</div>
              <div style={{ fontSize: "11px", color: "#000" }}>{data.nameEn || "Name"}</div>
              
              <div style={{ fontSize: "10px", color: "#000", marginTop: "4px" }}>
                जन्म तिथि/DOB: {data.dob ? formatDobDisplay(data.dob) : "DD/MM/YYYY"}
              </div>
              <div style={{ fontSize: "10px", color: "#000", marginTop: "2px" }}>
                {data.genderHi || "लिंग"} / {data.genderEn || "GENDER"}
              </div>
            </div>
          </div>

          {/* Red Disclaimer Box */}
          <div style={{
            border: "1px solid #d32f2f",
            padding: "4px",
            fontSize: "8.5px",
            lineHeight: 1.3,
            color: "#000",
            marginTop: "6px",
            marginBottom: "8px",
          }}>
            <div style={{ fontWeight: "bold" }}>आधार पहचान का प्रमाण है, नागरिकता या जन्मतिथि का नहीं ।</div>
            <div>इसका उपयोग सत्यापन (ऑनलाइन प्रमाणीकरण, या क्यूआर कोड/ ऑफ़लाइन एक्सएमएल की स्कैनिंग) के साथ किया जाना चाहिए ।</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>Aadhaar is proof of identity, not of citizenship or date of birth.</div>
            <div>It should be used with verification (online authentication, or scanning of QR code / offline XML).</div>
          </div>

          {/* Aadhaar Number */}
          <div style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "bold",
            color: "#000",
            letterSpacing: "1px",
            marginBottom: "2px"
          }}>
            {formatted || "0000 0000 0000"}
          </div>

          {/* Bottom Strip */}
          <div style={{
            borderTop: "2px solid #d32f2f",
            margin: "0 -10px -5px -10px",
            padding: "4px 0",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#000",
          }}>
            मेरा <span style={{ color: "#d32f2f" }}>आधार</span>, मेरी पहचान
          </div>
        </div>
      </div>

      {/* CUT LINE */}
      <div style={{
        width: "15px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, borderLeft: "1px dashed #000", left: "7px" }} />
        <span style={{ background: "#fff", zIndex: 1, padding: "4px 0", fontSize: "16px" }}>✂️</span>
      </div>

      {/* BACK SIDE */}
      <div style={{ width: "355px", height: "100%", display: "flex", position: "relative" }}>
        {/* Left vertical strip */}
        <div style={{
          width: "22px",
          borderRight: "1px dashed #999",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "8.5px",
            color: "#000",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}>
            Details as on: {data.downloadDate || "DD/MM/YYYY"}
          </div>
        </div>

        {/* Main Back Body */}
        <div style={{ flex: 1, padding: "5px 10px 0 10px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <img src="/gov-logo.png" alt="Government of India" style={{ height: "32px", objectFit: "contain" }} />
            <img src="/aadhaar-logo.png" alt="Aadhaar Logo" style={{ height: "32px", objectFit: "contain" }} />
          </div>

          <div style={{ height: "1px", background: "#ccc", margin: "0 -10px 5px -10px" }} />

          {/* Details Section */}
          <div style={{ display: "flex", flex: 1, gap: "10px" }}>
            <div style={{ flex: 1, fontSize: "9px", color: "#000", lineHeight: 1.3 }}>
              <div style={{ fontWeight: "bold" }}>पता:</div>
              <div>{data.addressHi || "पता यहाँ..."}</div>
              
              <div style={{ fontWeight: "bold", marginTop: "4px" }}>Address:</div>
              <div>{data.addressEn || "Address here..."}</div>
            </div>
            
            {/* QR Code */}
            <div style={{ width: "90px", height: "90px", flexShrink: 0 }}>
              <QRCodeSVG 
                value={`<?xml version="1.0" encoding="UTF-8"?>\n<PrintLetterBarcodeData uid="${num.replace(/_/g,"")}" name="${data.nameEn}" gender="${data.genderEn.charAt(0)}" yob="${data.dob.split('-')[0]}" co="C/O" house="" street="" lm="" loc="" vtc="" po="" dist="" subdist="" state="" pc="" dob="${formatDobDisplay(data.dob)}"/>`} 
                size={90} 
                level="M" 
              />
            </div>
          </div>

          {/* Aadhaar Number */}
          <div style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "bold",
            color: "#000",
            letterSpacing: "1px",
            marginTop: "auto"
          }}>
            {formatted || "0000 0000 0000"}
          </div>

          {/* VID */}
          <div style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#000",
            borderBottom: "1px dashed #999",
            paddingBottom: "2px",
            marginBottom: "2px",
            fontWeight: "bold",
          }}>
            VID : {data.vidNumber || "0000 0000 0000 0000"}
          </div>

          {/* Bottom Strip */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "8.5px",
            fontWeight: "bold",
            color: "#000",
            padding: "2px 0 4px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📞</span> 1947
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>✉️</span> help@uidai.gov.in
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🌐</span> www.uidai.gov.in
            </div>
          </div>
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

async function downloadCardAsPDF(elementId: string, fileName: string, isAadhaar: boolean = false) {
  const html2canvas = (await import("html2canvas-pro")).default;
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: "#fff" });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  const pdf = new jsPDF({ orientation: isAadhaar ? "landscape" : "portrait", unit: "mm", format: "a4" });
  
  if (isAadhaar) {
    // Render the wide e-Aadhaar layout in landscape A4
    const w = 185;
    const h = 59;
    const x = (297 - w) / 2;
    const y = 50;
    pdf.addImage(imgData, "JPEG", x, y, w, h);
  } else {
    // Render standard PAN card in portrait A4
    const cardW = 85.6;
    const cardH = 54;
    const x = (210 - cardW) / 2;
    const y = 20;
    pdf.addImage(imgData, "JPEG", x, y, cardW, cardH);
  }
  
  pdf.save(fileName);
}

// ─── Main Page ──────────────────────────────────
export default function ManualIdGeneratorPage() {
  const [tool, setTool] = useState<Tool>("aadhaar");
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
      await downloadCardAsPDF("pan-card-preview", `PAN_${pan.panNumber || "Card"}.pdf`, false);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAadhaar = async () => {
    setDownloading(true);
    try {
      await downloadCardAsPDF("aadhaar-combined-preview", `Aadhaar_${aadhaar.aadhaarNumber.replace(/\s/g, "_") || "Card"}.pdf`, true);
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

  const vidFormatted = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(\d{0,4})(\d{0,4})(\d{0,4})/, (_, a, b, c, d) =>
      [a, b, c, d].filter(Boolean).join(" ")
    );

  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="Manual ID Card Generator"
        subtitle="PAN Card & Aadhaar Card — Pixel Perfect Exact Match Design"
      />

      <div className="flex gap-2 p-1 rounded-xl w-fit mb-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
        {(["aadhaar", "pan"] as Tool[]).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tool === t ? "text-white shadow-md" : ""}`}
            style={{
              background: tool === t ? (t === "pan" ? "linear-gradient(135deg, #1a3a6c, #0d5c99)" : "linear-gradient(135deg, #d32f2f, #b71c1c)") : "transparent",
              color: tool === t ? "white" : "var(--text-secondary)",
            }}
          >
            {t === "pan" ? <CreditCard size={15} /> : <User size={15} />}
            {t === "pan" ? "PAN Card" : "Aadhaar Card"}
          </button>
        ))}
      </div>

      {tool === "pan" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="section-title flex items-center gap-2">
              <CreditCard size={18} style={{ color: "#0d5c99" }} />
              PAN Card Details
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

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="label">Photo Upload</label>
                <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={handlePanPhoto} />
                <button
                  onClick={() => photoRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:border-blue-400 hover:bg-blue-50/10 flex flex-col items-center gap-2"
                  style={{ borderColor: pan.photoDataUrl ? "#10b981" : "var(--border-primary)", color: "var(--text-muted)" }}
                >
                  {pan.photoDataUrl
                    ? <img src={pan.photoDataUrl} alt="" className="w-12 h-14 object-cover rounded" />
                    : <><span style={{ fontSize: "28px" }}>📷</span><span>Upload Photo</span></>
                  }
                </button>
              </div>
              <div>
                <label className="label">Signature Upload</label>
                <input type="file" ref={signRef} accept="image/*" className="hidden" onChange={handlePanSign} />
                <button
                  onClick={() => signRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:border-blue-400 hover:bg-blue-50/10 flex flex-col items-center gap-2"
                  style={{ borderColor: pan.signatureDataUrl ? "#10b981" : "var(--border-primary)", color: "var(--text-muted)" }}
                >
                  {pan.signatureDataUrl
                    ? <img src={pan.signatureDataUrl} alt="" className="w-16 h-10 object-contain rounded" />
                    : <><span style={{ fontSize: "28px" }}>✍️</span><span>Upload Signature</span></>
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
          </div>
        </div>
      )}

      {tool === "aadhaar" && (
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="glass-card p-6 space-y-5 xl:w-[450px] shrink-0">
            <h2 className="section-title flex items-center gap-2">
              <FileText size={18} style={{ color: "#d32f2f" }} />
              Aadhaar Details (Bilingual)
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">नाम (Hindi Name) *</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.nameHi}
                  onChange={(e) => setAadhaar((a) => ({ ...a, nameHi: e.target.value }))}
                  placeholder="रूख सार खातून"
                />
              </div>
              <div>
                <label className="label">English Name *</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.nameEn}
                  onChange={(e) => setAadhaar((a) => ({ ...a, nameEn: e.target.value }))}
                  placeholder="Rukh Sar Khatoon"
                />
              </div>
              
              <div>
                <label className="label">लिंग (Hindi) *</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.genderHi}
                  onChange={(e) => setAadhaar((a) => ({ ...a, genderHi: e.target.value }))}
                  placeholder="महिला"
                />
              </div>
              <div>
                <label className="label">Gender (English) *</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.genderEn}
                  onChange={(e) => setAadhaar((a) => ({ ...a, genderEn: e.target.value.toUpperCase() }))}
                  placeholder="FEMALE"
                />
              </div>

              <div className="col-span-2">
                <label className="label">Date of Birth *</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={aadhaar.dob}
                  onChange={(e) => setAadhaar((a) => ({ ...a, dob: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className="label">Aadhaar Number *</label>
                <input
                  className="input-field w-full font-mono tracking-widest text-lg"
                  value={aadhaar.aadhaarNumber}
                  onChange={(e) => setAadhaar((a) => ({ ...a, aadhaarNumber: aadhaarFormatted(e.target.value) }))}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                />
              </div>

              <div className="col-span-2">
                <label className="label">VID Number (Optional)</label>
                <input
                  className="input-field w-full font-mono tracking-wider"
                  value={aadhaar.vidNumber}
                  onChange={(e) => setAadhaar((a) => ({ ...a, vidNumber: vidFormatted(e.target.value) }))}
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength={19}
                />
              </div>

              <div className="col-span-2">
                <label className="label">पता (Hindi Address) *</label>
                <textarea
                  className="input-field w-full"
                  rows={2}
                  value={aadhaar.addressHi}
                  onChange={(e) => setAadhaar((a) => ({ ...a, addressHi: e.target.value }))}
                  placeholder="द्वारा: मोहम्मद शेर शाह..."
                />
              </div>

              <div className="col-span-2">
                <label className="label">English Address *</label>
                <textarea
                  className="input-field w-full"
                  rows={2}
                  value={aadhaar.addressEn}
                  onChange={(e) => setAadhaar((a) => ({ ...a, addressEn: e.target.value }))}
                  placeholder="C/O: Mohammad Sher Shah..."
                />
              </div>

              <div>
                <label className="label">Issue Date (Side Text)</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.issueDate}
                  onChange={(e) => setAadhaar((a) => ({ ...a, issueDate: e.target.value }))}
                  placeholder="26/02/2015"
                />
              </div>
              
              <div>
                <label className="label">Download Date (Side Text)</label>
                <input
                  className="input-field w-full"
                  value={aadhaar.downloadDate}
                  onChange={(e) => setAadhaar((a) => ({ ...a, downloadDate: e.target.value }))}
                  placeholder="21/07/2026"
                />
              </div>
            </div>

            <div>
              <label className="label">Photo Upload *</label>
              <input type="file" ref={aadhaarPhotoRef} accept="image/*" className="hidden" onChange={handleAadhaarPhoto} />
              <button
                onClick={() => aadhaarPhotoRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-all flex justify-center gap-2"
                style={{ borderColor: aadhaar.photoDataUrl ? "#d32f2f" : "var(--border-primary)", color: "var(--text-muted)" }}
              >
                {aadhaar.photoDataUrl ? "Change Photo" : "Upload Aadhaar Photo"}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDownloadAadhaar}
                disabled={downloading || !aadhaar.nameEn || !aadhaar.aadhaarNumber}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #d32f2f, #b71c1c)" }}
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

          <div className="flex-1 flex flex-col gap-4">
            <div className="glass-card p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={15} style={{ color: "var(--brand-primary)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Exact 1:1 Live Preview</h3>
              </div>
              
              <div className="flex-1 flex items-center justify-center overflow-x-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div style={{ transform: "scale(1.1)", transformOrigin: "center" }}>
                  <AadhaarCardPreview data={aadhaar} />
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
