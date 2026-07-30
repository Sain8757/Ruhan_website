"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Printer, RefreshCw, Smartphone, Clock, File as FileIcon, ExternalLink, Image as ImageIcon, Loader2, Trash2, Send, FolderOpen, UploadCloud } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function WifiFileDropModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropUrl, setDropUrl] = useState("");
  const [pcToMobileUrl, setPcToMobileUrl] = useState("");
  const [isUploadingToMobile, setIsUploadingToMobile] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string, name: string} | null>(null);
  const pcFileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setDropUrl(window.location.origin + "/drop");
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/drop/list");
      const data = await res.json();
      if (data.files) {
        // Only show files sent by mobile
        setFiles(data.files.filter((f: any) => f.direction !== "PC_TO_MOBILE"));
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
      printWindow.onload = () => printWindow.print();
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

  const downloadQR = (elementId: string = "drop-qr-code", filename: string = "Drop_QR_Code.png") => {
    const svg = document.getElementById(elementId);
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
        downloadLink.download = filename;
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

  const clearAllFiles = async () => {
    if (!window.confirm("Are you sure you want to delete ALL files from the database? This cannot be undone.")) return;
    setIsLoading(true);
    try {
      await fetch('/api/drop/clear', { method: 'DELETE' });
      await fetchFiles();
    } catch (error) {
      console.error("Failed to clear all files", error);
    }
  };

  const handlePcUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploadingToMobile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("direction", "PC_TO_MOBILE");

    try {
      const res = await fetch("/api/drop/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPcToMobileUrl(data.url);
      }
    } catch (err) {
      console.error("Failed to upload to mobile", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingToMobile(false);
      if (pcFileInputRef.current) {
        pcFileInputRef.current.value = "";
      }
    }
  };

  // Group files by customer name
  const groupedFiles = files.reduce((acc, file) => {
    const name = file.customerName || "Unknown Customer";
    if (!acc[name]) acc[name] = [];
    acc[name].push(file);
    return acc;
  }, {} as Record<string, any[]>);

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
      <div className="legacy-window" style={{ width: "1000px", maxWidth: "95vw", height: "85vh", display: "flex", flexDirection: "column" }}>
        
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
          
          {/* Left Panel: QR Codes */}
          <div style={{
            width: "300px",
            background: "#fff",
            borderTop: "1px solid #808080",
            borderLeft: "1px solid #808080",
            borderBottom: "1px solid #fff",
            borderRight: "1px solid #fff",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "15px"
          }}>
            {/* Receive Area */}
            <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
              <div style={{ background: "#e6f2ff", padding: "10px", borderRadius: "50%", display: "inline-block", marginBottom: "10px" }}>
                <Smartphone size={24} color="#1084d0" />
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#333", margin: "0 0 5px 0" }}>Receive from Phone</h2>
              <p style={{ fontSize: "11px", color: "#666", marginBottom: "15px", lineHeight: "1.4" }}>
                Customer scans to send photos/docs
              </p>
              
              <div style={{ padding: "10px", background: "#fff", border: "2px solid #1084d0", borderRadius: "10px", marginBottom: "10px", display: "inline-block" }}>
                <QRCodeSVG 
                  id="drop-qr-code"
                  value={dropUrl} 
                  size={140} 
                  level="H"
                />
              </div>
              
              <button 
                onClick={() => downloadQR("drop-qr-code", "Receive_File_QR.png")}
                style={{ width: "100%", background: "#1084d0", color: "#fff", border: "none", padding: "6px 0", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
              >
                <Download size={12} /> Download QR
              </button>
            </div>

            {/* Send Area (Two-Way) */}
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "50%", display: "inline-block", marginBottom: "10px" }}>
                <Send size={24} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#333", margin: "0 0 5px 0" }}>Send to Phone</h2>
              <p style={{ fontSize: "11px", color: "#666", marginBottom: "15px", lineHeight: "1.4" }}>
                Select a file from PC to give to customer
              </p>

              {pcToMobileUrl ? (
                <div>
                  <div style={{ padding: "10px", background: "#fff", border: "2px solid #16a34a", borderRadius: "10px", marginBottom: "10px", display: "inline-block" }}>
                    <QRCodeSVG 
                      id="send-qr-code"
                      value={pcToMobileUrl} 
                      size={140} 
                      level="H"
                    />
                  </div>
                  <p style={{ fontSize: "11px", fontWeight: "bold", color: "#16a34a", margin: "0 0 10px 0" }}>Ask customer to scan to download!</p>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => setPcToMobileUrl("")}
                      style={{ flex: 1, background: "#f3f4f6", color: "#333", border: "none", padding: "6px 0", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => downloadQR("send-qr-code", "Send_File_QR.png")}
                      style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", padding: "6px 0", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}
                    >
                      <Download size={12} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input 
                    type="file" 
                    ref={pcFileInputRef}
                    onChange={handlePcUpload}
                    style={{ display: "none" }}
                    id="pc-to-mobile-upload"
                  />
                  <label 
                    htmlFor="pc-to-mobile-upload"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      background: "#16a34a", color: "white", padding: "10px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "opacity 0.2s",
                      opacity: isUploadingToMobile ? 0.7 : 1
                    }}
                  >
                    {isUploadingToMobile ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {isUploadingToMobile ? "Uploading..." : "Upload File to Send"}
                  </label>
                </div>
              )}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", borderBottom: "1px solid #eee", background: "#f9f9f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>
                <span style={{ position: "relative", display: "flex", width: "10px", height: "10px" }}>
                  <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#4ade80", opacity: 0.75 }}></span>
                  <span style={{ position: "relative", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }}></span>
                </span>
                Live Incoming Files
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {files.length > 0 && (
                  <button 
                    onClick={clearAllFiles}
                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Trash2 size={12} /> Clear All
                  </button>
                )}
                <button 
                  onClick={fetchFiles}
                  style={{ background: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  title="Refresh"
                >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>
            
            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#f3f4f6" }}>
              {isLoading && files.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Loader2 className="animate-spin" size={24} color="#1084d0" />
                </div>
              ) : files.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#aaa" }}>
                  <FileIcon size={40} style={{ opacity: 0.3, marginBottom: "10px" }} />
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>No incoming files yet.</p>
                  <p style={{ fontSize: "12px", marginTop: "5px" }}>Ask a customer to scan the "Receive" QR code.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                  {(Object.entries(groupedFiles) as [string, any[]][]).map(([customer, customerFiles]) => (
                    <div key={customer} style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ background: "#1084d0", color: "#fff", padding: "10px 15px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px" }}>
                        <FolderOpen size={16} />
                        {customer} <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: "10px", marginLeft: "5px" }}>{customerFiles.length} files</span>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", padding: "15px" }}>
                        {customerFiles.map((file) => (
                          <div key={file.id} style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                          }}>
                            {/* Preview Area */}
                            <div className="group relative" style={{ height: "120px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                              <p style={{ margin: "0 0 5px 0", fontSize: "11px", fontWeight: "bold", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.filename}>
                                {file.filename}
                              </p>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#6b7280", marginBottom: "10px" }}>
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Clock size={9} /> {formatTime(file.createdAt)}</span>
                              </div>
                              
                              <div style={{ display: "flex", gap: "4px", marginTop: "auto" }}>
                                <button 
                                  onClick={() => setPreviewFile({url: file.url, type: file.type, name: file.filename})}
                                  style={{ flex: 1, background: "#e5e7eb", color: "#374151", border: "none", padding: "4px 0", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", cursor: "pointer" }}
                                >
                                  <ExternalLink size={10} /> View
                                </button>
                                <a 
                                  href={getDownloadUrl(file.url)}
                                  download={file.filename}
                                  style={{ flex: 1, background: "#e5e7eb", color: "#374151", padding: "4px 0", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", textDecoration: "none" }}
                                >
                                  <Download size={10} /> Save
                                </a>
                                <button 
                                  onClick={() => handlePrint(file.url)}
                                  style={{ flex: 1, background: "#1084d0", color: "#fff", border: "none", padding: "4px 0", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", cursor: "pointer" }}
                                >
                                  <Printer size={10} /> Print
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {previewFile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", zIndex: 10000,
          display: "flex", flexDirection: "column", padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "white", marginBottom: "15px", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{previewFile.name}</h3>
            <button onClick={() => setPreviewFile(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "24px", fontWeight: "bold", lineHeight: "1" }}>&times;</button>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", background: "#222", borderRadius: "8px" }}>
            {previewFile.type.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <iframe src={previewFile.url} style={{ width: "100%", height: "100%", border: "none", background: "white" }} title={previewFile.name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
