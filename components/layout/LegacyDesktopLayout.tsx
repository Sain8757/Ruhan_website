"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, File, FilePlus, ArrowUpCircle, MousePointer2, Settings, FileText, Phone, Pause, LayoutDashboard, Users, Briefcase, Receipt, Camera, ScanLine } from 'lucide-react';
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import Providers from "@/components/Providers";

export default function LegacyDesktopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const getWindowTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/services')) return 'Services';
    if (pathname.startsWith('/billing')) return 'Billing';
    if (pathname.startsWith('/photo-studio')) return 'Photo Studio';
    if (pathname.startsWith('/aadhaar-pan')) return 'Aadhaar / PAN';
    return 'Agency Information Manager';
  };

  return (
    <Providers>
      <WorkspaceProvider>
        <div className="legacy-desktop" style={{ width: '100vw', height: '100vh', display: 'flex' }}>
          {/* Main Background Window Container */}
          <div 
            className="legacy-window"
            style={{ 
              top: 0, left: 0, right: 0, bottom: 0,
              width: '100%', height: '100%'
            }}
          >
            {/* Title Bar */}
            <div className="legacy-window-titlebar">
              <div className="title-text">
                <span style={{ fontSize: '14px', lineHeight: 1 }}>🔹</span>
                {getWindowTitle()} - RA Seva Point
              </div>
              <div className="legacy-window-controls">
                <button className="legacy-btn-sys">_</button>
                <button className="legacy-btn-sys">□</button>
                <button className="legacy-btn-close"><X size={10} /></button>
              </div>
            </div>

            {/* Menu Bar */}
            <div style={{ background: '#d4d0c8', padding: '2px 4px', display: 'flex', gap: '8px', borderBottom: '1px solid #808080' }}>
              <span><u style={{ textDecoration: 'none', borderBottom: '1px solid black' }}>F</u>ile</span>
              <span><u style={{ textDecoration: 'none', borderBottom: '1px solid black' }}>E</u>dit</span>
              <span>Module</span>
              <span>Tools</span>
              <span>Brokerage</span>
              <span>Submission</span>
              <span>Policy</span>
              <span>ImageRight</span>
              <span>Detail</span>
              <span>Custom</span>
              <span>Help</span>
            </div>

            {/* Toolbar */}
            <div className="legacy-toolbar">
              <button className="legacy-toolbar-btn" onClick={() => router.push('/')}>
                <LayoutDashboard size={16} color="#008080" />
                Dash
              </button>
              <button className="legacy-toolbar-btn" onClick={() => router.push('/customers')}>
                <Users size={16} color="#000080" />
                Cust
              </button>
              <button className="legacy-toolbar-btn" onClick={() => router.push('/services')}>
                <Briefcase size={16} color="#008080" />
                Services
              </button>
              <button className="legacy-toolbar-btn" onClick={() => router.push('/billing')}>
                <Receipt size={16} color="#000080" />
                Billing
              </button>
              <div style={{ width: '2px', borderLeft: '1px solid #808080', borderRight: '1px solid #fff', margin: '0 4px' }}></div>
              <button className="legacy-toolbar-btn" onClick={() => router.push('/photo-studio')}>
                <Camera size={16} color="#000080" />
                Studio
              </button>
              <button className="legacy-toolbar-btn" onClick={() => router.push('/aadhaar-pan')}>
                <ScanLine size={16} color="#008080" />
                ID Crop
              </button>
              <div style={{ width: '2px', borderLeft: '1px solid #808080', borderRight: '1px solid #fff', margin: '0 4px' }}></div>
              <button className="legacy-toolbar-btn">
                <ArrowUpCircle size={16} color="#008080" />
                Submit
              </button>
              <button className="legacy-toolbar-btn">
                <MousePointer2 size={16} color="#000080" />
                Quote
              </button>
              <button className="legacy-toolbar-btn">
                <FileText size={16} color="#000080" />
                Bind
              </button>
            </div>

            {/* Inner Content Area */}
            <div style={{ background: '#d4d0c8', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="legacy-tab-content" style={{ flex: 1, margin: '4px', overflowY: 'auto' }}>
                {children}
              </div>
            </div>

          </div>
        </div>
      </WorkspaceProvider>
    </Providers>
  );
}
