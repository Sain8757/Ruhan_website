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
  
  const [moveToCrmData, setMoveToCrmData] = useState<{customer: string, mobile: string, files: any[]} | null>(null);
  const [crmServiceType, setCrmServiceType] = useState("Online Form");
  const [crmFees, setCrmFees] = useState("100");
  const [isMovingToCrm, setIsMovingToCrm] = useState(false);

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

  // Group files by customer name and mobile
  const groupedFiles = files.reduce((acc, file) => {
    const mobile = file.mobileNumber || "No Number";
    const name = file.customerName || "Unknown Customer";
    const key = `${name} | ${mobile}`;
    if (!acc[key]) acc[key] = { customerName: name, mobileNumber: mobile, files: [] };
    acc[key].files.push(file);
    return acc;
  }, {} as Record<string, { customerName: string, mobileNumber: string, files: any[] }>);

  const handleMoveToCrm = async () => {
    if (!moveToCrmData) return;
    setIsMovingToCrm(true);
    try {
      const res = await fetch("/api/drop/to-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: moveToCrmData.customer,
          mobileNumber: moveToCrmData.mobile,
          serviceType: crmServiceType,
          fees: crmFees,
          files: moveToCrmData.files
        })
      });
      const data = await res.json();
      if (data.success) {
        setMoveToCrmData(null);
        fetchFiles();
        alert("Files successfully moved to Services!");
      } else {
        alert(data.error || "Failed to move to services");
      }
    } catch (err) {
      console.error(err);
      alert("Error moving to services");
    } finally {
      setIsMovingToCrm(false);
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
      fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
      fontSize: "12px",
    }}>
      <div style={{ width: "1000px", maxWidth: "95vw", height: "85vh", display: "flex", flexDirection: "column", background: "#d4d0c8", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", outline: "1px solid #808080" }}>
        
        {/* Window Titlebar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", background: "linear-gradient(90deg, #000080, #1084d0)", color: "#fff", cursor: "default", userSelect: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Smartphone size={14} color="#ffffff" />
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
        <div style={{ padding: "8px", background: "#d4d0c8", display: "flex", gap: "8px", flex: 1, minHeight: 0 }}>
          
          {/* Left Panel: QR Codes */}
          <div style={{
            width: "300px",
            background: "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "8px"
          }}>
            {/* Receive Area */}
            <div style={{ textAlign: "center", marginBottom: "15px", borderBottom: "1px solid #808080", paddingBottom: "10px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#000", margin: "0 0 5px 0" }}>Receive from Phone</h2>
              <p style={{ fontSize: "11px", color: "#000", marginBottom: "10px" }}>
                Customer scans to send photos/docs
              </p>
              
              <div style={{ padding: "8px", background: "#ffffff", borderTop: "1px solid #808080", borderLeft: "1px solid #808080", borderRight: "1px solid #ffffff", borderBottom: "1px solid #ffffff", display: "inline-block", marginBottom: "10px" }}>
                <QRCodeSVG 
                  id="drop-qr-code"
                  value={dropUrl} 
                  size={140} 
                  level="H"
                />
              </div>
              
              <button 
                onClick={() => downloadQR("drop-qr-code", "Receive_File_QR.png")}
                style={{ width: "100%", background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "4px 0", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", outline: "none" }}
              >
                <Download size={12} /> Download QR
              </button>
            </div>

            {/* Send Area (Two-Way) */}
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#000", margin: "0 0 5px 0" }}>Send to Phone</h2>
              <p style={{ fontSize: "11px", color: "#000", marginBottom: "10px" }}>
                Select a file from PC to give to customer
              </p>

              {pcToMobileUrl ? (
                <div>
                  <div style={{ padding: "8px", background: "#ffffff", borderTop: "1px solid #808080", borderLeft: "1px solid #808080", borderRight: "1px solid #ffffff", borderBottom: "1px solid #ffffff", display: "inline-block", marginBottom: "10px" }}>
                    <QRCodeSVG 
                      id="send-qr-code"
                      value={pcToMobileUrl} 
                      size={140} 
                      level="H"
                    />
                  </div>
                  <p style={{ fontSize: "11px", fontWeight: "bold", color: "#000080", margin: "0 0 10px 0" }}>Ask customer to scan to download!</p>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      onClick={() => setPcToMobileUrl("")}
                      style={{ flex: 1, background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "4px 0", fontSize: "11px", cursor: "pointer", outline: "none" }}
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => downloadQR("send-qr-code", "Send_File_QR.png")}
                      style={{ flex: 1, background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "4px 0", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer", outline: "none" }}
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
                      background: "#d4d0c8", color: "#000", padding: "6px",
                      borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040",
                      fontSize: "12px", cursor: "pointer", outline: "none"
                    }}
                  >
                    {isUploadingToMobile ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
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
            background: "#ffffff",
            borderTop: "2px solid #808080",
            borderLeft: "2px solid #808080",
            borderRight: "2px solid #ffffff",
            borderBottom: "2px solid #ffffff",
            minHeight: 0
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#d4d0c8", borderBottom: "1px solid #808080" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", color: "#000", fontSize: "12px" }}>
                Live Incoming Files
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {files.length > 0 && (
                  <button 
                    onClick={clearAllFiles}
                    style={{ background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "2px 6px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", outline: "none" }}
                  >
                    <Trash2 size={12} color="red" /> Clear All
                  </button>
                )}
                <button 
                  onClick={fetchFiles}
                  style={{ background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "2px 6px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", outline: "none" }}
                  title="Refresh"
                >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} color="#000080" /> Refresh
                </button>
              </div>
            </div>
            
            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px", background: "#ffffff" }}>
              {isLoading && files.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Loader2 className="animate-spin" size={24} color="#000080" />
                </div>
              ) : files.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#808080" }}>
                  <FileIcon size={32} style={{ opacity: 0.5, marginBottom: "8px" }} />
                  <p style={{ margin: 0, fontSize: "12px" }}>No incoming files yet.</p>
                  <p style={{ fontSize: "11px", marginTop: "4px" }}>Ask a customer to scan the "Receive" QR code.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Object.entries(groupedFiles).map(([key, groupData]: [string, any]) => (
                    <div key={key} style={{ background: "#d4d0c8", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", outline: "1px solid #808080", overflow: "hidden" }}>
                      <div style={{ background: "linear-gradient(90deg, #000080, #1084d0)", color: "#fff", padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "bold", fontSize: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FolderOpen size={14} color="#ffffff" />
                          {groupData.customerName} <span style={{ fontSize: "11px", background: "transparent", color: "#c0d8f0", marginLeft: "5px" }}>({groupData.mobileNumber})</span>
                          <span style={{ fontSize: "11px", color: "#ffffff", marginLeft: "10px" }}>- {groupData.files.length} files</span>
                        </div>
                        <button 
                          onClick={() => setMoveToCrmData({ customer: groupData.customerName, mobile: groupData.mobileNumber, files: groupData.files })}
                          style={{ background: "#d4d0c8", color: "#000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", padding: "2px 6px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", outline: "none" }}
                        >
                          <Send size={10} color="#000080" /> Move to Services
                        </button>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px", padding: "8px", background: "#ffffff", borderTop: "1px solid #808080" }}>
                        {groupData.files.map((file: any) => (
                          <div key={file.id} style={{
                            background: "#d4d0c8",
                            borderTop: "1px solid #ffffff",
                            borderLeft: "1px solid #ffffff",
                            borderRight: "1px solid #808080",
                            borderBottom: "1px solid #808080",
                            display: "flex",
                            flexDirection: "column",
                            padding: "4px"
                          }}>
                            {/* Preview Area */}
                            <div style={{ height: "100px", background: "#ffffff", borderTop: "1px solid #808080", borderLeft: "1px solid #808080", borderRight: "1px solid #ffffff", borderBottom: "1px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                              {file.type.startsWith('image/') ? (
                                <img src={file.url} alt={file.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#000080" }}>
                                  <FileIcon size={24} />
                                  <span style={{ fontSize: "10px", marginTop: "4px" }}>PDF Document</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => deleteFile(file.id)}
                                style={{
                                  position: "absolute", top: "2px", right: "2px",
                                  background: "#d4d0c8", color: "#000",
                                  borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040",
                                  padding: "2px", cursor: "pointer", outline: "none"
                                }}
                                title="Delete file"
                              >
                                <Trash2 size={12} color="red" />
                              </button>
                            </div>

                            {/* Details */}
                            <div style={{ padding: "4px 0 0 0", display: "flex", flexDirection: "column", flex: 1 }}>
                              <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.filename}>
                                {file.filename}
                              </p>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#404040", marginBottom: "6px" }}>
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Clock size={9} /> {formatTime(file.createdAt)}</span>
                              </div>
                              
                              <div style={{ display: "flex", gap: "2px", marginTop: "auto" }}>
                                <button 
                                  onClick={() => setPreviewFile({url: file.url, type: file.type, name: file.filename})}
                                  style={{ flex: 1, background: "#d4d0c8", color: "#000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", padding: "2px 0", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", cursor: "pointer", outline: "none" }}
                                >
                                  <ExternalLink size={10} color="#000080" /> View
                                </button>
                                <a 
                                  href={getDownloadUrl(file.url)}
                                  download={file.filename}
                                  style={{ flex: 1, background: "#d4d0c8", color: "#000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", padding: "2px 0", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", textDecoration: "none", outline: "none" }}
                                >
                                  <Download size={10} color="#000080" /> Save
                                </a>
                                <button 
                                  onClick={() => handlePrint(file.url)}
                                  style={{ flex: 1, background: "#d4d0c8", color: "#000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", padding: "2px 0", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", cursor: "pointer", outline: "none" }}
                                >
                                  <Printer size={10} color="#000080" /> Print
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

      {/* Preview File Dialog */}
      {previewFile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif"
        }}>
          <div style={{ background: "#d4d0c8", width: "80%", maxWidth: "800px", height: "85vh", display: "flex", flexDirection: "column", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", outline: "1px solid #808080" }}>
            <div style={{ background: "linear-gradient(90deg, #000080, #1084d0)", color: "white", padding: "3px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>{previewFile.name}</span>
              <button onClick={() => setPreviewFile(null)} style={{ background: "#d4d0c8", color: "#000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", width: "16px", height: "14px", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none" }}>X</button>
            </div>
            <div style={{ flex: 1, padding: "8px", display: "flex", justifyContent: "center", alignItems: "center", background: "#ffffff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", margin: "8px" }}>
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <iframe src={previewFile.url} style={{ width: "100%", height: "100%", border: "none", background: "white" }} title={previewFile.name} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Move to CRM Dialog */}
      {moveToCrmData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 20000,
          display: "flex", justifyContent: "center", alignItems: "center",
          fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif"
        }}>
          <div style={{ background: "#d4d0c8", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", outline: "1px solid #808080", width: "350px", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(90deg, #000080, #1084d0)", color: "white", padding: "3px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>Move to Services</span>
              <button onClick={() => setMoveToCrmData(null)} style={{ background: "#d4d0c8", color: "#000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", width: "16px", height: "14px", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", outline: "none" }}>X</button>
            </div>
            
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px" }}>Customer:</span>
                <span style={{ fontSize: "12px", background: "#ffffff", borderTop: "1px solid #808080", borderLeft: "1px solid #808080", borderRight: "1px solid #ffffff", borderBottom: "1px solid #ffffff", padding: "4px" }}>
                  {moveToCrmData.customer} ({moveToCrmData.mobile})
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px" }}>Service Type:</span>
                <input 
                  type="text" 
                  value={crmServiceType}
                  onChange={(e) => setCrmServiceType(e.target.value)}
                  style={{ width: "100%", padding: "4px", background: "#ffffff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", fontSize: "12px", boxSizing: "border-box", outline: "none", fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px" }}>Fees (₹):</span>
                <input 
                  type="number" 
                  value={crmFees}
                  onChange={(e) => setCrmFees(e.target.value)}
                  style={{ width: "100%", padding: "4px", background: "#ffffff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", fontSize: "12px", boxSizing: "border-box", outline: "none", fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif" }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "flex-end" }}>
                <button 
                  onClick={handleMoveToCrm}
                  disabled={isMovingToCrm}
                  style={{ background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "4px 12px", fontSize: "12px", cursor: isMovingToCrm ? "not-allowed" : "pointer", outline: "none" }}
                >
                  {isMovingToCrm ? "Moving..." : "OK"}
                </button>
                <button 
                  onClick={() => setMoveToCrmData(null)}
                  style={{ background: "#d4d0c8", color: "#000", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "4px 12px", fontSize: "12px", cursor: "pointer", outline: "none" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
