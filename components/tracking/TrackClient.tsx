"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, CreditCard, MessageSquare, AlertTriangle, FileUp, Loader2, CheckCircle, Download, Phone, Star, Share2, MapPin, Printer, ExternalLink, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import TokenReceipt from "@/components/kiosk/TokenReceipt";

// Dictionary for Multi-Language
const T = {
  en: {
    hello: 'Hello', trackingId: 'Tracking ID', expected: 'Expected', shareLink: 'Share Status Link',
    appStatus: 'App Status', payment: 'Payment', due: 'Due', paid: 'Paid', payUpi: 'Pay via UPI',
    trackIndiaPost: 'Track on India Post', rewardPoints: 'Reward Points Earned', totalBalance: 'Total Balance',
    freePrintout: '100 Points = 1 Free Color Printout!', finalDocs: 'Final Documents', downloadFile: 'Download File',
    requestPrint: 'Request Physical Print at Shop', remarks: 'Remarks', actionRequired: 'Action Required',
    reqDoc: 'Required Document', uploading: 'Uploading...', takePhoto: 'Take Photo / Select File',
    filesSent: 'file(s) sent to Admin!', askQuestion: 'Ask a Question', typeMsg: 'Type your message...',
    send: 'Send', msgSent: 'Message sent to Admin!', rateService: 'Rate Our Service', optFeedback: 'Optional feedback...',
    submitting: 'Submitting...', submitRating: 'Submit Rating', thankYouRating: 'Thank you for your rating!',
    getDirections: 'Get Directions to Shop', saveReceipt: 'Save Token Receipt', specialOffer: '🌟 SPECIAL OFFER 🌟',
    offerText: 'Need a Flight Ticket or Hotel? Ask us today for best rates!', payToUnlock: 'Pay to Unlock Documents',
    locked: '🔒 Locked', visitShop: 'Schedule Shop Visit', date: 'Date', time: 'Time', bookVisit: 'Book Visit',
    visitBooked: 'Visit Booked!', commonQs: 'Common FAQs', referEarn: '🎁 Refer & Earn 50 Points',
    crossSellPan: 'Need to link Aadhaar with PAN? Apply now for ₹50!',
    crossSellAadhaar: 'Need PVC Aadhaar Card? Get it printed today!',
    q1: 'How much time will it take?', a1: 'Expected date is mentioned above. Usually takes 2-3 days.',
    q2: 'Why is my document locked?', a2: 'Documents will auto-unlock once the due payment is cleared via UPI.',
    q3: 'How to pay?', a3: 'Tap the green UPI button, it will automatically open GPay/PhonePe on your phone.'
  },
  hi: {
    hello: 'नमस्ते', trackingId: 'ट्रैकिंग आईडी', expected: 'अपेक्षित तिथि', shareLink: 'स्टेटस लिंक शेयर करें',
    appStatus: 'एप्लीकेशन स्टेटस', payment: 'भुगतान', due: 'बाकी', paid: 'जमा', payUpi: 'UPI से पेमेंट करें',
    trackIndiaPost: 'India Post पर ट्रैक करें', rewardPoints: 'रिवॉर्ड पॉइंट्स मिले', totalBalance: 'कुल बैलेंस',
    freePrintout: '100 पॉइंट्स = 1 फ्री कलर प्रिंटआउट!', finalDocs: 'अंतिम दस्तावेज़', downloadFile: 'फाइल डाउनलोड करें',
    requestPrint: 'दुकान पर प्रिंट के लिए कहें', remarks: 'टिप्पणियाँ', actionRequired: 'ध्यान दें',
    reqDoc: 'आवश्यक दस्तावेज़', uploading: 'अपलोड हो रहा है...', takePhoto: 'फोटो खींचें / फाइल चुनें',
    filesSent: 'फाइल(s) एडमिन को भेजी गई!', askQuestion: 'सवाल पूछें', typeMsg: 'अपना मैसेज लिखें...',
    send: 'भेजें', msgSent: 'मैसेज एडमिन को भेजा गया!', rateService: 'हमारी सर्विस को रेट करें', optFeedback: 'अपना फीडबैक दें (Optional)...',
    submitting: 'सबमिट हो रहा है...', submitRating: 'रेटिंग सबमिट करें', thankYouRating: 'रेटिंग देने के लिए धन्यवाद!',
    getDirections: 'दुकान का रास्ता (Map)', saveReceipt: 'टोकन रसीद सेव करें', specialOffer: '🌟 खास ऑफर 🌟',
    offerText: 'फ्लाइट टिकट या होटल बुक करना है? आज ही हमसे बेहतरीन रेट्स पूछें!', payToUnlock: 'दस्तावेज़ खोलने के लिए बकाया पेमेंट करें',
    locked: '🔒 लॉक्ड', visitShop: 'दुकान आने का समय बुक करें', date: 'तारीख', time: 'समय', bookVisit: 'समय बुक करें',
    visitBooked: 'समय बुक हो गया!', commonQs: 'आम सवाल (FAQs)', referEarn: '🎁 शेयर करें और 50 पॉइंट्स पाएं',
    crossSellPan: 'PAN को Aadhaar से लिंक करना है? सिर्फ ₹50 में अप्लाई करें!',
    crossSellAadhaar: 'PVC Aadhaar कार्ड चाहिए? आज ही प्रिंट करवाएं!',
    q1: 'कितना समय लगेगा?', a1: 'अपेक्षित तारीख ऊपर दी गई है। आमतौर पर 2-3 दिन लगते हैं।',
    q2: 'मेरा दस्तावेज़ लॉक क्यों है?', a2: 'बचे हुए पेमेंट को UPI से क्लियर करते ही दस्तावेज़ अनलॉक हो जाएंगे।',
    q3: 'पेमेंट कैसे करें?', a3: 'हरे रंग का UPI बटन दबाएं, यह आपके फोन में GPay/PhonePe खोल देगा।'
  }
};

const inset: React.CSSProperties = {
  borderTop: '2px solid #808080', borderLeft: '2px solid #808080',
  borderRight: '2px solid #ffffff', borderBottom: '2px solid #ffffff',
  background: '#ffffff',
};
const raised: React.CSSProperties = {
  borderTop: '2px solid #ffffff', borderLeft: '2px solid #ffffff',
  borderRight: '2px solid #404040', borderBottom: '2px solid #404040',
};
const btn: React.CSSProperties = {
  ...raised, background: '#d4d0c8', padding: '4px 8px', fontFamily: 'Tahoma',
  fontSize: '12px', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
};

export default function TrackClient({ service: initialService, settings, queuePosition }: { service: any, settings: any, queuePosition: number }) {
  const [lang, setLang] = useState<'en'|'hi'>('en');
  const t = (key: keyof typeof T.en) => T[lang][key];

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

  // Scheduling State
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitBooking, setVisitBooking] = useState(false);
  const [visitBooked, setVisitBooked] = useState(false);

  // FAQ State
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetch(`/api/services/${service.id}`).then(res => res.json()).then(data => {
            if (data && !data.error) setService(data);
          }).catch(console.error);
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
      const fd = new FormData();
      fd.append('file', e.target.files[0]);
      fd.append('trackingId', service.trackingId);
      const res = await fetch('/api/kiosk/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error("Upload failed");
      setUploadedCount(prev => prev + 1);
    } catch (err: any) { alert(err.message); } finally { setUploadingDoc(false); e.target.value = ''; }
  };

  const submitRating = async () => {
    if (rating === 0) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/services/${service.id}/rate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      if (!res.ok) throw new Error("Failed");
      setRatingSuccess(true);
      setService((prev: any) => ({ ...prev, rating, feedback }));
    } catch (err) { alert("Error saving rating"); } finally { setRatingSubmitting(false); }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    setChatSending(true);
    try {
      const res = await fetch(`/api/services/${service.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `[Customer Msg]: ${chatMessage}` }),
      });
      if (!res.ok) throw new Error("Failed");
      setChatSuccess(true);
      setChatMessage("");
      setTimeout(() => setChatSuccess(false), 3000);
    } catch (err) { alert("Error sending message"); } finally { setChatSending(false); }
  };

  const requestPrintout = async () => {
    setPrintRequesting(true);
    try {
      await fetch(`/api/services/${service.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🖨️ [SYSTEM]: Customer requested a physical printout of the final documents.` }),
      });
      setPrintRequested(true);
    } catch (err) { alert("Error requesting printout"); } finally { setPrintRequesting(false); }
  };

  const bookVisit = async () => {
    if (!visitDate || !visitTime) return;
    setVisitBooking(true);
    try {
      await fetch(`/api/services/${service.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `📅 [SYSTEM]: Customer scheduled a shop visit for ${visitDate} at ${visitTime}.` }),
      });
      setVisitBooked(true);
    } catch (err) { alert("Error booking visit"); } finally { setVisitBooking(false); }
  };

  const shareStatus = async () => {
    const url = window.location.href;
    const title = `${settings?.shopName || 'RA Seva Point'} Tracking`;
    const text = `Track my ${service.serviceType} application here:`;
    if (navigator.share) { try { await navigator.share({ title, text, url }); } catch (err) {} } 
    else { navigator.clipboard.writeText(`${text} ${url}`); alert("Tracking link copied to clipboard!"); }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `Token_${service.trackingId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) { alert("Could not generate receipt image."); }
  };

  const amountDue = service.fees - service.amountPaid;
  const upiLink = settings?.upiId && amountDue > 0 
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName || "RA Seva Point")}&tr=${service.trackingId}&am=${amountDue}&cu=INR` 
    : null;

  const isPaid = service.paymentStatus === 'PAID';
  const referMsg = `Namaste! Maine apna kaam RA Seva Point par karwaya, bahut badhiya service hai. Aap bhi try karein! Tracking Portal: ${window.location.origin}`;
  const referLink = `https://wa.me/?text=${encodeURIComponent(referMsg)}`;

  // Timeline Progress calculation
  const steps = [
    { label: 'Token Issued', done: true },
    { label: 'Processing', done: ['PROCESSING', 'COMPLETED', 'DELIVERED'].includes(service.status) },
    { label: 'Ready', done: ['COMPLETED', 'DELIVERED'].includes(service.status) },
    { label: 'Delivered', done: service.status === 'DELIVERED' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-10 pb-20"
      style={{ backgroundColor: '#008080', backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}>
      
      <div style={{ ...raised, background: '#d4d0c8', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Title Bar with Language Toggle */}
        <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} /> {settings?.shopName || 'RA Seva Point'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontFamily: 'Tahoma' }}>
              <Globe size={12} /> {lang === 'en' ? 'हिंदी' : 'EN'}
            </button>
            <div style={{ fontSize: '10px', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} /> {refreshCountdown}s
            </div>
          </div>
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Header Info */}
            <div style={{ background: 'white', ...inset, padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>{t('hello')}, {service.customer.name}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '18px', fontWeight: 'bold', color: '#000080', margin: '4px 0', lineHeight: '1.2' }}>{service.serviceType}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {format(new Date(service.createdAt), "dd MMM yyyy")}
              </div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#888', marginTop: '4px' }}>{t('trackingId')}: {service.trackingId}</div>
              
              {service.deadline && (
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 'bold' }}>
                  {t('expected')}: {format(new Date(service.deadline), "dd MMM yyyy")}
                </div>
              )}

              {/* Feature 1: Visual Timeline */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '5px', left: '10%', right: '10%', height: '2px', background: '#e5e7eb', zIndex: 1 }} />
                {steps.map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', flex: 1, fontSize: '10px', color: s.done ? '#000080' : '#888', fontWeight: s.done ? 'bold' : 'normal', zIndex: 2 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.done ? '#000080' : '#e5e7eb', margin: '0 auto 4px', border: s.done ? '2px solid #e0f2fe' : '2px solid #fff' }} />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={shareStatus} style={{ ...btn, width: '100%', height: '32px' }}>
              <Share2 size={14} /> {t('shareLink')}
            </button>

            {service.status === 'PENDING' && queuePosition > 0 && (
              <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '8px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>
                You are number {queuePosition} in queue.
              </div>
            )}

            {/* Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#e8f0ff', border: '1px solid #aac', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555' }}>{t('appStatus')}</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '14px', fontWeight: 'bold', color: '#000080', marginTop: '2px' }}>{service.status}</div>
              </div>

              <div style={{ background: service.paymentStatus === 'PAID' ? '#d4edda' : '#fff8e8', border: service.paymentStatus === 'PAID' ? '1px solid #c3e6cb' : '1px solid #cc9', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> {t('payment')}</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: service.paymentStatus === 'PAID' ? '#155724' : '#885500', marginTop: '2px' }}>
                  {service.paymentStatus}
                </div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#333', marginTop: '2px' }}>
                  {service.paymentStatus === 'UNPAID' ? `${t('due')}: ${formatCurrency(amountDue)}` : 
                   service.paymentStatus === 'PARTIAL' ? `${t('due')}: ${formatCurrency(amountDue)}` : 
                   `${t('paid')}: ${formatCurrency(service.fees)}`}
                </div>
              </div>
            </div>

            {upiLink && (
              <a href={upiLink} style={{ ...btn, background: '#10b981', color: 'white', padding: '10px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
                {t('payUpi')} {formatCurrency(amountDue)}
              </a>
            )}

            {/* Feature 4: Cross-Selling / Refer & Earn */}
            <a href={referLink} target="_blank" rel="noreferrer" style={{ ...btn, width: '100%', height: '32px', background: '#fef08a', border: '2px outset #fef08a' }}>
              {t('referEarn')}
            </a>
            {service.serviceType?.toLowerCase().includes('pan') && (
              <div style={{ background: '#e0e7ff', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                💡 {t('crossSellPan')}
              </div>
            )}
            {(service.serviceType?.toLowerCase().includes('aadhaar') || service.serviceType?.toLowerCase().includes('uidai')) && (
              <div style={{ background: '#e0e7ff', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                💡 {t('crossSellAadhaar')}
              </div>
            )}

            {service.referenceNo && (
              <div style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#333', marginBottom: '4px' }}>
                  Reference / AWB: <strong>{service.referenceNo}</strong>
                </div>
                <a href={`https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`} target="_blank" rel="noreferrer" style={{ ...btn, background: '#e0f2fe', width: '100%' }}>
                  <ExternalLink size={12} /> {t('trackIndiaPost')}
                </a>
              </div>
            )}

            {service.status === 'DELIVERED' && service.fees > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '8px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '11px', color: '#92400e' }}>
                <strong style={{ fontSize: '12px' }}>{t('rewardPoints')}: {Math.floor(service.fees / 10)}</strong><br/>
                {t('totalBalance')}: {service.customer.loyaltyPoints} Points
                <hr style={{ borderTop: '1px dotted #d97706', margin: '4px 0' }} />
                <em>💡 {t('freePrintout')}</em>
              </div>
            )}

            {/* Feature 2: Document Watermarking / Pay to Unlock */}
            {['COMPLETED', 'DELIVERED'].includes(service.status) && service.serviceDocUrls?.length > 0 && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: isPaid ? '#e0f2fe' : '#fff1f2' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: isPaid ? '#0369a1' : '#be123c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={12} /> {t('finalDocs')}
                </legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {!isPaid ? (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔒</div>
                      <div style={{ fontSize: '11px', color: '#be123c', fontWeight: 'bold' }}>{t('payToUnlock')}</div>
                    </div>
                  ) : (
                    <>
                      {service.serviceDocUrls.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ ...btn, background: 'white', justifyContent: 'flex-start' }}>
                          📄 {t('downloadFile')} {idx + 1}
                        </a>
                      ))}
                      <button onClick={requestPrintout} disabled={printRequesting || printRequested}
                        style={{ ...btn, marginTop: '4px', background: printRequested ? '#d4edda' : '#d4d0c8', color: printRequested ? '#155724' : '#000' }}>
                        <Printer size={12} /> {printRequested ? 'Print Requested!' : t('requestPrint')}
                      </button>
                    </>
                  )}
                </div>
              </fieldset>
            )}

            {service.notes && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#f5f5f5' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={12} /> {t('remarks')}
                </legend>
                <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {service.notes}
                </div>
              </fieldset>
            )}

            {(service.missingDocs || uploadedCount > 0) && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#ffebeb' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#cc0000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> {t('actionRequired')}
                </legend>
                
                {service.missingDocs && (
                  <div style={{ fontSize: '12px', color: '#880000', marginBottom: '10px', fontFamily: 'Tahoma', background: 'white', padding: '6px', border: '1px solid #ffcccc' }}>
                    <strong>{t('reqDoc')}:</strong><br/>{service.missingDocs}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="file" id="kiosk-upload" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" style={{ display: 'none' }} onChange={handleUpload} />
                  <button type="button" onClick={() => document.getElementById('kiosk-upload')?.click()} disabled={uploadingDoc}
                    style={{ ...btn, background: '#0a246a', color: 'white', padding: '8px', fontSize: '13px', width: '100%' }}>
                    {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                    {uploadingDoc ? t('uploading') : t('takePhoto')}
                  </button>
                  
                  {uploadedCount > 0 && (
                    <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '6px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> {uploadedCount} {t('filesSent')}
                    </div>
                  )}
                </div>
              </fieldset>
            )}

            {/* Feature 6: Schedule Visit */}
            {service.status !== 'DELIVERED' && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#eef2ff' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#3730a3', fontWeight: 'bold' }}>
                  {t('visitShop')}
                </legend>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '9px', color: '#555' }}>{t('date')}</div>
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={{ ...inset, width: '100%', padding: '4px', fontSize: '11px', fontFamily: 'Tahoma' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '9px', color: '#555' }}>{t('time')}</div>
                    <input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)} style={{ ...inset, width: '100%', padding: '4px', fontSize: '11px', fontFamily: 'Tahoma' }} />
                  </div>
                </div>
                <button onClick={bookVisit} disabled={visitBooking || visitBooked || !visitDate || !visitTime} style={{ ...btn, width: '100%', background: visitBooked ? '#d4edda' : '#0a246a', color: visitBooked ? '#155724' : 'white' }}>
                  {visitBooked ? t('visitBooked') : t('bookVisit')}
                </button>
              </fieldset>
            )}

            {/* Chat & Auto-FAQ */}
            {service.status !== 'DELIVERED' && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#fff' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold' }}>
                  {t('askQuestion')}
                </legend>
                
                {/* Feature 5: Auto-FAQ */}
                <div style={{ marginBottom: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>{t('commonQs')}</div>
                  {[1,2,3].map((num) => (
                    <div key={num} style={{ marginBottom: '4px' }}>
                      <div 
                        onClick={() => setFaqExpanded(faqExpanded === num ? null : num)}
                        style={{ fontSize: '11px', color: '#0ea5e9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Q: {t(`q${num}` as any)}</span>
                        {faqExpanded === num ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                      {faqExpanded === num && (
                        <div style={{ fontSize: '11px', color: '#333', background: '#fff', padding: '4px', borderLeft: '2px solid #0ea5e9', marginTop: '2px' }}>
                          A: {t(`a${num}` as any)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                    placeholder={t('typeMsg')} style={{ ...inset, flex: 1, padding: '4px', fontSize: '11px', fontFamily: 'Tahoma' }}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  />
                  <button onClick={sendChatMessage} disabled={chatSending || !chatMessage.trim()} style={{ ...btn, background: '#0a246a', color: 'white' }}>
                    {t('send')}
                  </button>
                </div>
                {chatSuccess && <div style={{ fontSize: '10px', color: 'green', marginTop: '4px' }}>{t('msgSent')}</div>}
              </fieldset>
            )}

            {service.status === 'DELIVERED' && !service.rating && !ratingSuccess && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#fff' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold' }}>
                  {t('rateService')}
                </legend>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={24} color={rating >= star ? '#fbbf24' : '#cbd5e1'} fill={rating >= star ? '#fbbf24' : 'none'} onClick={() => setRating(star)} style={{ cursor: 'pointer' }} />
                  ))}
                </div>
                {rating > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea placeholder={t('optFeedback')} value={feedback} onChange={e => setFeedback(e.target.value)}
                      style={{ ...inset, width: '100%', padding: '6px', fontSize: '12px', fontFamily: 'Tahoma', minHeight: '50px' }}
                    />
                    <button onClick={submitRating} disabled={ratingSubmitting} style={{ ...btn, background: '#0a246a', color: 'white' }}>
                      {ratingSubmitting ? t('submitting') : t('submitRating')}
                    </button>
                  </div>
                )}
              </fieldset>
            )}
            
            {(service.rating > 0 || ratingSuccess) && (
              <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '8px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '12px', fontWeight: 'bold' }}>
                {t('thankYouRating')} 
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={14} color={Math.max(rating, service.rating || 0) >= star ? '#fbbf24' : '#cbd5e1'} fill={Math.max(rating, service.rating || 0) >= star ? '#fbbf24' : 'none'} />
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              {settings?.shopPhone && (
                <a href={`https://wa.me/${settings.shopPhone.replace(/\D/g,'')}?text=Hi, I need help with my tracking ID: ${service.trackingId}`} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: 'none', background: '#25D366', color: 'white' }}>
                  <MessageSquare size={14} /> WhatsApp
                </a>
              )}
              {settings?.shopPhone && (
                <a href={`tel:${settings.shopPhone.replace(/\D/g,'')}`} style={{ ...btn, textDecoration: 'none' }}>
                  <Phone size={14} /> Call
                </a>
              )}
              
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.shopName || 'RA Seva Point')}`} target="_blank" rel="noreferrer" style={{ ...btn, gridColumn: '1 / -1', textDecoration: 'none' }}>
                <MapPin size={14} /> {t('getDirections')}
              </a>
            </div>

            <button onClick={handleDownloadReceipt} style={{ ...btn, width: '100%', height: '32px' }}>
              <Download size={14} /> {t('saveReceipt')}
            </button>

            <div style={{ marginTop: '10px', background: '#0a246a', color: 'white', padding: '10px', textAlign: 'center', fontFamily: 'Tahoma', fontSize: '11px', border: '1px solid #000' }}>
              <strong>{t('specialOffer')}</strong><br/>
              {t('offerText')}
            </div>

          </div>
        </div>
      </div>
      
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef}>
          <TokenReceipt 
            data={{
              shopName: settings?.shopName, tokenNumber: service.tokenNumber || 0, trackingId: service.trackingId,
              referenceNo: service.referenceNo || undefined, serviceType: service.serviceType, customerName: service.customer.name,
              customerMobile: service.customer.mobile, createdAt: service.createdAt,
            }}
          />
        </div>
      </div>

    </div>
  );
}
