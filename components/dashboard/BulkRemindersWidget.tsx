"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";

export default function BulkRemindersWidget() {
  const [loading, setLoading] = useState(true);
  const [pendingServices, setPendingServices] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cron/reminders")
      .then(res => res.json())
      .then(data => {
        setPendingServices(data.pending || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sendReminders = () => {
    if (pendingServices.length === 0) return;
    
    alert("This will open WhatsApp for each pending customer sequentially. Please allow popups.");
    
    pendingServices.forEach((s, index) => {
      setTimeout(() => {
        const text = encodeURIComponent(`Hello ${s.customer.name},\nAapka ${s.serviceType} application pending hai kyunki '${s.missingDocs}' jama nahi hua hai.\nKripya is link par jaakar document upload karein:\n\n🔗 ${window.location.origin}/status\n\nMobile: ${s.customer.mobile}\nTracking ID: ${s.trackingId}\n\nDhanyawad,\nRA Seva Point`);
        window.open(`https://wa.me/91${s.customer.mobile.replace(/\D/g,"").slice(-10)}?text=${text}`, "_blank");
      }, index * 2000); 
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse flex items-center justify-center min-h-[120px] mt-5">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (pendingServices.length === 0) return null;

  return (
    <div className="glass-card p-5 mt-5 border border-red-200" style={{ background: "rgba(254, 226, 226, 0.5)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-red-700 flex items-center gap-2 mb-1">
            <MessageCircle size={18} />
            Pending Document Reminders
          </h3>
          <p className="text-xs text-red-600 font-medium">
            {pendingServices.length} customer(s) are stuck due to missing documents.
          </p>
        </div>
        <button
          onClick={sendReminders}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
        >
          <MessageCircle size={16} />
          Send All Reminders
        </button>
      </div>
    </div>
  );
}
