"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  X, LayoutDashboard, Users, Briefcase, Receipt, Camera, 
  ScanLine, Layers, WalletCards, BookOpen, Package, 
  MessageSquare, BarChart3, Settings, QrCode, FileImage,
  Search, Bell, MessageCircle, Mail, Sparkles
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



            {/* Toolbar - Dynamic Modules */}
            <div className="legacy-toolbar" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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

              {/* Spacer to push search and icons to the right */}
              <div style={{ flex: 1, minWidth: '20px' }}></div>

              {/* Universal Search */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', padding: '1px', marginRight: '8px', width: '200px', flexShrink: 0 }}>
                <input type="text" placeholder="Search..." style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '11px', padding: '0 4px', color: '#000' }} />
                <button style={{ padding: '2px 4px', background: '#d4d0c8', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={12} color="#000" />
                </button>
              </div>

              {/* Utility Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', paddingRight: '8px', flexShrink: 0 }}>
                <button className="legacy-toolbar-btn" title="Notifications">
                  <Bell size={16} color="#d4af37" />
                </button>
                <button className="legacy-toolbar-btn" title="WhatsApp">
                  <MessageCircle size={16} color="#25D366" />
                </button>
                <button className="legacy-toolbar-btn" title="Email">
                  <Mail size={16} color="#D44638" />
                </button>
                <button className="legacy-toolbar-btn" title="Gemini AI">
                  <Sparkles size={16} color="#4285F4" />
                </button>
              </div>
            </div>

            {/* Inner Content Area */}
            <div style={{ background: '#d4d0c8', flex: 1, display: 'flex', overflow: 'hidden', padding: '4px' }}>
              


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
