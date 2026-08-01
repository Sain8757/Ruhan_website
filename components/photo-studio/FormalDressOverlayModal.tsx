"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UserCheck, X, Check, RotateCcw, Move, Sparkles, Wand2, Loader2, Bot, Sliders } from "lucide-react";
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

// Ready presets with pre-configured prompts & fallback SVGs
export const DRESS_PRESETS: FormalDressPreset[] = [
  {
    id: "male_black_suit",
    name: "👨 Male Black Suit & Blue Tie",
    category: "male",
    prompt: "Male passport portrait wearing a professional black suit jacket, crisp white formal shirt, and dark blue tie",
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
        <circle cx="250" cy="270" r="5" fill="#475569"/>
        <circle cx="250" cy="330" r="5" fill="#475569"/>
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
        <path d="M 35 400 L 105 175 L 190 85 L 250 135 L 310 85 L 395 175 L 465 400 Z" fill="#1e3a8a"/>
        <path d="M 190 85 L 250 195 L 310 85 Z" fill="#ffffff"/>
        <path d="M 235 135 L 265 135 L 260 315 L 250 355 L 240 315 Z" fill="#dc2626"/>
        <path d="M 105 175 L 200 235 L 250 195 L 190 85 Z" fill="#1e40af"/>
        <path d="M 395 175 L 300 235 L 250 195 L 310 85 Z" fill="#1e40af"/>
        <circle cx="250" cy="260" r="5" fill="#94a3b8"/>
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
        <path d="M 40 400 L 105 170 L 190 80 L 250 120 L 310 80 L 395 170 L 460 400 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
        <path d="M 190 80 L 235 140 L 250 120 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
        <path d="M 310 80 L 265 140 L 250 120 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
        <path d="M 235 140 L 250 160 L 265 140 Z" fill="#e2e8f0"/>
        <path d="M 245 140 L 255 140 L 255 400 L 245 400 Z" fill="#f1f5f9"/>
        <circle cx="250" cy="180" r="5" fill="#475569"/>
        <circle cx="250" cy="240" r="5" fill="#475569"/>
        <circle cx="250" cy="300" r="5" fill="#475569"/>
        <circle cx="250" cy="360" r="5" fill="#475569"/>
      </svg>
    `),
  },
  {
    id: "male_blue_shirt",
    name: "👔 Male Light Blue Formal Shirt",
    category: "male",
    prompt: "Male corporate portrait wearing a light sky blue formal collared button-down shirt",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <path d="M 40 400 L 105 170 L 190 80 L 250 120 L 310 80 L 395 170 L 460 400 Z" fill="#e0f2fe" stroke="#93c5fd" stroke-width="4"/>
        <path d="M 190 80 L 235 140 L 250 120 Z" fill="#bae6fd" stroke="#60a5fa" stroke-width="3"/>
        <path d="M 310 80 L 265 140 L 250 120 Z" fill="#bae6fd" stroke="#60a5fa" stroke-width="3"/>
        <path d="M 235 140 L 250 160 L 265 140 Z" fill="#7dd3fc"/>
        <path d="M 245 140 L 255 140 L 255 400 L 245 400 Z" fill="#bae6fd"/>
        <circle cx="250" cy="180" r="5" fill="#1e40af"/>
        <circle cx="250" cy="240" r="5" fill="#1e40af"/>
        <circle cx="250" cy="300" r="5" fill="#1e40af"/>
      </svg>
    `),
  },
  {
    id: "female_black_blazer",
    name: "👩 Female Black Executive Blazer",
    category: "female",
    prompt: "Female professional ID photo wearing a black blazer suit with a high-neck white formal top",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <path d="M 35 400 L 100 175 L 185 90 L 250 135 L 315 90 L 400 175 L 465 400 Z" fill="#18181b"/>
        <path d="M 185 90 L 250 190 L 315 90 Z" fill="#ffffff"/>
        <path d="M 100 175 L 195 230 L 250 190 L 185 90 Z" fill="#27272a"/>
        <path d="M 400 175 L 305 230 L 250 190 L 315 90 Z" fill="#27272a"/>
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
        <path d="M 45 400 L 105 170 L 190 85 L 250 125 L 310 85 L 395 170 L 455 400 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
        <path d="M 190 85 L 235 135 L 250 125 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <path d="M 310 85 L 265 135 L 250 125 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="250" cy="180" r="4" fill="#64748b"/>
        <circle cx="250" cy="240" r="4" fill="#64748b"/>
        <circle cx="250" cy="300" r="4" fill="#64748b"/>
      </svg>
    `),
  },
  {
    id: "graduation_gown",
    name: "🎓 Academic Graduation Gown",
    category: "male",
    prompt: "Academic graduation portrait wearing a black graduation gown with academic collar and hood",
    svgDataUrl: buildSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
        <path d="M 30 400 L 95 165 L 180 80 L 250 130 L 320 80 L 405 165 L 470 400 Z" fill="#09090b"/>
        <path d="M 180 80 L 250 170 L 320 80 Z" fill="#eab308"/>
        <path d="M 195 90 L 250 155 L 305 90 Z" fill="#ffffff"/>
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
        <path d="M 40 400 L 110 180 L 195 90 L 250 140 L 305 90 L 390 180 L 460 400 Z" fill="#020617"/>
        <path d="M 195 90 L 250 200 L 305 90 Z" fill="#ffffff"/>
        <!-- Bow Tie -->
        <polygon points="220,130 250,140 220,150" fill="#0f172a"/>
        <polygon points="280,130 250,140 280,150" fill="#0f172a"/>
        <circle cx="250" cy="140" r="5" fill="#1e293b"/>
        <path d="M 110 180 L 205 240 L 250 200 L 195 90 Z" fill="#0f172a"/>
        <path d="M 390 180 L 295 240 L 250 200 L 305 90 Z" fill="#0f172a"/>
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
  const [offsetY, setOffsetY] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  // Gemini AI Generation state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

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

    // Draw user photo
    ctx.clearRect(0, 0, width, height);
    
    if (aiGeneratedImage && aiImgRef.current) {
      ctx.drawImage(aiImgRef.current, 0, 0, width, height);
      return;
    }

    ctx.drawImage(photoImgRef.current, 0, 0, width, height);

    if (suitImgRef.current) {
      // Calculate suit scale relative to photo canvas width
      const baseSuitW = width * 1.15;
      const baseSuitH = baseSuitW * 0.8;
      const suitW = baseSuitW * (scale / 100);
      const suitH = baseSuitH * (scale / 100);

      const defaultPosY = height * 0.38;
      const posX = (width - suitW) / 2 + (offsetX * width) / 100;
      const posY = defaultPosY + (offsetY * height) / 100;

      ctx.drawImage(suitImgRef.current, posX, posY, suitW, suitH);
    }
  }, [aiGeneratedImage, offsetX, offsetY, scale]);

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
    setAiGeneratedImage(null);
    aiImgRef.current = null;
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
        // Fallback: update canvas with optimal suit preset alignment
        setAiGeneratedImage(null);
        aiImgRef.current = null;
        loadPresetSuit(selectedPreset);
        toast.success(`✨ Ready prompt applied: ${selectedPreset.name}!`);
      }
    } catch (err) {
      console.error("Gemini AI dress up error:", err);
      toast.error("AI processing encountered an issue. Using ready prompt overlay.");
      setAiGeneratedImage(null);
      aiImgRef.current = null;
      loadPresetSuit(selectedPreset);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Pointer drag to position suit on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (aiGeneratedImage) return; // No dragging needed if AI image generated
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
    if (!isDraggingRef.current || !photoImgRef.current || aiGeneratedImage) return;
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
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-yellow-400 animate-pulse" />
            <p className="text-xs font-black text-slate-200 uppercase tracking-wider">
              {aiGeneratedImage ? "✨ Gemini AI Generated Result" : "Live Preview (Drag suit to position)"}
            </p>
          </div>

          <div className="relative border-4 border-white/20 rounded-2xl overflow-hidden shadow-2xl bg-black max-h-[52vh] flex items-center justify-center">
            {isAiGenerating && (
              <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <Loader2 size={36} className="animate-spin text-blue-400" />
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
              className={`max-h-[50vh] w-auto object-contain ${aiGeneratedImage ? "cursor-default" : "cursor-grab active:cursor-grabbing"} touch-none`}
              title={aiGeneratedImage ? "Gemini AI formal photo" : "Click and drag to move suit"}
            />
          </div>

          {aiGeneratedImage ? (
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
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-semibold transition cursor-pointer"
              >
                Reset to Original
              </button>
            </div>
          ) : (
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
                  <span>Ready Prompts (Single Click Auto-Fit):</span>
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
                  <span className="text-[10px] text-slate-500 font-semibold">Gemini AI Ready</span>
                </div>

                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Male black suit jacket with white shirt and dark blue tie..."
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
                  <span>🎚️ Manual Adjustments</span>
                  <button
                    onClick={() => {
                      setScale(100);
                      setOffsetY(0);
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
