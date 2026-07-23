"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface LegacyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function LegacyDialog({ isOpen, onClose, title, children, width = '500px' }: LegacyDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div 
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxHeight: '90vh',
          backgroundColor: '#d4d0c8',
          borderTop: '2px solid #fff',
          borderLeft: '2px solid #fff',
          borderRight: '2px solid #404040',
          borderBottom: '2px solid #404040',
          boxShadow: '1px 1px 4px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
          fontSize: '11px',
          color: 'black'
        }}
      >
        {/* Title Bar */}
        <div 
          style={{
            background: 'linear-gradient(to right, #0a246a 0%, #a6caf0 100%)',
            color: 'white',
            fontWeight: 'bold',
            padding: '3px 2px 3px 4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
            margin: '2px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#000080', borderRadius: '50%', boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5)' }}></div>
            {title}
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button 
              className="legacy-btn-close"
              onClick={onClose}
              style={{
                backgroundColor: '#e81123',
                borderTop: '1px solid #fff', borderLeft: '1px solid #fff',
                borderRight: '1px solid #404040', borderBottom: '1px solid #404040',
                width: '18px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', color: 'white', fontSize: '10px',
                cursor: 'pointer'
              }}
              title="Close"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '8px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
