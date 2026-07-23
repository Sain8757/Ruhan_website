"use client";

import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { UploadCloud, X, Crop as CropIcon, Settings, Sliders, Download, Wand2, RotateCw, RotateCcw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

interface SignatureItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  crop?: Crop;
  status: "pending" | "processing" | "done" | "error";
  cropDimensions?: { width: number; height: number };
  croppedPreviewUrl?: string;
}

const DPI = 300; // Standard print DPI for conversions
const CM_TO_INCH = 0.393701;
// Convert target cm to required pixels for standard 300 DPI
const cmToPx = (cm: number) => Math.round(cm * CM_TO_INCH * DPI);

export default function SignatureResizer() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [items, setItems] = useState<SignatureItem[]>([]);
  const [unit, setUnit] = useState<"px" | "cm" | "original">("px");
  const [width, setWidth] = useState<number>(140);
  const [height, setHeight] = useState<number>(60);
  const [targetKb, setTargetKb] = useState<number>(20);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  
  // Store advanced filters
  const [itemFilters, setItemFilters] = useState<Record<string, { brightness: number, contrast: number }>>({});
  
  // Crop Modal state
  const [croppingItem, setCroppingItem] = useState<SignatureItem | null>(null);
  const [tempCrop, setTempCrop] = useState<Crop>();
  const [tempBrightness, setTempBrightness] = useState(100);
  const [tempContrast, setTempContrast] = useState(100);
  const [tempZoom, setTempZoom] = useState(1);
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);
  const [removingBgProgress, setRemovingBgProgress] = useState<string>("");
  
  const imageRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (items.length + acceptedFiles.length > 10) {
      toast.error("You can resize maximum 10 images at once");
      return;
    }

    acceptedFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const id = Math.random().toString(36).substring(7);
      
      const newItem: SignatureItem = {
        id,
        file,
        previewUrl: url,
        name: file.name.split(".").slice(0, -1).join("."), // Default without extension
        status: "pending",
      };

      img.onload = () => {
        setItems((prev) => prev.map(i => i.id === id ? { ...i, cropDimensions: { width: img.naturalWidth, height: img.naturalHeight } } : i));
      };
      img.src = url;
      
      setItems((prev) => [...prev, newItem]);
    });
    
    // Auto open crop modal for the first item
    if (acceptedFiles.length > 0) {
      setTimeout(() => {
        setItems((currentItems) => {
          const firstNew = currentItems.find(i => i.file === acceptedFiles[0]);
          if (firstNew) openCropModal(firstNew);
          return currentItems;
        });
      }, 100);
    }
  }, [items.length, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 10,
  });

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateItemName = (id: string, newName: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const openCropModal = (item: SignatureItem) => {
    setCroppingItem(item);
    setTempCrop(item.crop);
    
    const filters = itemFilters[item.id] || { brightness: 100, contrast: 100, removeBg: false };
    setTempBrightness(filters.brightness);
    setTempContrast(filters.contrast);
    setTempZoom(1);
  };

  const handleRotate = async (angle: number) => {
    if (!croppingItem) return;
    const img = new Image();
    img.src = croppingItem.previewUrl;
    await new Promise((resolve) => (img.onload = resolve));
    
    const canvas = document.createElement("canvas");
    if (angle === 90 || angle === 270 || angle === -90) {
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
    } else {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const newUrl = URL.createObjectURL(blob);
        setCroppingItem(prev => prev ? { ...prev, previewUrl: newUrl } : null);
        setItems(prev => prev.map(i => i.id === croppingItem.id ? { ...i, previewUrl: newUrl } : i));
        setTempCrop(undefined); // Reset crop
      }
    }, "image/png");
  };

  const handleAIRemoveBg = async (item: SignatureItem) => {
    try {
      setRemovingBgId(item.id);
      setRemovingBgProgress("Loading AI model...");
      
      const { removeBackground } = await import("@imgly/background-removal");
      
      const response = await fetch(item.croppedPreviewUrl || item.previewUrl);
      const blob = await response.blob();
      
      const supportsWebGpu = typeof navigator !== "undefined" && Boolean((navigator as any).gpu);
      const config: any = {
        device: supportsWebGpu ? "gpu" : "cpu",
        model: supportsWebGpu ? "isnet_fp16" : "isnet_quint8",
        output: { format: "image/png", quality: 1 },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0 && current < total) {
            const percent = Math.min(99, Math.round((current / total) * 100));
            setRemovingBgProgress(`Loading AI model... ${percent}%`);
            return;
          }
          setRemovingBgProgress("Removing background...");
        },
      };

      const foregroundBlob = await removeBackground(blob, config);
      const newUrl = URL.createObjectURL(foregroundBlob);
      
      setItems((prev) => 
        prev.map(i => i.id === item.id ? { 
          ...i, 
          previewUrl: newUrl,
          croppedPreviewUrl: undefined,
          crop: undefined 
        } : i)
      );
      toast.success("AI Background removed successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to remove background");
    } finally {
      setRemovingBgId(null);
      setRemovingBgProgress("");
    }
  };

  const saveCrop = async () => {
    if (croppingItem) {
      let cropDimensions = croppingItem.cropDimensions;
      let croppedPreviewUrl = croppingItem.croppedPreviewUrl;
      
      if (tempCrop && tempCrop.width > 0 && tempCrop.height > 0 && imageRef.current) {
        const isPercent = tempCrop.unit === '%';
        const img = imageRef.current;
        const cropW = isPercent ? (tempCrop.width / 100) * img.naturalWidth : tempCrop.width;
        const cropH = isPercent ? (tempCrop.height / 100) * img.naturalHeight : tempCrop.height;
        cropDimensions = { width: Math.round(cropW), height: Math.round(cropH) };
        
        // Generate cropped preview
        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        const cropX = isPercent ? (tempCrop.x / 100) * img.naturalWidth : tempCrop.x;
        const cropY = isPercent ? (tempCrop.y / 100) * img.naturalHeight : tempCrop.y;
        
        ctx?.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        
        croppedPreviewUrl = await new Promise<string>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(croppingItem.previewUrl);
            }
          }, "image/png");
        });
      } else {
        croppedPreviewUrl = undefined;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === croppingItem.id ? { ...item, crop: tempCrop, cropDimensions, croppedPreviewUrl } : item
        )
      );
      setItemFilters(prev => ({
        ...prev,
        [croppingItem.id]: {
          brightness: tempBrightness,
          contrast: tempContrast
        }
      }));
    }
    setCroppingItem(null);
  };

  // Resize and compress an individual item
  const processImage = async (item: SignatureItem): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const sourceCanvas = document.createElement("canvas");
        
        if (item.crop && item.crop.width > 0 && item.crop.height > 0) {
          // If crop is in percentages (which react-image-crop does by default when unit is '%')
          const isPercent = item.crop.unit === '%';
          const cropX = isPercent ? (item.crop.x / 100) * img.naturalWidth : item.crop.x;
          const cropY = isPercent ? (item.crop.y / 100) * img.naturalHeight : item.crop.y;
          const cropW = isPercent ? (item.crop.width / 100) * img.naturalWidth : item.crop.width;
          const cropH = isPercent ? (item.crop.height / 100) * img.naturalHeight : item.crop.height;

          sourceCanvas.width = cropW;
          sourceCanvas.height = cropH;
          sourceCanvas.getContext("2d")?.drawImage(
            img,
            cropX, cropY, cropW, cropH,
            0, 0, cropW, cropH
          );
        } else {
          sourceCanvas.width = img.naturalWidth;
          sourceCanvas.height = img.naturalHeight;
          sourceCanvas.getContext("2d")?.drawImage(img, 0, 0);
        }

        // Now resize to target dimensions
        let targetPxWidth, targetPxHeight;
        if (unit === "original") {
          targetPxWidth = sourceCanvas.width;
          targetPxHeight = sourceCanvas.height;
        } else {
          targetPxWidth = unit === "cm" ? cmToPx(width) : width;
          targetPxHeight = unit === "cm" ? cmToPx(height) : height;
        }

        const resizeCanvas = document.createElement("canvas");
        resizeCanvas.width = targetPxWidth;
        resizeCanvas.height = targetPxHeight;
        const resizeCtx = resizeCanvas.getContext("2d");
        
        // Fill white background for JPEG
        if (format === "image/jpeg") {
          resizeCtx!.fillStyle = "#FFFFFF";
          resizeCtx!.fillRect(0, 0, targetPxWidth, targetPxHeight);
        }
        
        // Apply filters
        const filters = itemFilters[item.id] || { brightness: 100, contrast: 100 };
        resizeCtx!.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`;
        
        resizeCtx?.drawImage(sourceCanvas, 0, 0, targetPxWidth, targetPxHeight);

        // Reset filter
        resizeCtx!.filter = 'none';

        // Compress and resolve
        // Binary search for target KB if JPEG
        if (format === "image/jpeg") {
          let minQ = 0.1;
          let maxQ = 1.0;
          let bestBlob: Blob | null = null;
          let attempt = 0;
          const targetBytes = targetKb * 1024;

          const compress = () => {
            if (attempt > 8 || maxQ - minQ < 0.05) {
              resolve(bestBlob);
              return;
            }
            const q = (minQ + maxQ) / 2;
            resizeCanvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(bestBlob);
                  return;
                }
                if (blob.size <= targetBytes) {
                  bestBlob = blob;
                  minQ = q; // Try to get higher quality
                } else {
                  maxQ = q; // Reduce quality
                }
                attempt++;
                compress();
              },
              "image/jpeg",
              q
            );
          };
          compress();
        } else {
          // PNG (No quality parameter effectively reduces size directly for PNG)
          resizeCanvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/png"
          );
        }
      };
      img.src = item.previewUrl;
    });
  };

  const handleResizeAll = async () => {
    if (items.length === 0) return;
    
    setItems((prev) => prev.map((item) => ({ ...item, status: "processing" })));
    
    for (const item of items) {
      try {
        const blob = await processImage(item);
        
        if (blob) {
          // Download it using context
          const url = URL.createObjectURL(blob);
          const ext = format === "image/jpeg" ? "jpg" : "png";
          downloadWithRename(url, `${item.name}.${ext}`);
          
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i))
          );
        } else {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "error" } : i))
          );
        }
      } catch (err) {
        console.error("Error processing item", item.id, err);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error" } : i))
        );
      }
    }
    toast.success("Resizing completed!");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 m-0">Resize Signature</h2>
          <p className="text-sm text-gray-500 m-0 mt-1">Smart tool to crop, resize, and compress your signatures to exact dimensions and file size.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left: Upload and Preview Area */}
        <div className="xl:col-span-8 space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]" : "border-gray-200 hover:bg-gray-50 hover:border-indigo-300"
            }`}
          >
            <input {...getInputProps()} />
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-100 mb-4">
              <UploadCloud size={28} className="text-indigo-500" />
            </div>
            <p className="text-base font-semibold text-gray-800">Drag & drop signatures here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse from your computer</p>
            <div className="mt-4 inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
              Up to 10 images at once
            </div>
          </div>

          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {items.map((item) => (
                <div key={item.id} className={`border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col group transition-all hover:shadow-md ${item.status === 'processing' ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-medium px-2.5 py-1 bg-gray-100/80 rounded-md text-gray-600 truncate max-w-[140px]" title={item.name}>
                      {item.name}
                    </span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors hover:bg-red-50">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="relative aspect-[4/3] bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden mb-4 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.croppedPreviewUrl || item.previewUrl} alt="preview" className="max-h-full max-w-full object-contain p-2" />
                    
                    {item.cropDimensions && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wider">
                        {item.cropDimensions.width} x {item.cropDimensions.height} px
                      </div>
                    )}
                    
                    {removingBgId === item.id && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                        <span className="text-xs font-semibold text-indigo-700">{removingBgProgress}</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-3">
                      <button
                        onClick={() => openCropModal(item)}
                        disabled={removingBgId === item.id}
                        className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-all w-3/4 justify-center"
                      >
                        <CropIcon size={16} />
                        Crop & Edit
                      </button>
                      <button
                        onClick={() => handleAIRemoveBg(item)}
                        disabled={removingBgId === item.id}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-all w-3/4 justify-center"
                      >
                        <Wand2 size={16} />
                        AI Remove BG
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Rename File</label>
                    <input
                      type="text"
                      className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={item.name}
                      onChange={(e) => updateItemName(item.id, e.target.value)}
                      placeholder="Rename file..."
                      disabled={item.status === 'processing'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Controls Area */}
        <div className="xl:col-span-4">
          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-900 mb-6 text-base flex items-center gap-2">
              <Sliders size={18} className="text-indigo-600" /> Output Settings
            </h3>
            
            <button 
              onClick={() => {
                setUnit("px");
                setWidth(140);
                setHeight(60);
                setTargetKb(20);
              }}
              className="w-full mb-4 py-2 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl text-sm flex items-center justify-center hover:bg-indigo-100 transition-colors"
            >
              Set Bihar Gov Default (140x60, 20KB)
            </button>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Unit</label>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setUnit("px")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${unit === 'px' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Pixels
                  </button>
                  <button
                    onClick={() => setUnit("cm")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${unit === 'cm' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    CM
                  </button>
                  <button
                    onClick={() => setUnit("original")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${unit === 'original' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Original Crop Size
                  </button>
                </div>
              </div>

              {unit !== "original" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Width</label>
                    <input
                      type="number"
                      className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                    />
                  </div>
                  <div className="text-gray-300 font-bold mt-6 text-sm">✕</div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Height</label>
                    <input
                      type="number"
                      className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Target File Size</label>
                <div className="flex w-full relative">
                  <input
                    type="number"
                    className="w-full py-2.5 pl-3 pr-12 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={targetKb}
                    onChange={(e) => setTargetKb(Number(e.target.value))}
                  />
                  <div className="absolute right-1 top-1 bottom-1 bg-gray-100 flex items-center px-3 rounded-md border border-gray-200 text-gray-600 text-xs font-bold">
                    KB
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Output Format</label>
                <select 
                  className="w-full py-2.5 px-3 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={format} 
                  onChange={(e) => setFormat(e.target.value as "image/jpeg" | "image/png")}
                >
                  <option value="image/jpeg">JPEG / JPG</option>
                  <option value="image/png">PNG</option>
                </select>
                {format === "image/png" && (
                  <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded-md border border-amber-200/60 font-medium">
                    ⚠️ Exact KB size limit only works perfectly with JPEG formats.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleResizeAll}
              disabled={items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download size={18} />
              Download Resized {items.length > 1 ? "Signatures" : "Signature"}
            </button>
          </div>
        </div>

      </div>

      {/* Crop Modal */}
      {croppingItem && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50/80">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 m-0 text-lg">
                <CropIcon size={18} className="text-indigo-600" /> Crop Signature
              </h3>
              <button onClick={() => setCroppingItem(null)} className="text-gray-400 hover:text-gray-800 bg-white p-1 rounded-full shadow-sm border transition-colors hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row h-full max-h-[60vh]">
              {/* Crop Area */}
              <div className="p-6 flex-1 overflow-auto bg-gray-100/50 flex items-center justify-center min-h-[300px] border-r">
                <div style={{ transform: `scale(${tempZoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
                  <ReactCrop
                    crop={tempCrop}
                    onChange={(_, percentCrop) => setTempCrop(percentCrop)}
                    className="max-w-full rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imageRef}
                      src={croppingItem.previewUrl}
                      alt="Crop preview"
                      className="max-h-[50vh] object-contain transition-all"
                      style={{
                        filter: `brightness(${tempBrightness}%) contrast(${tempContrast}%)`
                      }}
                    />
                  </ReactCrop>
                </div>
              </div>

              {/* Toolbar Area */}
              <div className="w-full md:w-64 bg-white p-5 space-y-6 overflow-y-auto">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><Wand2 size={16} className="text-indigo-600" /> Image Tools</h4>
                  
                  <div className="space-y-4">
                    {/* Rotation */}
                    <div className="flex gap-2">
                      <button onClick={() => handleRotate(-90)} className="flex-1 py-1.5 flex justify-center items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                        <RotateCcw size={14} /> Left
                      </button>
                      <button onClick={() => handleRotate(90)} className="flex-1 py-1.5 flex justify-center items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                        <RotateCw size={14} /> Right
                      </button>
                    </div>

                    {/* Zoom */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><ZoomIn size={12} /> Zoom</label>
                        <span className="text-xs text-gray-400">{Math.round(tempZoom * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" max="3" step="0.1"
                        value={tempZoom}
                        onChange={(e) => setTempZoom(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Brightness */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">Brightness</label>
                        <span className="text-xs text-gray-400">{tempBrightness}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" max="150" 
                        value={tempBrightness}
                        onChange={(e) => setTempBrightness(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">Contrast</label>
                        <span className="text-xs text-gray-400">{tempContrast}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" max="200" 
                        value={tempContrast}
                        onChange={(e) => setTempContrast(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-white flex justify-end gap-3">
              <button onClick={() => setCroppingItem(null)} className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveCrop} className="px-5 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
                <CropIcon size={16} />
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
