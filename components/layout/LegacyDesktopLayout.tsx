"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  X, LayoutDashboard, Users, Briefcase, Receipt, Camera, 
  ScanLine, Layers, WalletCards, BookOpen, Package, 
  MessageSquare, BarChart3, Settings, QrCode, FileImage 
} from 'lucide-react';
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import Providers from "@/components/Providers";
import { WORKSPACE_MODULES, type WorkspaceIcon } from "@/lib/workspace";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  LayoutDashboard,
  Users,
  Briefcase,
  Receipt,
  Camera,
  ScanLine,
  Layers,
  WalletCards,
  BookOpen,
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  QrCode,
  FileImage,
};

export default function LegacyDesktopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const getWindowTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const activeModule = WORKSPACE_MODULES.find(m => pathname.startsWith(m.href) && m.href !== '/');
    return activeModule ? activeModule.label : 'Agency Information Manager';
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

            {/* Menu Bar - Removed Dummy Text */}
            <div style={{ background: '#d4d0c8', padding: '2px 4px', display: 'flex', gap: '8px', borderBottom: '1px solid #808080', height: '24px' }}>
            </div>

            {/* Toolbar - Dynamic Modules */}
            <div className="legacy-toolbar" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {WORKSPACE_MODULES.map((module, idx) => {
                const IconComponent = iconMap[module.icon as string] || ScanLine;
                return (
                  <React.Fragment key={module.id}>
                    <button className="legacy-toolbar-btn" onClick={() => router.push(module.href)}>
                      <IconComponent size={16} color={idx % 2 === 0 ? "#008080" : "#000080"} />
                      {module.label}
                    </button>
                    {(idx === 3 || idx === 6 || idx === 10) && (
                      <div style={{ width: '2px', borderLeft: '1px solid #808080', borderRight: '1px solid #fff', margin: '0 4px', height: '24px', alignSelf: 'center' }}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Inner Content Area */}
            <div style={{ background: '#d4d0c8', flex: 1, display: 'flex', overflow: 'hidden', padding: '4px' }}>
              
              {/* Classic Left Sidebar */}
              <div style={{ 
                width: '200px', 
                background: '#fff', 
                borderTop: '2px solid #808080', 
                borderLeft: '2px solid #808080', 
                borderRight: '2px solid #fff', 
                borderBottom: '2px solid #fff',
                marginRight: '6px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ background: '#000080', color: '#fff', padding: '2px 4px', fontWeight: 'bold' }}>
                  Navigation
                </div>
                <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                  {WORKSPACE_MODULES.map((module) => {
                    const isActive = module.href === '/' ? pathname === '/' : pathname.startsWith(module.href);
                    return (
                      <div 
                        key={module.id}
                        className="legacy-tree-item" 
                        onClick={() => router.push(module.href)}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: isActive ? '#000080' : 'transparent', 
                          color: isActive ? '#fff' : '#000',
                          padding: '2px 4px'
                        }}
                      >
                        <span style={{ color: '#d4d0c8', fontSize: '12px' }}>📁</span> 
                        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{module.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Pane */}
              <div className="legacy-tab-content" style={{ flex: 1, overflowY: 'auto', background: '#d4d0c8' }}>
                {children}
              </div>
            </div>

          </div>
        </div>
      </WorkspaceProvider>
    </Providers>
  );
}
