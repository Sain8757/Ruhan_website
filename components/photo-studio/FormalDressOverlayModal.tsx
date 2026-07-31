"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UserCheck, X, Check, RotateCcw, Sliders, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export interface FormalDressPreset {
  id: string;
  name: string;
  category: "male" | "female";
  svgPath: string; // SVG path string or data URL
}

// High quality vector formal dress overlays for passport photos
export const DRESS_PRESETS: FormalDressPreset[] = [
  {
    id: "male_black_suit",
    name: "👨 Male Black Suit & Blue Tie",
    category: "male",
    svgPath: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M50 300 L90 180 L140 100 L200 130 L260 100 L310 180 L350 300 Z" fill="%230f172a"/><path d="M140 100 L200 170 L260 100" fill="%23ffffff"/><path d="M185 100 L215 100 L210 240 L200 270 L190 240 Z" fill="%231d4ed8"/><path d="M130 95 L200 135 L270 95 L310 180 L260 300 L140 300 L90 180 Z" fill="none" stroke="%231e293b" stroke-width="4"/></svg>`,
  },
  {
    id: "male_navy_suit",
    name: "👨 Male Navy Suit & Red Tie",
    category: "male",
    svgPath: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M40 300 L85 170 L135 95 L200 125 L265 95 L315 170 L360 300 Z" fill="%231e3a8a"/><path d="M135 95 L200 165 L265 95" fill="%23ffffff"/><path d="M185 95 L215 95 L210 235 L200 265 L190 235 Z" fill="%23dc2626"/><path d="M125 90 L200 130 L275 90" fill="none" stroke="%231e40af" stroke-width="5"/></svg>`,
  },
  {
    id: "male_white_shirt",
    name: "👔 Male Formal White Shirt",
    category: "male",
    svgPath: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M45 300 L90 165 L140 90 L200 120 L260 90 L310 165 L355 300 Z" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="3"/><path d="M140 90 L200 145 L260 90" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="3"/><path d="M195 120 L205 120 L205 300 L195 300 Z" fill="%23cbd5e1"/><circle cx="200" cy="160" r="4" fill="%23475569"/><circle cx="200" cy="210" r="4" fill="%23475569"/><circle cx="200" cy="260" r="4" fill="%23475569"/></svg>`,
  },
  {
    id: "female_black_blazer",
    name: "👩 Female Black Blazer",
    category: "female",
    svgPath: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M40 300 L95 175 L145 105 L200 140 L255 105 L305 175 L360 300 Z" fill="%2318181b"/><path d="M145 105 L200 180 L255 105" fill="%23ffffff"/><path d="M135 100 L200 150 L265 100" fill="none" stroke="%2327272a" stroke-width="5"/></svg>`,
  },
  {
    id: "female_white_shirt",
    name: "👩 Female White Formal Shirt",
    category: "female",
    svgPath: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M50 300 L95 170 L145 95 L200 125 L255 95 L305 170 L350 300 Z" fill="%23ffffff" stroke="%23e2e8f0" stroke-width="3"/><path d="M145 95 L200 150 L255 95" fill="%23f1f5f9" stroke="%23cbd5e1" stroke-width="3"/><circle cx="200" cy="170" r="4" fill="%2364748b"/><circle cx="200" cy="220" r="4" fill="%2364748b"/></svg>`,
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
  const [offsetY, setOffsetY] = useState(60);
  const [offsetX, setOffsetX] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const suitImgRef = useRef<HTMLImageElement | null>(null);

  const renderComposition = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photoImgRef.current || !suitImgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = photoImgRef.current.width;
    const height = photoImgRef.current.height;

    canvas.width = width;
    canvas.height = height;

    // Draw base user photo
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(photoImgRef.current, 0, 0, width, height);

    // Calculate suit position at bottom of photo
    const suitScaleRatio = (width / 400) * (scale / 100);
    const suitW = 400 * suitScaleRatio;
    const suitH = 300 * suitScaleRatio;

    const posX = width / 2 - suitW / 2 + (offsetX * width) / 100;
    const posY = height - suitH + (offsetY * height) / 100;

    // Draw suit overlay over photo
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
      sImg.src = selectedPreset.svgPath;
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

  if (!isOpen) return null;

  const handleApplyClick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const composed = canvas.toDataURL("image/png");
    onApply(composed);
    toast.success("Formal suit overlay applied!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Canvas Preview */}
        <div className="flex-1 bg-slate-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Formal Dress Live Preview</p>
          <div className="relative border-4 border-white/20 rounded-xl overflow-hidden shadow-2xl bg-black max-h-[50vh]">
            <canvas ref={canvasRef} className="max-h-[48vh] w-auto object-contain" />
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-semibold">
            Use the position & scale controls to align the suit over the shoulders
          </p>
        </div>

        {/* Right Controls Panel */}
        <div className="w-full md:w-96 p-6 flex flex-col bg-slate-50 border-l border-slate-200 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-base">
              <UserCheck size={20} className="text-blue-600" />
              <span>Formal Dress Inserter</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Preset Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block">👔 Select Dress Preset:</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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

          {/* Fine Controls */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
              <span>🎚️ Align & Scale Controls</span>
              <button
                onClick={() => {
                  setScale(100);
                  setOffsetY(60);
                  setOffsetX(0);
                }}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                <span>Dress Scale Size</span>
                <span>{scale}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Vertical Y Offset */}
            <div>
              <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                <span>Vertical Position (Up / Down)</span>
                <span>{offsetY}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="110"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Horizontal X Offset */}
            <div>
              <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                <span>Horizontal Alignment (Left / Right)</span>
                <span>{offsetX}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
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
