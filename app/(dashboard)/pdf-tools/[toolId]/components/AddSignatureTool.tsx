"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Image as ImageIcon, Loader2, X, PenTool } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function AddSignatureTool() {
  const toast = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [pageNum, setPageNum] = useState<number>(1);
  const [position, setPosition] = useState<string>("bottom-right");
  const [sigWidth, setSigWidth] = useState<number>(150);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(file);
    } else if (file) {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
      setSigFile(file);
    } else if (file) {
      toast.error("Please select a valid PNG or JPG image");
    }
  };

  const handleAddSignature = async () => {
    if (!pdfFile || !sigFile) {
      toast.error("Please select both a PDF and a signature image");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Load PDF
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      // 2. Embed Image
      const imageBytes = await sigFile.arrayBuffer();
      let image;
      if (sigFile.type === "image/png") {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      // 3. Get Page
      const pages = pdfDoc.getPages();
      const pageIndex = Math.min(Math.max(1, pageNum), pages.length) - 1;
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // 4. Calculate Dimensions & Position
      const imgDims = image.scale(sigWidth / image.width);
      
      let x = 50;
      let y = 50;
      const margin = 50;

      switch(position) {
        case "top-left": 
          x = margin; 
          y = height - imgDims.height - margin; 
          break;
        case "top-right": 
          x = width - imgDims.width - margin; 
          y = height - imgDims.height - margin; 
          break;
        case "bottom-left": 
          x = margin; 
          y = margin; 
          break;
        case "bottom-right": 
          x = width - imgDims.width - margin; 
          y = margin; 
          break;
        case "center": 
          x = width / 2 - imgDims.width / 2; 
          y = height / 2 - imgDims.height / 2; 
          break;
      }

      // 5. Draw Image
      page.drawImage(image, {
        x, 
        y,
        width: imgDims.width,
        height: imgDims.height,
      });

      // 6. Save & Download
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); 
      a.href = url; 
      a.download = `Signed_${pdfFile.name}`; 
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Signature added and PDF downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add signature. Check file validity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Upload */}
        <div className="space-y-2">
          <p className="label text-sm font-semibold text-gray-700">1. Select PDF File</p>
          {!pdfFile ? (
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <FileText size={32} className="mx-auto mb-3 text-blue-500" />
              <p className="font-semibold text-gray-700">Click to upload PDF</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <FileText size={24} className="text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{pdfFile.name}</p>
                <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setPdfFile(null)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          )}
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handlePdfChange} />
        </div>

        {/* Signature Upload */}
        <div className="space-y-2">
          <p className="label text-sm font-semibold text-gray-700">2. Select Signature (Image)</p>
          {!sigFile ? (
            <div
              onClick={() => sigInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all"
            >
              <ImageIcon size={32} className="mx-auto mb-3 text-pink-500" />
              <p className="font-semibold text-gray-700">Click to upload JPG/PNG</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <ImageIcon size={24} className="text-pink-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{sigFile.name}</p>
                <p className="text-xs text-gray-500">{(sigFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setSigFile(null)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          )}
          <input ref={sigInputRef} type="file" accept="image/png, image/jpeg, image/jpg" hidden onChange={handleSigChange} />
        </div>
      </div>

      {/* Options */}
      {pdfFile && sigFile && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Placement Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Page Number</label>
              <input 
                type="number" 
                min="1" 
                value={pageNum}
                onChange={(e) => setPageNum(parseInt(e.target.value) || 1)}
                className="input-field" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <select 
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="input-field"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Signature Width (px)</label>
              <input 
                type="number" 
                min="50" 
                max="500"
                value={sigWidth}
                onChange={(e) => setSigWidth(parseInt(e.target.value) || 150)}
                className="input-field" 
              />
            </div>
          </div>
          
          <button 
            onClick={handleAddSignature} 
            disabled={loading} 
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 mt-4 shadow-md"
          >
            {loading ? (
              <><Loader2 size={22} className="animate-spin" /> Processing...</>
            ) : (
              <><PenTool size={22} /> Add Signature to PDF</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
