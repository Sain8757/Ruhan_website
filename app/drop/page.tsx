"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, File, Loader2 } from "lucide-react";

export default function FileDropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setIsSuccess(false);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/drop/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setIsSuccess(true);
      setFile(null);
      
      // Auto reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "#f0f8ff",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "white",
        padding: "30px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ margin: 0, color: "#000080", fontSize: "24px", fontWeight: "900" }}>RA Seva Point</h1>
          <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>Fast & Secure Local File Drop</p>
        </div>

        {!isSuccess ? (
          <>
            <label 
              htmlFor="file-upload" 
              style={{
                display: "block",
                border: "2px dashed #1084d0",
                backgroundColor: file ? "#e6f2ff" : "#fafafa",
                padding: "40px 20px",
                borderRadius: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {file ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <File size={40} color="#1084d0" />
                  <span style={{ fontWeight: "600", color: "#333", wordBreak: "break-all" }}>{file.name}</span>
                  <span style={{ fontSize: "12px", color: "#888" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <UploadCloud size={48} color="#1084d0" />
                  <span style={{ fontWeight: "600", color: "#555" }}>Tap to select a file</span>
                  <span style={{ fontSize: "12px", color: "#888" }}>PDF, JPG, PNG (Max 10MB)</span>
                </div>
              )}
              <input 
                id="file-upload" 
                type="file" 
                style={{ display: "none" }} 
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              />
            </label>

            {error && <p style={{ color: "red", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "20px",
                backgroundColor: !file || isUploading ? "#ccc" : "#000080",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: !file || isUploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s"
              }}
            >
              {isUploading ? (
                <><Loader2 size={20} className="animate-spin" /> Uploading...</>
              ) : (
                "Send to PC"
              )}
            </button>
          </>
        ) : (
          <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
            <CheckCircle2 size={60} color="#10b981" />
            <h2 style={{ margin: 0, color: "#10b981", fontSize: "20px" }}>Sent Successfully!</h2>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>The file has appeared on the Shop PC.</p>
            <button 
              onClick={() => setIsSuccess(false)}
              style={{
                marginTop: "15px",
                padding: "8px 16px",
                backgroundColor: "#f3f4f6",
                color: "#333",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Send Another File
            </button>
          </div>
        )}
      </div>
      
      <p style={{ marginTop: "30px", fontSize: "12px", color: "#aaa" }}>
        Note: Files are automatically deleted after 24 hours.
      </p>
    </div>
  );
}
