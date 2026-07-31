"use client";

import { soundFx } from "@/lib/soundEffects";

/**
 * Web Speech Synthesis Hindi Voice Token Announcement
 */
export function announceTokenInHindi(tokenNumber: number | string, counterNumber: number = 1) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech Synthesis API not supported in this browser");
    return;
  }

  // Play attention chime before speech announcement
  soundFx.playSuccess();

  setTimeout(() => {
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const text = `टोकन नंबर ${tokenNumber}, कृपया काउंटर ${counterNumber} पर आएं।`;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "hi-IN";
    utterance.rate = 0.9; // Slightly slower for clear counter announcement
    utterance.pitch = 1.0;

    // Try to find a Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi") || v.lang.includes("IN")
    );

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, 400);
}
