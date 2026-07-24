"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { FileText, Loader2, Edit, Trash2, ArrowLeft, ArrowRight, Type, Image as ImageIcon, Move, Square, PenTool, X } from "lucide-react";
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

interface TextOverlay {
  id: string;
  pageNum: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ImageOverlay {
  id: string;
  pageNum: number;
  file: File;
  previewUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WhiteoutOverlay {
  id: string;
  pageNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export default function EditPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [pageNum, setPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1);

  // Layer Overlays
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [images, setImages] = useState<ImageOverlay[]>([]);
  const [whiteouts, setWhiteouts] = useState<WhiteoutOverlay[]>([]);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<"text" | "image" | "whiteout" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePdfChange = async (incoming: File) => {
    if (!incoming.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }
    setPdfFile(incoming);
    setPageNum(1);
    setTexts([]);
    setImages([]);
    setWhiteouts([]);

    try {
      const pdfjs = await loadPdfJs();
      const buf = await incoming.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      setPdfTotalPages(pdf.numPages);
    } catch {
      toast.error("Failed to read PDF file");
    }
  };

  // Render PDF Page Canvas
  useEffect(() => {
    if (pdfFile && canvasRef.current && containerRef.current) {
      let renderTask: any = null;
      let isSubscribed = true;

      const renderPage = async () => {
        try {
          const pdfjs = await loadPdfJs();
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          if (!isSubscribed) return;

          setPdfTotalPages(pdf.numPages);
          const validPageNum = Math.min(Math.max(1, pageNum), pdf.numPages);

          const page = await pdf.getPage(validPageNum);
          if (!isSubscribed) return;

          const containerWidth = containerRef.current?.clientWidth || 800;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / unscaledViewport.width;
          setPdfScale(scale);

          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext("2d");
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          renderTask = page.render({ canvasContext: context, viewport });
          await renderTask.promise;
        } catch (error) {
          console.error("Error rendering PDF:", error);
        }
      };

      renderPage();

      return () => {
        isSubscribed = false;
        if (renderTask) renderTask.cancel();
      };
    }
  }, [pdfFile, pageNum]);

  // Handle adding text
  const handleAddText = () => {
    const newText: TextOverlay = {
      id: Date.now().toString(),
      pageNum,
      text: "Type text here",
      x: 60,
      y: 60,
      color: "#000000",
      size: 18,
    };
    setTexts([...texts, newText]);
    toast.success("Text box added to page!");
  };

  // Handle adding Whiteout Cover Box
  const handleAddWhiteout = () => {
    const newWhiteout: WhiteoutOverlay = {
      id: Date.now().toString(),
      pageNum,
      x: 80,
      y: 80,
      width: 140,
      height: 40,
      color: "#ffffff",
    };
    setWhiteouts([...whiteouts, newWhiteout]);
    toast.success("Whiteout cover box added!");
  };

  // Handle image upload for overlay
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
      const url = URL.createObjectURL(file);
      const newImage: ImageOverlay = {
        id: Date.now().toString(),
        pageNum,
        file,
        previewUrl: url,
        x: 60,
        y: 60,
        width: 160,
        height: 100,
      };

      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        setImages((prev) =>
          prev.map((i) => (i.id === newImage.id ? { ...i, height: 160 / aspect } : i))
        );
      };
      img.src = url;

      setImages([...images, newImage]);
      toast.success("Image added to page!");
    }
  };

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent, id: string, type: "text" | "image" | "whiteout") => {
    e.stopPropagation();
    setDraggingId(id);
    setDraggingType(type);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    if (draggingType === "text") {
      setTexts((prev) => prev.map((t) => (t.id === draggingId ? { ...t, x: newX, y: newY } : t)));
    } else if (draggingType === "image") {
      setImages((prev) => prev.map((i) => (i.id === draggingId ? { ...i, x: newX, y: newY } : i)));
    } else if (draggingType === "whiteout") {
      setWhiteouts((prev) => prev.map((w) => (w.id === draggingId ? { ...w, x: newX, y: newY } : w)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      setDraggingType(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  // Convert hex to rgb for pdf-lib (0-1 range)
  const hexToPdfRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? rgb(
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        )
      : rgb(0, 0, 0);
  };

  const handleSavePdf = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      // 1. Apply Whiteout Boxes first (so text/images sit on top)
      for (const box of whiteouts) {
        const pageIdx = box.pageNum - 1;
        if (pageIdx >= 0 && pageIdx < pages.length) {
          const page = pages[pageIdx];
          const { height } = page.getSize();

          const pdfX = box.x / pdfScale;
          const pdfW = box.width / pdfScale;
          const pdfH = box.height / pdfScale;
          const pdfY = height - box.y / pdfScale - pdfH;

          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: hexToPdfRgb(box.color),
          });
        }
      }

      // 2. Apply Images
      for (const img of images) {
        const pageIdx = img.pageNum - 1;
        if (pageIdx >= 0 && pageIdx < pages.length) {
          const page = pages[pageIdx];
          const { height } = page.getSize();

          const imageBytes = await img.file.arrayBuffer();
          let pdfImage;
          if (img.file.type === "image/png") {
            pdfImage = await pdfDoc.embedPng(imageBytes);
          } else {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
          }

          const pdfX = img.x / pdfScale;
          const pdfW = img.width / pdfScale;
          const pdfH = img.height / pdfScale;
          const pdfY = height - img.y / pdfScale - pdfH;

          page.drawImage(pdfImage, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
          });
        }
      }

      // 3. Apply Text Annotations
      for (const text of texts) {
        const pageIdx = text.pageNum - 1;
        if (pageIdx >= 0 && pageIdx < pages.length) {
          const page = pages[pageIdx];
          const { height } = page.getSize();

          const pdfX = text.x / pdfScale;
          const pdfY = height - text.y / pdfScale - text.size / pdfScale;

          page.drawText(text.text, {
            x: pdfX,
            y: pdfY,
            size: text.size / pdfScale,
            color: hexToPdfRgb(text.color),
          });
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `Edited_${pdfFile.name}`);

      toast.success("Edited PDF saved and downloaded!");
    } catch {
      toast.error("Failed to save edited PDF.");
    } finally {
      setLoading(false);
    }
  };

  const currentTexts = texts.filter((t) => t.pageNum === pageNum);
  const currentImages = images.filter((i) => i.pageNum === pageNum);
  const currentWhiteouts = whiteouts.filter((w) => w.pageNum === pageNum);

  return (
    <div className="space-y-6">
      {!pdfFile ? (
        <div
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
          <Edit size={40} className="mx-auto mb-3 text-blue-600" />
          <p className="text-lg font-black mb-1" style={{ color: "#000080" }}>
            Drop PDF here to Edit Text, Images & Cover Boxes
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
        <div className="space-y-4 animate-fade-in">
          {/* File Overview & Tool Bar */}
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between flex-wrap gap-3 shadow-xs">
            {/* Add Tool Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAddText}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Type size={14} className="text-blue-700" /> Add Text
              </button>

              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ImageIcon size={14} className="text-pink-600" /> Add Image / Stamp
                <input
                  type="file"
                  ref={imgInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </button>

              <button
                type="button"
                onClick={handleAddWhiteout}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Square size={14} className="text-slate-600" /> Cover Box (Whiteout)
              </button>
            </div>

            {/* Page Switcher */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <button
                type="button"
                disabled={pageNum <= 1}
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                className="p-1 bg-white hover:bg-slate-200 rounded border border-slate-300 disabled:opacity-40"
              >
                <ArrowLeft size={14} />
              </button>
              <span>
                Page {pageNum} of {pdfTotalPages}
              </span>
              <button
                type="button"
                disabled={pageNum >= pdfTotalPages}
                onClick={() => setPageNum((p) => Math.min(pdfTotalPages, p + 1))}
                className="p-1 bg-white hover:bg-slate-200 rounded border border-slate-300 disabled:opacity-40"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Save PDF Action Button */}
            <button
              onClick={handleSavePdf}
              disabled={loading}
              style={{
                backgroundColor: "#000080",
                color: "#ffffff",
                borderTop: "2px solid #ffffff",
                borderLeft: "2px solid #ffffff",
                borderRight: "2px solid #000040",
                borderBottom: "2px solid #000040",
              }}
              className="px-4 py-1.5 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-blue-900 rounded shadow-xs"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Edit size={14} />}
              Save Edited PDF
            </button>
          </div>

          {/* Interactive Page Canvas Container */}
          <div className="p-4 bg-slate-200 border border-slate-400 rounded-lg flex justify-center overflow-x-auto shadow-inner min-h-[450px]">
            <div
              ref={containerRef}
              className="relative shadow-lg bg-white overflow-hidden select-none touch-none max-w-full"
              style={{ width: "100%", maxWidth: "800px" }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <canvas ref={canvasRef} className="block mx-auto" />

              {/* Render Whiteout Boxes */}
              {currentWhiteouts.map((w) => (
                <div
                  key={w.id}
                  className="absolute group border border-dashed border-slate-400 p-1 flex items-center justify-center"
                  style={{
                    left: w.x,
                    top: w.y,
                    width: w.width,
                    height: w.height,
                    backgroundColor: w.color,
                    cursor: "move",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, w.id, "whiteout")}
                >
                  <div className="absolute -top-7 left-0 bg-white shadow-md border border-slate-300 rounded flex items-center gap-1.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-[10px] font-bold">
                    <span>Width:</span>
                    <input
                      type="number"
                      value={w.width}
                      onChange={(e) =>
                        setWhiteouts(
                          whiteouts.map((box) =>
                            box.id === w.id ? { ...box, width: Number(e.target.value) } : box
                          )
                        )
                      }
                      className="w-12 px-1 border rounded"
                      min={20}
                    />
                    <span>Height:</span>
                    <input
                      type="number"
                      value={w.height}
                      onChange={(e) =>
                        setWhiteouts(
                          whiteouts.map((box) =>
                            box.id === w.id ? { ...box, height: Number(e.target.value) } : box
                          )
                        )
                      }
                      className="w-12 px-1 border rounded"
                      min={10}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWhiteouts(whiteouts.filter((box) => box.id !== w.id));
                      }}
                      className="text-red-600 hover:bg-red-50 rounded p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Render Images */}
              {currentImages.map((img) => (
                <div
                  key={img.id}
                  className="absolute group border-2 border-transparent hover:border-blue-500"
                  style={{
                    left: img.x,
                    top: img.y,
                    width: img.width,
                    height: img.height,
                    cursor: "move",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, img.id, "image")}
                >
                  <img src={img.previewUrl} alt="overlay" className="w-full h-full object-contain pointer-events-none" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages(images.filter((i) => i.id !== img.id));
                    }}
                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* Render Texts */}
              {currentTexts.map((text) => (
                <div
                  key={text.id}
                  className="absolute group border border-dashed border-transparent hover:border-blue-500 p-1"
                  style={{
                    left: text.x,
                    top: text.y,
                    cursor: "move",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, text.id, "text")}
                >
                  <div className="absolute -top-8 left-0 bg-white shadow-md border border-slate-300 rounded flex items-center gap-1.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <input
                      type="color"
                      value={text.color}
                      onChange={(e) =>
                        setTexts(
                          texts.map((t) => (t.id === text.id ? { ...t, color: e.target.value } : t))
                        )
                      }
                      className="w-6 h-6 p-0 border-0 cursor-pointer"
                    />
                    <input
                      type="number"
                      value={text.size}
                      onChange={(e) =>
                        setTexts(
                          texts.map((t) => (t.id === text.id ? { ...t, size: Number(e.target.value) } : t))
                        )
                      }
                      className="w-12 text-xs border rounded px-1 font-bold"
                      min={8}
                      max={72}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTexts(texts.filter((t) => t.id !== text.id));
                      }}
                      className="text-red-600 hover:bg-red-50 rounded p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={text.text}
                    onChange={(e) =>
                      setTexts(
                        texts.map((t) => (t.id === text.id ? { ...t, text: e.target.value } : t))
                      )
                    }
                    style={{
                      color: text.color,
                      fontSize: `${text.size}px`,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontFamily: "Helvetica, sans-serif",
                      fontWeight: "bold",
                    }}
                    placeholder="Type text..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
