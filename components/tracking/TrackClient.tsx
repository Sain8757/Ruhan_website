"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, CreditCard, MessageSquare, AlertTriangle, FileUp, Loader2, CheckCircle, Download, Phone, Star, Share2, MapPin, Printer, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import TokenReceipt from "@/components/kiosk/TokenReceipt";

// Simple Win95 Styles
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
  padding: '4px 8px',
  fontFamily: 'Tahoma',
  fontSize: '12px',
  color: '#000',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
};

export default function TrackClient({ service: initialService, settings, queuePosition }: { service: any, settings: any, queuePosition: number }) {
  const [service, setService] = useState(initialService);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  
  const [rating, setRating] = useState<number>(initialService.rating || 0);
  const [feedback, setFeedback] = useState<string>(initialService.feedback || "");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatSuccess, setChatSuccess] = useState(false);
  
  const [printRequesting, setPrintRequesting] = useState(false);
  const [printRequested, setPrintRequested] = useState(false);
  
  const [refreshCountdown, setRefreshCountdown] = useState(60);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Auto-Refresh Logic (Feature 6)
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Fetch updated service data
          fetch(`/api/services/${service.id}`)
            .then(res => res.json())
            .then(data => {
              if (data && !data.error) setService(data);
            })
            .catch(console.error);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [service.id]);

  const formatCurrency = (amt: number) => `₹${amt.toFixed(2)}`;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingDoc(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('trackingId', service.trackingId);
      
      const res = await fetch('/api/kiosk/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      
      setUploadedCount(prev => prev + 1);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const submitRating = async () => {
    if (rating === 0) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/services/${service.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      setRatingSuccess(true);
      setService((prev: any) => ({ ...prev, rating, feedback }));
    } catch (err) {
      alert("Error saving rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Feature 5: In-App Chat
  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    setChatSending(true);
    try {
      const res = await fetch(`/api/services/${service.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `[Customer Msg]: ${chatMessage}` }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setChatSuccess(true);
      setChatMessage("");
      setTimeout(() => setChatSuccess(false), 3000);
    } catch (err) {
      alert("Error sending message");
    } finally {
      setChatSending(false);
    }
  };

  // Feature 3: Request Printout
  const requestPrintout = async () => {
    setPrintRequesting(true);
    try {
      await fetch(`/api/services/${service.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🖨️ [SYSTEM]: Customer requested a physical printout of the final documents.` }),
      });
      setPrintRequested(true);
    } catch (err) {
      alert("Error requesting printout");
    } finally {
      setPrintRequesting(false);
    }
  };

  // Feature 2: Share Status
  const shareStatus = async () => {
    const url = window.location.href;
    const title = `${settings?.shopName || 'RA Seva Point'} Tracking`;
    const text = `Track my ${service.serviceType} application here:`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert("Tracking link copied to clipboard!");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Token_${service.trackingId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error generating receipt", error);
      alert("Could not generate receipt image.");
    }
  };

  // Generate UPI URI
  const amountDue = service.fees - service.amountPaid;
  const upiLink = settings?.upiId && amountDue > 0 
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName || "RA Seva Point")}&tr=${service.trackingId}&am=${amountDue}&cu=INR` 
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-10 pb-20"
      style={{ backgroundColor: '#008080', backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}>
      
      <div style={{ ...raised, background: '#d4d0c8', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Title Bar */}
        <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            {settings?.shopName || 'RA Seva Point'} Tracker
          </div>
          <div style={{ fontSize: '10px', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} /> Auto-refresh in {refreshCountdown}s
          </div>
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Header Info */}
            <div style={{ background: 'white', ...inset, padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Hello, {service.customer.name}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '18px', fontWeight: 'bold', color: '#000080', margin: '4px 0', lineHeight: '1.2' }}>{service.serviceType}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {format(new Date(service.createdAt), "dd MMM yyyy")}
              </div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#888', marginTop: '4px' }}>Tracking ID: {service.trackingId}</div>
              
              {service.deadline && (
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 'bold' }}>
                  Expected: {format(new Date(service.deadline), "dd MMM yyyy")}
                </div>
              )}
            </div>

            {/* Feature 2: Share Button */}
            <button onClick={shareStatus} style={{ ...btn, width: '100%', height: '32px' }}>
              <Share2 size={14} /> Share Status Link
            </button>

            {service.status === 'PENDING' && queuePosition > 0 && (
              <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '8px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>
                You are number {queuePosition} in queue.
              </div>
            )}

            {/* Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#e8f0ff', border: '1px solid #aac', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555' }}>App Status</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '14px', fontWeight: 'bold', color: '#000080', marginTop: '2px' }}>{service.status}</div>
              </div>

              <div style={{ background: service.paymentStatus === 'PAID' ? '#d4edda' : '#fff8e8', border: service.paymentStatus === 'PAID' ? '1px solid #c3e6cb' : '1px solid #cc9', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> Payment</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: service.paymentStatus === 'PAID' ? '#155724' : '#885500', marginTop: '2px' }}>
                  {service.paymentStatus}
                </div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#333', marginTop: '2px' }}>
                  {service.paymentStatus === 'UNPAID' ? `Due: ${formatCurrency(amountDue)}` : 
                   service.paymentStatus === 'PARTIAL' ? `Due: ${formatCurrency(amountDue)}` : 
                   `Paid: ${formatCurrency(service.fees)}`}
                </div>
              </div>
            </div>

            {upiLink && (
              <a href={upiLink} style={{ ...btn, background: '#10b981', color: 'white', padding: '10px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
                Pay {formatCurrency(amountDue)} via UPI
              </a>
            )}

            {/* Feature 4: Govt Tracking Link */}
            {service.referenceNo && (
              <div style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#333', marginBottom: '4px' }}>
                  Reference / AWB: <strong>{service.referenceNo}</strong>
                </div>
                <a href={`https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`} target="_blank" rel="noreferrer" style={{ ...btn, background: '#e0f2fe', width: '100%' }}>
                  <ExternalLink size={12} /> Track on India Post
                </a>
              </div>
            )}

            {/* Feature 1: Loyalty Points Catalog */}
            {service.status === 'DELIVERED' && service.fees > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '8px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '11px', color: '#92400e' }}>
                <strong style={{ fontSize: '12px' }}>Reward Points Earned: {Math.floor(service.fees / 10)}</strong><br/>
                Total Balance: {service.customer.loyaltyPoints} Points
                <hr style={{ borderTop: '1px dotted #d97706', margin: '4px 0' }} />
                <em>💡 100 Points = 1 Free Color Printout!</em>
              </div>
            )}

            {/* Feature 3: Request Physical Printout */}
            {service.status === 'DELIVERED' && service.serviceDocUrls?.length > 0 && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#e0f2fe' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#0369a1', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={12} /> Final Documents
                </legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {service.serviceDocUrls.map((url: string, idx: number) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ ...btn, background: 'white', justifyContent: 'flex-start' }}>
                      📄 Download File {idx + 1}
                    </a>
                  ))}
                  <button 
                    onClick={requestPrintout} 
                    disabled={printRequesting || printRequested}
                    style={{ ...btn, marginTop: '4px', background: printRequested ? '#d4edda' : '#d4d0c8', color: printRequested ? '#155724' : '#000' }}>
                    <Printer size={12} /> {printRequested ? 'Print Requested!' : 'Request Physical Print at Shop'}
                  </button>
                </div>
              </fieldset>
            )}

            {service.notes && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#f5f5f5' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={12} /> Remarks
                </legend>
                <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {service.notes}
                </div>
              </fieldset>
            )}

            {(service.missingDocs || uploadedCount > 0) && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#ffebeb' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#cc0000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> Action Required
                </legend>
                
                {service.missingDocs && (
                  <div style={{ fontSize: '12px', color: '#880000', marginBottom: '10px', fontFamily: 'Tahoma', background: 'white', padding: '6px', border: '1px solid #ffcccc' }}>
                    <strong>Required Document:</strong><br/>
                    {service.missingDocs}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="file" id="kiosk-upload" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" style={{ display: 'none' }} onChange={handleUpload} />
                  <button type="button" onClick={() => document.getElementById('kiosk-upload')?.click()} disabled={uploadingDoc}
                    style={{ ...btn, background: '#0a246a', color: 'white', padding: '8px', fontSize: '13px', width: '100%' }}>
                    {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                    {uploadingDoc ? 'Uploading...' : 'Take Photo / Select File'}
                  </button>
                  
                  {uploadedCount > 0 && (
                    <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '6px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> {uploadedCount} file(s) sent to Admin!
                    </div>
                  )}
                </div>
              </fieldset>
            )}

            {/* Feature 5: In-App Chat */}
            {service.status !== 'DELIVERED' && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#fff' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold' }}>
                  Ask a Question
                </legend>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" 
                    value={chatMessage} 
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{ ...inset, flex: 1, padding: '4px', fontSize: '11px', fontFamily: 'Tahoma' }}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  />
                  <button onClick={sendChatMessage} disabled={chatSending || !chatMessage.trim()} style={{ ...btn, background: '#0a246a', color: 'white' }}>
                    Send
                  </button>
                </div>
                {chatSuccess && <div style={{ fontSize: '10px', color: 'green', marginTop: '4px' }}>Message sent to Admin!</div>}
              </fieldset>
            )}

            {service.status === 'DELIVERED' && !service.rating && !ratingSuccess && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#fff' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold' }}>
                  Rate Our Service
                </legend>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={24} 
                      color={rating >= star ? '#fbbf24' : '#cbd5e1'} 
                      fill={rating >= star ? '#fbbf24' : 'none'} 
                      onClick={() => setRating(star)} 
                      style={{ cursor: 'pointer' }} 
                    />
                  ))}
                </div>
                {rating > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea 
                      placeholder="Optional feedback..."
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      style={{ ...inset, width: '100%', padding: '6px', fontSize: '12px', fontFamily: 'Tahoma', minHeight: '50px' }}
                    />
                    <button onClick={submitRating} disabled={ratingSubmitting} style={{ ...btn, background: '#0a246a', color: 'white' }}>
                      {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                )}
              </fieldset>
            )}
            
            {(service.rating > 0 || ratingSuccess) && (
              <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '8px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', fontWeight: 'bold' }}>
                Thank you for your rating! 
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={14} color={Math.max(rating, service.rating || 0) >= star ? '#fbbf24' : '#cbd5e1'} fill={Math.max(rating, service.rating || 0) >= star ? '#fbbf24' : 'none'} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons: WhatsApp & Call & Map */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              {settings?.shopPhone && (
                <a href={`https://wa.me/${settings.shopPhone.replace(/\\D/g,'')}?text=Hi, I need help with my tracking ID: ${service.trackingId}`} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: 'none', background: '#25D366', color: 'white' }}>
                  <MessageSquare size={14} /> WhatsApp
                </a>
              )}
              {settings?.shopPhone && (
                <a href={`tel:${settings.shopPhone.replace(/\\D/g,'')}`} style={{ ...btn, textDecoration: 'none' }}>
                  <Phone size={14} /> Call
                </a>
              )}
              
              {/* Feature 7: Navigate to Shop */}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.shopName || 'RA Seva Point')}`} target="_blank" rel="noreferrer" style={{ ...btn, gridColumn: '1 / -1', textDecoration: 'none' }}>
                <MapPin size={14} /> Get Directions to Shop
              </a>
            </div>

            <button onClick={handleDownloadReceipt} style={{ ...btn, width: '100%', height: '32px' }}>
              <Download size={14} /> Save Token Receipt
            </button>

            <div style={{ marginTop: '10px', background: '#0a246a', color: 'white', padding: '10px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '11px', border: '1px solid #000' }}>
              <strong>🌟 SPECIAL OFFER 🌟</strong><br/>
              Need a Flight Ticket or Hotel? Ask us today for best rates!
            </div>

          </div>
        </div>
      </div>
      
      {/* Hidden Receipt for html2canvas */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef}>
          <TokenReceipt 
            data={{
              shopName: settings?.shopName,
              tokenNumber: service.tokenNumber || 0,
              trackingId: service.trackingId,
              referenceNo: service.referenceNo || undefined,
              serviceType: service.serviceType,
              customerName: service.customer.name,
              customerMobile: service.customer.mobile,
              createdAt: service.createdAt,
            }}
          />
        </div>
      </div>

    </div>
  );
}
