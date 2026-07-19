"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Plus, Upload, Trash2, Printer, CheckCircle2, ScanLine } from "lucide-react";
import jsPDF from "jspdf";
import ImageCropperModal from "@/components/tools/ImageCropperModal";

type DocType = "Aadhaar Card" | "PAN Card" | "Voter ID" | "Driving License" | "Ration Card" | "Ayushman Card" | "Single Document" | "Other";

interface DocumentItem {
  id: string;
  type: DocType;
  frontImage: string | null;
  backImage: string | null;
}

export default function MultiIdCropperPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  
  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [activeCropTarget, setActiveCropTarget] = useState<{ docId: string; side: "front" | "back" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDocument = (type: DocType) => {
    setDocuments([
      ...documents,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        frontImage: null,
        backImage: null,
      },
    ]);
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const triggerUpload = (docId: string, side: "front" | "back") => {
    setActiveCropTarget({ docId, side });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const base64Image = canvas.toDataURL("image/jpeg", 0.95);
          setImageToCrop(base64Image);
          setCropperOpen(true);
        }
      } catch (error) {
        console.error("Error reading PDF:", error);
        alert("Failed to read PDF file.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    if (activeCropTarget) {
      setDocuments(
        documents.map((doc) => {
          if (doc.id === activeCropTarget.docId) {
            return {
              ...doc,
              [activeCropTarget.side === "front" ? "frontImage" : "backImage"]: croppedImageBase64,
            };
          }
          return doc;
        })
      );
    }
    setCropperOpen(false);
    setActiveCropTarget(null);
    setImageToCrop("");
  };

  const generatePDF = () => {
    if (documents.length === 0) return;

    // A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    documents.forEach((doc, index) => {
      if (index > 0) pdf.addPage();

      const hasFront = !!doc.frontImage;
      const hasBack = !!doc.backImage;

      // Define standard card size (ID Card size is approx 85.6mm x 54mm)
      // We will print it slightly larger for clear visibility: 95mm x 60mm
      const cardWidth = 95;
      const cardHeight = 60;
      
      const gap = 10; // Gap between front and back if placed side-by-side
      const topMargin = 50; // Distance from top of the page

      if (hasFront && hasBack) {
        // Place side-by-side horizontally
        const totalWidth = cardWidth * 2 + gap;
        const startX = (pageWidth - totalWidth) / 2; // Center horizontally
        
        pdf.addImage(doc.frontImage!, "JPEG", startX, topMargin, cardWidth, cardHeight);
        pdf.addImage(doc.backImage!, "JPEG", startX + cardWidth + gap, topMargin, cardWidth, cardHeight);
      } else if (hasFront) {
        // Only front - center horizontally
        const startX = (pageWidth - cardWidth) / 2;
        pdf.addImage(doc.frontImage!, "JPEG", startX, topMargin, cardWidth, cardHeight);
      } else if (hasBack) {
        // Only back (rare) - center horizontally
        const startX = (pageWidth - cardWidth) / 2;
        pdf.addImage(doc.backImage!, "JPEG", startX, topMargin, cardWidth, cardHeight);
      }
      
      // Add a label at the bottom of the page
      pdf.setFontSize(12);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${doc.type} - Generated by RA Seva Point`, pageWidth / 2, pageHeight - 15, { align: "center" });
    });

    pdf.save("Customer_Documents_Merged.pdf");
    // To open directly in print dialog instead of save:
    // pdf.autoPrint();
    // window.open(pdf.output('bloburl'), '_blank');
  };

  const printDirectly = () => {
    if (documents.length === 0) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    documents.forEach((doc, index) => {
      if (index > 0) pdf.addPage();
      const hasFront = !!doc.frontImage;
      const hasBack = !!doc.backImage;
      const cardWidth = 95;
      const cardHeight = 60;
      const gap = 10;
      const topMargin = 50;

      if (hasFront && hasBack) {
        const totalWidth = cardWidth * 2 + gap;
        const startX = (pageWidth - totalWidth) / 2;
        pdf.addImage(doc.frontImage!, "JPEG", startX, topMargin, cardWidth, cardHeight);
        pdf.addImage(doc.backImage!, "JPEG", startX + cardWidth + gap, topMargin, cardWidth, cardHeight);
      } else if (hasFront) {
        const startX = (pageWidth - cardWidth) / 2;
        pdf.addImage(doc.frontImage!, "JPEG", startX, topMargin, cardWidth, cardHeight);
      } else if (hasBack) {
        const startX = (pageWidth - cardWidth) / 2;
        pdf.addImage(doc.backImage!, "JPEG", startX, topMargin, cardWidth, cardHeight);
      }
      pdf.setFontSize(12);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${doc.type} - Generated by RA Seva Point`, pageWidth / 2, pageHeight - 15, { align: "center" });
    });

    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Multi-ID Cropper"
        subtitle="Crop and merge multiple customer ID cards into a single print-ready PDF"
      />

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Add Documents */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Add Document</h3>
            <div className="space-y-2">
              {(["Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Ration Card", "Ayushman Card", "Single Document", "Other"] as DocType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addDocument(type)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
                  style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                >
                  <span className="text-sm font-medium">{type}</span>
                  <Plus size={16} className="text-blue-500 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Actions</h3>
            <button 
              onClick={generatePDF}
              disabled={documents.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
            >
              <ScanLine size={18} /> Generate PDF
            </button>
            <button 
              onClick={printDirectly}
              disabled={documents.length === 0}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              <Printer size={18} /> Print Directly
            </button>
          </div>
        </div>

        {/* Right Area: Document List */}
        <div className="lg:col-span-3 space-y-6">
          {documents.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
              <ScanLine size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>No Documents Added</h3>
              <p className="text-sm mt-2 max-w-sm" style={{ color: "var(--text-muted)" }}>
                Select a document type from the left panel to start cropping and compiling ID cards.
              </p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div key={doc.id} className="glass-card p-6 relative animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-5 border-b pb-3" style={{ borderColor: "var(--border-secondary)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{doc.type}</h3>
                  </div>
                  <button 
                    onClick={() => removeDocument(doc.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Side */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Front Side</span>
                    {doc.frontImage ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={doc.frontImage} alt={`${doc.type} Front`} className="max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => triggerUpload(doc.id, "front")}
                            className="bg-white text-slate-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                          >
                            <Upload size={16} /> Recrop
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => triggerUpload(doc.id, "front")}
                        className="w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        style={{ borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}
                      >
                        <Upload size={24} className="mb-2 opacity-60" />
                        <span className="text-sm font-medium">Upload Front Image</span>
                      </button>
                    )}
                  </div>

                  {/* Back Side */}
                  {doc.type !== "Single Document" && (
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Back Side (Optional)</span>
                      {doc.backImage ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={doc.backImage} alt={`${doc.type} Back`} className="max-h-full object-contain" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => triggerUpload(doc.id, "back")}
                              className="bg-white text-slate-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                            >
                              <Upload size={16} /> Recrop
                            </button>
                          </div>
                          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                            <CheckCircle2 size={16} />
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => triggerUpload(doc.id, "back")}
                          className="w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          style={{ borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}
                        >
                          <Upload size={24} className="mb-2 opacity-60" />
                          <span className="text-sm font-medium">Upload Back Image</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ImageCropperModal 
        isOpen={cropperOpen}
        imageSrc={imageToCrop}
        onClose={() => {
          setCropperOpen(false);
          setImageToCrop("");
          setActiveCropTarget(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
