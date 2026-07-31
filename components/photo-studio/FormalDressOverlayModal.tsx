"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UserCheck, X, Check, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Sparkles } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export interface FormalDressPreset {
  id: string;
  name: string;
  category: "male" | "female";
  svgDataUrl: string;
}

const buildSvgDataUrl = (svgString: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;

// Ultra-clean vector formal suit / shirt overlays tailored for passport photos
export const DRESS_PRESETS: FormalDressPreset[] = [
  {
    id: "male_black_suit",
    name: "👨 Male Black Suit & Blue Tie",
    category: "male",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <!-- Suit Jacket -->
        <path d="M 40 400 L 110 180 L 195 90 L 250 140 L 305 90 L 390 180 L 460 400 Z" fill="#0f172a"/>
        <!-- Shirt V-Collar -->
        <path d="M 195 90 L 250 200 L 305 90 Z" fill="#ffffff"/>
        <!-- Collar Flaps -->
        <path d="M 195 90 L 225 150 L 250 140 Z" fill="#f1f5f9"/>
        <path d="M 305 90 L 275 150 L 250 140 Z" fill="#f1f5f9"/>
        <!-- Blue Tie -->
        <path d="M 235 140 L 265 140 L 260 320 L 250 360 L 240 320 Z" fill="#1d4ed8"/>
        <!-- Lapel Overlays -->
        <path d="M 110 180 L 205 240 L 250 200 L 195 90 Z" fill="#1e293b"/>
        <path d="M 390 180 L 295 240 L 250 200 L 305 90 Z" fill="#1e293b"/>
        <!-- Jacket Buttons -->
        <circle cx="250" cy="270" r="5" fill="#475569"/>
        <circle cx="250" cy="330" r="5" fill="#475569"/>
      </svg>
    `),
  },
  {
    id: "male_navy_suit",
    name: "👨 Male Navy Suit & Red Tie",
    category: "male",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <!-- Suit Jacket -->
        <path d="M 35 400 L 105 175 L 190 85 L 250 135 L 310 85 L 395 175 L 465 400 Z" fill="#1e3a8a"/>
        <!-- Shirt -->
        <path d="M 190 85 L 250 195 L 310 85 Z" fill="#ffffff"/>
        <!-- Red Tie -->
        <path d="M 235 135 L 265 135 L 260 315 L 250 355 L 240 315 Z" fill="#dc2626"/>
        <!-- Lapels -->
        <path d="M 105 175 L 200 235 L 250 195 L 190 85 Z" fill="#1e40af"/>
        <path d="M 395 175 L 300 235 L 250 195 L 310 85 Z" fill="#1e40af"/>
        <circle cx="250" cy="260" r="5" fill="#94a3b8"/>
      </svg>
    `),
  },
  {
    id: "male_white_shirt",
    name: "👔 Male Formal White Shirt & Collar",
    category: "male",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <!-- Main Shirt -->
        <path d="M 40 400 L 105 170 L 190 80 L 250 120 L 310 80 L 395 170 L 460 400 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
        <!-- Collar Left & Right -->
        <path d="M 190 80 L 235 140 L 250 120 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
        <path d="M 310 80 L 265 140 L 250 120 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
        <!-- Inner V -->
        <path d="M 235 140 L 250 160 L 265 140 Z" fill="#e2e8f0"/>
        <!-- Placket & Buttons -->
        <path d="M 245 140 L 255 140 L 255 400 L 245 400 Z" fill="#f1f5f9"/>
        <circle cx="250" cy="180" r="5" fill="#475569"/>
        <circle cx="250" cy="240" r="5" fill="#475569"/>
        <circle cx="250" cy="300" r="5" fill="#475569"/>
        <circle cx="250" cy="360" r="5" fill="#475569"/>
      </svg>
    `),
  },
  {
    id: "female_black_blazer",
    name: "👩 Female Black Blazer",
    category: "female",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <!-- Jacket Body -->
        <path d="M 35 400 L 100 175 L 185 90 L 250 135 L 315 90 L 400 175 L 465 400 Z" fill="#18181b"/>
        <!-- Inner White Top -->
        <path d="M 185 90 L 250 190 L 315 90 Z" fill="#ffffff"/>
        <!-- Lapels -->
        <path d="M 100 175 L 195 230 L 250 190 L 185 90 Z" fill="#27272a"/>
        <path d="M 400 175 L 305 230 L 250 190 L 315 90 Z" fill="#27272a"/>
      </svg>
    `),
  },
  {
    id: "female_white_shirt",
    name: "👩 Female White Formal Shirt",
    category: "female",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <path d="M 45 400 L 105 170 L 190 85 L 250 125 L 310 85 L 395 170 L 455 400 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
        <path d="M 190 85 L 235 135 L 250 125 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <path d="M 310 85 L 265 135 L 250 125 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="250" cy="180" r="4" fill="#64748b"/>
        <circle cx="250" cy="240" r="4" fill="#64748b"/>
        <circle cx="250" cy="300" r="4" fill="#64748b"/>
      </svg>
    `),
  },
];

interface FormalDressOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onApply: (composedDataUrl: string) => void;
}

export default function FormalDressOverlayModal({
  isOpen,
  onClose,
  imageSrc,
  onApply,
}: FormalDressOverlayModalProps) {
  const toast = useToast();
  const [selectedPreset, setSelectedPreset] = useState<FormalDressPreset>(DRESS_PRESETS[0]);
  const [scale, setScale] = useState(100);
  const [offsetY, setOffsetY] = useState(0); // Offset relative to default shoulder level
  const [offsetX, setOffsetX] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const suitImgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });

  const renderComposition = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photoImgRef.current || !suitImgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = photoImgRef.current.width;
    const height = photoImgRef.current.height;

    canvas.width = width;
    canvas.height = height;

    // Draw user photo
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(photoImgRef.current, 0, 0, width, height);

    // Calculate suit scale relative to photo canvas width
    const baseSuitW = width * 1.15; // Slightly wider than portrait width for natural shoulders
    const baseSuitH = baseSuitW * 0.8;
    const suitW = baseSuitW * (scale / 100);
    const suitH = baseSuitH * (scale / 100);

    // Default position puts suit neck/shoulder around ~42% from top of canvas
    const defaultPosY = height * 0.38;
    const posX = (width - suitW) / 2 + (offsetX * width) / 100;
    const posY = defaultPosY + (offsetY * height) / 100;

    // Draw formal suit overlay
    ctx.drawImage(suitImgRef.current, posX, posY, suitW, suitH);
  }, [offsetX, offsetY, scale]);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const pImg = new Image();
    pImg.crossOrigin = "anonymous";
    pImg.src = imageSrc;
    pImg.onload = () => {
      photoImgRef.current = pImg;
      loadSuitImg();
    };

    const loadSuitImg = () => {
      const sImg = new Image();
      sImg.src = selectedPreset.svgDataUrl;
      sImg.onload = () => {
        suitImgRef.current = sImg;
        renderComposition();
      };
    };
  }, [isOpen, imageSrc, selectedPreset, renderComposition]);

  useEffect(() => {
    if (photoImgRef.current && suitImgRef.current) {
      renderComposition();
    }
  }, [renderComposition]);

  // Pointer drag to position suit on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: offsetX,
      startY: offsetY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !photoImgRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const canvasW = photoImgRef.current.width || 400;
    const canvasH = photoImgRef.current.height || 500;

    const newX = Math.max(-50, Math.min(50, dragStartRef.current.startX + (deltaX / canvasW) * 100));
    const newY = Math.max(-50, Math.min(50, dragStartRef.current.startY + (deltaY / canvasH) * 100));

    setOffsetX(Math.round(newX));
    setOffsetY(Math.round(newY));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  if (!isOpen) return null;

  const handleApplyClick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const composed = canvas.toDataURL("image/png");
    onApply(composed);
    toast.success("Formal dress overlay applied successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[92vh]">
        {/* Left Canvas Live Preview */}
        <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden select-none">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-yellow-400" />
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Live Preview (Drag suit with mouse/finger)
            </p>
          </div>

          <div className="relative border-4 border-white/20 rounded-2xl overflow-hidden shadow-2xl bg-black max-h-[52vh] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="max-h-[50vh] w-auto object-contain cursor-grab active:cursor-grabbing touch-none"
              title="Click and drag to move suit"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-semibold flex items-center gap-1">
            <Move size={12} className="text-blue-400" /> Drag directly on photo to position suit perfectly over shoulders
          </p>
        </div>

        {/* Right Controls Panel */}
        <div className="w-full md:w-96 p-6 flex flex-col bg-slate-50 border-l border-slate-200 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-base">
              <UserCheck size={20} className="text-blue-600" />
              <span>Formal Suit / Dress Inserter</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block">👔 Select Formal Outfit Preset:</label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {DRESS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    selectedPreset.id === preset.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{preset.name}</span>
                  {selectedPreset.id === preset.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
              <span>🎚️ Position & Size Sliders</span>
              <button
                onClick={() => {
                  setScale(100);
                  setOffsetY(0);
                  setOffsetX(0);
                }}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <RotateCcw size={10} /> Reset Position
              </button>
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                <span>Suit Size / Scale</span>
                <span>{scale}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="150"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Vertical Y Offset */}
            <div>
              <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                <span>Vertical Position (Up / Down)</span>
                <span>{offsetY > 0 ? `+${offsetY}` : offsetY}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Horizontal X Offset */}
            <div>
              <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                <span>Horizontal Position (Left / Right)</span>
                <span>{offsetX > 0 ? `+${offsetX}` : offsetX}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyClick}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={16} /> Apply Suit Overlay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
