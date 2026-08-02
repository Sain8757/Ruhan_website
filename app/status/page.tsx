"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function CustomerStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [mobile, setMobile] = useState(searchParams?.get('mobile') || '');
  const [trackingId, setTrackingId] = useState(searchParams?.get('trackingId') || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`/api/customer/status?mobile=${encodeURIComponent(mobile)}&trackingId=${encodeURIComponent(trackingId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch status');
      
      if (data.services && data.services.length > 0) {
        router.push(`/track/${data.services[0].trackingId}`);
      } else {
        throw new Error('Invalid Mobile Number or Tracking ID');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mobile && trackingId) {
      fetchStatus();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !trackingId) return;
    await fetchStatus();
  };

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
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', color: '#444', marginBottom: '8px' }}>
              Enter your Mobile Number AND Tracking ID to check status.
            </div>
            
            <div>
              <label style={{ fontFamily: 'Tahoma', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Mobile No:</label>
              <input 
                type="text" 
                value={mobile} 
                onChange={e => setMobile(e.target.value)} 
                required 
                placeholder="e.g. 9876543210" 
                style={{ ...inset, width: '100%', padding: '8px', fontSize: '14px', fontFamily: 'Tahoma' }} 
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Tahoma', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Tracking ID:</label>
              <input 
                type="text" 
                value={trackingId} 
                onChange={e => setTrackingId(e.target.value)} 
                required 
                placeholder="e.g. BE9ZZF" 
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

        </div>

        {/* Status Bar */}
        <div style={{ borderTop: '2px solid #808080', background: '#d4d0c8', padding: '2px 6px', fontSize: '11px', fontFamily: 'Tahoma', color: '#444' }}>
          Universal Tracker Portal v1.0
        </div>
      </div>
    </div>
  );
}

export default function CustomerStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#008080' }}>
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    }>
      <CustomerStatusContent />
    </Suspense>
  );
}
