"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Download, RotateCw, Trash2, Sliders, Layout, Printer, Move, Plus, Minus, Eraser } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import jsPDF from "jspdf";
import PageHeader from "@/components/layout/PageHeader";
import AdvancedRetouchModal from "@/components/photo-studio/AdvancedRetouchModal";
import type { Config } from "@imgly/background-removal";

const FILTERS = [
  { id: 'none', label: 'None', css: '' },
  { id: 'grayscale', label: 'B&W', css: 'grayscale(100%)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(100%)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(50%) contrast(150%) saturate(120%) brightness(90%) hue-rotate(-15deg)' },
  { id: 'warm', label: 'Warm', css: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' },
  { id: 'cool', label: 'Cool', css: 'saturate(120%) hue-rotate(15deg) brightness(105%)' },
  { id: 'fade', label: 'Fade', css: 'brightness(120%) contrast(80%) saturate(80%)' }
];

const PHOTO_SIZES = [
  { label: "Passport (3.5 x 4.5 cm)", width: 35, height: 45, ratio: 35 / 45 },
  { label: "Mini Passport (fit 12 on 4x6) (3.0 x 3.8 cm)", width: 30, height: 38, ratio: 30 / 38 },
  { label: "Stamp Size (2.5 x 3.0 cm)", width: 25, height: 30, ratio: 25 / 30 },
  { label: "Visa - USA (2 x 2 inch)", width: 50.8, height: 50.8, ratio: 1 },
  { label: "ID Card Size (5 x 5 cm)", width: 50, height: 50, ratio: 1 },
];

const OUTPUT_SCALE = 12;
const TRANSPARENT_BG = "#ffffff00";
const PASSPORT_BLUE = "#3b82f6";

type NavigatorWithGpu = Navigator & {
  gpu?: unknown;
};

const imageToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read processed foreground"));
    reader.readAsDataURL(blob);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

const refineForegroundEdges = async (foreground: Blob) => {
  const bitmap = await createImageBitmap(foreground);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return foreground;
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const alpha = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) alpha[p] = data[i + 3];

  const refinedAlpha = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let weighted = 0;
      let weightTotal = 0;

      for (let oy = -1; oy <= 1; oy += 1) {
        const yy = Math.max(0, Math.min(height - 1, y + oy));
        for (let ox = -1; ox <= 1; ox += 1) {
          const xx = Math.max(0, Math.min(width - 1, x + ox));
          const weight = ox === 0 && oy === 0 ? 4 : ox === 0 || oy === 0 ? 2 : 1;
          weighted += alpha[yy * width + xx] * weight;
          weightTotal += weight;
        }
      }

      const index = y * width + x;
      const original = alpha[index];
      const feathered = weighted / weightTotal;
      const mixed = original * 0.72 + feathered * 0.28;
      refinedAlpha[index] = original < 8 ? 0 : original > 246 ? 255 : Math.round(mixed);
    }
  }

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const nextAlpha = refinedAlpha[p];
    data[i + 3] = nextAlpha;

    if (nextAlpha > 0 && nextAlpha < 230) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      const x = p % width;
      const y = Math.floor(p / width);

      for (let oy = -1; oy <= 1; oy += 1) {
        const yy = y + oy;
        if (yy < 0 || yy >= height) continue;
        for (let ox = -1; ox <= 1; ox += 1) {
          const xx = x + ox;
          if (xx < 0 || xx >= width) continue;
          const neighbor = yy * width + xx;
          if (alpha[neighbor] < 235) continue;
          const ni = neighbor * 4;
          r += data[ni];
          g += data[ni + 1];
          b += data[ni + 2];
          count += 1;
        }
      }

      if (count > 0) {
        const blend = 0.35;
        data[i] = Math.round(data[i] * (1 - blend) + (r / count) * blend);
        data[i + 1] = Math.round(data[i + 1] * (1 - blend) + (g / count) * blend);
        data[i + 2] = Math.round(data[i + 2] * (1 - blend) + (b / count) * blend);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to refine foreground"));
    }, "image/png", 1);
  });
};

export default function PhotoStudioPage() {
  const toast = useToast();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedForeground, setProcessedForeground] = useState<string | null>(null);
  const [size, setSize] = useState(PHOTO_SIZES[0]);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpen, setSharpen] = useState(0);
  const [enhance, setEnhance] = useState(100);
  const [beauty, setBeauty] = useState(0);
  const [watermark, setWatermark] = useState("");
  const [copies, setCopies] = useState(8);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [backgroundRemovalStatus, setBackgroundRemovalStatus] = useState<string | null>(null);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [pageFormat, setPageFormat] = useState<'A4' | '4x6'>('A4');
  const [downloadQuality, setDownloadQuality] = useState(100);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  
  // New PicsArt-like features
  const [hue, setHue] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const processedForegroundRef = useRef<HTMLImageElement | null>(null);
  const sourceFileRef = useRef<File | null>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const [activeTab, setActiveTab] = useState<'format' | 'adjust' | 'export'>('format');

  const activeSize = useCustomSize ? { label: 'Custom', width: customW, height: customH, ratio: customW / customH } : size;

  const w = activeSize.width;
  const h = activeSize.height;
  const pageDimensions = pageFormat === 'A4' ? { w: 210, h: 297 } : { w: 101.6, h: 152.4 };
  const calcMarginX = pageFormat === 'A4' ? 15 : 3;
  const calcMarginY = pageFormat === 'A4' ? 20 : 3;
  const calcSpacingX = pageFormat === 'A4' ? 4 : 2;
  const calcSpacingY = pageFormat === 'A4' ? 6 : 2;

  const calculatedMaxCopies = Math.max(
    1,
    Math.floor((pageDimensions.w - calcMarginX * 2 + calcSpacingX) / (w + calcSpacingX)) *
      Math.floor((pageDimensions.h - calcMarginY * 2 + calcSpacingY) / (h + calcSpacingY))
  );

  const drawCanvas = useCallback((targetCanvas = canvasRef.current) => {
    const canvas = canvasRef.current;
    const img = processedForegroundRef.current || originalImageRef.current;
    if (!targetCanvas || !img) return null;

    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return null;

    const targetWidth = Math.round(activeSize.width * OUTPUT_SCALE);
    const targetHeight = Math.round(activeSize.height * OUTPUT_SCALE);
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;
    if (canvas && targetCanvas !== canvas) {
      targetCanvas.style.width = canvas.style.width;
      targetCanvas.style.height = canvas.style.height;
    }

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    if (backgroundColor !== TRANSPARENT_BG) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate((offsetX / 100) * targetWidth, (offsetY / 100) * targetHeight);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    
    const filterObj = FILTERS.find(f => f.id === activeFilter);
    const filterCSS = filterObj ? filterObj.css : '';
    
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${enhance}%) hue-rotate(${hue}deg) ${filterCSS} ${sharpen > 0 ? `drop-shadow(0 0 ${(sharpen * 0.04).toFixed(2)}px rgba(0,0,0,0.6))` : ''}`;

    const imgRatio = img.width / img.height;
    const targetRatio = targetWidth / targetHeight;
    let drawWidth = targetWidth;
    let drawHeight = targetHeight;

    if (imgRatio > targetRatio) {
      drawWidth = targetHeight * imgRatio;
    } else {
      drawHeight = targetWidth / imgRatio;
    }

    drawWidth *= zoom / 100;
    drawHeight *= zoom / 100;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    if (beauty > 0) {
      ctx.globalAlpha = beauty * 0.006;
      ctx.filter = `brightness(${brightness + 5}%) contrast(${contrast}%) saturate(${enhance}%) blur(${Math.max(1, drawWidth * 0.006)}px)`;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    if (watermark.trim()) {
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate(-35 * Math.PI / 180);
      ctx.font = `bold ${Math.round(targetWidth * 0.12)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,0,0,0.3)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(watermark.toUpperCase(), 0, 0);
      ctx.restore();
    }

    return targetCanvas;
  }, [backgroundColor, brightness, contrast, enhance, beauty, offsetX, offsetY, rotation, activeSize.height, activeSize.width, zoom, sharpen, watermark, useCustomSize, customW, customH, hue, flipH, flipV, activeFilter]);

  useEffect(() => {
    if (originalImage) drawCanvas();
  }, [drawCanvas, originalImage, processedForeground]);

  useEffect(() => {
    if (activeTab === 'export' && canvasRef.current && originalImage) {
      const transparent = backgroundColor === TRANSPARENT_BG;
      const mime = transparent ? "image/png" : "image/jpeg";
      const quality = transparent ? undefined : downloadQuality / 100;
      canvasRef.current.toBlob((blob) => {
        if (blob) setEstimatedSize(blob.size);
      }, mime, quality);
    }
  }, [activeTab, downloadQuality, originalImage, backgroundColor, drawCanvas]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sourceFileRef.current = file;
    processedForegroundRef.current = null;
    setProcessedForeground(null);
    setBackgroundRemoved(false);
    setBackgroundRemovalStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setOriginalImage(dataUrl);
      try {
        originalImageRef.current = await loadImage(dataUrl);
        drawCanvas();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleRemoveBackground = async () => {
    const file = sourceFileRef.current;
    if (!file) {
      toast.error("Please upload a photo first");
      return;
    }

    if (processedForeground) {
      setBackgroundRemoved(true);
      toast.success("Using cached transparent foreground");
      return;
    }

    setIsRemovingBackground(true);
    setBackgroundRemovalStatus("Loading AI model...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const supportsWebGpu =
        typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithGpu).gpu);
      const config: Config = {
        device: supportsWebGpu ? "gpu" : "cpu",
        model: supportsWebGpu ? "isnet_fp16" : "isnet_quint8",
        output: { format: "image/png", quality: 1 },
        progress: (_key, current, total) => {
          if (total > 0 && current < total) {
            const percent = Math.min(99, Math.round((current / total) * 100));
            setBackgroundRemovalStatus(`Loading AI model... ${percent}%`);
            return;
          }
          setBackgroundRemovalStatus("Removing background...");
        },
      };

      let foregroundBlob: Blob;
      try {
        foregroundBlob = await removeBackground(file, config);
      } catch (error) {
        if (!supportsWebGpu) throw error;
        setBackgroundRemovalStatus("Removing background...");
        foregroundBlob = await removeBackground(file, {
          ...config,
          device: "cpu",
          model: "isnet_quint8",
        });
      }

      setBackgroundRemovalStatus("Refining edges...");
      const refinedBlob = await refineForegroundEdges(foregroundBlob);
      const foregroundDataUrl = await imageToDataUrl(refinedBlob);
      const foregroundImage = await loadImage(foregroundDataUrl);

      processedForegroundRef.current = foregroundImage;
      setProcessedForeground(foregroundDataUrl);
      setBackgroundRemoved(true);
      setBackgroundRemovalStatus("Processed securely on this device");
      drawCanvas();
      toast.success("AI background removed locally");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI background removal failed");
      setBackgroundRemovalStatus(null);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!originalImage) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, offsetX, offsetY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nextX = dragRef.current.offsetX + ((e.clientX - dragRef.current.x) / rect.width) * 100;
    const nextY = dragRef.current.offsetY + ((e.clientY - dragRef.current.y) / rect.height) * 100;
    setOffsetX(Math.max(-50, Math.min(50, Math.round(nextX))));
    setOffsetY(Math.max(-50, Math.min(50, Math.round(nextY))));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedForeground(null);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSharpen(0);
    setEnhance(100);
    setBeauty(0);
    setWatermark("");
    setZoom(100);
    setOffsetX(0);
    setOffsetY(0);
    setHue(0);
    setFlipH(false);
    setFlipV(false);
    setActiveFilter('none');
    setBackgroundRemoved(false);
    setBackgroundRemovalStatus(null);
    originalImageRef.current = null;
    processedForegroundRef.current = null;
    sourceFileRef.current = null;
  };

  const handleDownloadPhoto = () => {
    const canvas = drawCanvas();
    if (!canvas) {
      toast.error("Please upload and prepare a photo first");
      return;
    }

    const transparent = backgroundColor === TRANSPARENT_BG;
    const mime = transparent ? "image/png" : "image/jpeg";
    const extension = transparent ? "png" : "jpg";
    const quality = transparent ? undefined : downloadQuality / 100;
    
    const link = document.createElement("a");
    link.href = canvas.toDataURL(mime, quality);
    link.download = `RA_Seva_Photo_${Date.now()}.${extension}`;
    link.click();
    toast.success("Photo downloaded successfully!");
  };

  const handleDownloadPDF = () => {
    const renderCanvas = document.createElement("canvas");
    const canvas = drawCanvas(renderCanvas);
    if (!canvas) {
      toast.error("Please upload and prepare a photo first");
      return;
    }

    try {
      const transparent = backgroundColor === TRANSPARENT_BG;
      const imgType = transparent ? "PNG" : "JPEG";
      const imgData = canvas.toDataURL(transparent ? "image/png" : "image/jpeg", 1.0);
      
      const pageFormatStr = pageFormat === 'A4' ? 'a4' : [101.6, 152.4];
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: pageFormatStr,
      });

      const marginX = pageFormat === 'A4' ? 15 : 3;
      const marginY = pageFormat === 'A4' ? 20 : 3;
      const spacingX = pageFormat === 'A4' ? 4 : 2;
      const spacingY = pageFormat === 'A4' ? 6 : 2;
      const w = activeSize.width;
      const h = activeSize.height;
      const pageWidth = pageFormat === 'A4' ? 210 : 101.6;
      const pageHeight = pageFormat === 'A4' ? 297 : 152.4;
      const maxCopies = Math.max(
        1,
        Math.floor((pageWidth - marginX * 2 + spacingX) / (w + spacingX)) *
          Math.floor((pageHeight - marginY * 2 + spacingY) / (h + spacingY))
      );
      const totalCopies = Math.min(copies, maxCopies);

      let currentX = marginX;
      let currentY = marginY;

      for (let i = 0; i < totalCopies; i += 1) {
        pdf.addImage(imgData, imgType, currentX, currentY, w, h);
        currentX += w + spacingX;
        if (currentX + w > pageWidth - marginX) {
          currentX = marginX;
          currentY += h + spacingY;
        }
      }

      pdf.save(`RA_Seva_Passport_Photos_${Date.now()}.pdf`);
      toast.success(`PDF downloaded at exact ${activeSize.width}mm x ${activeSize.height}mm size`);
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="Photo Studio"
        subtitle="Generate instant passport, visa, and ID cards"
      />

      <div className="tool-workspace">
        <div className="tool-preview-panel">
          {originalImage ? (
            <div className="tool-preview-inner">
              <div className="tool-canvas-frame relative group">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="touch-none cursor-move"
                  title="Drag to position photo"
                />
                
                {/* Floating Zoom Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md rounded-lg p-1.5 shadow-xl border border-white/10 z-10">
                  <button 
                    onClick={() => setZoom(z => Math.min(200, z + 5))}
                    className="p-1.5 text-white hover:bg-white/20 rounded-md transition-colors"
                    title="Zoom In"
                  >
                    <Plus size={18} />
                  </button>
                  <div className="h-px bg-white/20 mx-1" />
                  <button 
                    onClick={() => setZoom(z => Math.max(50, z - 5))}
                    className="p-1.5 text-white hover:bg-white/20 rounded-md transition-colors"
                    title="Zoom Out"
                  >
                    <Minus size={18} />
                  </button>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                {activeSize.label} · {activeSize.width}mm x {activeSize.height}mm · {copies} copies on A4
              </p>
            </div>
          ) : (
            <div className="tool-empty-state">
              <div className="tool-empty-icon">
                <Camera size={32} />
              </div>
              <div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>No Image Uploaded</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Upload a high-quality portrait photo
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                <Camera size={16} />
                Choose Photo
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        <div className="glass-card flex flex-col max-h-[700px] sticky top-6">
          <div className="flex border-b" style={{ borderColor: 'var(--border-secondary)' }}>
            <button
              onClick={() => setActiveTab('format')}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'format' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
            >
              Format & BG
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'adjust' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
            >
              Adjust
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'export' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
            >
              Export
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
            {activeTab === 'format' && (
              <div className="space-y-8 animate-fade-in">
                {/* Photo Format */}
                <div className="space-y-4">
                  <h2 className="section-title flex items-center gap-2 mb-0">
                    <Sliders size={18} className="text-blue-500" />
                    Photo Format
                  </h2>
                  <div>
                    <label className="label">Photo Type & Dimensions</label>
                    <select
                      className="input-field"
                      value={size.label}
                      onChange={(e) => {
                        const s = PHOTO_SIZES.find((p) => p.label === e.target.value);
                        if (s) setSize(s);
                      }}
                      disabled={!originalImage || useCustomSize}
                    >
                      {PHOTO_SIZES.map((s) => (
                        <option key={s.label} value={s.label}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customSizeToggle"
                        checked={useCustomSize}
                        onChange={(e) => setUseCustomSize(e.target.checked)}
                        disabled={!originalImage}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="customSizeToggle" className="text-sm cursor-pointer select-none">
                        Custom Size
                      </label>
                    </div>

                    {useCustomSize && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Width (mm)</label>
                          <input
                            type="number"
                            min="10" max="200" step="0.1"
                            className="input-field"
                            value={customW}
                            onChange={(e) => setCustomW(Number(e.target.value))}
                            disabled={!originalImage}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Height (mm)</label>
                          <input
                            type="number"
                            min="10" max="200" step="0.1"
                            className="input-field"
                            value={customH}
                            onChange={(e) => setCustomH(Number(e.target.value))}
                            disabled={!originalImage}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-4">
                  <h2 className="section-title mb-0">Background</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { value: "#ffffff", label: "White" },
                        { value: PASSPORT_BLUE, label: "Blue" },
                        { value: "#ef4444", label: "Red" },
                        { value: TRANSPARENT_BG, label: "PNG" },
                      ].map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setBackgroundColor(c.value)}
                          className="h-10 rounded-xl border flex items-center justify-center shrink-0 text-[10px] font-bold transition-transform hover:scale-105"
                          style={{
                            backgroundColor: c.value === TRANSPARENT_BG ? "transparent" : c.value,
                            borderColor: backgroundColor === c.value ? "#4f6ef7" : "var(--border-primary)",
                            boxShadow: backgroundColor === c.value ? "0 0 0 3px rgba(79,110,247,0.16)" : "none",
                            color: ["#ffffff", TRANSPARENT_BG].includes(c.value) ? "var(--text-secondary)" : "#ffffff",
                          }}
                          title={c.label}
                          disabled={!originalImage}
                        >
                          {c.label}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={backgroundColor === TRANSPARENT_BG ? "#ffffff" : backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-10 w-full rounded-xl overflow-hidden cursor-pointer border"
                        style={{ borderColor: "var(--border-primary)" }}
                        disabled={!originalImage}
                        title="Custom color"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveBackground}
                      className="btn-primary w-full"
                      disabled={!originalImage || isRemovingBackground}
                    >
                      <Sliders size={16} />
                      {isRemovingBackground
                        ? backgroundRemovalStatus || "Removing background..."
                        : backgroundRemoved
                          ? "AI Background Removed"
                          : "AI Remove Background"}
                    </button>
                    {backgroundRemovalStatus && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {backgroundRemovalStatus}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEraserMode(true)}
                      className="btn-secondary w-full"
                      disabled={!originalImage}
                    >
                      <Eraser size={16} />
                      Advanced Retouch (Heal/Erase)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'adjust' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="section-title mb-4">Image Adjustments</h2>
                  <div className="space-y-5">
                  
                    {/* Filters & Flip controls */}
                    <div>
                      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4">
                        {FILTERS.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <button onClick={() => setFlipH(!flipH)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold ${flipH ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                           Flip Horizontal
                        </button>
                        <button onClick={() => setFlipV(!flipV)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold ${flipV ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                           Flip Vertical
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0 flex items-center gap-1">
                          <Move size={12} />
                          Horizontal
                        </span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{offsetX}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={offsetX}
                        onChange={(e) => setOffsetX(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Vertical</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{offsetY}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={offsetY}
                        onChange={(e) => setOffsetY(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Brightness</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Contrast</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Hue</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{hue}deg</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={hue}
                        onChange={(e) => setHue(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Sharpen</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{sharpen}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sharpen}
                        onChange={(e) => setSharpen(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Enhance (Color)</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{enhance}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={enhance}
                        onChange={(e) => setEnhance(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="label mb-0">Beauty (Smooth)</span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{beauty}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={beauty}
                        onChange={(e) => setBeauty(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage}
                      />
                    </div>

                    <div>
                      <label className="label">Watermark (optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. SAMPLE, DRAFT"
                        value={watermark}
                        onChange={(e) => setWatermark(e.target.value)}
                        disabled={!originalImage}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-[1fr_auto] gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="btn-secondary"
                    disabled={!originalImage}
                  >
                    <RotateCw size={14} />
                    Rotate 90
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary text-red-500 hover:bg-red-500/10"
                    disabled={!originalImage}
                    title="Reset photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-8 animate-fade-in">
                {/* Print Layout */}
                <div className="space-y-4">
                  <h2 className="section-title flex items-center gap-2 mb-0">
                    <Layout size={18} className="text-blue-500" />
                    Print Layout
                  </h2>
                  <div>
                    <label className="label">Print Page Format</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPageFormat('A4'); setCopies(1); }}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${pageFormat === 'A4' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        A4 Size
                      </button>
                      <button
                        onClick={() => { setPageFormat('4x6'); setCopies(1); }}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${pageFormat === '4x6' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        4x6 inch
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Number of Copies ({pageFormat} Grid)</label>
                    <select
                      className="input-field"
                      value={copies}
                      onChange={(e) => setCopies(parseInt(e.target.value))}
                      disabled={!originalImage}
                    >
                      {Array.from({ length: calculatedMaxCopies }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Copy' : 'Copies'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Export */}
                <div className="space-y-4">
                  <h2 className="section-title flex items-center gap-2 mb-0">
                    <Printer size={18} className="text-blue-500" />
                    Export
                  </h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 border rounded-xl" style={{ borderColor: 'var(--border-secondary)' }}>
                      <div className="flex justify-between items-end mb-2">
                        <label className="label mb-0">Image Quality / File Size</label>
                        {estimatedSize && (
                          <span className="text-xs font-semibold px-2 py-1 bg-white rounded-md border text-blue-600">
                            ~{(estimatedSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={downloadQuality}
                        onChange={(e) => setDownloadQuality(parseInt(e.target.value))}
                        className="range-field"
                        disabled={!originalImage || backgroundColor === TRANSPARENT_BG}
                        title={backgroundColor === TRANSPARENT_BG ? "Quality adjustment not available for PNG" : "Adjust to reduce file size"}
                      />
                      <p className="text-[10px] mt-1 text-gray-500">
                        {backgroundColor === TRANSPARENT_BG 
                          ? "PNG files preserve full quality automatically."
                          : "Lower quality to reduce KB size. 80-90% is recommended for good quality."}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleDownloadPhoto}
                      className="btn-secondary w-full py-2.5"
                      disabled={!originalImage}
                    >
                      <Download size={16} />
                      Download Single Photo
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="btn-primary w-full py-2.5"
                      disabled={!originalImage}
                    >
                      <Printer size={16} />
                      Download {pageFormat} Print PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isEraserMode && processedForeground && (
        <AdvancedRetouchModal
          imageSrc={processedForeground}
          onClose={() => setIsEraserMode(false)}
          onSave={(dataUrl) => {
            setProcessedForeground(dataUrl);
            (async () => {
              try {
                processedForegroundRef.current = await loadImage(dataUrl);
                drawCanvas();
              } catch (err) {
                console.error("Failed to load edited foreground", err);
              }
            })();
            setIsEraserMode(false);
          }}
          onClose={() => setIsEraserMode(false)}
        />
      )}
    </div>
  );
}
