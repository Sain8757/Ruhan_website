"use client";

import React, { useState, useEffect } from "react";
import { Download, Printer, RefreshCw, Smartphone, Clock, File as FileIcon, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function FileDropDashboard() {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropUrl, setDropUrl] = useState("");
  
  useEffect(() => {
    setDropUrl(window.location.origin + "/drop");
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/drop/list");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch files", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and auto-polling every 3 seconds
  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = (url: string) => {
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDownloadUrl = (url: string) => {
    // Force cloudinary to download as attachment
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  const downloadQR = () => {
    const svg = document.getElementById("drop-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if(ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "Drop_QR_Code.png";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: QR Code Panel */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Smartphone className="w-8 h-8 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Local Wi-Fi File Drop</h2>
            <p className="text-sm text-gray-500 mb-6">
              Customers can scan this QR code to instantly send documents and photos directly to your PC without WhatsApp.
            </p>
            
            <div className="bg-white p-4 rounded-xl border-4 border-blue-500 shadow-md">
              <QRCodeSVG 
                id="drop-qr-code"
                value={dropUrl} 
                size={180} 
                level="H"
              />
            </div>
            
            <button 
              onClick={downloadQR}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors w-full"
            >
              <Download size={16} /> Download QR Code
            </button>
            
            <div className="mt-4 text-xs font-mono bg-gray-100 px-3 py-2 rounded-lg text-gray-600 break-all w-full">
              {dropUrl}
            </div>
          </div>
        </div>

        {/* Right Side: Incoming Files List */}
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Live Incoming Files
              </h3>
              <button 
                onClick={fetchFiles}
                className="text-gray-500 hover:text-blue-600 p-1"
                title="Refresh now"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
              {isLoading && files.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-gray-400">
                  <FileIcon size={48} className="mb-4 opacity-20" />
                  <p>No files dropped yet today.</p>
                  <p className="text-sm mt-1">Ask a customer to scan the QR code.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                      
                      {/* Live Preview Area */}
                      <div className="h-32 bg-gray-100 flex items-center justify-center border-b border-gray-100 relative">
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-red-500">
                            <FileIcon size={40} />
                            <span className="text-xs font-bold mt-2">PDF DOCUMENT</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(file.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <a 
                            href={file.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            title="View File"
                          >
                            <ExternalLink size={14} /> View
                          </a>
                          <a 
                            href={getDownloadUrl(file.url)}
                            download={file.filename}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            title="Force Download"
                          >
                            <Download size={14} /> Save
                          </a>
                          <button 
                            onClick={() => handlePrint(file.url)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Printer size={14} /> Print
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
