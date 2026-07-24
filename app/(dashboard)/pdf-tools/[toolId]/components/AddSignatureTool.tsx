"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Image as ImageIcon, Loader2, X, PenTool, Move, Type, Eraser, Calendar, Check } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

declare const pdfjsLib: any;

async function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("No browser");
    if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve((window as any).pdfjsLib);
    };
    script.onerror = () => reject("Failed to load PDF.js");
    document.head.appendChild(script);
  });
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

type SigMode = "draw" | "type" | "upload";

const PEN_COLORS = [
  { label: "Navy Blue", value: "#000080" },
  { label: "Black", value: "#000000" },
  { label: "Dark Red", value: "#990000" },
  { label: "Emerald Green", value: "#006600" },
];

const FONT_STYLES = [
  { id: "style1", name: "Cursive Classic", font: "cursive" },
  { id: "style2", name: "Script Elegant", font: "Dancing Script, cursive" },
  { id: "style3", name: "Brush Signature", font: "Brush Script MT, cursive" },
  { id: "style4", name: "Formal Serif", font: "Times New Roman, serif" },
];

export default function AddSignatureTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();

  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pageNum, setPageNum] = useState<number>(1);

  // Signature Input Mode
  const [sigMode, setSigMode] = useState<SigMode>("draw");

  // Mode 1: Draw Pad State
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000080");
  const [penWidth, setPenWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Mode 2: Type Text State
  const [typedName, setTypedName] = useState("RA Seva Point");
  const [selectedFont, setSelectedFont] = useState(FONT_STYLES[0].font);
  const [typedColor, setTypedColor] = useState("#000080");

  // Mode 3: Upload Image State
  const [sigFile, setSigFile] = useState<File | null>(null);

  // Date Stamp extra
  const [includeDateStamp, setIncludeDateStamp] = useState(false);
  const [dateStampText, setDateStampText] = useState(() => new Date().toLocaleDateString("en-IN"));

  // Unified Signature Data URL for placement
  const [activeSigDataUrl, setActiveSigDataUrl] = useState<string | null>(null);

  // Placement Options
  const [placementMode, setPlacementMode] = useState<"manual" | "preset">("manual");
  const [position, setPosition] = useState<string>("bottom-right");
  const [sigWidth, setSigWidth] = useState<number>(180);
  const [pdfScale, setPdfScale] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // PDF File Upload Handler
  const handlePdfChange = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }
    setPdfFile(incoming);
    setPageNum(1);

    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await incoming.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      setPdfTotalPages(pdf.numPages);
    } catch {
      toast.error("Failed to read PDF file");
    }
  };

  // Render PDF Page Canvas for Preview & Drag-and-Drop
  useEffect(() => {
    if (pdfFile && pageCanvasRef.current && containerRef.current) {
      let renderTask: any = null;
      let isSubscribed = true;

      const renderPage = async () => {
        try {
          const pdfjs = await loadPdfJs();
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          if (!isSubscribed) return;

          setPdfTotalPages(pdf.numPages);
          const validPage = Math.min(Math.max(1, pageNum), pdf.numPages);
          const page = await pdf.getPage(validPage);
          if (!isSubscribed) return;

          const containerWidth = containerRef.current?.clientWidth || 700;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / unscaledViewport.width;
          setPdfScale(scale);

          const viewport = page.getViewport({ scale });
          const canvas = pageCanvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext("2d");
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          renderTask = page.render({ canvasContext: context, viewport });
          await renderTask.promise;
        } catch (err) {
          console.error("PDF page render error:", err);
        }
      };

      renderPage();

      return () => {
        isSubscribed = false;
        if (renderTask) renderTask.cancel();
      };
    }
  }, [pdfFile, pageNum]);

  // Mode 1: Drawing Canvas Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    updateActiveSignature();
  };

  const clearDrawPad = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setActiveSigDataUrl(null);
  };

  // Generate PNG Data URL for Typed / Drawn / Uploaded signature
  const updateActiveSignature = () => {
    if (sigMode === "draw") {
      const canvas = drawCanvasRef.current;
      if (canvas && hasDrawn) {
        setActiveSigDataUrl(canvas.toDataURL("image/png"));
      }
    } else if (sigMode === "type") {
      if (!typedName.trim()) return;
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `600 48px ${selectedFont}`;
        ctx.fillStyle = typedColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, canvas.width / 2, 70);

        if (includeDateStamp) {
          ctx.font = "bold 20px Arial, sans-serif";
          ctx.fillStyle = "#475569";
          ctx.fillText(`Date: ${dateStampText}`, canvas.width / 2, 125);
        }

        setActiveSigDataUrl(canvas.toDataURL("image/png"));
      }
    }
  };

  useEffect(() => {
    if (sigMode === "type") {
      updateActiveSignature();
    }
  }, [typedName, selectedFont, typedColor, includeDateStamp, dateStampText, sigMode]);

  // Mode 3: Image File Handler
  const handleSigImageUpload = (file: File) => {
    setSigFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setActiveSigDataUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    const scaledWidth = sigWidth * pdfScale;
    const maxX = containerRect.width - scaledWidth;
    const maxY = containerRect.height - 30;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    setDragPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Final Embed & Save Signature into PDF
  const handleAddSignature = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file first");
      return;
    }
    if (!activeSigDataUrl) {
      toast.error("Please draw, type, or upload a signature first");
      return;
    }

    setLoading(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      // Embed signature Data URL as PNG
      const sigImgBytes = await fetch(activeSigDataUrl).then((res) => res.arrayBuffer());
      const image = await pdfDoc.embedPng(sigImgBytes);

      const pages = pdfDoc.getPages();
      const targetPageIndex = Math.min(Math.max(1, pageNum), pages.length) - 1;
      const page = pages[targetPageIndex];
      const { width, height } = page.getSize();

      const imgDims = image.scale(sigWidth / image.width);
      let x = 50;
      let y = 50;

      if (placementMode === "preset") {
        const margin = 50;
        switch (position) {
          case "top-left":
            x = margin;
            y = height - imgDims.height - margin;
            break;
          case "top-right":
            x = width - imgDims.width - margin;
            y = height - imgDims.height - margin;
            break;
          case "bottom-left":
            x = margin;
            y = margin;
            break;
          case "bottom-right":
            x = width - imgDims.width - margin;
            y = margin;
            break;
          case "center":
            x = width / 2 - imgDims.width / 2;
            y = height / 2 - imgDims.height / 2;
            break;
        }
      } else {
        // Drag placement calculation
        x = dragPos.x / pdfScale;
        y = height - dragPos.y / pdfScale - imgDims.height;
      }

      page.drawImage(image, {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: imgDims.width,
        height: imgDims.height,
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `Signed_${pdfFile.name}`);
      toast.success("Signature added to PDF successfully!");
    } catch {
      toast.error("Failed to add signature to PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PDF File Upload Selector */}
      {!pdfFile ? (
        <div
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handlePdfChange(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => pdfInputRef.current?.click()}
          style={{
            backgroundColor: "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
          }}
          className="p-10 text-center cursor-pointer transition-all hover:bg-blue-50/50 rounded-lg"
        >
          <PenTool size={40} className="mx-auto mb-3 text-blue-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here to Add Signature & Stamp
          </p>
          <p className="text-xs font-semibold text-slate-500">or click to browse PDF document</p>
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => e.target.files?.[0] && handlePdfChange(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* File Overview Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-300 rounded-lg shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={28} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">{pdfFile.name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {formatFileSize(pdfFile.size)} • {pdfTotalPages} Total Pages
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setPdfFile(null);
                setPdfTotalPages(1);
                setActiveSigDataUrl(null);
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X size={16} /> Remove PDF
            </button>
          </div>

          {/* 2. Signature Creation Modes Selector */}
          <div className="p-4 bg-white border border-slate-300 rounded-lg space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <span className="text-sm font-extrabold text-slate-800">
                Choose How to Create Signature:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {[
                  { id: "draw", label: "✍️ Draw", icon: PenTool },
                  { id: "type", label: "⌨️ Type Name", icon: Type },
                  { id: "upload", label: "🖼️ Upload Image", icon: ImageIcon },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSigMode(mode.id as SigMode);
                      if (mode.id === "draw" && hasDrawn) updateActiveSignature();
                      if (mode.id === "type") updateActiveSignature();
                    }}
                    style={{
                      backgroundColor: sigMode === mode.id ? "#000080" : "transparent",
                      color: sigMode === mode.id ? "#ffffff" : "#334155",
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode A: Interactive Touch / Mouse Draw Pad */}
            {sigMode === "draw" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Pen Color:</span>
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPenColor(c.value)}
                        style={{ backgroundColor: c.value }}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                          penColor === c.value ? "scale-110 border-amber-400 ring-2 ring-blue-400" : "border-white"
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Thickness:</span>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      value={penWidth}
                      onChange={(e) => setPenWidth(parseInt(e.target.value))}
                      className="w-24 accent-blue-700"
                    />
                    <span className="font-bold">{penWidth}px</span>
                  </div>

                  <button
                    type="button"
                    onClick={clearDrawPad}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser size={14} /> Clear Pad
                  </button>
                </div>

                <div className="relative border-2 border-dashed border-slate-400 rounded-lg bg-slate-50 overflow-hidden">
                  <canvas
                    ref={drawCanvasRef}
                    width={600}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[160px] cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-bold">
                      ✍️ Draw your signature here using Mouse or Touchscreen
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode B: Stylish Type Name Generator */}
            {sigMode === "type" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-800 block mb-1">
                      Type Name or Text:
                    </label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="e.g. Md Shahanawaz Alam"
                      className="w-full p-2 text-sm font-bold border border-slate-400 rounded outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-800 block mb-1">
                      Signature Font Style:
                    </label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full p-2 text-xs font-bold border border-slate-400 rounded outline-none"
                    >
                      {FONT_STYLES.map((f) => (
                        <option key={f.id} value={f.font}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Font Color & Date Stamp Checkbox */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Text Color:</span>
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setTypedColor(c.value)}
                        style={{ backgroundColor: c.value }}
                        className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${
                          typedColor === c.value ? "scale-110 border-amber-400 ring-2 ring-blue-400" : "border-white"
                        }`}
                      />
                    ))}
                  </div>

                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={includeDateStamp}
                      onChange={(e) => setIncludeDateStamp(e.target.checked)}
                      className="accent-blue-700"
                    />
                    📅 Add Date Stamp ({dateStampText})
                  </label>
                </div>

                {/* Typed Signature Live Box */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg text-center flex items-center justify-center min-h-[90px]">
                  <span
                    style={{
                      fontFamily: selectedFont,
                      color: typedColor,
                      fontSize: "32px",
                      lineHeight: "1.2",
                    }}
                    className="font-bold"
                  >
                    {typedName || "Your Signature"}
                  </span>
                </div>
              </div>
            )}

            {/* Mode C: Upload PNG/JPG Image */}
            {sigMode === "upload" && (
              <div>
                <div
                  onClick={() => sigInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-400 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-all"
                >
                  <ImageIcon size={32} className="mx-auto mb-2 text-pink-600" />
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload Signature Image (PNG with transparent background recommended)
                  </p>
                  <input
                    ref={sigInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    hidden
                    onChange={(e) => e.target.files?.[0] && handleSigImageUpload(e.target.files[0])}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Placement & Positioning Controls */}
          {activeSigDataUrl && (
            <div className="p-4 bg-white border border-slate-300 rounded-lg space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <span className="text-sm font-extrabold text-slate-900">
                  Signature Placement & Size:
                </span>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700">Page:</span>
                  <button
                    type="button"
                    disabled={pageNum <= 1}
                    onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                    className="px-2 py-0.5 bg-slate-200 font-bold rounded border border-slate-300 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="font-extrabold text-slate-900">
                    {pageNum} / {pdfTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageNum >= pdfTotalPages}
                    onClick={() => setPageNum((p) => Math.min(pdfTotalPages, p + 1))}
                    className="px-2 py-0.5 bg-slate-200 font-bold rounded border border-slate-300 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-800">
                <div>
                  <label className="block mb-1">Signature Width ({sigWidth}px):</label>
                  <input
                    type="range"
                    min={60}
                    max={400}
                    value={sigWidth}
                    onChange={(e) => setSigWidth(parseInt(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>

                <div>
                  <label className="block mb-1">Placement Mode:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPlacementMode("manual")}
                      className={`flex-1 py-1 rounded font-bold border text-center ${
                        placementMode === "manual" ? "bg-blue-700 text-white border-blue-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      👆 Drag & Drop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlacementMode("preset")}
                      className={`flex-1 py-1 rounded font-bold border text-center ${
                        placementMode === "preset" ? "bg-blue-700 text-white border-blue-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      📍 Preset
                    </button>
                  </div>
                </div>

                {placementMode === "preset" && (
                  <div>
                    <label className="block mb-1">Preset Location:</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded font-bold"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Interactive PDF Canvas Viewer for Drag & Drop Placement */}
              {placementMode === "manual" && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-900 rounded border border-blue-200 text-xs font-bold">
                    <Move size={14} />
                    Drag signature box anywhere on Page {pageNum} to position it exactly!
                  </div>

                  <div
                    ref={containerRef}
                    className="relative border border-slate-400 rounded-lg overflow-hidden bg-slate-200 shadow-inner w-full touch-none select-none max-w-full min-h-[300px]"
                  >
                    <canvas ref={pageCanvasRef} className="w-full h-auto block" />

                    {activeSigDataUrl && (
                      <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        style={{
                          position: "absolute",
                          left: dragPos.x,
                          top: dragPos.y,
                          width: sigWidth * pdfScale,
                          cursor: isDragging ? "grabbing" : "grab",
                          boxShadow: isDragging ? "0 10px 25px -5px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
                          border: "2px dashed #000080",
                          backgroundColor: "rgba(255, 255, 255, 0.75)",
                          padding: "3px",
                        }}
                        className="rounded transition-shadow touch-none group z-10"
                      >
                        <img
                          src={activeSigDataUrl}
                          alt="Signature Preview"
                          className="w-full h-auto pointer-events-none block"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Embed Action Button */}
              <button
                onClick={handleAddSignature}
                disabled={loading}
                style={{
                  backgroundColor: "#000080",
                  color: "#ffffff",
                  borderTop: "2px solid #ffffff",
                  borderLeft: "2px solid #ffffff",
                  borderRight: "2px solid #000040",
                  borderBottom: "2px solid #000040",
                }}
                className="w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-900 transition-colors shadow-md rounded"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Embedding Signature...
                  </>
                ) : (
                  <>
                    <PenTool size={20} /> Add Signature to PDF Page {pageNum} & Download
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
