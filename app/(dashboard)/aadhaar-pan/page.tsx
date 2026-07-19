"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CreditCard, Download, Trash2, Sparkles, FileImage, ChevronLeft, ChevronRight, Search, UserCheck, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import jsPDF from "jspdf";
import PageHeader from "@/components/layout/PageHeader";
import type { PDFDocumentProxy, PageViewport } from "pdfjs-dist";

type CropSide = "front" | "back";
type ResizeDirection = "n" | "e" | "s" | "w" | "nw" | "ne" | "sw" | "se";
type DragType = "move" | `resize-${ResizeDirection}` | null;
type CropBox = { x: number; y: number; w: number; h: number };

const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const CARD_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM;
const ACCEPTED_FORMATS = "image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.pdf,application/pdf";
const MIN_BOX_SIZE = 0.05;
const PDF_RENDER_MAX_SIDE = 3600;
const PDF_RENDER_MIN_SCALE = 2;
const PDF_RENDER_MAX_SCALE = 5;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("File preview load nahi ho paya"));
    img.src = src;
  });

const clampBox = (box: CropBox): CropBox => {
  const w = Math.max(MIN_BOX_SIZE, Math.min(1, box.w));
  const h = Math.max(MIN_BOX_SIZE, Math.min(1, box.h));
  return {
    x: Math.max(0, Math.min(1 - w, box.x)),
    y: Math.max(0, Math.min(1 - h, box.y)),
    w,
    h,
  };
};

const getResizeCursor = (dragType: DragType) => {
  if (dragType === "move") return "grabbing";
  if (dragType === "resize-n" || dragType === "resize-s") return "ns-resize";
  if (dragType === "resize-e" || dragType === "resize-w") return "ew-resize";
  if (dragType === "resize-ne" || dragType === "resize-sw") return "nesw-resize";
  if (dragType === "resize-nw" || dragType === "resize-se") return "nwse-resize";
  return "crosshair";
};

type CustomerResult = { id: string; name: string; mobile: string };

export default function AadhaarPanCropPage() {
  const toast = useToast();
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string>("");
  const [sourceType, setSourceType] = useState<"image" | "pdf" | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [croppedFront, setCroppedFront] = useState<string | null>(null);
  const [croppedBack, setCroppedBack] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<CropSide>("front");
  const [box, setBox] = useState<CropBox>({ x: 0.1, y: 0.2, w: 0.8, h: 0.8 / CARD_RATIO });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<DragType>(null);

  // Customer search state
  const [customerQuery, setCustomerQuery] = useState<string>("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [loggingService, setLoggingService] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);

  const resetSelectionBox = useCallback(() => {
    setBox({ x: 0.1, y: 0.2, w: 0.8, h: 0.8 / CARD_RATIO });
  }, []);

  // Debounced customer search
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
        // silently fail
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
          serviceType: "Aadhaar/PAN Print",
          fees: 30,
          paymentStatus: "UNPAID",
          paymentMode: "CASH",
          notes: "ID card print job from Aadhaar-PAN tool",
        }),
      });
      if (!res.ok) throw new Error("Failed to log service");
      toast.success("Service logged for " + selectedCustomer.name);
      handleDeselectCustomer();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log service");
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
    if (!ctx) throw new Error("PDF render canvas available nahi hai");

    renderCanvas.width = Math.round(viewport.width);
    renderCanvas.height = Math.round(viewport.height);
    await page.render({ canvas: renderCanvas, canvasContext: ctx, viewport }).promise;

    const preview = renderCanvas.toDataURL("image/png");
    const img = await loadImage(preview);
    imageRef.current = img;
    setSourcePreview(preview);
    setSourceType("pdf");
    setPdfPage(pageNumber);
    resetSelectionBox();
  }, [resetSelectionBox]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    setSourceName(file.name);
    setSourcePreview(null);
    imageRef.current = null;
    pdfDocumentRef.current = null;

    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        pdfDocumentRef.current = pdf;
        setPdfPageCount(pdf.numPages);
        await renderPdfPage(pdf, 1);
        toast.success("PDF loaded. Page select karke manually crop karein.");
        return;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Image read nahi ho payi"));
        reader.readAsDataURL(file);
      });
      const img = await loadImage(dataUrl);
      imageRef.current = img;
      setSourcePreview(dataUrl);
      setSourceType("image");
      setPdfPage(1);
      setPdfPageCount(0);
      resetSelectionBox();
      toast.success("Image loaded. Crop box adjust karein.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File load nahi ho payi");
    } finally {
      setIsLoadingFile(false);
      e.target.value = "";
    }
  };

  const drawWorkspace = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const wrapperWidth = canvas.parentElement?.clientWidth || 600;
    const displayWidth = Math.min(wrapperWidth, img.width);
    const displayHeight = (displayWidth * img.height) / img.width;
    const ratio = window.devicePixelRatio || 1;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    const bx = box.x * displayWidth;
    const by = box.y * displayHeight;
    const bw = box.w * displayWidth;
    const bh = box.h * displayHeight;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, displayWidth, by);
    ctx.fillRect(0, by, bx, bh);
    ctx.fillRect(bx + bw, by, displayWidth - (bx + bw), bh);
    ctx.fillRect(0, by + bh, displayWidth, displayHeight - (by + bh));

    ctx.strokeStyle = "#4f6ef7";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    const handles: Array<[number, number, number]> = [
      [bx, by, 20],
      [bx + bw, by, 20],
      [bx, by + bh, 20],
      [bx + bw, by + bh, 20],
      [bx + bw / 2, by, 14],
      [bx + bw, by + bh / 2, 14],
      [bx + bw / 2, by + bh, 14],
      [bx, by + bh / 2, 14],
    ];
    handles.forEach(([hx, hy, size]) => {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#4f6ef7";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(hx - size / 2, hy - size / 2, size, size, 5);
      ctx.fill();
      ctx.stroke();
    });
  }, [box]);

  useEffect(() => {
    if (sourcePreview) drawWorkspace();
  }, [drawWorkspace, sourcePreview]);

  const pointerToCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerToCanvas(e);
    if (!point) return;

    const bx = box.x * point.width;
    const by = box.y * point.height;
    const bw = box.w * point.width;
    const bh = box.h * point.height;
    const handles: Array<{ type: DragType; x: number; y: number; radius: number }> = [
      { type: "resize-nw", x: bx, y: by, radius: 24 },
      { type: "resize-ne", x: bx + bw, y: by, radius: 24 },
      { type: "resize-sw", x: bx, y: by + bh, radius: 24 },
      { type: "resize-se", x: bx + bw, y: by + bh, radius: 24 },
      { type: "resize-n", x: bx + bw / 2, y: by, radius: 18 },
      { type: "resize-e", x: bx + bw, y: by + bh / 2, radius: 18 },
      { type: "resize-s", x: bx + bw / 2, y: by + bh, radius: 18 },
      { type: "resize-w", x: bx, y: by + bh / 2, radius: 18 },
    ];
    const handle = handles.find((item) => Math.hypot(point.x - item.x, point.y - item.y) < item.radius);

    e.currentTarget.setPointerCapture(e.pointerId);
    if (handle?.type) {
      setDragType(handle.type);
      setIsDragging(true);
      setDragStart({ x: point.x, y: point.y });
      return;
    }

    if (point.x >= bx && point.x <= bx + bw && point.y >= by && point.y <= by + bh) {
      setDragType("move");
      setIsDragging(true);
      setDragStart({ x: point.x - bx, y: point.y - by });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const point = pointerToCanvas(e);
    if (!point) return;

    if (dragType === "move") {
      const nextX = Math.max(0, Math.min(point.width - box.w * point.width, point.x - dragStart.x)) / point.width;
      const nextY = Math.max(0, Math.min(point.height - box.h * point.height, point.y - dragStart.y)) / point.height;
      setBox((current) => ({ ...current, x: nextX, y: nextY }));
      return;
    }

    if (dragType?.startsWith("resize")) {
      const nx = Math.max(0, Math.min(1, point.x / point.width));
      const ny = Math.max(0, Math.min(1, point.y / point.height));

      setBox((current) => {
        const right = current.x + current.w;
        const bottom = current.y + current.h;
        const direction = dragType.replace("resize-", "") as ResizeDirection;
        let nextX = current.x;
        let nextY = current.y;
        let nextRight = right;
        let nextBottom = bottom;

        if (direction.includes("w")) {
          nextX = Math.min(right - MIN_BOX_SIZE, nx);
        }
        if (direction.includes("e")) {
          nextRight = Math.max(current.x + MIN_BOX_SIZE, nx);
        }
        if (direction.includes("n")) {
          nextY = Math.min(bottom - MIN_BOX_SIZE, ny);
        }
        if (direction.includes("s")) {
          nextBottom = Math.max(current.y + MIN_BOX_SIZE, ny);
        }

        return clampBox({ x: nextX, y: nextY, w: nextRight - nextX, h: nextBottom - nextY });
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setDragType(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const changePdfPage = async (direction: -1 | 1) => {
    const pdf = pdfDocumentRef.current;
    if (!pdf) return;

    const nextPage = Math.max(1, Math.min(pdf.numPages, pdfPage + direction));
    if (nextPage === pdfPage) return;

    setIsLoadingFile(true);
    try {
      await renderPdfPage(pdf, nextPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF page load nahi ho paya");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) {
      toast.error("Pehle PDF ya image upload karein");
      return;
    }

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    const sx = Math.round(box.x * img.width);
    const sy = Math.round(box.y * img.height);
    const sw = Math.round(box.w * img.width);
    const sh = Math.round(box.h * img.height);

    tempCanvas.width = sw;
    tempCanvas.height = sh;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sw, sh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    const croppedData = tempCanvas.toDataURL("image/png");

    if (activeSide === "front") {
      setCroppedFront(croppedData);
      setActiveSide("back");
      toast.success("Front cropped. Ab back side select/crop karein.");
    } else {
      setCroppedBack(croppedData);
      toast.success("Back cropped. PDF/PNG export ready hai.");
    }
  };

  const downloadCroppedImage = (side: CropSide, dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `RA_Seva_${side === "front" ? "Front" : "Back"}_${Date.now()}.png`;
    link.click();
  };

  const handleDownloadPDF = () => {
    if (!croppedFront && !croppedBack) {
      toast.error("Please crop at least one side");
      return;
    }

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const x = (pageWidth - CARD_WIDTH_MM) / 2;
      let currentY = 20;

      if (croppedFront) {
        pdf.addImage(croppedFront, "PNG", x, currentY, CARD_WIDTH_MM, CARD_HEIGHT_MM);
        currentY += CARD_HEIGHT_MM + 12;
      }

      if (croppedBack) {
        pdf.addImage(croppedBack, "PNG", x, currentY, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      }

      pdf.save(`RA_Seva_Card_Print_${Date.now()}.pdf`);
      toast.success("PDF created successfully!");
    } catch {
      toast.error("Error creating layout PDF");
    }
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
    imageRef.current = null;
    pdfDocumentRef.current = null;
    resetSelectionBox();
  };

  const updateBoxSize = (axis: "w" | "h", value: number) => {
    setBox((current) => {
      if (axis === "w") {
        return clampBox({ ...current, w: value, x: Math.min(current.x, 1 - value) });
      }

      return clampBox({ ...current, h: value, y: Math.min(current.y, 1 - value) });
    });
  };

  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="Aadhaar & PAN Crop Tool"
        subtitle="Crop and print ID cards to perfect physical proportions"
      />

      {/* ── Customer Search & Link ── */}
      <div className="glass-card p-4 mb-6" style={{ position: "relative" }}>
        <div className="flex items-center gap-2 mb-1">
          <UserCheck size={18} className="text-blue-500" />
          <h2 className="section-title mb-0" style={{ fontSize: "0.95rem" }}>Link to Customer (Optional)</h2>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Optionally link this print job to a customer record and log the service.
        </p>

        {selectedCustomer ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: "var(--color-brand-subtle, rgba(79,110,247,0.15))",
                color: "var(--color-brand, #4f6ef7)",
                border: "1px solid rgba(79,110,247,0.3)",
              }}
            >
              <UserCheck size={14} />
              {selectedCustomer.name}
              <button
                onClick={handleDeselectCustomer}
                className="ml-1 rounded-full hover:opacity-70 transition-opacity"
                title="Deselect customer"
                style={{ lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
            <button
              onClick={handleLogService}
              disabled={loggingService}
              className="btn-primary flex items-center gap-2"
              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
            >
              {loggingService ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              {loggingService ? "Logging..." : "Log Service"}
            </button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <div className="flex items-center gap-2" style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.75rem", color: "var(--text-muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                {searchingCustomers ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </span>
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                onFocus={() => customerResults.length > 0 && setShowDropdown(true)}
                placeholder="Search customer by name or mobile…"
                className="input-field w-full"
                style={{ paddingLeft: "2.25rem" }}
                autoComplete="off"
              />
            </div>

            {showDropdown && customerResults.length > 0 && (
              <ul
                className="glass-card"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  padding: "0.25rem",
                  maxHeight: "220px",
                  overflowY: "auto",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                }}
              >
                {customerResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectCustomer(c); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors flex justify-between items-center gap-2"
                    >
                      <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.mobile}</span>
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
            <div className="tool-preview-inner">
              <div className="tool-canvas-frame w-full">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="touch-none max-w-full block"
                  style={{ cursor: getResizeCursor(dragType) }}
                  title="Drag inside to move. Corner and side handles se resize karein."
                />
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {sourceName} {sourceType === "pdf" ? `- PDF page ${pdfPage} of ${pdfPageCount}` : ""}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Box ke andar drag karke move karein. White corner/side handles ya sliders se chhota-bada karein.
              </div>
            </div>
          ) : (
            <div className="tool-empty-state">
              <div className="tool-empty-icon">
                <CreditCard size={32} />
              </div>
              <div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>Upload Aadhaar/PAN</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  PDF, JPEG, JPG, PNG, WebP aur browser-supported images
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
              Cropper Action
            </h2>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full"
              disabled={isLoadingFile}
              type="button"
            >
              <FileImage size={16} />
              {sourcePreview ? "Change File" : "Upload PDF/Image"}
            </button>

            {sourceType === "pdf" && (
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => changePdfPage(-1)}
                  disabled={isLoadingFile || pdfPage <= 1}
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Page {pdfPage} / {pdfPageCount}
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => changePdfPage(1)}
                  disabled={isLoadingFile || pdfPage >= pdfPageCount}
                  title="Next page"
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
              onClick={handleCrop}
              className="btn-primary w-full"
              disabled={!sourcePreview || isLoadingFile}
            >
              Crop Selected Area ({activeSide === "front" ? "Front" : "Back"})
            </button>

            <div className="space-y-4 rounded-xl p-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="label mb-0">Crop Width</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{Math.round(box.w * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={Math.round(box.w * 100)}
                  onChange={(e) => updateBoxSize("w", parseInt(e.target.value) / 100)}
                  className="range-field"
                  disabled={!sourcePreview}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="label mb-0">Crop Height</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{Math.round(box.h * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={Math.round(box.h * 100)}
                  onChange={(e) => updateBoxSize("h", parseInt(e.target.value) / 100)}
                  className="range-field"
                  disabled={!sourcePreview}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={resetSelectionBox}
              className="btn-secondary w-full"
              disabled={!sourcePreview}
            >
              Reset Crop Box
            </button>
          </div>

          <div className="glass-card control-section space-y-4">
            <h2 className="section-title">Cropped Output</h2>

            <div className="space-y-4">
              <div>
                <span className="label">Front Side Preview</span>
                {croppedFront ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                    <img src={croppedFront} alt="Front Cropped" className="w-full object-contain max-h-[120px]" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadCroppedImage("front", croppedFront)}
                        className="bg-blue-600 text-white rounded-lg p-1.5 hover:bg-blue-700 transition-colors"
                        title="Download front PNG"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => setCroppedFront(null)}
                        className="bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600 transition-colors"
                        title="Remove front crop"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border border-dashed rounded-xl text-center text-xs text-slate-400">
                    No Front Cropped
                  </div>
                )}
              </div>

              <div>
                <span className="label">Back Side Preview</span>
                {croppedBack ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                    <img src={croppedBack} alt="Back Cropped" className="w-full object-contain max-h-[120px]" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadCroppedImage("back", croppedBack)}
                        className="bg-blue-600 text-white rounded-lg p-1.5 hover:bg-blue-700 transition-colors"
                        title="Download back PNG"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => setCroppedBack(null)}
                        className="bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600 transition-colors"
                        title="Remove back crop"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border border-dashed rounded-xl text-center text-xs text-slate-400">
                    No Back Cropped
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={!croppedFront && !croppedBack}
            >
              <Download size={16} />
              Download Layout PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary w-full text-red-500 hover:bg-red-500/10"
              disabled={!sourcePreview && !croppedFront && !croppedBack}
            >
              <Trash2 size={16} />
              Reset Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
