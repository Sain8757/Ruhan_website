import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Undo2, Check, Eraser } from "lucide-react";

interface ManualEraserModalProps {
  imageSrc: string;
  onSave: (newDataUrl: string) => void;
  onClose: () => void;
}

export default function ManualEraserModal({ imageSrc, onSave, onClose }: ManualEraserModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; size: number } | null>(null);
  
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas to exact image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Save initial state for history
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, currentState]);
  };

  const undo = () => {
    if (history.length <= 1) return; // Can't undo beyond the initial state
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Account for CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    saveStateToHistory(); // Save state *before* drawing starts
    setIsDrawing(true);
    
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
    draw(x, y, x, y); // Draw single dot
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      setMousePos({
        x: e.clientX,
        y: e.clientY,
        size: brushSize * scaleX,
      });
    }

    if (!isDrawing || !lastPos.current) return;
    
    const { x, y } = getCoordinates(e);
    draw(lastPos.current.x, lastPos.current.y, x, y);
    lastPos.current = { x, y };
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setMousePos(null);
    handlePointerUp(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    lastPos.current = null;
  };

  const draw = (startX: number, startY: number, endX: number, endY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize;
    // This is the magic for the eraser:
    ctx.globalCompositeOperation = "destination-out";
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Output as PNG to preserve transparency
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl h-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Eraser className="text-blue-500" size={20} />
            <h2 className="font-bold text-gray-800">Manual Eraser</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Cancel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shrink-0 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col gap-1 w-full max-w-[200px]">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Brush Size</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="flex flex-col gap-1 w-full max-w-[150px]">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Zoom</span>
                <span>{zoom}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            
            <div className="w-px h-8 bg-gray-200 mx-2" />
            
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700"
            >
              <Undo2 size={16} />
              Undo
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Check size={16} />
            Done & Save
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 bg-[url('/checkerboard.png')] bg-[#e5e7eb] relative overflow-auto custom-scrollbar p-4" ref={containerRef}>
          {/* We generate a simple CSS checkerboard since image might be missing */}
          <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
          }} />
          
          <div className="min-w-full min-h-full flex items-center justify-center relative z-10">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              className="object-contain shadow-2xl rounded-sm"
              style={{ 
                width: `${zoom}%`,
                height: 'auto',
                cursor: 'none',
                touchAction: "none" // Prevent scrolling on touch devices while drawing
              }}
            />
          </div>
        </div>

        {mousePos && (
          <div 
            className="fixed pointer-events-none rounded-full border border-white mix-blend-difference z-[60]"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: mousePos.size,
              height: mousePos.size,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
            }}
          />
        )}
      </div>
    </div>
  );
}
