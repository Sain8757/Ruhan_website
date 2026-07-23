"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Download, X } from "lucide-react";

interface DownloadContextType {
  downloadWithRename: (blobUrl: string, defaultFileName: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [extension, setExtension] = useState<string>("");

  const downloadWithRename = (url: string, defaultName: string) => {
    setBlobUrl(url);
    
    // Extract extension from default name if present
    const lastDotIndex = defaultName.lastIndexOf(".");
    if (lastDotIndex > 0) {
      setFileName(defaultName.substring(0, lastDotIndex));
      setExtension(defaultName.substring(lastDotIndex));
    } else {
      setFileName(defaultName);
      setExtension("");
    }
    
    setIsOpen(true);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    
    const finalName = fileName.trim() ? `${fileName.trim()}${extension}` : `Untitled${extension}`;
    
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Close modal
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <DownloadContext.Provider value={{ downloadWithRename }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-[#404040] border-r-[#404040] shadow-xl">
            {/* Windows 95 Title Bar */}
            <div className="bg-[#000080] flex justify-between items-center px-2 py-1">
              <span className="text-white font-bold text-sm font-sans flex items-center gap-2">
                <Download size={14} />
                Save File As...
              </span>
              <button 
                onClick={handleCancel}
                className="bg-[#c0c0c0] p-0.5 border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white active:bg-[#a0a0a0]"
              >
                <X size={14} className="text-black" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex flex-col gap-4">
              <p className="text-sm font-sans text-black">
                Please enter a name for your file before downloading.
              </p>
              
              <div className="flex items-center">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDownload();
                  }}
                  className="w-full px-2 py-1 text-sm border-t-2 border-l-2 border-t-[#404040] border-l-[#404040] border-b-2 border-r-2 border-b-white border-r-white bg-white focus:outline-none focus:bg-[#000080] focus:text-white"
                  autoFocus
                />
                {extension && (
                  <span className="ml-2 text-sm font-mono text-black font-semibold">
                    {extension}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={handleDownload}
                  className="px-6 py-1 bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black font-sans text-sm focus:outline-black focus:outline-1 focus:outline-dashed"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-1 bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black font-sans text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
}
