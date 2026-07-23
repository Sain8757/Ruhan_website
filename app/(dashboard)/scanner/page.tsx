"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Download, Sliders, Trash2, Camera } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";
import jsPDF from "jspdf";
import PageHeader from "@/components/layout/PageHeader";
import ScanningModal from "@/components/doc-scanner/ScanningModal";

const loadPdfJs = async () => {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve((window as any).pdfjsLib);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export default function DocumentScannerPage() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [image, setImage] = useState<string | null>(null);
  const [scanningFileUrl, setScanningFileUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"color" | "bw" | "original">("color");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Removed crop states (now handled in ScanningModal)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      try {
        toast.info("Extracting first page from PDF...");
        const pdfjs: any = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 3.0 }); // Higher quality base scale
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No 2d context");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        // Use PNG for lossless intermediate step
        const dataUrl = canvas.toDataURL("image/png");
        setScanningFileUrl(dataUrl);
      } catch (err) {
        toast.error("Failed to parse PDF document.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScanningFileUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScanComplete = (croppedImageSrc: string) => {
    setImage(croppedImageSrc);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = croppedImageSrc;
    setScanningFileUrl(null);
  };

  const drawWorkspace = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayWidth = canvas.parentElement?.clientWidth || 500;
    const displayHeight = (displayWidth * img.height) / img.width;
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    if (mode === "bw") {
      ctx.filter = `grayscale(100%) contrast(${contrast + 50}%) brightness(${brightness}%)`;
    } else if (mode === "color") {
      ctx.filter = `saturate(130%) contrast(${contrast}%) brightness(${brightness}%)`;
    } else {
      ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
    }

    // Draw main image
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    
    // Apply color mode filters onto canvas if not drawing crop lines
    ctx.filter = "none";
  }, [mode, contrast, brightness]);

  useEffect(() => {
    if (image) drawWorkspace();
  }, [image, drawWorkspace, mode, contrast, brightness]);

  // Mouse handlers removed, crop happens in ScanningModal

  // Perform Perspective Correction + Enhance Filters
  const handleDownloadPDF = () => {
    const img = imageRef.current;
    if (!img) return;

    try {
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      const w = img.width;
      const h = img.height;

      tempCanvas.width = w;
      tempCanvas.height = h;

      // Apply Filter Styles
      if (mode === "bw") {
        ctx.filter = `grayscale(100%) contrast(${contrast + 50}%) brightness(${brightness}%)`;
      } else if (mode === "color") {
        ctx.filter = `saturate(130%) contrast(${contrast}%) brightness(${brightness}%)`;
      } else {
        ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
      }

      ctx.drawImage(img, 0, 0, w, h);

      const croppedData = tempCanvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation: w > h ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const printW = w > h ? 297 : 210;
      const printH = w > h ? 210 : 297;
      pdf.addImage(croppedData, "JPEG", 0, 0, printW, printH);
      
      const pdfUrl = pdf.output('bloburl');
      downloadWithRename(pdfUrl, `RA_Scanned_Document_${Date.now()}.pdf`);
      toast.success("Document downloaded as PDF!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadPNG = () => {
    const img = imageRef.current;
    if (!img) return;
    try {
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;
      
      const w = img.width;
      const h = img.height;
      tempCanvas.width = w;
      tempCanvas.height = h;

      if (mode === "bw") {
        ctx.filter = `grayscale(100%) contrast(${contrast + 50}%) brightness(${brightness}%)`;
      } else if (mode === "color") {
        ctx.filter = `saturate(130%) contrast(${contrast}%) brightness(${brightness}%)`;
      } else {
        ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
      }
      
      ctx.drawImage(img, 0, 0, w, h);
      
      downloadWithRename(tempCanvas.toDataURL("image/png"), `RA_Scanned_Document_${Date.now()}.png`);
      toast.success("Document saved as PNG!");
    } catch {
      toast.error("Failed to generate PNG");
    }
  };

  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="Document Scanner"
        subtitle="Auto-align, crop, enhance and convert uploads into PDF"
      />

      {scanningFileUrl && (
        <ScanningModal 
          imageSrc={scanningFileUrl} 
          onComplete={handleScanComplete} 
        />
      )}

      <div className="tool-workspace">
        {/* Workspace */}
        <div className="tool-preview-panel">
          {image ? (
            <div className="tool-preview-inner">
              <div className="tool-canvas-frame w-full">
                <canvas
                  ref={canvasRef}
                  className="max-w-full block shadow-sm border border-gray-100"
                />
              </div>
            </div>
          ) : (
            <div className="tool-empty-state">
              <div className="tool-empty-icon">
                <FileText size={32} />
              </div>
              <div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>Upload Scan File</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Select PNG, JPG, or PDF scan image
                </p>
              </div>
              <div className="flex gap-2 justify-center mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  <FileText size={16} />
                  Upload File
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  Scan with Camera
                </button>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleImageUpload}
          />
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
          />
        </div>

        {/* Adjustments & Export Panel */}
        <div className="control-rail">
          <div className="glass-card control-section space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <Sliders size={18} className="text-blue-500" />
              Scanner Presets
            </h2>

            {/* Mode Presets */}
            <div>
              <label className="label">Enhancement Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "color", label: "Color" },
                  { id: "bw", label: "B&W Scan" },
                  { id: "original", label: "Original" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as any)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                      mode === item.id
                        ? "gradient-brand text-white shadow-sm border-blue-600"
                        : "btn-secondary"
                    }`}
                    disabled={!image}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast / Brightness */}
            {mode !== "original" && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="range-field"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="range-field"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setImage(null);
                setMode("color");
              }}
              className="btn-secondary w-full text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-2"
              disabled={!image}
            >
              <Trash2 size={16} />
              Reset Document
            </button>
          </div>

          <div className="glass-card control-section">
            <h2 className="section-title">Save & Export</h2>
            <button
              onClick={handleDownloadPDF}
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={!image}
            >
              <Download size={16} />
              Download Scanned PDF
            </button>
            <button
              onClick={handleDownloadPNG}
              className="btn-secondary w-full flex items-center justify-center gap-2 mt-2"
              disabled={!image}
            >
              <Download size={16} />
              Download as PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
