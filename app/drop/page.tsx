"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, File as FileIcon, Loader2, Scissors, X, Plus } from "lucide-react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function FileDropPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop State
  const [cropFileIndex, setCropFileIndex] = useState<number | null>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
      setIsSuccess(false);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Crop functions
  const openCropModal = (index: number) => {
    const file = files[index];
    setCropFileIndex(index);
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
  };

  const closeCropModal = () => {
    setCropFileIndex(null);
    setImgSrc('');
    setCrop(undefined);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const applyCrop = async () => {
    if (cropFileIndex === null || !imgRef.current || !crop || crop.width === 0 || crop.height === 0) {
      closeCropModal();
      return;
    }

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height
        );
        
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        if (blob) {
          const originalFile = files[cropFileIndex];
          const croppedFile = new File([blob], `cropped_${originalFile.name}`, { type: 'image/jpeg' });
          
          setFiles(prev => {
            const newFiles = [...prev];
            newFiles[cropFileIndex] = croppedFile;
            return newFiles;
          });
        }
      }
    } catch (err) {
      console.error("Cropping failed", err);
    }
    
    closeCropModal();
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!customerName.trim() || !mobileNumber.trim()) {
      setError("Please enter your name and mobile number first.");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerName", customerName);
      formData.append("mobileNumber", mobileNumber);
      formData.append("direction", "MOBILE_TO_PC");

      try {
        const res = await fetch("/api/drop/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error(`Failed to upload ${file.name}`);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error("Upload error for file", file.name, err);
      }
      
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setIsUploading(false);
    if (successCount === files.length) {
      setIsSuccess(true);
      setFiles([]);
      setCustomerName("");
      setTimeout(() => setIsSuccess(false), 4000);
    } else if (successCount > 0) {
      setError(`Uploaded ${successCount} out of ${files.length} files. Some failed.`);
    } else {
      setError("Failed to upload files. Please try again.");
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
      padding: "15px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "white",
        padding: "25px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px",
      }}>
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h1 style={{ margin: 0, color: "#000080", fontSize: "24px", fontWeight: "900" }}>RA Seva Point</h1>
          <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>Fast & Secure Local File Drop</p>
        </div>

        {!isSuccess ? (
          <>
            <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#444", marginBottom: "5px" }}>Your Name *</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                  style={{ 
                    width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc",
                    fontSize: "16px", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#444", marginBottom: "5px" }}>Mobile Number *</label>
                <input 
                  type="tel" 
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  style={{ 
                    width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc",
                    fontSize: "16px", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#444", marginBottom: "5px" }}>Documents / Photos *</label>
              
              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{ 
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "8px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                        <FileIcon size={18} color="#1084d0" />
                        <span style={{ fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>{file.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {file.type.startsWith('image/') && (
                          <button onClick={() => openCropModal(idx)} style={{ background: "none", border: "none", color: "#1084d0", cursor: "pointer", padding: "4px" }} title="Crop Image">
                            <Scissors size={16} />
                          </button>
                        )}
                        <button onClick={() => removeFile(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }} title="Remove">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label 
                htmlFor="file-upload" 
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border: "2px dashed #1084d0",
                  backgroundColor: "#e6f2ff",
                  padding: "15px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "#1084d0",
                  fontWeight: "bold",
                  transition: "all 0.2s ease"
                }}
              >
                <Plus size={20} />
                {files.length === 0 ? "Select Files or Take Photo" : "Add More Files"}
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple
                  style={{ display: "none" }} 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                />
              </label>
            </div>

            {error && <p style={{ color: "red", fontSize: "13px", marginTop: "10px", textAlign: "center", fontWeight: "bold" }}>{error}</p>}

            {isUploading && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${uploadProgress}%`, background: "#10b981", height: "100%", transition: "width 0.3s" }}></div>
                </div>
                <p style={{ textAlign: "center", fontSize: "12px", color: "#666", margin: "5px 0 0 0" }}>Uploading... {uploadProgress}%</p>
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={files.length === 0 || !customerName.trim() || !mobileNumber.trim() || mobileNumber.length !== 10 || isUploading}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: files.length === 0 || !customerName.trim() || !mobileNumber.trim() || mobileNumber.length !== 10 || isUploading ? "#ccc" : "#000080",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: files.length === 0 || !customerName.trim() || !mobileNumber.trim() || mobileNumber.length !== 10 || isUploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s"
              }}
            >
              {isUploading ? (
                <><Loader2 size={20} className="animate-spin" /> Sending to PC...</>
              ) : (
                "Send All to PC"
              )}
            </button>
          </>
        ) : (
          <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", textAlign: "center" }}>
            <CheckCircle2 size={60} color="#10b981" />
            <h2 style={{ margin: 0, color: "#10b981", fontSize: "20px" }}>Files Sent Successfully!</h2>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Thank you, {customerName}. The shop owner has received your files.</p>
            <button 
              onClick={() => setIsSuccess(false)}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                backgroundColor: "#f3f4f6",
                color: "#333",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Send More Files
            </button>
          </div>
        )}
      </div>
      
      <p style={{ marginTop: "20px", fontSize: "12px", color: "#888", textAlign: "center" }}>
        Note: Files are automatically deleted from the system after 24 hours for your privacy.
      </p>

      {/* Crop Modal */}
      {cropFileIndex !== null && imgSrc && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.9)", zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{ background: "#222", padding: "15px", borderRadius: "12px", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", color: "white" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Crop Image</h3>
              <button onClick={closeCropModal} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", background: "#000", borderRadius: "8px" }}>
              <ReactCrop 
                crop={crop} 
                onChange={(_, percentCrop) => setCrop(percentCrop)}
              >
                <img 
                  ref={imgRef} 
                  src={imgSrc} 
                  alt="Crop preview" 
                  onLoad={onImageLoad}
                  style={{ maxHeight: "60vh", maxWidth: "100%", objectFit: "contain" }}
                />
              </ReactCrop>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={closeCropModal} style={{ flex: 1, padding: "12px", background: "#444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
              <button onClick={applyCrop} style={{ flex: 1, padding: "12px", background: "#1084d0", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Save Crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
