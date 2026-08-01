/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Loader2, Copy, ExternalLink, MessageCircle, RefreshCw, Printer,
  FileText, Trash2, Check, User, IndianRupee, Tag, Briefcase,
  Upload, X, Download, Clock, Send, AlertTriangle, PlusCircle,
  CreditCard, Activity
} from "lucide-react";
import html2canvas from 'html2canvas-pro';
import TokenReceipt from '@/components/kiosk/TokenReceipt';

// ── Constants ────────────────────────────────────────────────────
const COMMON_DOCS = [
  "Aadhaar Card","PAN Card","Passport Photo","Income Proof",
  "Caste Certificate","Ration Card","Voter ID","Birth Certificate",
  "Residence Proof","Driving Licence","Marriage Certificate","Death Certificate",
];

const PRESET_TAGS = ["urgent","govt-portal","outsourced","follow-up","pending-docs","completed"];

const STATUS_META: Record<string, {bg:string;color:string;border:string;label:string;dot:string}> = {
  PENDING:    {bg:"#fffde7",color:"#7c5e00",border:"#e6c200",label:"Pending",   dot:"#f0b800"},
  SUBMITTED:  {bg:"#e3f0ff",color:"#003a8c",border:"#5b9bd5",label:"Submitted", dot:"#3b7dd8"},
  PROCESSING: {bg:"#e6f7ff",color:"#00596b",border:"#40aac2",label:"Processing",dot:"#00a0be"},
  APPROVED:   {bg:"#f0fff0",color:"#1a5c1a",border:"#52c41a",label:"Approved",  dot:"#2da32d"},
  DELIVERED:  {bg:"#d9f7be",color:"#135200",border:"#73d13d",label:"Delivered", dot:"#389e0d"},
  CANCELLED:  {bg:"#fff1f0",color:"#820014",border:"#ff4d4f",label:"Cancelled", dot:"#cf1322"},
};

const PAYMENT_META: Record<string,{bg:string;color:string;label:string}> = {
  UNPAID:  {bg:"#fff1f0",color:"#820014",label:"UNPAID"},
  PARTIAL: {bg:"#fffbe6",color:"#7c5e00",label:"PARTIAL"},
  PAID:    {bg:"#f0fff0",color:"#135200",label:"PAID"},
};

const WA_TEMPLATES: Record<string, { label: string; text: string }> = {
  PENDING:    { label:"Application Received", text:"नमस्ते {name},\n\nहमें आपके *{service}* के लिए आवेदन प्राप्त हो गया है।\nट्रैकिंग आईडी: *{trackingId}*\n\nहम इस पर काम शुरू करने के बाद आपको सूचित करेंगे।\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  DOCS:       { label:"Documents Needed",     text:"नमस्ते {name},\n\nआपके *{service}* आवेदन के लिए हमें कुछ अतिरिक्त दस्तावेज़ों की आवश्यकता है। कृपया जल्द से जल्द हमारे केंद्र पर संपर्क करें।\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  SUBMITTED:  { label:"Application Submitted",text:"नमस्ते {name},\n\nआपका *{service}* का आवेदन सफलतापूर्वक संबंधित विभाग में *जमा (Submit)* कर दिया गया है।\nट्रैकिंग आईडी: *{trackingId}*\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  PROCESSING: { label:"Processing",           text:"नमस्ते {name},\n\nआपके *{service}* आवेदन पर वर्तमान में *कार्य चल रहा है (Processing)*।\nट्रैकिंग आईडी: *{trackingId}*\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  APPROVED:   { label:"Application Approved", text:"नमस्ते {name},\n\nयह सूचित करते हुए खुशी हो रही है कि आपका *{service}* का आवेदन *स्वीकृत (Approved)* हो गया है।\nट्रैकिंग आईडी: *{trackingId}*\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  DELIVERED:  { label:"Application Ready",    text:"नमस्ते {name},\n\nआपका *{service}* का कार्य *पूरा हो गया है*। कृपया अपना दस्तावेज़ प्राप्त करने के लिए हमारे केंद्र पर पधारें।\nट्रैकिंग आईडी: *{trackingId}*\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  DELAYED:    { label:"Processing Delayed",   text:"नमस्ते {name},\n\nहमें खेद है कि आपके *{service}* के कार्य में कुछ *विलंब* हो रहा है। हम जल्द ही आपको इसकी अद्यतन स्थिति से अवगत कराएंगे।\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
  PAYMENT:    { label:"Payment Reminder",     text:"नमस्ते {name},\n\nआपके *{service}* का कार्य पूर्ण हो गया है। आपका *₹{pending}* का भुगतान अभी बाकी है। कृपया अपना बकाया भुगतान करें।\n\nअपना स्टेटस यहाँ ट्रैक करें: {trackingLink}\n\n— RA Seva Point" },
};

type Tab = "general" | "documents" | "comments" | "activity" | "payment";
type PreviewType = "image" | "pdf" | "docx" | "unsupported";

const getFileNameFromUrl = (url: string, fallback = "document") => {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || fallback);
  } catch {
    return decodeURIComponent(url.split("/").pop() || fallback);
  }
};

const getExtension = (nameOrUrl: string) => {
  const clean = nameOrUrl.split("?")[0].split("#")[0];
  const match = clean.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() || "";
};

const getPreviewType = (url: string, contentType?: string): PreviewType => {
  const type = (contentType || "").toLowerCase();
  const ext = getExtension(getFileNameFromUrl(url, url));
  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "image";
  if (type.includes("pdf") || ext === "pdf") return "pdf";
  if (type.includes("officedocument") || ext === "docx") return "docx";
  return "unsupported";
};

const detectPreviewType = (url: string, blob: Blob, bytes: Uint8Array): PreviewType => {
  const hinted = getPreviewType(url, blob.type);
  if (hinted !== "unsupported") return hinted;
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 8));
  if (header.startsWith("%PDF")) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";
  return "unsupported";
};

const getPreviewFetchUrl = (url: string) => `/api/document-preview?url=${encodeURIComponent(url)}`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string | null;
  onSuccess?: () => void;
}

const SHead = ({ icon, label, color="black" }: { icon: React.ReactNode; label: string; color?: string }) => (
  <div style={{ display:"flex",alignItems:"center",gap:"5px",marginBottom:"6px",paddingBottom:"3px",borderBottom:"1px solid #c0c0c0" }}>
    <span style={{ color }}>{icon}</span>
    <span style={{ fontWeight:"bold",fontSize:"11px",color,letterSpacing:"0.3px" }}>{label}</span>
  </div>
);

export default function ServiceDetailsDialog({ isOpen, onClose, serviceId, onSuccess }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // ── Core state ───────────────────────────────────────────────
  const [service,       setService]       = useState<any>(null);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [vendors,       setVendors]       = useState<any[]>([]);
  const [activeTab,     setActiveTab]     = useState<Tab>("general");
  const [relatedServices, setRelatedServices] = useState<any[]>([]);

  // General fields
  const [status,        setStatus]        = useState("PENDING");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paymentMode,   setPaymentMode]   = useState("PENDING");
  const [fees,          setFees]          = useState(0);
  const [amountPaid,    setAmountPaid]    = useState(0);
  const [notes,         setNotes]         = useState("");
  const [requiredDocs,  setRequiredDocs]  = useState<string[]>([]);
  const [masterDocs,    setMasterDocs]    = useState<string[]>([]);
  const [customDoc,     setCustomDoc]     = useState("");
  const [deadline,      setDeadline]      = useState("");
  const [referenceNo,   setReferenceNo]   = useState("");
  const [vendorId,      setVendorId]      = useState("");
  const [vendorCost,    setVendorCost]    = useState(0);
  const [missingDocs,   setMissingDocs]   = useState("");
  const [tasks,         setTasks]         = useState<{text:string;done:boolean}[]>([]);
  const [newTask,       setNewTask]       = useState("");
  const [tags,          setTags]          = useState<string[]>([]);
  const [customTag,     setCustomTag]     = useState("");
  const [callbackAt,    setCallbackAt]    = useState("");
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(false); // Feature 9

  // Time Tracker (Feature 6)
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  // Voice Typing State (Feature 3)
  const [isListening, setIsListening] = useState(false);

  // Documents tab
  const [docUrls,       setDocUrls]       = useState<string[]>([]);
  const [uploading,     setUploading]     = useState(false);

  // Comments tab
  const [comments,      setComments]      = useState<any[]>([]);
  const [commentText,   setCommentText]   = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Activity tab
  const [activityLogs,  setActivityLogs]  = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Payment tab
  const [payAmount,     setPayAmount]     = useState("");
  const [payMode,       setPayMode]       = useState("CASH");
  const [collecting,    setCollecting]    = useState(false);

  // WhatsApp template popup
  const [showWATemplates, setShowWATemplates] = useState(false);

  // Document Viewer Modal
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewType, setPreviewType] = useState<PreviewType>("unsupported");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // ── Load service ─────────────────────────────────────────────
  const loadService = useCallback(() => {
    if (!isOpen || !serviceId) return;
    setLoading(true);
    setActiveTab("general");
    fetch(`/api/services/${serviceId}`)
      .then(r => { if (!r.ok) throw new Error("Service not found"); return r.json(); })
      .then(data => {
        setService(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setPaymentMode(data.paymentMode);
        setFees(data.fees || 0);
        setAmountPaid(data.amountPaid || 0);
        setNotes(data.notes || "");
        setRequiredDocs(data.requiredDocs || []);
        setDeadline(data.deadline ? new Date(data.deadline).toISOString().split("T")[0] : "");
        setReferenceNo(data.referenceNo || "");
        setVendorId(data.vendorId || "");
        setVendorCost(data.vendorCost || 0);
        setMissingDocs(data.missingDocs || "");
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setTags(data.tags || []);
        setCallbackAt(data.callbackAt ? new Date(data.callbackAt).toISOString().slice(0,16) : "");
        setDocUrls(data.serviceDocUrls || []);
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setPayAmount(String(data.fees || ""));
        setLoading(false);
        // Load related services
        fetch(`/api/services?customerId=${data.customerId}&limit=10`)
          .then(r => r.json())
          .then(d => setRelatedServices((d.services || []).filter((s: any) => s.id !== data.id)))
          .catch(() => {});
          
        // Fetch Service Master Data
        fetch(`/api/inventory?q=${encodeURIComponent(data.serviceType)}&type=service`)
          .then(r => r.json())
          .then(inv => {
            const master = inv.find((item: any) => item.name === data.serviceType);
            if (master) {
              setMasterDocs(master.requiredDocs || []);
              if (!data.fees || data.fees === 0) {
                setFees(master.sellingPrice || 0);
                setPayAmount(String(master.sellingPrice || 0));
              }
            } else {
              setMasterDocs([]);
            }
          })
          .catch(() => setMasterDocs([]));
      })
      .catch(err => { toast.error(err.message); onClose(); });
  }, [isOpen, serviceId]);

  useEffect(() => { loadService(); }, [loadService]);
  useEffect(() => {
    return () => {
      if (previewImg?.startsWith("blob:")) URL.revokeObjectURL(previewImg);
    };
  }, [previewImg]);
  useEffect(() => {
    fetch("/api/vendors").then(r => r.json()).then(d => setVendors(d.vendors || [])).catch(() => {});
  }, []);

  const loadActivity = useCallback(() => {
    if (!serviceId) return;
    setLoadingActivity(true);
    fetch(`/api/services/${serviceId}/activity`)
      .then(r => r.json())
      .then(d => setActivityLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, [serviceId]);

  useEffect(() => {
    if (activeTab === "activity") loadActivity();
  }, [activeTab, loadActivity]);

  // Feature 6: Time Tracker Hook
  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // ── Handlers ─────────────────────────────────────────────────
  const saveChanges = async () => {
    if (!service) return;
    setSaving(true);
    try {
      // Append time tracker note if active
      const finalNotes = (timerActive && seconds > 0) ? `${notes}\n[System]: Tracked time: ${Math.floor(seconds/60)}m ${seconds%60}s` : notes;
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, paymentMode, fees, notes: finalNotes, requiredDocs, deadline: deadline || null, referenceNo, vendorId: vendorId || null, vendorCost, missingDocs, tasks, tags, callbackAt: callbackAt || null }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service updated!");
      if (onSuccess) onSuccess();
      if (status !== "PENDING" && service.status !== status) {
        const tpl = WA_TEMPLATES[status as keyof typeof WA_TEMPLATES];
        if (tpl && window.confirm(`Status is now ${status}. Notify customer via WhatsApp?`)) {
          sendWA(tpl);
        }
      }
      onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // Feature 7: Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveChanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }); // run on every render to capture latest state closure

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveChanges();
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = image;
      link.download = `receipt-${service?.trackingId}.jpg`;
      link.click();
    } catch (error) {
      console.error("Failed to generate receipt", error);
      toast.error("Failed to download receipt.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Service deleted.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  const sendWA = (tpl: { text: string }, extraData?: Record<string, string>) => {
    if (!service?.customer?.mobile) { toast.error("No mobile number"); return; }
    const trackingLink = `${window.location.origin}/track/${service.trackingId}`;
    let text = tpl.text
      .replace(/{name}/g, service.customer.name)
      .replace(/{service}/g, service.serviceType)
      .replace(/{trackingId}/g, service.trackingId || "N/A")
      .replace(/{trackingLink}/g, trackingLink);
      
    if (extraData) {
      Object.keys(extraData).forEach(k => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), extraData[k]);
      });
    }
    
    window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${encodeURIComponent(text)}`, "_blank");
    setShowWATemplates(false);
  };

  const sendMissingDocsWA = () => {
    if (!service?.customer?.mobile) { toast.error("No mobile number"); return; }
    if (!missingDocs.trim()) { toast.error("Please type the missing document name first"); return; }
    const link = `${window.location.origin}/status`;
    const text = `Hello ${service.customer.name},\nAapke ${service.serviceType} application me '${missingDocs}' missing hai.\nKripya is link par jayen aur ghar baithe upload karein:\n\n🔗 ${link}\n\nMobile No: ${service.customer.mobile}\nTracking ID: ${service.trackingId}\n\nThank you,\nRA Seva Point`;
    window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendReuploadWA = async (url: string) => {
    if (!service?.customer?.mobile) { toast.error("No mobile number"); return; }
    const docName = decodeURIComponent(url.split("/").pop() || "Document");
    const link = `${window.location.origin}/status`;
    const text = `Hello ${service.customer.name},\nAapka upload kiya gaya document '${docName}' clear nahi hai ya galat hai.\nKripya is link par jaa kar wapas theek document upload karein:\n\n🔗 ${link}\n\nMobile No: ${service.customer.mobile}\nTracking ID: ${service.trackingId}\n\nThank you,\nRA Seva Point`;
    
    try {
      const newMissingDocs = missingDocs ? `${missingDocs}, ${docName}` : docName;
      await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missingDocs: newMissingDocs })
      });
      setMissingDocs(newMissingDocs);
      toast.success(`Requested re-upload for ${docName}`);
    } catch (e) {
      console.error(e);
    }

    window.open(`https://wa.me/91${service.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDownload = async (url: string) => {
    try {
      toast.info("Downloading...");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch image");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      let filename = getFileNameFromUrl(url);
      if (!getExtension(filename)) {
        const extFromType = blob.type.includes("pdf")
          ? "pdf"
          : blob.type.startsWith("image/")
            ? blob.type.split("/")[1]?.replace("jpeg", "jpg")
            : "";
        if (extFromType) filename += `.${extFromType}`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      toast.error("Direct download failed. Opening in new tab.");
      window.open(url, '_blank');
    }
  };

  const renderPdfPreview = async (buffer: ArrayBuffer) => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.6, 920 / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: context, viewport }).promise;
      pages.push(canvas.toDataURL("image/png"));
    }

    return pages;
  };

  const renderDocxPreview = async (buffer: ArrayBuffer) => {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    return result.value;
  };

  const openPreview = async (url: string) => {
    setOriginalUrl(url);
    setPreviewImg(null);
    setPreviewPages([]);
    setPreviewHtml("");
    setPreviewType(getPreviewType(url));
    setPreviewLoading(true);

    try {
      const res = await fetch(getPreviewFetchUrl(url));
      if (!res.ok) throw new Error("Failed to load");
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const type = detectPreviewType(url, blob, new Uint8Array(buffer));
      setPreviewType(type);
      if (type === "image") {
        setPreviewImg(URL.createObjectURL(blob));
        return;
      }
      if (type === "pdf") {
        const pages = await renderPdfPreview(buffer);
        setPreviewPages(pages);
        if (pages.length === 0) throw new Error("No PDF pages rendered");
        return;
      }
      if (type === "docx") {
        const html = await renderDocxPreview(buffer);
        setPreviewHtml(html || "<p>No preview content found.</p>");
        return;
      }
      setPreviewImg(url);
      toast.error("Preview is not available for this file type. Please use Download or Open in New Tab.");
    } catch (e) {
      console.error(e);
      setPreviewType("unsupported");
      setPreviewImg(url);
      toast.error("Preview failed. Please use Download or Open in New Tab.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSync = async () => {
    if (!serviceId) return;
    toast.info("Connecting to Govt API...");
    try {
      const res = await fetch(`/api/services/${serviceId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setStatus(data.status); toast.success(data.message);
      if (onSuccess) onSuccess();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !serviceId) return;
    
    // Prompt for rename
    const ext = file.name.split('.').pop() || '';
    const defaultName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
    let customName = window.prompt("Enter file name (without extension):", defaultName);
    if (customName === null) return;
    if (customName.trim() === "") customName = defaultName;
    const finalFileName = `${customName.trim()}.${ext}`;
    const renamedFile = new File([file], finalFileName, { type: file.type });

    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", renamedFile);
      const res = await fetch(`/api/services/${serviceId}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDocUrls(prev => [...prev, data.url]);
      toast.success(`${finalFileName} uploaded!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDeleteDoc = async (url: string) => {
    if (!serviceId || !window.confirm("Delete this document?")) return;
    try {
      const res = await fetch(`/api/services/${serviceId}/upload`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (!res.ok) throw new Error("Delete failed");
      setDocUrls(prev => prev.filter(u => u !== url));
      toast.success("Document removed");
    } catch (err: any) { toast.error(err.message); }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !serviceId) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: commentText }) });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to add comment");
      setComments(data.comments as any[] || []);
      setCommentText("");
    } catch (err: any) { toast.error(err.message); }
    finally { setSendingComment(false); }
  };

  const deleteComment = async (commentId: string) => {
    if (!serviceId) return;
    try {
      const res = await fetch(`/api/services/${serviceId}/comments`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId }) });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed");
      setComments(data.comments as any[] || []);
    } catch (err: any) { toast.error(err.message); }
  };

  const collectPayment = async () => {
    if (!payAmount || !serviceId) return;
    setCollecting(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseFloat(payAmount), paymentMode: payMode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      setPaymentStatus(data.paymentStatus);
      setAmountPaid(data.service.amountPaid);
      toast.success(`₹${payAmount} collected via ${payMode}! Status: ${data.paymentStatus}`);
      if (onSuccess) onSuccess();
    } catch (err: any) { toast.error(err.message); }
    finally { setCollecting(false); }
  };

  const isDocUploaded = (doc: string) => docUrls.some(url => decodeURIComponent(url).toLowerCase().includes(doc.toLowerCase()));
  const toggleDoc = (doc: string) => {
    if (isDocUploaded(doc)) { toast.info("Document is uploaded, can't be unchecked manually."); return; }
    setRequiredDocs(p => {
      if (p.includes(`[X] ${doc}`)) {
        // Feature 1: Auto-fill missing docs on uncheck
        setMissingDocs(md => md.includes(doc) ? md : (md ? `${md}, ${doc}` : doc));
        return p.filter(d => d !== `[X] ${doc}`).concat(doc);
      }
      if (p.includes(doc)) {
        // Remove from missing docs on check
        setMissingDocs(md => md.replace(new RegExp(`(?:, )?${doc}`, "gi"), "").replace(/^,\s*/, "").trim());
        return p.filter(d => d !== doc).concat(`[X] ${doc}`);
      }
      return [...p, `[X] ${doc}`];
    });
  };
  const addCustomDoc = () => { 
    const d = customDoc.trim(); 
    if (d && !requiredDocs.includes(d) && !requiredDocs.includes(`[X] ${d}`)) { 
      setRequiredDocs(p => [...p, d]); 
      setCustomDoc(""); 
    } 
  };
  const addTask    = () => { const t = newTask.trim(); if (t) { setTasks(p => [...p, {text:t,done:false}]); setNewTask(""); } };
  const toggleTask = (i: number) => setTasks(p => p.map((t,idx) => idx===i ? {...t,done:!t.done} : t));
  const toggleTag  = (tag: string) => setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  const addCustomTag = () => { const t = customTag.trim().toLowerCase().replace(/\s+/g,"-"); if (t && !tags.includes(t)) { setTags(p => [...p, t]); setCustomTag(""); } };

  const profitMargin = fees - vendorCost;
  const sMeta = STATUS_META[status] || STATUS_META.PENDING;
  const pMeta = PAYMENT_META[paymentStatus] || PAYMENT_META.UNPAID;

  // Feature 3: Voice Typing
  const handleListen = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // or hi-IN for Hindi
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setter((prev: string) => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => { toast.error("Speech recognition failed."); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ── Style helpers ─────────────────────────────────────────────
  const F: React.CSSProperties = { fontFamily: "Tahoma, MS Sans Serif, sans-serif", fontSize: "12px" };
  const raised: React.CSSProperties = { borderTop:"2px solid #fff",borderLeft:"2px solid #fff",borderRight:"2px solid #404040",borderBottom:"2px solid #404040" };
  const inset:  React.CSSProperties = { borderTop:"2px solid #848484",borderLeft:"2px solid #848484",borderRight:"2px solid #efefef",borderBottom:"2px solid #efefef" };
  const groove: React.CSSProperties = { border:"2px groove #a0a0a0" };
  const Btn = (extra?: React.CSSProperties): React.CSSProperties => ({ ...F,...raised,background:"#d4d0c8",padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"4px",...extra });
  const Inp = (extra?: React.CSSProperties): React.CSSProperties => ({ ...F,...inset,background:"white",padding:"3px 5px",outline:"none",width:"100%",...extra });
  const Sel = (extra?: React.CSSProperties): React.CSSProperties => ({ ...F,...inset,background:"white",padding:"3px 4px",outline:"none",width:"100%",...extra });


  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key:"general",   label:"General",   icon:"⚙" },
    { key:"documents", label:"Documents", icon:"📎" },
    { key:"comments",  label:`Comments${comments.length > 0 ? ` (${comments.length})` : ""}`, icon:"💬" },
    { key:"activity",  label:"Activity",  icon:"📜" },
    { key:"payment",   label:"Payment",   icon:"💳" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div style={{ position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.45)" }} onClick={onClose} />

      {/* ── Dialog ── */}
      <div style={{ position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none" }}>
        <div style={{ ...F,background:"#d4d0c8",...raised,width:"780px",maxWidth:"99vw",maxHeight:"97vh",display:"flex",flexDirection:"column",boxShadow:"6px 6px 28px rgba(0,0,0,0.7)",pointerEvents:"all" }}>

          {/* ── TITLE BAR ── */}
          <div style={{ background:"linear-gradient(90deg,#000080,#1084d0)",color:"#fff",padding:"4px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:"7px",fontWeight:"bold",fontSize:"13px" }}>
              <Briefcase size={14} />
              {service ? `${service.serviceType} — Status` : "Service Properties"}
            </div>
            <button onClick={onClose} style={{ ...raised,background:"#d4d0c8",color:"#000",width:"20px",height:"17px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"12px",cursor:"pointer" }}>✕</button>
          </div>

          {/* ── MENU BAR ── */}
          <div style={{ background:"#d4d0c8",borderBottom:"1px solid #999",padding:"1px 6px",display:"flex",gap:"16px",fontSize:"12px",flexShrink:0,userSelect:"none" }}>
            {["File","Edit","View","Help"].map(m => <span key={m} style={{ padding:"1px 4px",cursor:"default" }}>{m}</span>)}
          </div>

          {loading ? (
            <div style={{ padding:"60px",textAlign:"center",flex:1 }}>
              <Loader2 size={28} className="animate-spin" style={{ margin:"0 auto 10px" }} /><div>Loading...</div>
            </div>
          ) : service ? (
            <form onSubmit={handleSave} style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>

              {/* ── INFO BAR ── */}
              <div style={{ padding:"5px 8px",borderBottom:"1px solid #999",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#c8c4bc" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap" }}>
                  <span style={{ ...raised,padding:"2px 8px",background:"#d4d0c8",fontWeight:"bold",fontSize:"11px" }}>REF: #{service.trackingId || "N/A"}</span>
                  <span style={{ ...raised,padding:"2px 8px",background:"#d4d0c8",fontSize:"11px" }}>{formatDate(service.createdAt)}</span>
                  <span style={{ padding:"2px 10px",background:sMeta.bg,color:sMeta.color,fontWeight:"bold",fontSize:"11px",border:`1px solid ${sMeta.border}`,display:"flex",alignItems:"center",gap:"5px" }}>
                    <span style={{ width:"7px",height:"7px",borderRadius:"50%",background:sMeta.dot,display:"inline-block" }} />{sMeta.label}
                  </span>
                  <span style={{ padding:"2px 10px",background:pMeta.bg,color:pMeta.color,fontWeight:"bold",fontSize:"11px",border:`1px solid ${pMeta.color}` }}>■ {pMeta.label}</span>
                  {/* Tags inline */}
                  {tags.slice(0,3).map(tag => (
                    <span key={tag} style={{ padding:"1px 7px",background:"#e8e8ff",border:"1px solid #9999cc",fontSize:"10px",color:"#333" }}>#{tag}</span>
                  ))}
                </div>
                <div style={{ display:"flex",gap:"5px",flexShrink:0 }}>
                  <button type="button" onClick={handleDownloadReceipt} style={Btn({background:"#0a246a",color:"white"})}><Download size={12}/> Download Receipt</button>
                  <button type="button" onClick={() => window.print()} style={Btn()}><Printer size={12}/> Print Slip</button>
                  <button type="button" onClick={() => window.open(`/billing?customerId=${service.customer.id}`,"_blank")} style={Btn({background:"#0a246a",color:"white"})}>
                    <FileText size={12}/> 1-Click Invoice
                  </button>
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ flex:1,overflow:"hidden",display:"flex" }}>

                {/* ── LEFT PANEL ── */}
                <div style={{ width:"195px",flexShrink:0,borderRight:"2px solid #808080",padding:"7px",overflowY:"auto",background:"#ccc8c0",display:"flex",flexDirection:"column",gap:"7px" }}>

                  {/* Customer */}
                  <div style={{ ...groove,padding:"7px",background:"#d4d0c8" }}>
                    <SHead icon={<User size={11}/>} label="Customer Details" color="#000080" />
                    <div style={{ fontWeight:"bold",fontSize:"12px",color:"#000080",marginBottom:"2px",wordBreak:"break-word" }}>{service.customer.name}</div>
                    
                    {/* Feature 11: Rating Display */}
                    {service.rating && service.rating > 0 && (
                      <div style={{ fontSize:"10px", color:"#fbbf24", marginBottom:"2px", letterSpacing:"1px" }}>
                        {"★".repeat(service.rating)}{"☆".repeat(5-service.rating)}
                      </div>
                    )}
                    
                    {/* Feature 4: VIP / Warning Badges */}
                    {service.customer.loyaltyPoints > 50 && (
                      <div style={{ fontSize:"9px", background:"#fef3c7", color:"#92400e", padding:"2px 4px", border:"1px solid #fde68a", marginBottom:"2px", display:"inline-block" }}>
                        🌟 Loyal Cust ({service.customer.loyaltyPoints} pts)
                      </div>
                    )}
                    {service.paymentStatus === 'UNPAID' && (
                      <div style={{ fontSize:"9px", background:"#ffebeb", color:"#cc0000", padding:"2px 4px", border:"1px solid #ffcccc", marginBottom:"2px", display:"inline-block" }}>
                        ⚠️ Has Dues
                      </div>
                    )}

                    <div style={{ fontSize:"11px",color:"#444",marginBottom:"2px",marginTop:"2px" }}>📱 {service.customer.mobile}</div>
                    {service.customer.email && <div style={{ fontSize:"10px",color:"#666",wordBreak:"break-all",marginBottom:"3px" }}>{service.customer.email}</div>}

                    {/* WA Template Button */}
                    <div style={{ position:"relative" }}>
                      <button type="button" onClick={() => setShowWATemplates(!showWATemplates)}
                        style={Btn({background:"#075e54",color:"white",width:"100%",justifyContent:"center",fontSize:"11px",marginTop:"4px"})}>
                        <MessageCircle size={11}/> WhatsApp ▾
                      </button>
                      {showWATemplates && (
                        <div style={{ position:"absolute",top:"100%",left:0,zIndex:100,background:"#d4d0c8",...raised,width:"220px",padding:"4px" }}>
                          <div style={{ fontSize:"11px",fontWeight:"bold",padding:"2px 4px",borderBottom:"1px solid #aaa",marginBottom:"3px" }}>Select Template:</div>
                          <div style={{ padding:"4px",borderTop:"1px solid #eee",background:"#f9f9f9",maxHeight:"200px",overflowY:"auto" }}>
                            {Object.values(WA_TEMPLATES).map((tpl,i) => (
                              <div key={i} title={tpl.text} onClick={() => sendWA(tpl, { pending: (fees - amountPaid).toString() })} style={{ padding:"4px 6px",fontSize:"11px",cursor:"pointer",borderBottom:"1px solid #e0e0e0" }}
                                onMouseEnter={e => e.currentTarget.style.background="#e0f2fe"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                                {/* Feature 13: Tooltip Preview using title prop */}
                                <strong>{tpl.label}</strong>
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={() => setShowWATemplates(false)} style={Btn({width:"100%",justifyContent:"center",marginTop:"4px",fontSize:"11px"})}>Cancel</button>
                        </div>
                      )}
                    </div>

                    {/* Feature 9: Scheduled WhatsApp */}
                    <div style={{ marginTop:"4px", fontSize:"10px", display:"flex", alignItems:"center", gap:"4px" }}>
                      <input type="checkbox" id="wa-schedule" />
                      <label htmlFor="wa-schedule" style={{ cursor:"pointer", color:"#555" }}>Auto-send scheduled WhatsApp</label>
                    </div>

                    {/* Customer Profile Link */}
                    <button type="button" onClick={() => window.open(`/customers/${service.customerId}`,"_blank")}
                      style={Btn({marginTop:"4px",width:"100%",justifyContent:"center",fontSize:"10px"})}>
                      <ExternalLink size={10}/> View Customer Profile
                    </button>
                  </div>

                  {/* Feature 5: Profit Margin Alert */}
                  <div style={{ ...groove,padding:"7px",background: profitMargin < 0 ? "#ffebeb" : "#d4d0c8", border: profitMargin < 0 ? "2px groove #cc0000" : groove.border }}>
                    <SHead icon={<IndianRupee size={11}/>} label="Profit Margin" color={profitMargin < 0 ? "#cc0000" : "#006600"} />
                    {profitMargin < 0 && (
                      <div style={{ fontSize:"9px", background:"#cc0000", color:"white", padding:"2px 4px", fontWeight:"bold", textAlign:"center", marginBottom:"4px" }}>
                        ⚠️ ALERT: RUNNING AT A LOSS
                      </div>
                    )}
                    <table style={{ width:"100%",fontSize:"11px",borderCollapse:"collapse" }}>
                      <tbody>
                        {[["Customer Fees:", `₹${fees}`, "inherit"],["Vendor Cost:", `-₹${vendorCost}`, "#cc0000"]].map(([k,v,c]) => (
                          <tr key={k}><td style={{ padding:"1px 0",color:"#555" }}>{k}</td><td style={{ textAlign:"right",fontWeight:"bold",color:c }}>{v}</td></tr>
                        ))}
                        <tr><td colSpan={2}><div style={{ borderTop:"1px solid #aaa",margin:"3px 0" }}/></td></tr>
                        <tr>
                          <td style={{ fontWeight:"bold" }}>Est. Profit:</td>
                          <td style={{ textAlign:"right",fontWeight:"bold",fontSize:"13px",color:profitMargin>=0?"#006600":"#cc0000" }}>₹{profitMargin}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tracking */}
                  <div style={{ ...groove,padding:"7px",background:"#d4d0c8" }}>
                    <SHead icon={<Tag size={11}/>} label="Tracking" />
                    <div style={{ fontSize:"11px",marginBottom:"4px" }}>ID: <strong style={{ letterSpacing:"1px" }}>{service.trackingId || "N/A"}</strong></div>
                    {service.tokenNumber && <div style={{ fontSize:"11px",marginBottom:"4px" }}>Token: <strong style={{ color:"#000080" }}>T{String(service.tokenNumber).padStart(3,"0")}</strong></div>}
                    <div style={{ display:"flex",gap:"4px" }}>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(service.trackingId||""); toast.success("Copied!"); }} style={Btn({flex:1,justifyContent:"center",fontSize:"10px"})}><Copy size={9}/> Copy</button>
                      <button type="button" onClick={() => window.open(`/status?query=${service.trackingId}`,"_blank")} style={Btn({flex:1,justifyContent:"center",fontSize:"10px"})}><ExternalLink size={9}/> View</button>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div style={{ ...groove,padding:"7px",background:"#d4d0c8" }}>
                    <SHead icon={<Briefcase size={11}/>} label="Service Info" />
                    <table style={{ width:"100%",fontSize:"11px",borderCollapse:"collapse" }}>
                      <tbody>
                        {[
                          ["Fee:", formatCurrency(service.fees)],
                          ["Mode:", service.paymentMode],
                          ["Assignee:", service.assignedTo?.name||"Admin"],
                          ...(service.vendorId ? [["Vendor:", vendors.find(v => v.id === service.vendorId)?.name || "Assigned 🏢"]] : []),
                          ...(service.rating ? [["Rating:", `${service.rating} ⭐`]] : [])
                        ].map(([k,v]) => (
                          <tr key={k}><td style={{ color:"#555",padding:"1px 0" }}>{k}</td><td style={{ textAlign:"right",fontWeight:"bold" }}>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    {service.feedback && (
                      <div style={{ marginTop:"4px", fontSize:"10px", color:"#333", background:"#fff", padding:"4px", border:"1px inset #ccc", fontStyle:"italic" }}>
                        "{service.feedback}"
                      </div>
                    )}
                  </div>

                  {/* Related Services */}
                  {relatedServices.length > 0 && (
                    <div style={{ ...groove,padding:"7px",background:"#d4d0c8" }}>
                      <SHead icon={<Activity size={11}/>} label={`Other Services (${relatedServices.length})`} color="#555" />
                      {relatedServices.slice(0,4).map((s: any) => (
                        <div key={s.id} style={{ fontSize:"10px",padding:"2px 0",borderBottom:"1px dotted #ccc",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{s.serviceType}</span>
                          <span style={{ marginLeft:"4px",padding:"0 4px",background:STATUS_META[s.status]?.bg||"#eee",color:STATUS_META[s.status]?.color||"#333",fontSize:"9px",flexShrink:0 }}>{s.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

                  {/* ── TAB BAR ── */}
                  <div style={{ display:"flex",borderBottom:"2px solid #808080",background:"#d4d0c8",flexShrink:0 }}>
                    {TABS.map(tab => (
                      <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                        style={{ ...F,padding:"5px 14px",cursor:"pointer",border:"none",borderRight:"1px solid #aaa",background:activeTab===tab.key?"#d4d0c8":"#b8b4ac",
                          borderTop:activeTab===tab.key?"2px solid #d4d0c8":"none",
                          borderBottom:activeTab===tab.key?"2px solid #d4d0c8":"2px solid #808080",
                          fontWeight:activeTab===tab.key?"bold":"normal",marginBottom:activeTab===tab.key?"-2px":"0",
                          position:"relative",zIndex:activeTab===tab.key?1:0,
                        }}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ── TAB CONTENT ── */}
                  <div style={{ flex:1,overflowY:"auto",padding:"10px" }}>

                    {/* ═══ GENERAL TAB ═══ */}
                    {activeTab === "general" && (
                      <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>

                        {/* Service Config */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8" }}>
                          <SHead icon="⚙" label="Service Configuration" color="#000080" />
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px" }}>
                            <div>
                              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px" }}>
                                <label style={{ fontSize:"11px" }}>Workflow Status:</label>
                                <button type="button" onClick={handleSync} style={Btn({fontSize:"10px",padding:"1px 5px"})}><RefreshCw size={9}/> Sync API</button>
                              </div>
                              <select style={Sel()} value={status} onChange={e => setStatus(e.target.value)}>
                                {Object.entries(STATUS_META).map(([v,m]) => <option key={v} value={v}>{m.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:"11px",display:"block",marginBottom:"3px" }}>Payment Status:</label>
                              <select style={Sel()} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                                <option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:"11px",display:"block",marginBottom:"3px" }}>Payment Mode:</label>
                              <select style={Sel()} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                                <option value="PENDING">Pending</option><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:"11px",display:"block",marginBottom:"3px" }}>Fees Amount (₹):</label>
                              <input type="number" style={Inp()} value={fees} min={0} onChange={e => setFees(parseFloat(e.target.value)||0)} />
                            </div>
                          </div>
                        </div>

                        {/* Required Docs */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8" }}>
                          <SHead icon="📁" label="Required Documents Checklist" />
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 10px",marginBottom:"7px" }}>
                            {Array.from(new Set([...requiredDocs.map(d => d.replace("[X] ", "")), ...masterDocs])).map(doc => {
                              const uploaded = isDocUploaded(doc);
                              const manualChecked = requiredDocs.includes(`[X] ${doc}`);
                              const isChecked = uploaded || manualChecked;
                              return (
                                <label key={doc} style={{ display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",cursor:"pointer",padding:"2px 0",color: isChecked ? "#006600" : "inherit" }}>
                                  <input type="checkbox" checked={isChecked} onChange={() => toggleDoc(doc)} /> 
                                  <span style={{ textDecoration: isChecked ? "line-through" : "none" }}>{doc}</span>
                                  {uploaded && <span title="Uploaded">✅</span>}
                                </label>
                              );
                            })}
                          </div>
                          <div style={{ display:"flex",gap:"4px" }}>
                            <input type="text" style={Inp({flex:1})} value={customDoc} onChange={e => setCustomDoc(e.target.value)} placeholder="Add custom document..."
                              onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); addCustomDoc(); }}} />
                            <button type="button" style={Btn()} onClick={addCustomDoc}>+ Add</button>
                          </div>
                        </div>

                        {/* Deadline + ARN + Callback */}
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px" }}>
                          <div>
                            <label style={{ fontSize:"11px",display:"block",marginBottom:"3px" }}>Expected Deadline:</label>
                            <input type="date" style={Inp()} value={deadline} onChange={e => setDeadline(e.target.value)} />
                          </div>
                          <div>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px" }}>
                              <label style={{ fontSize:"11px" }}>Govt. Ref / ARN:</label>
                              {/* Feature 2: Govt Status Check */}
                              {referenceNo && (
                                <button type="button" onClick={() => window.open(`https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`, "_blank")} style={Btn({fontSize:"9px",padding:"1px 4px",background:"#1084d0",color:"white"})}>
                                  <ExternalLink size={9}/> Check
                                </button>
                              )}
                            </div>
                            <input type="text" style={Inp()} value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="e.g. 15-digit ARN" />
                          </div>
                          <div>
                            <label style={{ fontSize:"11px",marginBottom:"3px",display:"flex",alignItems:"center",gap:"4px" }}>
                              <Clock size={11} style={{ color:"#0055aa" }}/> Callback Reminder:
                            </label>
                            <input type="datetime-local" style={Inp()} value={callbackAt} onChange={e => setCallbackAt(e.target.value)} />
                          </div>
                        </div>

                        {/* Vendor */}
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px" }}>
                          <div>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px" }}>
                              <label style={{ fontSize:"11px" }}>Outsource to Vendor:</label>
                              {/* Feature 8: 1-Click Vendor Follow-up */}
                              {vendorId && (
                                <button type="button" onClick={() => {
                                  const v = vendors.find(x => x.id === vendorId);
                                  if (v && v.phone) {
                                    const t = encodeURIComponent(`Hi ${v.name},\nUpdate status for ${service?.serviceType} (Ref: ${referenceNo || service?.trackingId}).`);
                                    window.open(`https://wa.me/91${v.phone.replace(/\D/g,"").slice(-10)}?text=${t}`, "_blank");
                                  } else { toast.error("Vendor phone not found"); }
                                }} style={Btn({fontSize:"9px",padding:"1px 4px",background:"#25D366",color:"white"})}>
                                  <MessageCircle size={9}/> Follow-up
                                </button>
                              )}
                            </div>
                            <select style={Sel()} value={vendorId} onChange={e => setVendorId(e.target.value)}>
                              <option value="">-- No Vendor (Self) --</option>
                              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize:"11px",display:"block",marginBottom:"3px",color:vendorCost>0?"#cc0000":undefined }}>Vendor Cost (₹):</label>
                            <input type="number" style={Inp()} value={vendorCost} min={0} onChange={e => setVendorCost(parseFloat(e.target.value)||0)} />
                          </div>
                        </div>

                        {/* Tags */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8" }}>
                          <SHead icon={<Tag size={11}/>} label="Service Labels / Tags" color="#555" />
                          <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"6px" }}>
                            {PRESET_TAGS.map(tag => (
                              <label key={tag} style={{ display:"flex",alignItems:"center",gap:"4px",fontSize:"11px",cursor:"pointer",
                                padding:"2px 8px",border:`1px solid ${tags.includes(tag)?"#000080":"#aaa"}`,
                                background:tags.includes(tag)?"#000080":"#d4d0c8",color:tags.includes(tag)?"white":"#333" }}>
                                <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} style={{ display:"none" }} />
                                #{tag}
                              </label>
                            ))}
                          </div>
                          <div style={{ display:"flex",gap:"4px" }}>
                            <input type="text" style={Inp({flex:1})} value={customTag} onChange={e => setCustomTag(e.target.value)} placeholder="Custom tag..."
                              onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); addCustomTag(); }}} />
                            <button type="button" style={Btn()} onClick={addCustomTag}>+ Tag</button>
                          </div>
                        </div>

                        {/* Tasks */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8" }}>
                          <SHead icon="☑" label="Service Tasks" />
                          <div style={{ minHeight:"40px",marginBottom:"6px" }}>
                            {tasks.length===0
                              ? <div style={{ color:"#999",fontSize:"11px",fontStyle:"italic" }}>No tasks yet.</div>
                              : tasks.map((t,i) => (
                                  <div key={i} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"2px 0",borderBottom:"1px dotted #ccc" }}>
                                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(i)} />
                                    <span style={{ flex:1,fontSize:"12px",textDecoration:t.done?"line-through":"none",color:t.done?"#999":"#000" }}>{t.text}</span>
                                    <button type="button" onClick={() => setTasks(p=>p.filter((_,idx)=>idx!==i))} style={{ background:"none",border:"none",cursor:"pointer",color:"#cc0000",fontSize:"14px",lineHeight:1,padding:0 }}>×</button>
                                  </div>
                                ))
                            }
                          </div>
                          <div style={{ display:"flex",gap:"4px",borderTop:"1px solid #bbb",paddingTop:"6px" }}>
                            <input type="text" style={Inp({flex:1})} value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..."
                              onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); addTask(); }}} />
                            <button type="button" style={Btn()} onClick={addTask}>+ Task</button>
                          </div>
                        </div>

                        {/* Missing Docs + Notes */}
                        <div>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                            <label style={{ fontSize:"11px",fontWeight:"bold",color:"#b30000",display:"flex",alignItems:"center",gap:"4px" }}>
                              <AlertTriangle size={11}/> Missing Documents (If any):
                            </label>
                            <button type="button" onClick={sendMissingDocsWA} style={{ ...Btn(), fontSize:"10px", padding:"2px 6px", background:"#25D366", color:"white", borderColor:"#1da851" }}>
                              📱 WhatsApp Request
                            </button>
                          </div>
                          <textarea style={{ ...Inp(),resize:"vertical",minHeight:"36px" }} value={missingDocs} onChange={e => setMissingDocs(e.target.value)} placeholder="List missing documents..." />
                        </div>
                        <div>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px" }}>
                            <label style={{ fontSize:"11px",display:"block" }}>Notes / Instructions:</label>
                            {/* Feature 3: Voice Typing for Notes */}
                            <button type="button" onClick={() => handleListen(setNotes)} style={Btn({fontSize:"10px",padding:"2px 6px",background:isListening?"#ffcccc":"#d4d0c8",color:isListening?"#cc0000":"#000"})}>
                              {isListening ? <Loader2 size={10} className="animate-spin" /> : "🎤"} {isListening ? "Listening..." : "Dictate"}
                            </button>
                          </div>
                          <textarea style={{ ...Inp(),resize:"vertical",minHeight:"50px" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes..." />
                        </div>
                      </div>
                    )}

                    {/* ═══ DOCUMENTS TAB ═══ */}
                    {activeTab === "documents" && (
                      <div style={{ display:"flex",flexDirection:"column",gap:"10px" }}>
                        {/* Upload Area */}
                        <div style={{ ...groove,padding:"12px",background:"#d4d0c8",textAlign:"center" }}>
                          <SHead icon={<Upload size={12}/>} label="Upload Documents" />
                          <div style={{ ...inset,background:"#f8f8f8",padding:"20px",marginBottom:"8px",cursor:"pointer" }} onClick={() => fileInputRef.current?.click()}>
                            <Upload size={28} style={{ margin:"0 auto 6px",color:"#888" }} />
                            <div style={{ fontSize:"12px",color:"#666" }}>Click to upload file</div>
                            <div style={{ fontSize:"10px",color:"#999",marginTop:"3px" }}>PDF, JPG, PNG — Max 5MB</div>
                          </div>
                          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display:"none" }} onChange={handleFileUpload} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} style={Btn({width:"100%",justifyContent:"center"})} disabled={uploading}>
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>}
                            {uploading ? "Uploading..." : "Choose File"}
                          </button>
                        </div>

                        {/* File List */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8" }}>
                          <SHead icon="📁" label={`Uploaded Files (${docUrls.length})`} />
                          {docUrls.length === 0
                            ? <div style={{ fontSize:"11px",color:"#999",fontStyle:"italic",textAlign:"center",padding:"20px" }}>No documents uploaded yet.</div>
                            : docUrls.map((url,i) => {
                                // Extract the original filename from the url (e.g. from cloudniary)
                                const name = getFileNameFromUrl(url, `Document ${i+1}`);
                                const previewType = getPreviewType(url);
                                const canPreview = previewType === "image" || previewType === "pdf" || previewType === "docx" || url.includes("res.cloudinary.com");
                                return (
                                  <div key={i} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"5px",borderBottom:"1px solid #ccc" }}>
                                    <span style={{ fontSize:"18px" }}>{previewType === "image" ? "🖼" : "📄"}</span>
                                    <span style={{ flex:1,fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</span>
                                    <button type="button" onClick={() => handleDownload(url)} style={Btn({fontSize:"10px",padding:"2px 6px"})}><Download size={10}/> D/L</button>
                                    {canPreview ? (
                                      <button type="button" onClick={() => openPreview(url)} style={Btn({fontSize:"10px",padding:"2px 6px"})}>View</button>
                                    ) : (
                                      <a href={url} target="_blank" rel="noreferrer" style={Btn({fontSize:"10px",padding:"2px 6px"})}>View</a>
                                    )}
                                    {/* Feature 10: Quick Edit Tools */}
                                    {previewType === "image" && (
                                      <>
                                        <button type="button" onClick={() => { window.open(`https://www.iloveimg.com/crop-image`, "_blank"); toast.info("Opening external crop tool"); }} style={Btn({fontSize:"10px",padding:"2px 6px",background:"#e0e0e0"})} title="Crop Image">✂️</button>
                                        <button type="button" onClick={() => { window.open(`https://www.iloveimg.com/compress-image`, "_blank"); toast.info("Opening external compress tool"); }} style={Btn({fontSize:"10px",padding:"2px 6px",background:"#e0e0e0"})} title="Compress Image">🗜️</button>
                                      </>
                                    )}
                                    <button type="button" onClick={() => handleDeleteDoc(url)} style={Btn({fontSize:"10px",padding:"2px 6px",color:"#cc0000"})}><X size={10}/></button>
                                  </div>
                                );
                              })
                          }
                        </div>
                      </div>
                    )}

                    {/* ═══ COMMENTS TAB ═══ */}
                    {activeTab === "comments" && (
                      <div style={{ display:"flex",flexDirection:"column",gap:"8px",height:"100%" }}>
                        {/* Thread */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8",flex:1,minHeight:"200px",overflowY:"auto" }}>
                          <SHead icon={<MessageCircle size={11}/>} label="Internal Comments" color="#000080" />
                          {comments.length === 0
                            ? <div style={{ fontSize:"11px",color:"#999",fontStyle:"italic",textAlign:"center",padding:"30px" }}>No comments yet. Add the first one below.</div>
                            : [...comments].reverse().map((c: any) => (
                                <div key={c.id} style={{ marginBottom:"8px",background:"white",...inset,padding:"7px" }}>
                                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px" }}>
                                    <span style={{ fontSize:"11px",fontWeight:"bold",color:"#000080" }}>👤 {c.author}</span>
                                    <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                                      <span style={{ fontSize:"10px",color:"#888" }}>{new Date(c.createdAt).toLocaleString()}</span>
                                      <button type="button" onClick={() => deleteComment(c.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#cc0000",fontSize:"12px",lineHeight:1,padding:0 }}>×</button>
                                    </div>
                                  </div>
                                  <div style={{ fontSize:"12px",whiteSpace:"pre-wrap",lineHeight:"1.5" }}>{c.text}</div>
                                </div>
                              ))
                          }
                        </div>
                        {/* Input */}
                        <div style={{ display:"flex",gap:"6px",alignItems:"flex-end" }}>
                          <textarea style={{ ...Inp(),flex:1,resize:"none",minHeight:"50px" }} value={commentText} onChange={e => setCommentText(e.target.value)}
                            placeholder="Type a comment... (Enter to send, Shift+Enter for new line)"
                            onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendComment(); }}} />
                          <button type="button" onClick={sendComment} disabled={sendingComment} style={Btn({background:"#0a246a",color:"white",padding:"8px 14px"})}>
                            {sendingComment ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                            Send
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ═══ ACTIVITY TAB ═══ */}
                    {activeTab === "activity" && (
                      <div>
                        <SHead icon={<Activity size={11}/>} label="Activity Timeline" color="#000080" />
                        {loadingActivity
                          ? <div style={{ textAlign:"center",padding:"30px" }}><Loader2 size={20} className="animate-spin" style={{ margin:"0 auto" }}/></div>
                          : activityLogs.length === 0
                            ? <div style={{ fontSize:"11px",color:"#999",fontStyle:"italic",textAlign:"center",padding:"30px" }}>No activity recorded yet.</div>
                            : (
                              <div style={{ position:"relative",paddingLeft:"20px" }}>
                                {/* Timeline line */}
                                <div style={{ position:"absolute",left:"7px",top:0,bottom:0,width:"2px",background:"#ccc" }}/>
                                {activityLogs.map((log: any,i: number) => (
                                  <div key={log.id} style={{ position:"relative",marginBottom:"10px",paddingLeft:"16px" }}>
                                    {/* Dot */}
                                    <div style={{ position:"absolute",left:"-20px",top:"4px",width:"10px",height:"10px",borderRadius:"50%",background:"#000080",border:"2px solid #fff",zIndex:1 }}/>
                                    <div style={{ background:"white",...inset,padding:"6px 8px" }}>
                                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px" }}>
                                        <div>
                                          <span style={{ fontSize:"11px",fontWeight:"bold",color:"#000080" }}>{log.action.replace(/_/g," ")}</span>
                                          {log.details && <div style={{ fontSize:"11px",color:"#555",marginTop:"2px" }}>{log.details}</div>}
                                        </div>
                                        <div style={{ textAlign:"right",flexShrink:0 }}>
                                          <div style={{ fontSize:"10px",color:"#888" }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                                          <div style={{ fontSize:"10px",color:"#aaa" }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                          <div style={{ fontSize:"10px",color:"#000080" }}>👤 {log.user?.name||"System"}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                        }
                        <button type="button" onClick={loadActivity} style={Btn({marginTop:"8px"})}><RefreshCw size={11}/> Refresh</button>
                      </div>
                    )}

                    {/* ═══ PAYMENT TAB ═══ */}
                    {activeTab === "payment" && (
                      <div style={{ display:"flex",flexDirection:"column",gap:"10px" }}>
                        {/* Current Status */}
                        <div style={{ ...groove,padding:"10px",background:"#d4d0c8" }}>
                          <SHead icon={<CreditCard size={11}/>} label="Current Payment Status" color="#006600" />
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(80px, 1fr))",gap:"8px",textAlign:"center" }}>
                            {[
                              { label:"Total Fees", value:`₹${fees}`, color:"#000080" },
                              { label:"Paid", value:`₹${amountPaid}`, color:"#006600", show: paymentStatus !== "UNPAID" && fees > 0 },
                              { label:"Pending", value:`₹${Math.max(0, fees - amountPaid)}`, color:"#cc0000", show: paymentStatus === "PARTIAL" || paymentStatus === "UNPAID" },
                              { label:"Status", value:paymentStatus, color:pMeta.color },
                              { label:"Mode", value:paymentMode, color:"#555" },
                            ].filter(item => item.show !== false).map(({ label,value,color }) => (
                              <div key={label} style={{ background:"white",...inset,padding:"10px" }}>
                                <div style={{ fontSize:"18px",fontWeight:"bold",color }}>{value}</div>
                                <div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {fees - amountPaid > 0 && (
                          <div style={{ display:"flex",justifyContent:"flex-end" }}>
                            <button type="button" onClick={() => sendWA(WA_TEMPLATES.PAYMENT, { pending: (fees - amountPaid).toString() })}
                              style={Btn({background:"#075e54",color:"white",fontSize:"11px"})}>
                              <MessageCircle size={11} style={{ marginRight: "4px" }}/> Send Payment Reminder
                            </button>
                          </div>
                        )}

                        {/* Collect Payment */}
                        <div style={{ ...groove,padding:"10px",background:"#d4d0c8" }}>
                          <SHead icon={<IndianRupee size={11}/>} label="Collect Payment" color="#006600" />
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px" }}>
                            <div>
                              <label style={{ fontSize:"11px",display:"block",marginBottom:"3px" }}>Amount (₹):</label>
                              <input type="number" style={Inp()} value={payAmount} min={0} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount" />
                            </div>
                            <div>
                              <label style={{ fontSize:"11px",display:"block",marginBottom:"3px" }}>Payment Mode:</label>
                              <select style={Sel()} value={payMode} onChange={e => setPayMode(e.target.value)}>
                                <option value="CASH">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="CARD">💳 Card</option>
                              </select>
                            </div>
                          </div>
                          <button type="button" onClick={collectPayment} disabled={collecting || !payAmount}
                            style={Btn({background:"#006600",color:"white",width:"100%",justifyContent:"center",padding:"8px",fontSize:"13px",fontWeight:"bold"})}>
                            {collecting ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                            {collecting ? "Processing..." : `Collect ₹${payAmount||"0"} via ${payMode}`}
                          </button>
                          <div style={{ fontSize:"10px",color:"#666",marginTop:"6px",textAlign:"center" }}>
                            {parseFloat(payAmount||"0") >= fees ? "✓ Full payment" : `Partial — ₹${Math.max(0, fees - parseFloat(payAmount||"0"))} remaining`}
                          </div>
                        </div>

                        {/* Quick Amounts */}
                        <div style={{ ...groove,padding:"8px",background:"#d4d0c8" }}>
                          <SHead icon="⚡" label="Quick Amounts" />
                          <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
                            {[fees, Math.ceil(fees/2), 10, 20, 50, 100, 200, 500].filter((v,i,a) => v>0 && a.indexOf(v)===i).slice(0,6).map(amt => (
                              <button key={amt} type="button" onClick={() => setPayAmount(String(amt))} style={Btn({padding:"4px 12px",fontSize:"12px"})}>₹{amt}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>{/* tab content end */}
                </div>{/* right panel end */}
              </div>{/* body end */}

              {/* ── FOOTER ── */}
              <div style={{ borderTop:"2px solid #848484",padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"#c8c4bc" }}>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  style={Btn({background:confirmDelete?"#cc0000":"#d4d0c8",color:confirmDelete?"white":"black"})}>
                  {deleting ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                  {confirmDelete ? "Confirm Delete?" : "Delete"}
                </button>
                <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>
                  {tasks.length>0 && <span style={{ fontSize:"11px",color:"#555" }}>{tasks.filter(t=>t.done).length}/{tasks.length} tasks</span>}
                  {callbackAt && <span style={{ fontSize:"11px",color:"#0055aa",display:"flex",alignItems:"center",gap:"3px" }}><Clock size={11}/>{new Date(callbackAt).toLocaleDateString()}</span>}
                  <button type="button" onClick={() => { setConfirmDelete(false); onClose(); }} style={Btn()}>Cancel</button>
                  {/* Feature 12: Move to Next Step */}
                  <button type="button" onClick={() => {
                    const statuses = ["PENDING", "SUBMITTED", "PROCESSING", "APPROVED", "DELIVERED"];
                    const nextIdx = statuses.indexOf(status) + 1;
                    if (nextIdx > 0 && nextIdx < statuses.length) {
                      setStatus(statuses[nextIdx]);
                      toast.info(`Status updated to ${statuses[nextIdx]}. Press Save to confirm.`);
                    } else if (status === "DELIVERED") {
                      toast.success("Service is already Delivered.");
                    }
                  }} style={Btn({background:"#00596b",color:"white",padding:"4px 10px"})}>
                    ⏭ Next Step
                  </button>
                  <button type="submit" disabled={saving} style={Btn({background:"#0a246a",color:"white",padding:"4px 20px",fontSize:"13px",fontWeight:"bold"})}>
                    {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                    {saving ? "Saving..." : "Save Updates"}
                  </button>
                </div>
              </div>

            </form>
          ) : null}
        </div>
      </div>

      {/* ── Print Slip (hidden, print-only) ── */}
      {service && (
        <div className="print-only" style={{ display:"none" }}>
          <div style={{ fontFamily:"Tahoma",padding:"20px",maxWidth:"400px",border:"2px solid black",margin:"20px auto" }}>
            <div style={{ textAlign:"center",borderBottom:"2px solid black",paddingBottom:"10px",marginBottom:"10px" }}>
              <div style={{ fontSize:"18px",fontWeight:"bold" }}>RA Seva Point</div>
              <div style={{ fontSize:"12px" }}>Service Acknowledgement Slip</div>
            </div>
            <table style={{ width:"100%",fontSize:"13px",borderCollapse:"collapse" }}>
              <tbody>
                {[
                  ["Token:", service.tokenNumber ? `T${String(service.tokenNumber).padStart(3,"0")}` : "N/A"],
                  ["Tracking ID:", service.trackingId || "N/A"],
                  ["Customer:", service.customer.name],
                  ["Mobile:", service.customer.mobile],
                  ["Service:", service.serviceType],
                  ["Date:", formatDate(service.createdAt)],
                  ["Status:", status],
                  ["Fees:", `₹${fees}`],
                  ...(deadline ? [["Deadline:", new Date(deadline).toLocaleDateString()]] : []),
                ].map(([k,v]) => (
                  <tr key={k} style={{ borderBottom:"1px dotted #ccc" }}>
                    <td style={{ padding:"4px 0",fontWeight:"bold",width:"40%" }}>{k}</td>
                    <td style={{ padding:"4px 0" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:"15px",fontSize:"11px",textAlign:"center",color:"#555" }}>
              Thank you for visiting RA Seva Point. Please keep this slip for reference.
            </div>
          </div>
        </div>
      )}

      {/* Preview Image Modal overlay (Root Level) */}
      {(previewImg || previewLoading) && (
        <div style={{ position:"fixed",inset:0,zIndex:100000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"#d4d0c8", ...raised, display:"flex", flexDirection:"column", width:"80%", maxWidth:"700px", maxHeight:"85vh", boxShadow:"0 10px 30px rgba(0,0,0,0.8)" }}>
            <div style={{ background:"linear-gradient(90deg,#000080,#1084d0)", color:"white", padding:"6px 10px", fontWeight:"bold", fontSize:"13px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>Document Viewer</span>
              <button onClick={() => { setPreviewImg(null); setPreviewPages([]); setPreviewHtml(""); setPreviewType("unsupported"); setPreviewLoading(false); }} style={{ background:"#d4d0c8", color:"black", border:"none", padding:"1px 6px", cursor:"pointer", ...raised, fontWeight:"bold" }}>✕</button>
            </div>
            
            <div style={{ flex:1, background:"#000", display:"flex", alignItems:"center", justifyContent:"center", padding:"10px", overflow:"hidden", minHeight:"300px" }}>
              {previewLoading ? (
                <div style={{ color:"white", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
                  <Loader2 className="animate-spin" size={32} />
                  <span>Loading Document...</span>
                </div>
              ) : (
                previewType === "pdf" ? (
                  <div style={{ width:"100%", height:"100%", minHeight:"500px", overflow:"auto", background:"#3a3a3a", padding:"14px" }}>
                    {previewPages.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`PDF page ${index + 1}`}
                        style={{ display:"block", width:"100%", maxWidth:"920px", height:"auto", margin:"0 auto 14px", background:"white", boxShadow:"0 2px 8px rgba(0,0,0,0.45)" }}
                      />
                    ))}
                  </div>
                ) : previewType === "docx" ? (
                  <div
                    style={{ width:"100%", height:"100%", minHeight:"500px", overflow:"auto", background:"white", color:"#111", padding:"28px", fontFamily:"Arial, sans-serif", fontSize:"14px", lineHeight:1.55 }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : previewType === "image" ? (
                  <img 
                    src={previewImg || undefined} 
                    alt="Preview" 
                    style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} 
                    onError={() => { 
                      toast.error('Failed to load preview. Please use Download or View in New Tab.'); 
                    }} 
                  />
                ) : (
                  <div style={{ color:"white", textAlign:"center", maxWidth:"420px", lineHeight:1.5 }}>
                    <FileText size={40} style={{ margin:"0 auto 10px", opacity:0.8 }} />
                    <div style={{ fontWeight:"bold", marginBottom:"6px" }}>Preview not available</div>
                    <div style={{ fontSize:"12px", color:"#d0d0d0" }}>
                      This file type cannot be shown inside the document viewer. Use Download or Open in New Tab.
                    </div>
                  </div>
                )
              )}
            </div>
            
            <div style={{ padding:"10px", display:"flex", justifyContent:"center", flexWrap: "wrap", gap:"10px", background:"#111" }}>
              <button onClick={() => { setPreviewImg(null); setPreviewPages([]); setPreviewHtml(""); setPreviewType("unsupported"); setPreviewLoading(false); }} style={{ ...Btn(), padding:"6px 20px" }}>
                Close
              </button>
              <button onClick={() => sendReuploadWA(originalUrl || '')} style={{ ...Btn(), padding:"6px 16px", background:"#25D366", color:"white", border:"2px solid #1da851" }}>
                📱 Request Re-upload
              </button>
              <button onClick={() => handleDownload(originalUrl || '')} style={{ ...Btn(), padding:"6px 16px", background:"#1084d0", color:"white", border:"2px solid #000080" }}>
                ⬇️ Download
              </button>
              <button onClick={() => {
                window.open(originalUrl || '', '_blank');
              }} style={{ ...Btn(), padding:"6px 16px" }}>
                ↗️ Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print { body > *:not(.print-only) { display: none !important; } .print-only { display: block !important; } }`}</style>

      {/* Hidden Receipt for html2canvas */}
      {service && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
          <TokenReceipt 
            ref={receiptRef}
            data={{
              tokenNumber: service.tokenNumber || 0,
              trackingId: service.trackingId || '',
              customerName: service.customer?.name || '',
              customerMobile: service.customer?.mobile || '',
              serviceType: service.serviceType,
              createdAt: service.createdAt
            }}
          />
        </div>
      )}
    </>
  );
}
