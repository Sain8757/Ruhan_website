"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";

export default function KioskNotifier() {
  const { toast } = useToast();
  const lastCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio (optional if we don't have a file, it will just log warning, but it's fine)
    try {
      // You can add a small ding.mp3 file to the public folder. For now, it will use system beep or nothing.
      audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audioRef.current.volume = 0.5;
    } catch {}

    const checkQueue = async () => {
      try {
        const res = await fetch("/api/kiosk/queue");
        if (!res.ok) return;
        const data = await res.json();
        const currentCount = data.totalPending || 0;

        if (currentCount > lastCountRef.current && lastCountRef.current !== 0) {
          // A new request came in! (ignore the initial load jump from 0 to N)
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
          }
          toast("🔔 New Kiosk Request Received! Check Dashboard.", "success");
        }
        
        lastCountRef.current = currentCount;
      } catch (err) {
        console.error("Kiosk Notifier Error:", err);
      }
    };

    // Initial check
    checkQueue();

    // Poll every 15 seconds
    const interval = setInterval(checkQueue, 15000);
    return () => clearInterval(interval);
  }, [toast]);

  return null;
}
