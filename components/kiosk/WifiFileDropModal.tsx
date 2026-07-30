"use client";

import React, { useState, useEffect } from "react";
import { Download, Printer, RefreshCw, Smartphone, Clock, File as FileIcon, ExternalLink, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function WifiFileDropModal({ onClose }: { onClose: () => void }) {
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

  const deleteFile = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    setFiles(prev => prev.filter(f => f.id !== id));
    try {
      await fetch(`/api/drop/delete?id=${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete file", error);
      fetchFiles();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Tahoma, 'Segoe UI', sans-serif"
    }}>
      <div className="legacy-window" style={{ width: "900px", maxWidth: "95vw", height: "80vh", display: "flex", flexDirection: "column" }}>
        
        {/* Window Titlebar */}
        <div className="legacy-window-titlebar" style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", background: "#000080", color: "#fff", cursor: "default" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Smartphone size={14} />
            <span style={{ fontSize: "12px", fontWeight: "bold" }}>Wi-Fi File Drop - Live Monitor</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#d4d0c8",
              borderTop: "1px solid #fff",
              borderLeft: "1px solid #fff",
              borderRight: "1px solid #404040",
              borderBottom: "1px solid #404040",
              color: "black",
              width: "16px",
              height: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            X
          </button>
        </div>

        {/* Window Content */}
        <div style={{ padding: "10px", background: "#d4d0c8", display: "flex", gap: "10px", flex: 1, minHeight: 0 }}>
          
          {/* Left Panel: QR Code */}
          <div style={{
            width: "300px",
            background: "#fff",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #fff",
            borderRight: "1px solid #fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            textAlign: "center"
          }}>
            <div style={{ background: "#e6f2ff", padding: "12px", borderRadius: "50%", marginBottom: "15px" }}>
              <Smartphone size={32} color="#1084d0" />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#333", margin: "0 0 10px 0" }}>Local File Drop</h2>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px", lineHeight: "1.4" }}>
              Customers can scan this QR code to instantly send documents and photos directly to your PC without WhatsApp.
            </p>
            
            <div style={{ padding: "10px", background: "#fff", border: "2px solid #1084d0", borderRadius: "10px", marginBottom: "15px" }}>
              <QRCodeSVG 
                id="drop-qr-code"
                value={dropUrl} 
                size={160} 
                level="H"
              />
            </div>
            
            <button 
              onClick={downloadQR}
              style={{
                width: "100%",
                background: "#1084d0",
                color: "#fff",
                border: "none",
                padding: "8px 0",
                borderRadius: "4px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                marginBottom: "10px"
              }}
            >
              <Download size={14} /> Download QR
            </button>
            <div style={{ fontSize: "10px", color: "#888", wordBreak: "break-all", background: "#f5f5f5", padding: "4px", borderRadius: "4px", width: "100%" }}>
              {dropUrl}
            </div>
          </div>

          {/* Right Panel: File List */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #fff",
            borderRight: "1px solid #fff",
            minHeight: 0
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee", background: "#f9f9f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", color: "#333" }}>
                <span style={{ position: "relative", display: "flex", width: "10px", height: "10px" }}>
                  <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#4ade80", opacity: 0.75 }}></span>
                  <span style={{ position: "relative", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }}></span>
                </span>
                Live Incoming Files
              </div>
              <button 
                onClick={fetchFiles}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
                title="Refresh"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
            
            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "15px", background: "#f3f4f6" }}>
              {isLoading && files.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Loader2 className="animate-spin" size={24} color="#1084d0" />
                </div>
              ) : files.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#aaa" }}>
                  <FileIcon size={40} style={{ opacity: 0.3, marginBottom: "10px" }} />
                  <p style={{ margin: 0 }}>No files dropped yet today.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "15px" }}>
                  {files.map((file) => (
                    <div key={file.id} style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      
                      {/* Preview Area */}
                      <div className="group relative" style={{ height: "120px", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #f3f4f6" }}>
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#ef4444" }}>
                            <FileIcon size={32} />
                            <span style={{ fontSize: "10px", fontWeight: "bold", marginTop: "8px" }}>PDF</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            position: "absolute", top: "5px", right: "5px",
                            background: "rgba(255,255,255,0.9)", color: "#ef4444",
                            border: "none", borderRadius: "50%", padding: "5px",
                            cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                          }}
                          title="Delete file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Details */}
                      <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "bold", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.filename}>
                          {file.filename}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", marginBottom: "12px" }}>
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Clock size={10} /> {formatTime(file.createdAt)}</span>
                        </div>
                        
                        <div style={{ display: "flex", gap: "5px", marginTop: "auto" }}>
                          <a 
                            href={file.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ flex: 1, background: "#f3f4f6", color: "#374151", padding: "4px 0", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", textDecoration: "none" }}
                          >
                            <ExternalLink size={12} /> View
                          </a>
                          <a 
                            href={getDownloadUrl(file.url)}
                            download={file.filename}
                            style={{ flex: 1, background: "#f3f4f6", color: "#374151", padding: "4px 0", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", textDecoration: "none" }}
                          >
                            <Download size={12} /> Save
                          </a>
                          <button 
                            onClick={() => handlePrint(file.url)}
                            style={{ flex: 1, background: "#1084d0", color: "#fff", border: "none", padding: "4px 0", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}
                          >
                            <Printer size={12} /> Print
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
