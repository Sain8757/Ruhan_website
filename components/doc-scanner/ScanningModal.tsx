import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, ScanLine } from "lucide-react";

interface ScanningModalProps {
  imageSrc: string;
  onComplete: (croppedImageSrc: string) => void;
}

export default function ScanningModal({ imageSrc, onComplete }: ScanningModalProps) {
  const [status, setStatus] = useState<"scanning" | "cropping">("scanning");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [corners, setCorners] = useState([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
  ]);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("cropping");
      
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        // force a redraw soon after mounting
        setTimeout(() => setStatus("cropping"), 50); 
      };
      img.src = imageSrc;
      
    }, 2500);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const drawWorkspace = useCallback(() => {
    if (status !== "cropping") return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // We will set the intrinsic size of the canvas to the image's original dimensions
    // but scale down the width if it's too large, to keep it crisp.
    const displayWidth = canvas.parentElement?.clientWidth || 500;
    const displayHeight = (displayWidth * img.height) / img.width;
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(corners[0].x * displayWidth, corners[0].y * displayHeight);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(corners[i].x * displayWidth, corners[i].y * displayHeight);
    }
    ctx.closePath();
    ctx.stroke();

    corners.forEach((c, index) => {
      ctx.fillStyle = activeCorner === index ? "#059669" : "#10b981";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x * displayWidth, c.y * displayHeight, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    // Draw Loupe (Magnifier) if dragging
    if (isDragging && mousePos) {
      const { x: mx, y: my } = mousePos;
      const R = 60; // Magnifier radius
      const zoom = 2;
      
      let lx = mx;
      let ly = my - R - 30; // Position above the cursor
      
      // If it goes too high (off canvas), move it below the cursor
      if (ly < R) ly = my + R + 30;
      if (lx < R) lx = R;
      if (lx > displayWidth - R) lx = displayWidth - R;

      ctx.save();
      
      // Clip to circle
      ctx.beginPath();
      ctx.arc(lx, ly, R, 0, Math.PI * 2);
      ctx.clip();
      
      // Draw white background in circle
      ctx.fillStyle = "white";
      ctx.fill();

      // Setup zoom transform
      ctx.translate(lx, ly);
      ctx.scale(zoom, zoom);
      ctx.translate(-mx, -my);

      // Draw image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      
      // Draw green lines (scaled down so they don't look huge)
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 2.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(corners[0].x * displayWidth, corners[0].y * displayHeight);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(corners[i].x * displayWidth, corners[i].y * displayHeight);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore(); // Remove clip and transform

      // Draw loupe border
      ctx.beginPath();
      ctx.arc(lx, ly, R, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "white";
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.stroke();
      
      // Draw crosshair at the center of the loupe
      ctx.beginPath();
      ctx.moveTo(lx - 8, ly);
      ctx.lineTo(lx + 8, ly);
      ctx.moveTo(lx, ly - 8);
      ctx.lineTo(lx, ly + 8);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#10b981";
      ctx.stroke();
    }
  }, [corners, activeCorner, status, isDragging, mousePos]);

  useEffect(() => {
    if (status === "cropping") drawWorkspace();
  }, [drawWorkspace, status]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Crucial fix: Map CSS pixels to Canvas internal pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x, y } = getMousePos(e);
    setMousePos({ x, y });
    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;

    let closestIndex = -1;
    let minDistance = 20;

    corners.forEach((c, index) => {
      const cx = c.x * displayWidth;
      const cy = c.y * displayHeight;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    if (closestIndex !== -1) {
      setActiveCorner(closestIndex);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || activeCorner === null || !canvasRef.current) return;
    const { x, y } = getMousePos(e);
    setMousePos({ x, y });
    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;

    const updatedCorners = [...corners];
    updatedCorners[activeCorner] = {
      x: Math.max(0, Math.min(displayWidth, x)) / displayWidth,
      y: Math.max(0, Math.min(displayHeight, y)) / displayHeight,
    };
    setCorners(updatedCorners);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveCorner(null);
    setMousePos(null);
  };

  const handleConfirmCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    const xs = corners.map((c) => c.x * img.width);
    const ys = corners.map((c) => c.y * img.height);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;

    tempCanvas.width = w;
    tempCanvas.height = h;
    ctx.drawImage(img, minX, minY, w, h, 0, 0, w, h);
    
    onComplete(tempCanvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl overflow-hidden animate-scale-in max-h-[90vh]">
        
        <div className="p-4 text-center border-b border-gray-100 bg-slate-50 flex-shrink-0">
          {status === "scanning" ? (
            <div className="flex flex-col items-center gap-2">
              <ScanLine className="text-blue-500 animate-pulse" size={28} />
              <h2 className="text-lg font-bold text-gray-800">Scanning Document...</h2>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="text-green-500" size={24} />
              <h2 className="text-lg font-bold text-gray-800">Adjust Crop Area</h2>
              <p className="text-xs text-gray-500">Drag the corners to align the document borders accurately.</p>
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-center bg-gray-100 overflow-y-auto" style={{ minHeight: "60vh" }}>
          {status === "scanning" ? (
            <div className="relative w-64 h-80 bg-white shadow-md rounded-md overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageSrc} 
                alt="Scanning" 
                className="w-full h-full object-cover brightness-75 grayscale-[50%]" 
              />
              <div className="absolute top-0 left-0 w-full h-full bg-blue-500/10 animate-pulse" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.8)] animate-scan-laser" />
            </div>
          ) : (
            <div className="w-full flex justify-center h-full items-center">
               <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="cursor-crosshair block shadow-md border border-gray-200 bg-white"
                  style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
                />
            </div>
          )}
        </div>

        {status === "cropping" && (
          <div className="p-4 border-t border-gray-100 bg-white flex justify-center flex-shrink-0">
            <button
              onClick={handleConfirmCrop}
              className="btn-primary w-full max-w-sm py-3 text-lg font-bold shadow-blue-500/30 shadow-lg"
            >
              OK (Confirm Crop)
            </button>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan-laser {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
}
