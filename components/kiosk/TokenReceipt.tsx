import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

export interface TokenReceiptData {
  shopName?: string;
  tokenNumber: number;
  trackingId: string;
  referenceNo?: string;
  customerName: string;
  customerMobile: string;
  serviceType: string;
  createdAt: string | Date;
}

interface TokenReceiptProps {
  data: TokenReceiptData;
}

const TokenReceipt = forwardRef<HTMLDivElement, TokenReceiptProps>(({ data }, ref) => {
  const shopName = data.shopName || "Ruhan Seva Point";
  // The tracking URL that the QR code points to
  const trackingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/track/${data.trackingId}`
    : `https://ruhan.com/track/${data.trackingId}`;

  return (
    <div
      ref={ref}
      style={{
        width: '400px',
        backgroundColor: '#ffffff',
        padding: '0',
        fontFamily: "'Inter', sans-serif",
        color: '#1f2937',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
      className="receipt-container"
    >
      {/* Top Header */}
      <div style={{ backgroundColor: '#2563eb', padding: '24px', textAlign: 'center', color: '#ffffff' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>{shopName}</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Digital Service Token</p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Token Number */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', fontWeight: 600 }}>Token No</p>
          <h1 style={{ margin: 0, fontSize: '64px', fontWeight: 900, color: '#111827', lineHeight: '1.1' }}>
            {String(data.tokenNumber).padStart(2, '0')}
          </h1>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', borderTop: '2px dashed #e5e7eb', margin: '8px 0 24px 0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-34px', width: '20px', height: '20px', backgroundColor: '#f3f4f6', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', top: '-10px', right: '-34px', width: '20px', height: '20px', backgroundColor: '#f3f4f6', borderRadius: '50%' }}></div>
        </div>

        {/* Details Grid */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Customer Name</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{data.customerName || 'N/A'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Mobile</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{data.customerMobile || 'N/A'}</p>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Service Type</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 700, color: '#2563eb' }}>{data.serviceType}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Date & Time</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {format(new Date(data.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Reference No</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 500, color: '#374151' }}>{data.referenceNo || 'N/A'}</p>
          </div>
        </div>

        {/* Tracking Section with QR */}
        <div style={{ 
          width: '100%', 
          backgroundColor: '#f8fafc', 
          padding: '16px', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ flexShrink: 0, padding: '4px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <QRCodeSVG value={trackingUrl} size={64} level="H" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>Track Status Online</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Scan QR code or use tracking ID:</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', color: '#2563eb' }}>
              {data.trackingId}
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Strip */}
      <div style={{ height: '8px', width: '100%', background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)' }}></div>
    </div>
  );
});

TokenReceipt.displayName = 'TokenReceipt';

export default TokenReceipt;
