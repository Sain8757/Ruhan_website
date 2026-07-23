"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { FileText, Loader2, Edit, Trash2, ArrowLeft, ArrowRight, Type, Image as ImageIcon, Move } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from \"@/contexts/DownloadContext\";
import * as pdfjsLib from 'pdfjs-dist';

// Define workerSrc so pdf.js works properly
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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

export default function EditPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [pageNum, setPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1);
  
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [images, setImages] = useState<ImageOverlay[]>([]);
  
  const [activeMode, setActiveMode] = useState<"text" | "image" | "move">("move");

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<"text" | "image" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(file);
      setPageNum(1);
      setTexts([]);
      setImages([]);
    } else if (file) {
      toast.error("Please select a valid PDF file");
    }
  };

  // Render PDF Page
  useEffect(() => {
    if (pdfFile && canvasRef.current && containerRef.current) {
      let renderTask: any = null;
      let isSubscribed = true;

      const renderPage = async () => {
        try {
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          if (!isSubscribed) return;

          setPdfTotalPages(pdf.numPages);
          const validPageNum = Math.min(Math.max(1, pageNum), pdf.numPages);
          if (pageNum !== validPageNum) setPageNum(validPageNum);

          const page = await pdf.getPage(validPageNum);
          if (!isSubscribed) return;

          // Scale canvas to fit container
          const containerWidth = containerRef.current?.clientWidth || 800;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / unscaledViewport.width;
          setPdfScale(scale);
          
          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext('2d');
          if (!context) return;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          renderTask = page.render(renderContext);
          await renderTask.promise;
        } catch (error) {
          console.error("Error rendering PDF:", error);
          if (isSubscribed) toast.error("Failed to render PDF preview");
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
      text: "Double click to edit",
      x: 50,
      y: 50,
      color: "#000000",
      size: 16
    };
    setTexts([...texts, newText]);
  };

  // Handle image upload for overlay
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
      const url = URL.createObjectURL(file);
      // Rough estimation of size, can be improved
      const newImage: ImageOverlay = {
        id: Date.now().toString(),
        pageNum,
        file,
        previewUrl: url,
        x: 50,
        y: 50,
        width: 150,
        height: 100 // Default height, will look skewed until adjusted or loaded properly
      };
      
      // Auto adjust height based on actual image aspect ratio
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        setImages(prev => prev.map(img => img.id === newImage.id ? { ...img, height: 150 / aspect } : img));
      };
      img.src = url;

      setImages([...images, newImage]);
      setActiveMode("move");
    }
  };

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent, id: string, type: "text" | "image") => {
    e.stopPropagation();
    setDraggingId(id);
    setDraggingType(type);
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    if (draggingType === "text") {
      setTexts(prev => prev.map(t => t.id === draggingId ? { ...t, x: newX, y: newY } : t));
    } else if (draggingType === "image") {
      setImages(prev => prev.map(i => i.id === draggingId ? { ...i, x: newX, y: newY } : i));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      setDraggingType(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  // Convert hex to rgb string for pdf-lib (0-1 range)
  const hexToPdfRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ) : rgb(0, 0, 0);
  };

  const handleSavePdf = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      // Apply texts
      for (const text of texts) {
        const pageIdx = text.pageNum - 1;
        if (pageIdx >= 0 && pageIdx < pages.length) {
          const page = pages[pageIdx];
          const { height } = page.getSize();
          
          const pdfX = text.x / pdfScale;
          const pdfY = height - (text.y / pdfScale) - (text.size / pdfScale);
          
          page.drawText(text.text, {
            x: pdfX,
            y: pdfY,
            size: text.size / pdfScale,
            color: hexToPdfRgb(text.color),
          });
        }
      }

      // Apply images
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
          const pdfY = height - (img.y / pdfScale) - pdfH;

          page.drawImage(pdfImage, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH
          });
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `Edited_${pdfFile.name}`);
      
      toast.success("PDF saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save edited PDF.");
    } finally {
      setLoading(false);
    }
  };

  const currentTexts = texts.filter(t => t.pageNum === pageNum);
  const currentImages = images.filter(i => i.pageNum === pageNum);

  return (
    <div className="space-y-6">
      {!pdfFile && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Upload Document</h2>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => pdfInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={pdfInputRef} 
              onChange={handlePdfChange} 
              accept="application/pdf" 
              className="hidden" 
            />
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Click to select a PDF to Edit
            </p>
          </div>
        </div>
      )}

      {pdfFile && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddText}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
              >
                <Type size={16} /> Add Text
              </button>
              
              <button 
                onClick={() => imgInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
              >
                <ImageIcon size={16} /> Add Image
                <input 
                  type="file" 
                  ref={imgInputRef} 
                  onChange={handleImageChange} 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPageNum(Math.max(1, pageNum - 1))}
                disabled={pageNum <= 1}
                className="p-1.5 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-sm font-medium">Page {pageNum} of {pdfTotalPages}</span>
              <button 
                onClick={() => setPageNum(Math.min(pdfTotalPages, pageNum + 1))}
                disabled={pageNum >= pdfTotalPages}
                className="p-1.5 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
              >
                <ArrowRight size={16} />
              </button>
            </div>

            <button
              onClick={handleSavePdf}
              disabled={loading}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-sm shadow-md disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />}
              Save PDF
            </button>
          </div>

          <div className="p-6 bg-gray-100 flex justify-center">
            <div 
              ref={containerRef}
              className="relative shadow-lg bg-white overflow-hidden select-none"
              style={{ width: "100%", maxWidth: "800px", touchAction: "none" }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <canvas ref={canvasRef} className="block mx-auto" />
              
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
                    cursor: "move"
                  }}
                  onPointerDown={(e) => handlePointerDown(e, img.id, "image")}
                >
                  <img src={img.previewUrl} alt="overlay" className="w-full h-full object-contain pointer-events-none" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setImages(images.filter(i => i.id !== img.id)) }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* Render Texts */}
              {currentTexts.map((text) => (
                <div 
                  key={text.id}
                  className="absolute group border border-dashed border-transparent hover:border-gray-400 p-1"
                  style={{
                    left: text.x,
                    top: text.y,
                    cursor: "move",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, text.id, "text")}
                >
                  <div className="absolute -top-8 left-0 bg-white shadow-md border rounded flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <input 
                      type="color" 
                      value={text.color}
                      onChange={(e) => setTexts(texts.map(t => t.id === text.id ? { ...t, color: e.target.value } : t))}
                      className="w-6 h-6 p-0 border-0 cursor-pointer"
                    />
                    <input 
                      type="number" 
                      value={text.size}
                      onChange={(e) => setTexts(texts.map(t => t.id === text.id ? { ...t, size: Number(e.target.value) } : t))}
                      className="w-12 text-xs border rounded px-1"
                      min={8} max={72}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTexts(texts.filter(t => t.id !== text.id)) }}
                      className="text-red-500 hover:bg-red-50 rounded p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={text.text}
                    onChange={(e) => setTexts(texts.map(t => t.id === text.id ? { ...t, text: e.target.value } : t))}
                    style={{
                      color: text.color,
                      fontSize: `${text.size}px`,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'Helvetica, sans-serif'
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
