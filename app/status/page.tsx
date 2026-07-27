"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Search, FileUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CustomerStatusPage() {
  const [mobile, setMobile] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [service, setService] = useState<any>(null);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Win95 inset style
  const inset: React.CSSProperties = {
    borderTop: '2px solid #808080',
    borderLeft: '2px solid #808080',
    borderRight: '2px solid #ffffff',
    borderBottom: '2px solid #ffffff',
    background: '#ffffff',
  };
  const raised: React.CSSProperties = {
    borderTop: '2px solid #ffffff',
    borderLeft: '2px solid #ffffff',
    borderRight: '2px solid #404040',
    borderBottom: '2px solid #404040',
  };
  const btn: React.CSSProperties = {
    ...raised,
    background: '#d4d0c8',
    cursor: 'pointer',
    padding: '6px 14px',
    fontFamily: 'Tahoma, sans-serif',
    fontSize: '13px',
    fontWeight: 'bold',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !trackingId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/customer/status?mobile=${mobile}&trackingId=${trackingId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch status');
      setService(data.service);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !service) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('trackingId', service.trackingId);
      const res = await fetch('/api/kiosk/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedCount(c => c + 1);
      alert('Document uploaded securely to RA Seva Point!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-10"
      style={{ backgroundColor: '#008080', backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}>
      
      <div style={{ ...raised, background: '#d4d0c8', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Title Bar */}
        <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            RA Seva Point — Track Application
          </div>
        </div>

        <div style={{ padding: '12px' }}>
          
          {!service ? (
            // LOGIN SCREEN
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', color: '#444', marginBottom: '8px' }}>
                Track your service status securely using your Mobile Number and Tracking ID.
              </div>
              
              <div>
                <label style={{ fontFamily: 'Tahoma', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Mobile Number:</label>
                <input type="tel" maxLength={10} value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="e.g. 9876543210" style={{ ...inset, width: '100%', padding: '6px', fontSize: '14px', fontFamily: 'Tahoma' }} />
              </div>
              
              <div>
                <label style={{ fontFamily: 'Tahoma', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Tracking ID (See Receipt):</label>
                <input type="text" maxLength={8} value={trackingId} onChange={e => setTrackingId(e.target.value.toUpperCase())} required placeholder="e.g. BE9ZZF" style={{ ...inset, width: '100%', padding: '6px', fontSize: '14px', fontFamily: 'Tahoma', textTransform: 'uppercase' }} />
              </div>

              {errorMsg && (
                <div style={{ background: '#ffcccc', border: '1px solid #cc0000', color: '#cc0000', padding: '6px', fontSize: '11px', textAlign: 'center', fontFamily: 'Tahoma' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...btn, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px', height: '36px' }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </form>
          ) : (
            // STATUS DASHBOARD
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ background: 'white', ...inset, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Hello, {service.customerName}</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '20px', fontWeight: 'bold', color: '#000080', margin: '4px 0' }}>{service.serviceType}</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#888' }}>ID: {service.trackingId}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ background: '#e8f0ff', border: '1px solid #aac', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#555' }}>Status</div>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: '#000080', marginTop: '2px' }}>{service.status}</div>
                </div>
                <div style={{ background: '#fff8e8', border: '1px solid #cc9', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#555' }}>Payment</div>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: service.paymentStatus === 'PAID' ? 'green' : '#885500', marginTop: '2px' }}>{service.paymentStatus}</div>
                </div>
              </div>

              {/* ACTION REQUIRED: Missing Documents */}
              {(service.missingDocs || uploadedCount > 0) && (
                <fieldset style={{ border: '2px groove #c0c0c0', padding: '10px', background: '#ffebeb' }}>
                  <legend style={{ fontFamily: 'Tahoma', fontSize: '12px', padding: '0 4px', color: '#cc0000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} /> Action Required
                  </legend>
                  
                  {service.missingDocs && (
                    <div style={{ fontSize: '12px', color: '#880000', marginBottom: '12px', fontFamily: 'Tahoma', background: 'white', padding: '6px', border: '1px solid #ffcccc' }}>
                      <strong>Admin Message:</strong><br/>
                      {service.missingDocs}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input type="file" id="kiosk-upload" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleUpload} />
                    <button type="button" onClick={() => document.getElementById('kiosk-upload')?.click()} disabled={uploadingDoc}
                      style={{ ...btn, background: '#0a246a', color: 'white', padding: '10px', fontSize: '14px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                      {uploadingDoc ? 'Uploading...' : 'Take Photo / Upload'}
                    </button>
                    
                    {uploadedCount > 0 && (
                      <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '6px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> {uploadedCount} file(s) sent to Admin!
                      </div>
                    )}
                  </div>
                </fieldset>
              )}

              <button onClick={() => setService(null)} style={{ ...btn, width: '100%', marginTop: '10px' }}>
                Sign Out
              </button>

            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{ borderTop: '2px solid #808080', background: '#d4d0c8', padding: '2px 6px', fontSize: '11px', fontFamily: 'Tahoma', color: '#444' }}>
          Customer Tracker Portal
        </div>
      </div>
    </div>
  );
}
