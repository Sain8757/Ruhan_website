"use client";

import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { UploadCloud, X, Crop as CropIcon, Settings, FileImage } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface SignatureItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  crop?: Crop;
  status: "pending" | "processing" | "done" | "error";
}

const DPI = 300; // Standard print DPI for conversions
const CM_TO_INCH = 0.393701;
// Convert target cm to required pixels for standard 300 DPI
const cmToPx = (cm: number) => Math.round(cm * CM_TO_INCH * DPI);

export default function SignatureResizer() {
  const toast = useToast();
  const [items, setItems] = useState<SignatureItem[]>([]);
  const [unit, setUnit] = useState<"px" | "cm">("px");
  const [width, setWidth] = useState<number>(140);
  const [height, setHeight] = useState<number>(60);
  const [targetKb, setTargetKb] = useState<number>(20);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  
  // Crop Modal state
  const [croppingItem, setCroppingItem] = useState<SignatureItem | null>(null);
  const [tempCrop, setTempCrop] = useState<Crop>();
  const imageRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (items.length + acceptedFiles.length > 10) {
      toast.error("You can resize maximum 10 images at once");
      return;
    }

    const newItems: SignatureItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name.split(".").slice(0, -1).join("."), // Default without extension
      status: "pending",
    }));

    setItems((prev) => [...prev, ...newItems]);
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
  };

  const saveCrop = () => {
    if (croppingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === croppingItem.id ? { ...item, crop: tempCrop } : item
        )
      );
    }
    setCroppingItem(null);
  };

  // Resize and compress an individual item
  const processImage = async (item: SignatureItem): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let sourceCanvas = document.createElement("canvas");
        
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
        const targetPxWidth = unit === "cm" ? cmToPx(width) : width;
        const targetPxHeight = unit === "cm" ? cmToPx(height) : height;

        const resizeCanvas = document.createElement("canvas");
        resizeCanvas.width = targetPxWidth;
        resizeCanvas.height = targetPxHeight;
        const resizeCtx = resizeCanvas.getContext("2d");
        
        // Fill white background for JPEG
        if (format === "image/jpeg") {
          resizeCtx!.fillStyle = "#FFFFFF";
          resizeCtx!.fillRect(0, 0, targetPxWidth, targetPxHeight);
        }
        
        resizeCtx?.drawImage(sourceCanvas, 0, 0, targetPxWidth, targetPxHeight);

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
          // Download it
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const ext = format === "image/jpeg" ? "jpg" : "png";
          a.download = `${item.name}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
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
    <div className="glass-card p-6 mt-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 m-0">Resize Signature</h2>
          <p className="text-sm text-gray-500 m-0">Crop, resize, compress to specific KB and download.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Left: Upload and Preview Area */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">Drag & drop signatures here, or click to select</p>
            <p className="text-xs text-gray-500 mt-1">Note: You can resize up to 10 images at once.</p>
          </div>

          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className={`border rounded-xl p-3 bg-white shadow-sm flex flex-col ${item.status === 'processing' ? 'opacity-70' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-600 truncate max-w-[150px]" title={item.name}>
                      {item.name}
                    </span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors hover:bg-red-50">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="relative aspect-video bg-gray-50 rounded-lg border border-dashed border-gray-300 overflow-hidden mb-3 group flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <button
                        onClick={() => openCropModal(item)}
                        className="bg-white text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 shadow-sm hover:bg-gray-100 transition-colors"
                      >
                        <CropIcon size={14} />
                        Crop
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <input
                      type="text"
                      className="input-field text-sm w-full py-1.5 px-2 bg-gray-50 border-gray-200 focus:bg-white"
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
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit space-y-5">
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2 border-b pb-2">Settings</h3>
            
            <div className="flex items-center gap-4 mb-5">
              <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-gray-700">
                <input
                  type="radio"
                  name="unit"
                  value="px"
                  checked={unit === "px"}
                  onChange={() => setUnit("px")}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                />
                Pixel
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-gray-700">
                <input
                  type="radio"
                  name="unit"
                  value="cm"
                  checked={unit === "cm"}
                  onChange={() => setUnit("cm")}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                />
                Centimeter
              </label>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Width ({unit})</label>
                <input
                  type="number"
                  className="input-field py-2"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
              <span className="text-gray-400 font-bold mt-5 text-sm">X</span>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Height ({unit})</label>
                <input
                  type="number"
                  className="input-field py-2"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <label className="font-semibold text-gray-700 text-sm whitespace-nowrap min-w-[50px]">Size:</label>
              <div className="flex w-full relative">
                <input
                  type="number"
                  className="input-field pr-10 py-2"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                />
                <span className="absolute right-0 inset-y-0 flex items-center bg-gray-200 text-gray-600 text-xs px-3 rounded-r-lg border border-gray-300 font-bold">
                  Kb
                </span>
              </div>
            </div>

            <div className="mb-6">
               <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Output Format</label>
               <select className="input-field py-2 font-medium text-sm" value={format} onChange={(e) => setFormat(e.target.value as any)}>
                 <option value="image/jpeg">JPEG / JPG</option>
                 <option value="image/png">PNG</option>
               </select>
               {format === "image/png" && (
                 <p className="text-[10px] text-amber-600 mt-1.5 bg-amber-50 p-1.5 rounded border border-amber-200 font-medium">Size limit (KB) is strictly enforced for JPEG only.</p>
               )}
            </div>

            <button
              onClick={handleResizeAll}
              disabled={items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <FileImage size={18} />
              Resize Signature{items.length > 1 ? "s" : ""}
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
            <div className="p-6 flex-1 overflow-auto bg-gray-100/50 flex items-center justify-center min-h-[300px]">
              <ReactCrop
                crop={tempCrop}
                onChange={(c) => setTempCrop(c)}
                className="max-w-full rounded-lg shadow-sm overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={croppingItem.previewUrl}
                  alt="Crop preview"
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
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
