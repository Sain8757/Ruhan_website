"use client";

import { useRef, useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Image as ImageIcon, Loader2, X, PenTool, Move } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";
import * as pdfjsLib from 'pdfjs-dist';

// Define workerSrc so pdf.js works properly
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function AddSignatureTool() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);
  
  // Signature Image Data URL for Preview
  const [sigPreview, setSigPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  
  const [placementMode, setPlacementMode] = useState<"preset" | "manual">("preset");
  const [pageNum, setPageNum] = useState<number>(1);
  const [position, setPosition] = useState<string>("bottom-right");
  const [sigWidth, setSigWidth] = useState<number>(150);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);

  // Manual Drag State
  const [pdfScale, setPdfScale] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(file);
      setPageNum(1);
    } else if (file) {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
      setSigFile(file);
      const url = URL.createObjectURL(file);
      setSigPreview(url);
    } else if (file) {
      toast.error("Please select a valid PNG or JPG image");
    }
  };

  // Render PDF Page for Preview
  useEffect(() => {
    if (placementMode === "manual" && pdfFile && canvasRef.current && containerRef.current) {
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

          // Calculate scale to fit container width
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
          console.error("Error rendering PDF preview:", error);
          if (isSubscribed) toast.error("Failed to render PDF preview");
        }
      };

      renderPage();

      return () => {
        isSubscribed = false;
        if (renderTask) renderTask.cancel();
      };
    }
  }, [pdfFile, pageNum, placementMode]);

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    // Boundaries
    const scaledWidth = sigWidth * pdfScale;
    // rough aspect ratio for boundary calculation (will be exactly bounded eventually but good enough)
    const aspect = sigPreview ? 1 : 1; 
    const scaledHeight = (sigWidth / aspect) * pdfScale;

    const maxX = containerRect.width - scaledWidth;
    const maxY = containerRect.height - 20;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setDragPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleAddSignature = async () => {
    if (!pdfFile || !sigFile) {
      toast.error("Please select both a PDF and a signature image");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Load PDF
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      // 2. Embed Image
      const imageBytes = await sigFile.arrayBuffer();
      let image;
      if (sigFile.type === "image/png") {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      // 3. Get Page
      const pages = pdfDoc.getPages();
      const pageIndex = Math.min(Math.max(1, pageNum), pages.length) - 1;
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // 4. Calculate Dimensions & Position
      const imgDims = image.scale(sigWidth / image.width);
      
      let x = 50;
      let y = 50;
      
      if (placementMode === "preset") {
        const margin = 50;
        switch(position) {
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
        // Manual placement mode
        x = dragPos.x / pdfScale;
        y = height - (dragPos.y / pdfScale) - imgDims.height;
      }

      // 5. Draw Image
      page.drawImage(image, {
        x, 
        y,
        width: imgDims.width,
        height: imgDims.height,
      });

      // 6. Save & Download
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadWithRename(url, `Signed_${pdfFile.name}`); 
      
      toast.success("Signature added and PDF downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add signature. Check file validity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Upload */}
        <div className="space-y-2">
          <p className="label text-sm font-semibold text-gray-700">1. Select PDF File</p>
          {!pdfFile ? (
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <FileText size={32} className="mx-auto mb-3 text-blue-500" />
              <p className="font-semibold text-gray-700">Click to upload PDF</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <FileText size={24} className="text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{pdfFile.name}</p>
                <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setPdfFile(null); setPageNum(1); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          )}
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handlePdfChange} />
        </div>

        {/* Signature Upload */}
        <div className="space-y-2">
          <p className="label text-sm font-semibold text-gray-700">2. Select Signature (Image)</p>
          {!sigFile ? (
            <div
              onClick={() => sigInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all"
            >
              <ImageIcon size={32} className="mx-auto mb-3 text-pink-500" />
              <p className="font-semibold text-gray-700">Click to upload JPG/PNG</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <ImageIcon size={24} className="text-pink-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{sigFile.name}</p>
                <p className="text-xs text-gray-500">{(sigFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setSigFile(null); setSigPreview(null); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          )}
          <input ref={sigInputRef} type="file" accept="image/png, image/jpeg, image/jpg" hidden onChange={handleSigChange} />
        </div>
      </div>

      {/* Options */}
      {pdfFile && sigFile && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm animate-fade-in">
          
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-800">Placement Options</h3>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setPlacementMode("preset")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${placementMode === "preset" ? "bg-white shadow-sm text-gray-800 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
              >
                Preset Position
              </button>
              <button
                onClick={() => setPlacementMode("manual")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${placementMode === "manual" ? "bg-white shadow-sm text-gray-800 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
              >
                Manual (Drag & Drop)
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Page Number</label>
              <input 
                type="number" 
                min="1" 
                max={pdfTotalPages}
                value={pageNum}
                onChange={(e) => setPageNum(parseInt(e.target.value) || 1)}
                className="input-field" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Signature Width (px)</label>
              <input 
                type="number" 
                min="50" 
                max="500"
                value={sigWidth}
                onChange={(e) => setSigWidth(parseInt(e.target.value) || 150)}
                className="input-field" 
              />
            </div>

            {placementMode === "preset" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <select 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="input-field"
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

          {/* Visual Preview for Manual Placement */}
          {placementMode === "manual" && (
            <div className="space-y-2 mt-6">
              <div className="flex items-center gap-2 mb-2 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                <Move size={18} />
                <p className="text-sm font-semibold">Drag the signature on the page below to position it.</p>
              </div>
              
              <div 
                ref={containerRef} 
                className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50 shadow-inner w-full mx-auto touch-none select-none max-w-full"
                style={{ minHeight: '300px' }}
              >
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto block"
                />
                
                {sigPreview && (
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp} // Also stop dragging if pointer leaves
                    style={{
                      position: "absolute",
                      left: dragPos.x,
                      top: dragPos.y,
                      width: sigWidth * pdfScale, 
                      cursor: isDragging ? "grabbing" : "grab",
                      boxShadow: isDragging ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)" : "none",
                      border: "2px dashed #ec4899",
                      padding: "2px",
                      backgroundColor: "rgba(255,255,255,0.4)"
                    }}
                    className="transition-shadow touch-none group z-10"
                  >
                    <img 
                      src={sigPreview} 
                      alt="Signature Preview" 
                      className="w-full h-auto opacity-80 group-hover:opacity-100 pointer-events-none block" 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={handleAddSignature} 
            disabled={loading} 
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 mt-4 shadow-md transition-all active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 size={22} className="animate-spin" /> Processing...</>
            ) : (
              <><PenTool size={22} /> Add Signature to PDF</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
