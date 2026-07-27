"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Search, FileUp, CheckCircle, AlertTriangle, ArrowLeft, Clock, MessageSquare, CreditCard } from 'lucide-react';
import { format } from "date-fns";

export default function CustomerStatusPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);

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
    color: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setErrorMsg('');
    setServices([]);
    setSelectedService(null);
    setUploadedCount(0);
    
    try {
      const res = await fetch(`/api/customer/status?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch status');
      
      if (data.services.length === 1) {
        setSelectedService(data.services[0]);
      } else {
        setServices(data.services);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedService) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('trackingId', selectedService.trackingId);
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

  const formatCurrency = (amt: number) => `₹${amt.toFixed(2)}`;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-10 pb-20"
      style={{ backgroundColor: '#008080', backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}>
      
      <div style={{ ...raised, background: '#d4d0c8', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Title Bar */}
        <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            RA Seva Point Tracker
          </div>
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* LOGIN VIEW */}
          {!selectedService && services.length === 0 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', color: '#444', marginBottom: '8px' }}>
                Enter your Mobile Number or Tracking ID to check status.
              </div>
              
              <div>
                <label style={{ fontFamily: 'Tahoma', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Mobile No. OR Tracking ID:</label>
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  required 
                  placeholder="e.g. 9876543210 or BE9ZZF" 
                  style={{ ...inset, width: '100%', padding: '8px', fontSize: '14px', fontFamily: 'Tahoma' }} 
                />
              </div>

              {errorMsg && (
                <div style={{ background: '#ffcccc', border: '1px solid #cc0000', color: '#cc0000', padding: '8px', fontSize: '12px', textAlign: 'center', fontFamily: 'Tahoma', fontWeight: 'bold' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...btn, marginTop: '10px', height: '40px' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Searching...' : 'Find My Application'}
              </button>
            </form>
          )}

          {/* LIST VIEW (If Mobile Number has multiple services) */}
          {!selectedService && services.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: '#000080', borderBottom: '1px solid #808080', paddingBottom: '4px' }}>
                Found {services.length} Applications
              </div>
              
              <div style={{ ...inset, background: '#fff', maxHeight: '300px', overflowY: 'auto', padding: '2px' }}>
                {services.map((s, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedService(s)}
                    style={{ 
                      padding: '8px', 
                      borderBottom: '1px solid #eee', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: idx % 2 === 0 ? '#fafafa' : '#fff'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#e8f0ff')}
                    onMouseOut={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#fafafa' : '#fff')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.serviceType}</div>
                      <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', marginTop: '2px' }}>ID: {s.trackingId} • {format(new Date(s.createdAt), "dd MMM yy")}</div>
                    </div>
                    <div style={{ 
                      fontFamily: 'Tahoma', fontSize: '10px', fontWeight: 'bold', 
                      background: s.status === 'DELIVERED' ? '#d4edda' : '#fff3cd', 
                      color: s.status === 'DELIVERED' ? '#155724' : '#856404',
                      padding: '2px 6px', border: '1px solid #ccc'
                    }}>
                      {s.status}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => { setServices([]); setQuery(''); }} style={{ ...btn, marginTop: '8px' }}>
                <ArrowLeft size={14} /> Back to Search
              </button>
            </div>
          )}

          {/* DETAIL VIEW */}
          {selectedService && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              <div style={{ background: 'white', ...inset, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Hello, {selectedService.customerName}</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '18px', fontWeight: 'bold', color: '#000080', margin: '4px 0', lineHeight: '1.2' }}>{selectedService.serviceType}</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {format(new Date(selectedService.createdAt), "dd MMM yyyy")}
                </div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#888', marginTop: '4px' }}>Tracking ID: {selectedService.trackingId}</div>
              </div>

              {/* Status and Payment Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                
                {/* Application Status */}
                <div style={{ background: '#e8f0ff', border: '1px solid #aac', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555' }}>App Status</div>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '14px', fontWeight: 'bold', color: '#000080', marginTop: '2px' }}>{selectedService.status}</div>
                </div>

                {/* Payment Status */}
                <div style={{ background: selectedService.paymentStatus === 'PAID' ? '#d4edda' : '#fff8e8', border: selectedService.paymentStatus === 'PAID' ? '1px solid #c3e6cb' : '1px solid #cc9', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> Payment</div>
                  
                  <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: selectedService.paymentStatus === 'PAID' ? '#155724' : '#885500', marginTop: '2px' }}>
                    {selectedService.paymentStatus}
                  </div>
                  
                  <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#333', marginTop: '2px' }}>
                    {selectedService.paymentStatus === 'PENDING' ? `Due: ${formatCurrency(selectedService.fees)}` : 
                     selectedService.paymentStatus === 'PARTIAL' ? `Partial Paid (Total: ${formatCurrency(selectedService.fees)})` : 
                     `Paid: ${formatCurrency(selectedService.fees)}`}
                  </div>
                </div>
              </div>

              {/* Admin Comments (Notes) */}
              {selectedService.notes && (
                <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#f5f5f5' }}>
                  <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={12} /> Remarks
                  </legend>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {selectedService.notes}
                  </div>
                </fieldset>
              )}

              {/* ACTION REQUIRED: Missing Documents */}
              {(selectedService.missingDocs || uploadedCount > 0) && (
                <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#ffebeb' }}>
                  <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#cc0000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Action Required
                  </legend>
                  
                  {selectedService.missingDocs && (
                    <div style={{ fontSize: '12px', color: '#880000', marginBottom: '10px', fontFamily: 'Tahoma', background: 'white', padding: '6px', border: '1px solid #ffcccc' }}>
                      <strong>Required Document:</strong><br/>
                      {selectedService.missingDocs}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="file" id="kiosk-upload" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleUpload} />
                    <button type="button" onClick={() => document.getElementById('kiosk-upload')?.click()} disabled={uploadingDoc}
                      style={{ ...btn, background: '#0a246a', color: 'white', padding: '8px', fontSize: '13px', width: '100%' }}>
                      {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
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

              <button 
                onClick={() => {
                  setSelectedService(null);
                  // If we came from a multi-service search, we can go back to the list.
                  // If we came from a single ID search, clear everything.
                  if (services.length <= 1) {
                    setServices([]);
                    setQuery('');
                  }
                }} 
                style={{ ...btn, width: '100%', marginTop: '4px', height: '36px' }}
              >
                <ArrowLeft size={14} /> Back
              </button>

            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{ borderTop: '2px solid #808080', background: '#d4d0c8', padding: '2px 6px', fontSize: '11px', fontFamily: 'Tahoma', color: '#444' }}>
          Universal Tracker Portal v1.0
        </div>
      </div>
    </div>
  );
}
