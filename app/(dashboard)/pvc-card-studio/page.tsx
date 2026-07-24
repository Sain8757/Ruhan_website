"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CreditCard, Download, Trash2, Sparkles, FileImage, ChevronLeft, ChevronRight, Search, UserCheck, Loader2, Printer, CheckCircle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";
import jsPDF from "jspdf";
import PageHeader from "@/components/layout/PageHeader";
import type { PDFDocumentProxy, PageViewport } from "pdfjs-dist";
import ImageCropperModal from "@/components/tools/ImageCropperModal";

type CropSide = "front" | "back";

const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const ACCEPTED_FORMATS = "image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.pdf,application/pdf";
const PDF_RENDER_MAX_SIDE = 3600;
const PDF_RENDER_MIN_SCALE = 2;
const PDF_RENDER_MAX_SCALE = 5;

type CustomerResult = { id: string; name: string; mobile: string };

export default function PvcCardStudioPage() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string>("");
  const [sourceType, setSourceType] = useState<"image" | "pdf" | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const [cardPreset, setCardPreset] = useState<string>("aadhaar");
  const [autoEnhance, setAutoEnhance] = useState<boolean>(true);
  
  const [croppedFront, setCroppedFront] = useState<string | null>(null);
  const [croppedBack, setCroppedBack] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<CropSide>("front");
  const [cropperOpen, setCropperOpen] = useState(false);

  // Customer link state
  const [customerQuery, setCustomerQuery] = useState<string>("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [loggingService, setLoggingService] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);

  // Customer search debounced
  useEffect(() => {
    if (!customerQuery.trim() || selectedCustomer) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(customerQuery.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(data.customers ?? data ?? []);
          setShowDropdown(true);
        }
      } catch {
        // fail silently
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery, selectedCustomer]);

  const handleSelectCustomer = (customer: CustomerResult) => {
    setSelectedCustomer(customer);
    setCustomerQuery("");
    setCustomerResults([]);
    setShowDropdown(false);
  };

  const handleDeselectCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setCustomerResults([]);
    setShowDropdown(false);
  };

  const handleLogService = async () => {
    if (!selectedCustomer) return;
    setLoggingService(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          serviceType: `PVC ${cardPreset.toUpperCase()} Card Print`,
          fees: 50,
          paymentStatus: "UNPAID",
          paymentMode: "CASH",
          notes: "PVC Card Studio Print Job",
        }),
      });
      if (!res.ok) throw new Error("Failed to log service");
      toast.success("Service logged for " + selectedCustomer.name);
      handleDeselectCustomer();
    } catch (error: any) {
      toast.error(error.message || "Could not log service");
    } finally {
      setLoggingService(false);
    }
  };

  const renderPdfPage = useCallback(async (pdf: PDFDocumentProxy, pageNumber: number) => {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      PDF_RENDER_MAX_SCALE,
      Math.max(PDF_RENDER_MIN_SCALE, PDF_RENDER_MAX_SIDE / Math.max(baseViewport.width, baseViewport.height))
    );
    const viewport = page.getViewport({ scale }) as PageViewport;
    const renderCanvas = document.createElement("canvas");
    const ctx = renderCanvas.getContext("2d");
    if (!ctx) throw new Error("PDF render canvas not available");

    renderCanvas.width = Math.round(viewport.width);
    renderCanvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const preview = renderCanvas.toDataURL("image/png");
    setSourcePreview(preview);
    setSourceType("pdf");
    setPdfPage(pageNumber);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    setSourceName(file.name);
    setSourcePreview(null);
    pdfDocumentRef.current = null;

    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        pdfDocumentRef.current = pdf;
        setPdfPageCount(pdf.numPages);
        await renderPdfPage(pdf, 1);
        toast.success("PDF loaded. Choose side and crop.");
        return;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Image read failed"));
        reader.readAsDataURL(file);
      });
      setSourcePreview(dataUrl);
      setSourceType("image");
      setPdfPage(1);
      setPdfPageCount(0);
      toast.success("Image loaded. Choose side and crop.");
    } catch (error: any) {
      toast.error(error.message || "File load failed");
    } finally {
      setIsLoadingFile(false);
      e.target.value = "";
    }
  };

  const changePdfPage = async (direction: -1 | 1) => {
    const pdf = pdfDocumentRef.current;
    if (!pdf) return;

    const nextPage = Math.max(1, Math.min(pdf.numPages, pdfPage + direction));
    if (nextPage === pdfPage) return;

    setIsLoadingFile(true);
    try {
      await renderPdfPage(pdf, nextPage);
    } catch (error: any) {
      toast.error(error.message || "PDF page load failed");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const applyAutoEnhance = (base64Url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(base64Url);

        ctx.filter = "brightness(108%) contrast(112%) saturate(105%)";
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(base64Url);
      img.src = base64Url;
    });
  };

  const handleCropComplete = async (croppedImageBase64: string) => {
    const finalImage = autoEnhance ? await applyAutoEnhance(croppedImageBase64) : croppedImageBase64;
    if (activeSide === "front") {
      setCroppedFront(finalImage);
      setActiveSide("back");
      toast.success("Front side cropped & enhanced! Now crop Back side.");
    } else {
      setCroppedBack(finalImage);
      toast.success("Back side cropped & enhanced! Ready for PVC export.");
    }
    setCropperOpen(false);
  };

  const handleDownloadCleanPDF = () => {
    if (!croppedFront && !croppedBack) {
      toast.error("Please crop at least one side");
      return;
    }

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      let startX = (pageWidth - (CARD_WIDTH_MM * 2 + 6)) / 2;
      let startY = 25;

      if (croppedFront && croppedBack) {
        // Clean Side-by-Side Dual PVC Layout (No text headers)
        pdf.addImage(croppedFront, "PNG", startX, startY, CARD_WIDTH_MM, CARD_HEIGHT_MM);
        pdf.setLineWidth(0.2);
        pdf.setDrawColor(160, 160, 160);
        pdf.rect(startX, startY, CARD_WIDTH_MM, CARD_HEIGHT_MM, "S");
        
        pdf.addImage(croppedBack, "PNG", startX + CARD_WIDTH_MM + 6, startY, CARD_WIDTH_MM, CARD_HEIGHT_MM);
        pdf.rect(startX + CARD_WIDTH_MM + 6, startY, CARD_WIDTH_MM, CARD_HEIGHT_MM, "S");
      } else {
        const x = (pageWidth - CARD_WIDTH_MM) / 2;
        let y = startY;
        if (croppedFront) {
          pdf.addImage(croppedFront, "PNG", x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
          pdf.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, "S");
          y += CARD_HEIGHT_MM + 10;
        }
        if (croppedBack) {
          pdf.addImage(croppedBack, "PNG", x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
          pdf.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, "S");
        }
      }

      const pdfUrl = pdf.output("bloburl").toString();
      downloadWithRename(pdfUrl, `PVC_Card_${cardPreset.toUpperCase()}_${Date.now()}.pdf`);
      toast.success("Clean PVC PDF created!");
    } catch {
      toast.error("Error creating layout PDF");
    }
  };

  const handlePrintPVC = () => {
    window.print();
  };

  const handleReset = () => {
    setSourcePreview(null);
    setSourceName("");
    setSourceType(null);
    setPdfPage(1);
    setPdfPageCount(0);
    setCroppedFront(null);
    setCroppedBack(null);
    setActiveSide("front");
    pdfDocumentRef.current = null;
  };

  return (
    <div className="page-shell page-shell-tool">
      {/* Printable PVC Canvas (Hidden on screen, ONLY visible on print) */}
      {(croppedFront || croppedBack) && (
        <div className="hidden print:flex print:items-center print:justify-center print:w-full print:h-full print:p-0 print:m-0">
          <div className="flex items-center gap-2 m-auto" style={{ width: "177mm", height: "54mm" }}>
            {croppedFront && (
              <div style={{ width: "85.6mm", height: "53.98mm", border: "0.5pt solid #999", borderRadius: "3mm", overflow: "hidden" }}>
                <img src={croppedFront} alt="Front Card" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {croppedBack && (
              <div style={{ width: "85.6mm", height: "53.98mm", border: "0.5pt solid #999", borderRadius: "3mm", overflow: "hidden" }}>
                <img src={croppedBack} alt="Back Card" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen UI - Hidden on Print */}
      <div className="no-print">
        <PageHeader
          title="PVC Card Studio"
          subtitle="Generate high-resolution 85.6mm x 53.98mm PVC ID cards for Aadhaar, PAN, Voter, Ayushman & License"
        />

        {/* Customer Search & Link */}
        <div className="glass-card p-4 mb-6" style={{ position: "relative" }}>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck size={18} className="text-blue-500" />
            <h2 className="section-title mb-0" style={{ fontSize: "0.95rem" }}>Link to Customer (Optional)</h2>
          </div>

          {selectedCustomer ? (
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <span
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  background: "rgba(79,110,247,0.15)",
                  color: "#4f6ef7",
                  border: "1px solid rgba(79,110,247,0.3)",
                }}
              >
                <UserCheck size={14} />
                {selectedCustomer.name}
                <button onClick={handleDeselectCustomer} className="ml-1 rounded-full hover:opacity-70 transition-opacity">✕</button>
              </span>
              <button onClick={handleLogService} disabled={loggingService} className="btn-primary flex items-center gap-2 text-xs py-1.5 px-3">
                {loggingService ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                {loggingService ? "Logging..." : "Log Service (₹50)"}
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }} className="mt-2">
              <div className="flex items-center gap-2" style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "0.75rem", color: "var(--text-muted)", pointerEvents: "none" }}>
                  {searchingCustomers ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </span>
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowDropdown(true)}
                  placeholder="Search customer name or mobile..."
                  className="input-field w-full"
                  style={{ paddingLeft: "2.25rem" }}
                  autoComplete="off"
                />
              </div>

              {showDropdown && customerResults.length > 0 && (
                <ul className="glass-card" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, padding: "4px", maxHeight: "200px", overflowY: "auto" }}>
                  {customerResults.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectCustomer(c); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-500/10 flex justify-between items-center"
                      >
                        <span className="font-semibold text-sm">{c.name}</span>
                        <span className="text-xs text-slate-400">{c.mobile}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="tool-workspace">
          <div className="tool-preview-panel">
            {sourcePreview ? (
              <div className="tool-preview-inner h-full flex flex-col items-center justify-center relative overflow-hidden">
                <img 
                  src={sourcePreview} 
                  alt="Source Document" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200" 
                />
                <div className="mt-4 text-center">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {sourceName} {sourceType === "pdf" ? `- PDF page ${pdfPage} of ${pdfPageCount}` : ""}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Click 'Crop Selected Area' to open interactive cropper.
                  </div>
                </div>
              </div>
            ) : (
              <div className="tool-empty-state">
                <div className="tool-empty-icon">
                  <CreditCard size={32} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>Upload Document for PVC Card</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Upload e-Aadhaar, e-PAN, Voter ID, or Ayushman PDF / Image
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                  disabled={isLoadingFile}
                >
                  <FileImage size={16} />
                  {isLoadingFile ? "Loading..." : "Choose File"}
                </button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={ACCEPTED_FORMATS}
              onChange={handleFileUpload}
            />
          </div>

          <div className="control-rail">
            <div className="glass-card control-section space-y-4">
              <h2 className="section-title flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                PVC Preset & Controls
              </h2>

              <div>
                <label className="label">Select Card Type</label>
                <select
                  className="input-field w-full text-xs font-semibold"
                  value={cardPreset}
                  onChange={(e) => setCardPreset(e.target.value)}
                >
                  <option value="aadhaar">e-Aadhaar Card (Standard CR80)</option>
                  <option value="pan">e-PAN Card (NSDL / UTI)</option>
                  <option value="voter">Voter ID Card (ECI)</option>
                  <option value="ayushman">Ayushman Bharat (PMJAY)</option>
                  <option value="license">Driving License / RC</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-enhance-studio-check"
                  checked={autoEnhance}
                  onChange={(e) => setAutoEnhance(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="auto-enhance-studio-check" className="text-xs font-medium cursor-pointer">
                  Auto-Enhance Brightness & Sharpness
                </label>
              </div>

              <hr className="border-slate-200" />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full"
                disabled={isLoadingFile}
                type="button"
              >
                <FileImage size={16} />
                {sourcePreview ? "Change Document" : "Upload File"}
              </button>

              {sourceType === "pdf" && (
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => changePdfPage(-1)}
                    disabled={isLoadingFile || pdfPage <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center text-xs font-semibold">
                    Page {pdfPage} / {pdfPageCount}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => changePdfPage(1)}
                    disabled={isLoadingFile || pdfPage >= pdfPageCount}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                <button
                  className={`py-2 px-4 rounded-lg flex-1 text-xs font-bold transition-all ${activeSide === "front" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`}
                  onClick={() => setActiveSide("front")}
                  type="button"
                >
                  Front Side
                </button>
                <button
                  className={`py-2 px-4 rounded-lg flex-1 text-xs font-bold transition-all ${activeSide === "back" ? "gradient-brand text-white shadow-sm" : "btn-ghost"}`}
                  onClick={() => setActiveSide("back")}
                  type="button"
                >
                  Back Side
                </button>
              </div>

              <button
                onClick={() => setCropperOpen(true)}
                className="btn-primary w-full"
                disabled={!sourcePreview || isLoadingFile}
              >
                Crop {activeSide === "front" ? "Front" : "Back"} Side
              </button>
            </div>

            <div className="glass-card control-section space-y-4">
              <h2 className="section-title">Cropped Card Outputs</h2>

              <div className="space-y-3">
                <div>
                  <span className="label">Front Side (85.6mm x 53.98mm)</span>
                  {croppedFront ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img src={croppedFront} alt="Front Cropped" className="w-full object-contain max-h-[120px]" />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadWithRename(croppedFront, `PVC_Front_${Date.now()}.png`)}
                          className="bg-blue-600 text-white rounded-lg p-1.5"
                          title="Download PNG"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => setCroppedFront(null)}
                          className="bg-red-500 text-white rounded-lg p-1.5"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 border border-dashed rounded-xl text-center text-xs text-slate-400">
                      No Front Side Cropped
                    </div>
                  )}
                </div>

                <div>
                  <span className="label">Back Side (85.6mm x 53.98mm)</span>
                  {croppedBack ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img src={croppedBack} alt="Back Cropped" className="w-full object-contain max-h-[120px]" />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadWithRename(croppedBack, `PVC_Back_${Date.now()}.png`)}
                          className="bg-blue-600 text-white rounded-lg p-1.5"
                          title="Download PNG"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => setCroppedBack(null)}
                          className="bg-red-500 text-white rounded-lg p-1.5"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 border border-dashed rounded-xl text-center text-xs text-slate-400">
                      No Back Side Cropped
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  onClick={handleDownloadCleanPDF}
                  className="btn-primary w-full flex items-center justify-center gap-2 font-bold"
                  disabled={!croppedFront && !croppedBack}
                >
                  <Download size={16} />
                  Download Clean PVC PDF
                </button>
                <button
                  onClick={handlePrintPVC}
                  className="btn-secondary w-full flex items-center justify-center gap-2 font-bold text-slate-800"
                  disabled={!croppedFront && !croppedBack}
                >
                  <Printer size={16} />
                  Print PVC Cards Direct
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary w-full text-red-500 hover:bg-red-50"
                  disabled={!sourcePreview && !croppedFront && !croppedBack}
                >
                  <Trash2 size={16} />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sourcePreview && (
        <ImageCropperModal
          isOpen={cropperOpen}
          imageSrc={sourcePreview}
          onClose={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
