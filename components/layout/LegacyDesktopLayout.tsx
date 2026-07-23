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
import { LogOut } from 'lucide-react';
import { signOut } from "next-auth/react";
import { DownloadProvider } from "@/contexts/DownloadContext";

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

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = async () => {
    // Basic signout logic - adapt to your auth provider
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Providers>
      <WorkspaceProvider>
        <div className="legacy-desktop" style={{ width: '100vw', height: '100vh', display: 'flex' }}>
          {/* Main Background Window Container */}
          <div 
            className="legacy-window"
            style={{ 
              position: 'relative',
              width: '100%', 
              maxWidth: '1440px',
              margin: '0 auto',
              height: '100vh',
              boxShadow: '0 0 50px rgba(0,0,0,0.3)'
            }}
          >
            {/* Title Bar */}
            <div className="legacy-window-titlebar">
              <div className="title-text" style={{ flex: 1 }}>
                <span style={{ fontSize: '14px', lineHeight: 1 }}>🔹</span>
                {getWindowTitle()} - RA Seva Point
              </div>

              {/* Universal Search & Icons centered in Title Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}>
                {/* Universal Search */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', padding: '1px', marginRight: '16px', width: '250px', flexShrink: 0 }}>
                  <input type="text" placeholder="Search..." style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '11px', padding: '0 4px', color: '#000' }} />
                  <button style={{ padding: '2px 4px', background: '#d4d0c8', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={12} color="#000" />
                  </button>
                </div>

                {/* Utility Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <button className="legacy-toolbar-btn" title="Notifications" style={{ background: '#d4d0c8', padding: '2px 4px' }}>
                    <Bell size={16} color="#d4af37" />
                  </button>
                  <button className="legacy-toolbar-btn" title="WhatsApp" style={{ background: '#d4d0c8', padding: '2px 4px' }}>
                    <MessageCircle size={16} color="#25D366" />
                  </button>
                  <button className="legacy-toolbar-btn" title="Email" style={{ background: '#d4d0c8', padding: '2px 4px' }}>
                    <Mail size={16} color="#D44638" />
                  </button>
                  <button className="legacy-toolbar-btn" title="Gemini AI" style={{ background: '#d4d0c8', padding: '2px 4px' }}>
                    <Sparkles size={16} color="#4285F4" />
                  </button>
                </div>
              </div>

              <div className="legacy-window-controls" style={{ flex: 1, justifyContent: 'flex-end', display: 'flex' }}>
                <button 
                  className="legacy-btn-sys" 
                  style={{ width: 'auto', padding: '0 8px', display: 'flex', gap: '4px' }}
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Logout"
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
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
            </div>

            {/* Inner Content Area */}
            <div style={{ background: '#d4d0c8', flex: 1, display: 'flex', overflow: 'hidden', padding: '4px' }}>
              


              {/* Main Content Pane */}
              <div className="legacy-tab-content" style={{ flex: 1, overflowY: 'auto', background: '#d4d0c8' }}>
                <DownloadProvider>
                  {children}
                </DownloadProvider>
              </div>
            </div>

            {/* Logout Confirmation Modal (Windows 95 Style) */}
            {showLogoutConfirm && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999
              }}>
                <div style={{
                  backgroundColor: '#d4d0c8',
                  borderTop: '2px solid #fff',
                  borderLeft: '2px solid #fff',
                  borderRight: '2px solid #404040',
                  borderBottom: '2px solid #404040',
                  padding: '2px',
                  width: '300px',
                  boxShadow: '2px 2px 5px rgba(0,0,0,0.5)'
                }}>
                  <div style={{
                    background: 'linear-gradient(to right, #000080 0%, #1084d0 100%)',
                    color: 'white',
                    padding: '2px 4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Log Off Windows</span>
                    <button 
                      onClick={() => setShowLogoutConfirm(false)}
                      style={{
                        background: '#d4d0c8',
                        borderTop: '1px solid #fff',
                        borderLeft: '1px solid #fff',
                        borderRight: '1px solid #404040',
                        borderBottom: '1px solid #404040',
                        color: 'black',
                        width: '16px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >X</button>
                  </div>
                  
                  <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ color: '#000080' }}>
                      <LogOut size={32} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontFamily: 'Tahoma, sans-serif' }}>
                        Are you sure you want to log off?
                      </p>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    padding: '8px 16px 16px',
                  }}>
                    <button 
                      onClick={handleLogout}
                      style={{
                        padding: '4px 16px',
                        background: '#d4d0c8',
                        borderTop: '1px solid #fff',
                        borderLeft: '1px solid #fff',
                        borderRight: '1px solid #404040',
                        borderBottom: '1px solid #404040',
                        fontFamily: 'Tahoma, sans-serif',
                        fontSize: '12px',
                        cursor: 'pointer',
                        width: '75px'
                      }}
                    >Yes</button>
                    <button 
                      onClick={() => setShowLogoutConfirm(false)}
                      style={{
                        padding: '4px 16px',
                        background: '#d4d0c8',
                        borderTop: '1px solid #fff',
                        borderLeft: '1px solid #fff',
                        borderRight: '1px solid #404040',
                        borderBottom: '1px solid #404040',
                        fontFamily: 'Tahoma, sans-serif',
                        fontSize: '12px',
                        cursor: 'pointer',
                        width: '75px'
                      }}
                    >No</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </WorkspaceProvider>
    </Providers>
  );
}
