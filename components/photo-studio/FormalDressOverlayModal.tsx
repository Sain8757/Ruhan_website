"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UserCheck, X, Check, RotateCcw, Move, Sparkles, Wand2, Loader2, Bot, Sliders, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export interface FormalDressPreset {
  id: string;
  name: string;
  category: "male" | "female";
  prompt: string;
  svgDataUrl: string;
}

const buildSvgDataUrl = (svgString: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;

// Ultra-realistic vector formal attire presets with natural neck curves & realistic shading
export const DRESS_PRESETS: FormalDressPreset[] = [
  {
    id: "female_black_blazer",
    name: "👩 Female Black Executive Blazer",
    category: "female",
    prompt: "Female professional ID photo wearing a black executive blazer suit with a high-neck white formal top",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <linearGradient id="fbbBlazer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#27272a"/>
            <stop offset="100%" stop-color="#09090b"/>
          </linearGradient>
          <linearGradient id="fbbInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f4f4f5"/>
          </linearGradient>
          <filter id="fbbShd">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <!-- Inner White V-Neck Top -->
        <path d="M 180 80 Q 250 160 320 80 L 295 240 L 205 240 Z" fill="url(#fbbInner)"/>
        <path d="M 205 110 L 250 145 L 295 110" stroke="#e4e4e7" stroke-width="2" fill="none"/>
        
        <!-- Left Body & Shoulder -->
        <path d="M 25 400 C 65 270 120 160 185 85 L 250 170 L 315 85 C 380 160 435 270 475 400 Z" fill="url(#fbbBlazer)" filter="url(#fbbShd)"/>
        
        <!-- Left Elegant Lapel -->
        <path d="M 185 85 L 230 230 L 250 190 L 195 130 Z" fill="#3f3f46"/>
        <!-- Right Elegant Lapel -->
        <path d="M 315 85 L 270 230 L 250 190 L 305 130 Z" fill="#3f3f46"/>
        
        <!-- Single Waist Button -->
        <circle cx="250" cy="265" r="5" fill="#a1a1aa" stroke="#52525b" stroke-width="1.5"/>
      </svg>
    `),
  },
  {
    id: "male_black_suit",
    name: "👨 Male Black Suit & Blue Tie",
    category: "male",
    prompt: "Male passport portrait wearing a professional black suit jacket, crisp white formal shirt, and dark blue tie",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <linearGradient id="mbsSuit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="mbsTie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#1e40af"/>
          </linearGradient>
          <filter id="mbsShd">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M 180 90 L 250 185 L 320 90 Z" fill="#ffffff"/>
        <path d="M 175 80 Q 215 130 250 145 L 210 75 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <path d="M 325 80 Q 285 130 250 145 L 290 75 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <polygon points="238,130 262,130 258,155 242,155" fill="url(#mbsTie)" filter="url(#mbsShd)"/>
        <path d="M 242 155 L 258 155 L 265 340 L 250 380 L 235 340 Z" fill="url(#mbsTie)" filter="url(#mbsShd)"/>
        <path d="M 20 400 C 60 270 120 160 185 85 L 250 170 L 315 85 C 380 160 440 270 480 400 Z" fill="url(#mbsSuit)" filter="url(#mbsShd)"/>
        <path d="M 185 85 L 225 240 L 250 200 L 195 140 Z" fill="#334155"/>
        <path d="M 315 85 L 275 240 L 250 200 L 305 140 Z" fill="#334155"/>
        <circle cx="250" cy="275" r="5" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
      </svg>
    `),
  },
  {
    id: "male_navy_suit",
    name: "👨 Male Navy Suit & Red Tie",
    category: "male",
    prompt: "Male executive passport photo wearing a navy blue blazer suit, white collared shirt, and red silk tie",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <linearGradient id="mnsSuit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#172554"/>
          </linearGradient>
          <linearGradient id="mnsTie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>
          <filter id="mnsShd">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M 180 85 L 250 180 L 320 85 Z" fill="#ffffff"/>
        <path d="M 175 75 Q 215 125 250 140 L 210 70 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <path d="M 325 75 Q 285 125 250 140 L 290 70 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <polygon points="238,125 262,125 258,150 242,150" fill="url(#mnsTie)" filter="url(#mnsShd)"/>
        <path d="M 242 150 L 258 150 L 265 335 L 250 375 L 235 335 Z" fill="url(#mnsTie)" filter="url(#mnsShd)"/>
        <path d="M 20 400 C 60 265 120 155 185 80 L 250 165 L 315 80 C 380 155 440 265 480 400 Z" fill="url(#mnsSuit)" filter="url(#mnsShd)"/>
        <path d="M 185 80 L 225 235 L 250 195 L 195 135 Z" fill="#2563eb"/>
        <path d="M 315 80 L 275 235 L 250 195 L 305 135 Z" fill="#2563eb"/>
        <circle cx="250" cy="270" r="5" fill="#93c5fd" stroke="#1d4ed8" stroke-width="1.5"/>
      </svg>
    `),
  },
  {
    id: "male_white_shirt",
    name: "👔 Male Formal White Shirt",
    category: "male",
    prompt: "Male official ID photo wearing a clean white formal button-down shirt with top collar buttoned",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <linearGradient id="mwsShirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </linearGradient>
          <filter id="mwsShd">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.2"/>
          </filter>
        </defs>
        <path d="M 30 400 C 70 270 125 160 190 75 L 250 115 L 310 75 C 375 160 430 270 470 400 Z" fill="url(#mwsShirt)" stroke="#cbd5e1" stroke-width="2" filter="url(#mwsShd)"/>
        <path d="M 190 75 Q 225 130 250 120 L 215 65 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <path d="M 310 75 Q 275 130 250 120 L 285 65 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <path d="M 242 120 L 258 120 L 258 400 L 242 400 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
        <circle cx="250" cy="160" r="4.5" fill="#475569"/>
        <circle cx="250" cy="220" r="4.5" fill="#475569"/>
        <circle cx="250" cy="280" r="4.5" fill="#475569"/>
        <circle cx="250" cy="340" r="4.5" fill="#475569"/>
      </svg>
    `),
  },
  {
    id: "female_white_shirt",
    name: "👩 Female White Formal Shirt",
    category: "female",
    prompt: "Female passport photo wearing a clean white formal collared blouse shirt",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <linearGradient id="fwsShirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f8fafc"/>
          </linearGradient>
          <filter id="fwsShd">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.2"/>
          </filter>
        </defs>
        <path d="M 35 400 C 75 270 125 160 190 80 L 250 120 L 310 80 C 375 160 425 270 465 400 Z" fill="url(#fwsShirt)" stroke="#cbd5e1" stroke-width="2" filter="url(#fwsShd)"/>
        <path d="M 190 80 Q 225 125 250 115 L 215 70 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <path d="M 310 80 Q 275 125 250 115 L 285 70 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="250" cy="170" r="4" fill="#64748b"/>
        <circle cx="250" cy="230" r="4" fill="#64748b"/>
        <circle cx="250" cy="290" r="4" fill="#64748b"/>
      </svg>
    `),
  },
  {
    id: "graduation_gown",
    name: "🎓 Academic Graduation Gown",
    category: "male",
    prompt: "Academic graduation portrait wearing a black graduation gown with academic gold collar and hood",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <filter id="ggShd">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M 30 400 C 70 260 120 150 185 75 L 250 125 L 315 75 C 380 150 430 260 470 400 Z" fill="#09090b" filter="url(#ggShd)"/>
        <path d="M 185 75 L 250 170 L 315 75 Z" fill="#eab308"/>
        <path d="M 195 85 L 250 155 L 305 85 Z" fill="#ffffff"/>
      </svg>
    `),
  },
  {
    id: "male_tuxedo",
    name: "🤵 Classic Black Tuxedo & Bow Tie",
    category: "male",
    prompt: "Formal portrait photo wearing a classic black tuxedo, white pleated tuxedo shirt, and black bow tie",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <defs>
          <filter id="tuxShd">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M 180 85 L 250 180 L 320 85 Z" fill="#ffffff"/>
        <!-- Bow Tie -->
        <polygon points="220,125 250,135 220,145" fill="#0f172a"/>
        <polygon points="280,125 250,135 280,145" fill="#0f172a"/>
        <circle cx="250" cy="135" r="4" fill="#334155"/>
        <path d="M 20 400 C 60 265 120 155 185 80 L 250 165 L 315 80 C 380 155 440 265 480 400 Z" fill="#020617" filter="url(#tuxShd)"/>
        <path d="M 185 80 L 225 235 L 250 195 L 195 135 Z" fill="#1e293b"/>
        <path d="M 315 80 L 275 235 L 250 195 L 305 135 Z" fill="#1e293b"/>
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
  const [activeTab, setActiveTab] = useState<"ai_prompt" | "manual_overlay">("ai_prompt");
  const [selectedPreset, setSelectedPreset] = useState<FormalDressPreset>(DRESS_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(DRESS_PRESETS[0].prompt);
  
  // Manual Overlay Controls
  const [scale, setScale] = useState(100);
  const [offsetY, setOffsetY] = useState(10);
  const [offsetX, setOffsetX] = useState(0);

  // Gemini AI Generation state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const suitImgRef = useRef<HTMLImageElement | null>(null);
  const aiImgRef = useRef<HTMLImageElement | null>(null);
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });

  const renderComposition = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photoImgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = photoImgRef.current.width;
    const height = photoImgRef.current.height;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // If showing original
    if (showOriginal) {
      ctx.drawImage(photoImgRef.current, 0, 0, width, height);
      return;
    }

    // If AI image generated
    if (aiGeneratedImage && aiImgRef.current) {
      ctx.drawImage(aiImgRef.current, 0, 0, width, height);
      return;
    }

    // Always draw base photo first
    ctx.drawImage(photoImgRef.current, 0, 0, width, height);

    // ONLY render suit overlay if in manual overlay mode OR if suit is applied
    if (activeTab === "manual_overlay" && suitImgRef.current) {
      const baseSuitW = width * 1.15;
      const baseSuitH = baseSuitW * 0.8;
      const suitW = baseSuitW * (scale / 100);
      const suitH = baseSuitH * (scale / 100);

      // Default position puts suit neck/shoulder comfortably at lower neck level (~44% down)
      const defaultPosY = height * 0.44;
      const posX = (width - suitW) / 2 + (offsetX * width) / 100;
      const posY = defaultPosY + (offsetY * height) / 100;

      ctx.drawImage(suitImgRef.current, posX, posY, suitW, suitH);
    }
  }, [activeTab, aiGeneratedImage, offsetX, offsetY, scale, showOriginal]);

  const loadPresetSuit = useCallback((preset: FormalDressPreset) => {
    const sImg = new Image();
    sImg.src = preset.svgDataUrl;
    sImg.onload = () => {
      suitImgRef.current = sImg;
      renderComposition();
    };
  }, [renderComposition]);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const pImg = new Image();
    pImg.crossOrigin = "anonymous";
    pImg.src = imageSrc;
    pImg.onload = () => {
      photoImgRef.current = pImg;
      loadPresetSuit(selectedPreset);
    };
  }, [isOpen, imageSrc, selectedPreset, loadPresetSuit]);

  useEffect(() => {
    if (photoImgRef.current) {
      renderComposition();
    }
  }, [renderComposition]);

  // Handle Preset Click
  const handleSelectPreset = (preset: FormalDressPreset) => {
    setSelectedPreset(preset);
    setCustomPrompt(preset.prompt);
    loadPresetSuit(preset);
  };

  // Call Gemini AI Dress-Up API
  const handleGenerateGeminiAi = async () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter or select a prompt for Gemini AI");
      return;
    }

    setIsAiGenerating(true);
    toast.info("Gemini AI is processing formal attire prompt...");

    try {
      const res = await fetch("/api/ai/dress-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          prompt: customPrompt,
          presetId: selectedPreset.id,
        }),
      });

      const data = await res.json();

      if (data.image) {
        setAiGeneratedImage(data.image);
        const img = new Image();
        img.src = data.image;
        img.onload = () => {
          aiImgRef.current = img;
          renderComposition();
          toast.success("✨ Gemini AI successfully dressed photo in formal attire!");
        };
      } else {
        // Fallback: Enable precision fitted overlay for the selected prompt
        setAiGeneratedImage(null);
        aiImgRef.current = null;
        setActiveTab("manual_overlay");
        loadPresetSuit(selectedPreset);
        toast.success(`✨ Applied formal prompt: ${selectedPreset.name}! Adjust sliders if needed.`);
      }
    } catch (err) {
      console.error("Gemini AI dress up error:", err);
      toast.error("AI processing offline. Switched to precision formal suit mode.");
      setAiGeneratedImage(null);
      aiImgRef.current = null;
      setActiveTab("manual_overlay");
      loadPresetSuit(selectedPreset);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Pointer drag to position suit on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTab !== "manual_overlay" || aiGeneratedImage) return;
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
    if (!isDraggingRef.current || !photoImgRef.current || activeTab !== "manual_overlay" || aiGeneratedImage) return;
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
    toast.success("Formal dress applied successfully to your photo!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[92vh]">
        {/* Left Canvas Live Preview */}
        <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden select-none">
          <div className="flex items-center justify-between w-full max-w-md mb-3 px-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              <p className="text-xs font-black text-slate-200 uppercase tracking-wider">
                {aiGeneratedImage
                  ? "✨ Gemini AI Photo Result"
                  : activeTab === "ai_prompt"
                  ? "Photo Preview (Click button to apply prompt)"
                  : "Manual Overlay (Drag suit to position)"}
              </p>
            </div>

            {(aiGeneratedImage || activeTab === "manual_overlay") && (
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition cursor-pointer select-none"
              >
                <Eye size={12} /> Press to View Original
              </button>
            )}
          </div>

          <div className="relative border-4 border-white/20 rounded-2xl overflow-hidden shadow-2xl bg-black max-h-[52vh] flex items-center justify-center">
            {isAiGenerating && (
              <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <Loader2 size={38} className="animate-spin text-blue-400" />
                <p className="text-sm font-black tracking-wide">Gemini AI is Dressing Photo...</p>
                <p className="text-xs text-slate-300 max-w-xs">Applying formal attire based on prompt. Please wait a moment.</p>
              </div>
            )}

            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`max-h-[50vh] w-auto object-contain ${
                activeTab === "manual_overlay" && !aiGeneratedImage ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              } touch-none`}
              title={activeTab === "manual_overlay" ? "Click and drag to move suit" : "Photo preview"}
            />
          </div>

          {activeTab === "ai_prompt" && !aiGeneratedImage && (
            <div className="mt-3 bg-blue-950/80 border border-blue-800/80 text-blue-200 text-xs px-4 py-2 rounded-xl text-center font-medium max-w-md">
              💡 Select a ready prompt below and click <span className="font-black text-white">"✨ Gemini Automatic Pehnao"</span> to dress the photo.
            </div>
          )}

          {aiGeneratedImage && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] bg-green-950 text-green-300 border border-green-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Bot size={13} /> Gemini AI Automatic Dress Applied
              </span>
              <button
                onClick={() => {
                  setAiGeneratedImage(null);
                  aiImgRef.current = null;
                  renderComposition();
                }}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={11} /> Reset
              </button>
            </div>
          )}

          {activeTab === "manual_overlay" && !aiGeneratedImage && (
            <p className="text-[11px] text-slate-400 mt-3 font-semibold flex items-center gap-1">
              <Move size={12} className="text-blue-400" /> Drag directly on photo to position suit over shoulders
            </p>
          )}
        </div>

        {/* Right Controls Panel */}
        <div className="w-full md:w-[440px] p-6 flex flex-col bg-slate-50 border-l border-slate-200 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div className="flex items-center gap-2 font-black text-slate-900 text-base">
              <UserCheck size={20} className="text-blue-600" />
              <span>Formal Suit / Shirt Inserter</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab("ai_prompt")}
              className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "ai_prompt"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-300/50"
              }`}
            >
              <Wand2 size={14} />
              <span>✨ Gemini AI Prompt</span>
            </button>

            <button
              onClick={() => setActiveTab("manual_overlay")}
              className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "manual_overlay"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-300/50"
              }`}
            >
              <Sliders size={14} />
              <span>📐 Manual Overlay</span>
            </button>
          </div>

          {/* TAB 1: Gemini AI Prompt Mode */}
          {activeTab === "ai_prompt" && (
            <div className="space-y-4 animate-fade-in">
              {/* Ready Prompts Chips */}
              <div>
                <label className="text-xs font-black text-slate-800 flex items-center gap-1 mb-2">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Select Ready Prompt:</span>
                </label>
                
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {DRESS_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedPreset.id === preset.id
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{preset.name}</span>
                      {selectedPreset.id === preset.id && <Check size={14} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    ✍️ AI Dress Prompt:
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Gemini AI Engine</span>
                </div>

                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Female professional black executive blazer with white inner top..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20 shadow-inner"
                />
              </div>

              {/* Gemini AI Action Button */}
              <button
                onClick={handleGenerateGeminiAi}
                disabled={isAiGenerating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini AI Pehna Raha Hai...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>✨ Gemini Automatic Pehnao</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Manual Overlay Mode */}
          {activeTab === "manual_overlay" && (
            <div className="space-y-4 animate-fade-in">
              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">👔 Select Outfit Preset:</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {DRESS_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full p-2 rounded-xl border text-left text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
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

              {/* Position Sliders */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                  <span>🎚️ Precision Adjustments</span>
                  <button
                    onClick={() => {
                      setScale(100);
                      setOffsetY(10);
                      setOffsetX(0);
                    }}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>

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

                <div>
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                    <span>Vertical Position</span>
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

                <div>
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-1">
                    <span>Horizontal Position</span>
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyClick}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition"
            >
              <Check size={16} /> Apply to Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
