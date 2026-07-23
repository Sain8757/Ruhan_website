"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { FileText, Loader2, Eraser, Trash2, ArrowLeft, ArrowRight, MousePointer2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from \"@/contexts/DownloadContext\";
import * as pdfjsLib from 'pdfjs-dist';

// Define workerSrc so pdf.js works properly
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function RedactPdfTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1);
  
  // Store redactions per page
  const [redactions, setRedactions] = useState<{ [key: number]: Rect[] }>({});
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(file);
      setPageNum(1);
      setRedactions({});
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      w: Math.abs(x - startPos.x),
      h: Math.abs(y - startPos.y)
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing && currentRect && currentRect.w > 5 && currentRect.h > 5) {
      setRedactions(prev => ({
        ...prev,
        [pageNum]: [...(prev[pageNum] || []), currentRect]
      }));
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const clearRedactions = () => {
    setRedactions(prev => ({ ...prev, [pageNum]: [] }));
  };

  const handleApplyRedactions = async () => {
    if (!pdfFile) return;
    const hasRedactions = Object.values(redactions).some(rects => rects.length > 0);
    if (!hasRedactions) {
      toast.error("Please draw at least one redaction rectangle.");
      return;
    }

    setLoading(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      Object.entries(redactions).forEach(([pageNumStr, rects]) => {
        const pageIdx = parseInt(pageNumStr) - 1;
        if (pageIdx >= 0 && pageIdx < pages.length) {
          const page = pages[pageIdx];
          const { height } = page.getSize();
          
          rects.forEach(r => {
            // Convert canvas coordinates to pdf coordinates
            const pdfX = r.x / pdfScale;
            const pdfW = r.w / pdfScale;
            const pdfH = r.h / pdfScale;
            // PDF y-coordinate starts from bottom, canvas from top
            const pdfY = height - (r.y / pdfScale) - pdfH;
            
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(0, 0, 0),
            });
          });
        }
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `Redacted_${pdfFile.name}`);
      
      toast.success("Redactions applied and PDF downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply redactions.");
    } finally {
      setLoading(false);
    }
  };

  const currentPageRedactions = redactions[pageNum] || [];

  return (
    <div className="space-y-6">
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
            {pdfFile ? pdfFile.name : "Click to select a PDF"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Upload the document you want to redact
          </p>
        </div>
      </div>

      {pdfFile && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Draw Redactions</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPageNum(Math.max(1, pageNum - 1))}
                  disabled={pageNum <= 1}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="text-sm font-medium">Page {pageNum} of {pdfTotalPages}</span>
                <button 
                  onClick={() => setPageNum(Math.min(pdfTotalPages, pageNum + 1))}
                  disabled={pageNum >= pdfTotalPages}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              <button 
                onClick={clearRedactions}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg font-medium"
              >
                <Trash2 size={16} /> Clear Page
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 w-full mb-4 text-sm text-amber-800 flex items-center gap-2">
            <MousePointer2 size={16} />
            <span>Click and drag on the document below to draw black redaction boxes.</span>
          </div>

          <div 
            ref={containerRef}
            className="relative border border-gray-300 bg-gray-100 rounded shadow-inner overflow-hidden select-none"
            style={{ width: "100%", maxWidth: "800px", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <canvas ref={canvasRef} className="block mx-auto" />
            
            {/* Draw stored redactions for current page */}
            {currentPageRedactions.map((rect, i) => (
              <div 
                key={i}
                className="absolute bg-black"
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  pointerEvents: "none"
                }}
              />
            ))}

            {/* Draw active redaction rectangle */}
            {isDrawing && currentRect && (
              <div 
                className="absolute bg-black/60 border border-black"
                style={{
                  left: currentRect.x,
                  top: currentRect.y,
                  width: currentRect.w,
                  height: currentRect.h,
                  pointerEvents: "none"
                }}
              />
            )}
          </div>
          
          <div className="w-full mt-6 flex justify-end">
            <button
              onClick={handleApplyRedactions}
              disabled={loading || Object.values(redactions).every(r => r.length === 0)}
              className="btn-primary flex items-center gap-2 py-3 px-6 text-base shadow-md disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Eraser size={18} />}
              Apply Redactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
