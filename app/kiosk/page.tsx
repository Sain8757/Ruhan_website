"use client";
import React, { useState } from 'react';
import { SERVICE_TYPES } from '@/lib/utils';

export default function KioskPage() {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('');
      setStep(3); // Success Screen
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={{ fontFamily: 'sans-serif' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
        
        {errorMsg && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{errorMsg}</span>
            <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMsg('')}>
              <span>×</span>
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome to RS Seva Point</h1>
          <p className="text-gray-500 text-sm mt-1">Self-Service Queue Kiosk</p>
        </div>

        {/* Form Steps */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); if (mobile.length === 10) { setStep(2); setErrorMsg(''); } else setErrorMsg('Enter 10 digit mobile'); }} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input 
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\\D/g, '').slice(0, 10))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                placeholder="Enter 10 digit mobile"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
              Next ➔
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Rajesh Kumar"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
              <select 
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <button type="button" className="w-full bg-gray-100 border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition">
              <span>📷</span> Upload Documents (Optional)
            </button>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition">
                Back
              </button>
              <button type="submit" disabled={loading} className="w-2/3 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
                {loading ? 'Joining Queue...' : 'Join Queue'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-green-500">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Queue Joined!</h2>
            <p className="text-gray-500 mb-6">Please show this ticket number at the counter.</p>
            
            <div className="bg-gray-100 p-6 rounded-xl inline-block mb-6 border border-gray-200">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Ticket No.</p>
              <p className="text-4xl font-mono font-bold text-blue-600">{ticket}</p>
            </div>
            
            <button onClick={() => { setStep(1); setMobile(''); setName(''); }} className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition">
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
