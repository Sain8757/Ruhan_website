"use client";

import { useState, useEffect } from "react";
import { Users, MessageCircle, Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/contexts/ToastContext";

export default function MarketingPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Namaste [Name],\n\nSpecial offer at RA Seva Point today! Get 10% off on all services.\n\nRegards,\nRA Seva Point");
  
  const [isSending, setIsSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  
  const toast = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers?limit=1000"); // fetch all
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const startCampaign = () => {
    if (!message.trim()) return toast.error("Please enter a message");
    if (customers.length === 0) return toast.error("No customers found");
    
    setIsSending(true);
    setCurrentIndex(0);
    setSentCount(0);
  };

  const stopCampaign = () => {
    setIsSending(false);
  };

  useEffect(() => {
    if (!isSending) return;
    if (currentIndex >= customers.length) {
      setIsSending(false);
      toast.success("Campaign finished!");
      return;
    }

    const customer = customers[currentIndex];
    
    if (customer.mobile) {
      // Replace variables
      const personalizedMessage = message.replace(/\[Name\]/g, customer.name);
      
      // Open WhatsApp Web
      const url = `https://wa.me/91${customer.mobile}?text=${encodeURIComponent(personalizedMessage)}`;
      
      const win = window.open(url, "_blank");
      
      if (!win) {
        toast.error("Popup blocked! Please allow popups for this site.");
        setIsSending(false);
        return;
      }
      
      setSentCount(prev => prev + 1);
    }
    
    // Move to next after a delay to allow the user to click "Send" in WA Web
    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 5000); // 5 seconds between messages
    
    return () => clearTimeout(timer);
    
  }, [isSending, currentIndex, customers, message, toast]);


  return (
    <div className="page-shell">
      <PageHeader
        title="WhatsApp Marketing"
        subtitle="Bulk messaging campaign to your customers"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        
        {/* Campaign Settings */}
        <div className="legacy-fieldset" style={{ background: '#fff' }}>
          <div className="legacy-legend">Campaign Details</div>
          
          <div className="mb-4">
            <label className="label text-sm font-bold">Target Audience</label>
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 mt-1">
              <Users size={20} />
              <span className="font-semibold">All Registered Customers ({customers.length})</span>
              {loading && <Loader2 size={14} className="animate-spin ml-2" />}
            </div>
          </div>

          <div className="mb-4">
            <label className="label text-sm font-bold flex justify-between">
              <span>Message Template</span>
              <span className="text-xs font-normal text-slate-500">Use [Name] to insert customer name</span>
            </label>
            <textarea
              className="legacy-input"
              style={{ width: '100%', minHeight: '150px', fontFamily: 'inherit', resize: 'vertical' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="flex gap-2 border-t pt-4 border-slate-200">
            {!isSending ? (
              <button 
                className="legacy-button" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', background: '#0a246a', color: 'white' }}
                onClick={startCampaign}
                disabled={customers.length === 0 || loading}
              >
                <Play size={16} className="inline mr-2" />
                Start Campaign
              </button>
            ) : (
              <button 
                className="legacy-button" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', background: '#cc0000', color: 'white' }}
                onClick={stopCampaign}
              >
                <Pause size={16} className="inline mr-2" />
                Pause Campaign
              </button>
            )}
          </div>
          
          <div className="mt-3 text-xs text-slate-500 flex items-start gap-1">
            <AlertCircle size={14} className="shrink-0 text-amber-500" />
            <p>Ensure you have allowed Popups for this website in your browser settings before starting. The campaign will open a new WhatsApp Web tab every 5 seconds.</p>
          </div>
        </div>

        {/* Campaign Status Tracker */}
        <div className="legacy-fieldset" style={{ background: '#d4d0c8' }}>
          <div className="legacy-legend">Campaign Progress</div>
          
          <div className="p-4 bg-white border border-slate-400 mb-4 shadow-inner" style={{ minHeight: '200px' }}>
            <div className="text-center mb-6 mt-4">
              <div className="text-4xl font-black text-blue-900 mb-1">{sentCount} / {customers.length}</div>
              <div className="text-sm font-bold text-slate-600 uppercase tracking-widest">Messages Queued</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-6 border border-slate-400 p-0.5 relative">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ 
                  width: `${customers.length > 0 ? (sentCount / customers.length) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #0a246a, #3b82f6)'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: sentCount > customers.length / 2 ? 'white' : 'black', textShadow: sentCount > customers.length / 2 ? '1px 1px 0 #000' : 'none' }}>
                {Math.round(customers.length > 0 ? (sentCount / customers.length) * 100 : 0)}%
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-xs border-b border-slate-200 pb-1">
                <span className="font-bold">Status:</span>
                <span className={isSending ? "text-blue-600 font-bold" : "text-slate-500"}>
                  {isSending ? "Active - Sending Messages..." : "Idle"}
                </span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-200 pb-1">
                <span className="font-bold">Current Target:</span>
                <span className="truncate max-w-[200px]">
                  {isSending && customers[currentIndex] ? `${customers[currentIndex].name} (${customers[currentIndex].mobile})` : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
