"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { soundFx } from "@/lib/soundEffects";

export type Language = "en" | "hi";

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Navigation & Header
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  counterDesk: { en: "Counter Desk", hi: "काउंटर डेस्क" },
  services: { en: "Services", hi: "सेवाएं" },
  onlineWork: { en: "Online Work", hi: "ऑनलाइन वर्क" },
  customers: { en: "Customers", hi: "ग्राहक सूची" },
  billing: { en: "Billing / POS", hi: "बिलिंग / POS" },
  photoStudio: { en: "Photo Studio", hi: "फोटो स्टूडियो" },
  pvcCardStudio: { en: "PVC Card Studio", hi: "PVC कार्ड स्टूडियो" },
  pdfTools: { en: "PDF Tools", hi: "PDF टूल्स" },
  aadhaarPan: { en: "Aadhaar & PAN", hi: "आधार एवं पैन" },
  manualIdGen: { en: "Manual ID Generator", hi: "मैनुअल ID जनरेटर" },
  khataBook: { en: "Khata Book", hi: "खाता बुक" },
  reports: { en: "Reports & Analytics", hi: "रिपोर्ट्स एवं एनालिटिक्स" },
  crm: { en: "CRM", hi: "ग्राहक संबंध (CRM)" },
  settings: { en: "Settings", hi: "सेटिंग्स" },
  kioskMode: { en: "Kiosk Mode", hi: "कियोस्क मोड" },
  serviceMaster: { en: "Service Master", hi: "सर्विस मास्टर" },
  resizeSignature: { en: "Resize Signature", hi: "हस्ताक्षर रीसाइज़" },
  multiIdCropper: { en: "Multi ID Cropper", hi: "मल्टी ID क्रॉप" },
  scanner: { en: "Doc Scanner", hi: "दस्तावेज़ स्कैनर" },
  paymentQr: { en: "Payment QR", hi: "पेमेंट QR" },
  marketing: { en: "Marketing & Offers", hi: "मार्केटिंग एवं ऑफर्स" },
  books: { en: "Books & Register", hi: "बुक्स एवं रजिस्टर" },
  manualForms: { en: "Manual Forms", hi: "मैनुअल फॉर्म्स" },

  // Header & Controls
  searchPlaceholder: { en: "Search tools, services, customers (Ctrl+K)...", hi: "टूल्स, सेवाएं, ग्राहक खोजें (Ctrl+K)..." },
  notifications: { en: "Notifications", hi: "सूचनाएं" },
  aiAssistant: { en: "AI Assistant", hi: "AI सहायक" },
  fileExplorer: { en: "Open Files", hi: "फाइल खोलें" },
  darkMode: { en: "Dark Mode", hi: "डार्क मोड" },
  lightMode: { en: "Light Mode", hi: "लाइट मोड" },
  soundOn: { en: "Sound On", hi: "ध्वनि चालू" },
  soundOff: { en: "Sound Muted", hi: "ध्वनि बंद" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  logoutConfirmTitle: { en: "Confirm Logout", hi: "लॉगआउट की पुष्टि करें" },
  logoutConfirmMsg: { en: "Are you sure you want to sign out of RA Seva Point?", hi: "क्या आप RA सेवा प्वाइंट से साइन आउट करना चाहते हैं?" },

  // Actions & Common Terms
  save: { en: "Save", hi: "सुरक्षित करें" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  print: { en: "Print", hi: "प्रिंट करें" },
  export: { en: "Export", hi: "एक्सपोर्ट" },
  delete: { en: "Delete", hi: "हटाएं" },
  edit: { en: "Edit", hi: "संपादित करें" },
  addNew: { en: "Add New", hi: "नया जोड़ें" },
  total: { en: "Total", hi: "कुल" },
  pending: { en: "Pending", hi: "लंबित" },
  completed: { en: "Completed", hi: "पूर्ण" },
  customerName: { en: "Customer Name", hi: "ग्राहक का नाम" },
  mobileNumber: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  amount: { en: "Amount", hi: "राशि (₹)" },
  quickBill: { en: "Quick Bill", hi: "क्विक बिल" },
  quickSearch: { en: "Quick Search", hi: "त्वरित खोज" },
  status: { en: "Status", hi: "स्थिति" },
  date: { en: "Date", hi: "दिनांक" },
  action: { en: "Action", hi: "कार्रवाई" },
  receipt: { en: "Receipt", hi: "रसीद" },

  // Sections & Categories
  mainMenu: { en: "Main Menu", hi: "मुख्य मेनू" },
  documentStudio: { en: "Document & Studio", hi: "दस्तावेज़ एवं स्टूडियो" },
  financeKhata: { en: "Finance & Khata", hi: "वित्त एवं खाता" },
  utilityTools: { en: "Utility Tools", hi: "उपयोगिता टूल्स" },
  systemAdmin: { en: "System & Admin", hi: "सिस्टम एवं एडमिन" },
  digitalSevaTitle: { en: "Digital Seva Point", hi: "डिजिटल सेवा प्वाइंट" },
  onlineCyberPortal: { en: "Cyber Cafe & CSC Portal", hi: "सीएससी एवं साइबर कैफे पोर्टल" },

  // Banner / Welcome
  welcomeText: { en: "Welcome to RA Seva Point", hi: "RA सेवा प्वाइंट में आपका स्वागत है" },
  todaySummary: { en: "Today's Business Overview", hi: "आज का व्यवसाय अवलोकन" }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted settings
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang === "en" || savedLang === "hi") {
      setLanguageState(savedLang);
    }
    const savedSound = localStorage.getItem("app_sound");
    if (savedSound !== null) {
      const isEnabled = savedSound === "true";
      setSoundEnabledState(isEnabled);
      soundFx.setEnabled(isEnabled);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_lang", lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "hi" : "en";
    setLanguage(next);
    soundFx.playClick();
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundFx.setEnabled(enabled);
    localStorage.setItem("app_sound", String(enabled));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      soundFx.playSuccess();
    }
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
