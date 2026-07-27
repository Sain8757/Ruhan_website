"use client";
import React, { useState, useEffect } from 'react';
import { SERVICE_TYPES } from '@/lib/utils';
import { Loader2, Users } from 'lucide-react';

export default function KioskPage() {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState('');
  const [queuePosition, setQueuePosition] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Realtime clock for the retro feel
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/kiosk/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, serviceType })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setTicket(data.trackingId);
      setQueuePosition(data.queuePosition || 1);
      setErrorMsg('');
      setStep(3); // Success Screen
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center" style={{ backgroundColor: '#008080', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}>
      
      {/* Retro Window Container */}
      <div 
        className="w-full max-w-md bg-[#d4d0c8]"
        style={{
          borderTop: '2px solid #fff',
          borderLeft: '2px solid #fff',
          borderRight: '2px solid #404040',
          borderBottom: '2px solid #404040',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontFamily: 'Tahoma, sans-serif'
        }}
      >
        {/* Title Bar */}
        <div 
          style={{
            background: 'linear-gradient(to right, #000080 0%, #1084d0 100%)',
            color: 'white',
            padding: '4px 8px',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="flex items-center gap-2">
            <span>🏪</span>
            <span>Virtual Waiting Room - RA Seva Point</span>
          </div>
          <div className="flex gap-1">
            <button style={{ background: '#d4d0c8', borderTop: '1px solid #fff', borderLeft: '1px solid #fff', borderRight: '1px solid #404040', borderBottom: '1px solid #404040', color: 'black', width: '16px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>_</button>
            <button style={{ background: '#d4d0c8', borderTop: '1px solid #fff', borderLeft: '1px solid #fff', borderRight: '1px solid #404040', borderBottom: '1px solid #404040', color: 'black', width: '16px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>X</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-4">
          
          {/* Header Info */}
          <div className="flex items-center gap-4 border-b pb-4 border-gray-400">
            <div className="w-16 h-16 bg-[#000080] flex items-center justify-center shadow-inner" style={{ border: '2px inset #fff' }}>
              <Users size={32} color="#fff" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800" style={{ textShadow: '1px 1px 0px #fff' }}>Welcome to Kiosk</h1>
              <p className="text-sm text-gray-600">Please join the queue for service.</p>
              <p className="text-xs mt-1 text-[#000080] font-bold">Time: {time.toLocaleTimeString()}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-100 border border-red-500 text-red-700 px-3 py-2 text-sm flex justify-between items-center" style={{ boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.1)' }}>
              <span>{errorMsg}</span>
              <button className="font-bold px-2" onClick={() => setErrorMsg('')}>×</button>
            </div>
          )}
          
          {/* Form Steps */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (mobile.length === 10) { setStep(2); setErrorMsg(''); } else setErrorMsg('Enter exactly 10 digits.'); }} className="flex flex-col gap-4 py-2">
              <fieldset style={{ border: '2px groove #fff', padding: '10px', margin: '0' }}>
                <legend style={{ padding: '0 4px' }} className="text-sm">Step 1: Identification</legend>
                <div className="flex flex-col gap-1">
                  <label className="text-sm">Mobile Number:</label>
                  <input 
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-2 py-1 text-base"
                    style={{ borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', outline: 'none' }}
                    placeholder="Enter 10 digit mobile"
                    required
                  />
                </div>
              </fieldset>
              
              <div className="flex justify-end gap-2 mt-2">
                <button type="submit" className="px-6 py-1 font-bold" style={{ background: '#d4d0c8', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', cursor: 'pointer' }}>
                  Next &gt;
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
              <fieldset style={{ border: '2px groove #fff', padding: '10px', margin: '0' }}>
                <legend style={{ padding: '0 4px' }} className="text-sm">Step 2: Service Details</legend>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">Full Name:</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-2 py-1 text-base"
                      style={{ borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', outline: 'none' }}
                      placeholder="e.g. Rajesh Kumar"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">Service Required:</label>
                    <select 
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value)}
                      className="w-full px-2 py-1 text-base"
                      style={{ borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', outline: 'none', background: '#fff' }}
                    >
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-between items-center mt-2">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-1" style={{ background: '#d4d0c8', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', cursor: 'pointer' }}>
                  &lt; Back
                </button>
                <button type="submit" disabled={loading} className="px-6 py-1 font-bold flex items-center gap-2" style={{ background: '#d4d0c8', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', cursor: loading ? 'wait' : 'pointer' }}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="w-full bg-white p-4 flex flex-col items-center justify-center shadow-inner" style={{ border: '2px inset #fff', minHeight: '180px' }}>
                <h2 className="text-2xl font-bold text-[#008000] mb-2" style={{ textShadow: '1px 1px 0px #ccc' }}>Success!</h2>
                <p className="text-sm mb-4">Your request has been added to the queue.</p>
                
                <div className="bg-[#ffffcc] p-4 border border-[#cccc99] w-full max-w-[200px]">
                  <p className="text-xs text-gray-600 uppercase">Ticket Number</p>
                  <p className="text-3xl font-bold text-[#000080] font-mono tracking-widest">{ticket}</p>
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Users size={18} color="#000080" />
                  <span className="text-sm font-bold">Queue Position: <span className="text-[#000080] text-lg">{queuePosition}</span></span>
                </div>
              </div>
              
              <button 
                onClick={() => { setStep(1); setMobile(''); setName(''); }} 
                className="w-full px-4 py-2 font-bold text-base mt-2" 
                style={{ background: '#d4d0c8', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          )}

        </div>
        
        {/* Status Bar */}
        <div className="bg-[#d4d0c8] p-1 text-xs flex justify-between border-t border-gray-400" style={{ borderTop: '2px solid #fff', boxShadow: 'inset 0 1px 0 #808080' }}>
          <span className="px-2" style={{ borderRight: '2px groove #fff' }}>Step {step} of 3</span>
          <span className="px-2" style={{ borderRight: '2px groove #fff' }}>System Active</span>
          <span className="px-2">Virtual Kiosk v1.0</span>
        </div>
      </div>
    </div>
  );
}
