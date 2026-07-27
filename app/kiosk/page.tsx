"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SERVICE_TYPES } from '@/lib/utils';
import { Loader2, Users, Globe, Upload } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ─── Translations ──────────────────────────────────────────
const T = {
  en: {
    title: "Virtual Waiting Room",
    subtitle: "RA Seva Point — Self-Service Kiosk",
    step1: "Step 1 of 3: Identification",
    step2: "Step 2 of 3: Service Details",
    step3: "Booking Confirmed!",
    mobile: "Mobile Number",
    mobilePlaceholder: "Enter 10 digit mobile",
    mobileError: "Please enter a valid 10 digit mobile number.",
    lookingUp: "Looking up...",
    nameFound: "Welcome back!",
    fullName: "Full Name",
    namePlaceholder: "e.g. Rajesh Kumar",
    service: "Service Required",
    price: "Approx. Rate",
    back: "← Back",
    next: "Next →",
    submit: "Join Queue",
    submitting: "Joining Queue...",
    token: "Your Token",
    position: "Queue Position",
    wait: "Est. Wait Time",
    minutes: "min",
    ahead: "people ahead",
    done: "Done",
    successMsg: "Please wait. Show this token at the counter when called.",
    systemActive: "System Active",
    version: "Kiosk v2.0",
  },
  hi: {
    title: "वर्चुअल वेटिंग रूम",
    subtitle: "RA सेवा पॉइंट — स्व-सेवा कियोस्क",
    step1: "चरण 1 / 3: पहचान",
    step2: "चरण 2 / 3: सेवा विवरण",
    step3: "बुकिंग की पुष्टि हो गई!",
    mobile: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल दर्ज करें",
    mobileError: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।",
    lookingUp: "खोज रहा है...",
    nameFound: "पुनः स्वागत है!",
    fullName: "पूरा नाम",
    namePlaceholder: "जैसे राजेश कुमार",
    service: "सेवा का प्रकार",
    price: "अनुमानित शुल्क",
    back: "← वापस",
    next: "आगे →",
    submit: "कतार में जुड़ें",
    submitting: "जुड़ रहे हैं...",
    token: "आपका टोकन",
    position: "कतार में स्थान",
    wait: "अनुमानित प्रतीक्षा",
    minutes: "मिनट",
    ahead: "लोग आगे हैं",
    done: "हो गया",
    successMsg: "कृपया प्रतीक्षा करें। बुलाए जाने पर काउंटर पर यह टोकन दिखाएं।",
    systemActive: "सिस्टम सक्रिय",
    version: "कियोस्क v2.0",
  }
};

const DEFAULT_SERVICES = [
  'Aadhaar Print', 'PAN Card', 'Voter ID', 'Passport', 'Driving License',
  'Income Certificate', 'Caste Certificate', 'Birth Certificate'
];

const DEFAULT_PRICE_MAP: Record<string, string> = {};
const DEFAULT_REQUIRED_DOCS_MAP: Record<string, string[]> = {};

export default function KioskPage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = T[lang];

  // Utility to generate cropped image
  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    });
  };

  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [nameFound, setNameFound] = useState(false);
  
  const [availableServices, setAvailableServices] = useState<string[]>(DEFAULT_SERVICES);
  const [serviceType, setServiceType] = useState(DEFAULT_SERVICES[0]);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState('');
  const [tokenLabel, setTokenLabel] = useState('');
  const [queuePosition, setQueuePosition] = useState(1);
  const [estimatedWait, setEstimatedWait] = useState(5);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>(DEFAULT_PRICE_MAP);
  const [requiredDocsMap, setRequiredDocsMap] = useState<Record<string, string[]>>(DEFAULT_REQUIRED_DOCS_MAP);

  // Live clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch service list, prices, and required docs from inventory
  useEffect(() => {
    fetch('/api/kiosk/services')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          const pm: Record<string, string> = {};
          const rdm: Record<string, string[]> = {};
          const sNames: string[] = [];
          
          data.forEach((s: any) => {
            if (s.name) {
              sNames.push(s.name);
              pm[s.name] = `₹${s.sellingPrice || 0}`;
              if (s.requiredDocs && Array.isArray(s.requiredDocs) && s.requiredDocs.length > 0) {
                rdm[s.name] = s.requiredDocs;
              }
            }
          });
          
          if (sNames.length > 0) {
            setAvailableServices(sNames);
            setServiceType(sNames[0]);
            setPrices(pm);
            setRequiredDocsMap(rdm);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-fill customer name by mobile
  const lookupCustomer = useCallback(async (mob: string) => {
    if (mob.length !== 10) { setNameFound(false); return; }
    setLookingUp(true);
    try {
      const res = await fetch(`/api/kiosk/lookup?mobile=${mob}`);
      const data = await res.json();
      if (data.found) { setName(data.name); setNameFound(true); }
      else { setNameFound(false); }
    } catch { setNameFound(false); }
    finally { setLookingUp(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => lookupCustomer(mobile), 500);
    return () => clearTimeout(timer);
  }, [mobile, lookupCustomer]);

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
      setTokenLabel(data.tokenLabel || `T${String(data.queuePosition).padStart(3, '0')}`);
      setQueuePosition(data.queuePosition || 1);
      setEstimatedWait(data.estimatedWaitMinutes || 5);
      setErrorMsg('');
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1); setMobile(''); setName(''); setNameFound(false);
    setTicket(''); setTokenLabel(''); setErrorMsg('');
    setUploadedCount(0);
    setUploadedParts({});
  };

  const [uploadedParts, setUploadedParts] = useState<Record<string, string[]>>({});
  
  // Crop & Options State
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [docMenuOpen, setDocMenuOpen] = useState(false);
  const [uploadOption, setUploadOption] = useState<'Front' | 'Back' | 'Single' | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleDocClick = (docName: string) => {
    setActiveDoc(docName);
    setDocMenuOpen(true);
  };

  const handleOptionSelect = (opt: 'Front' | 'Back' | 'Single') => {
    setUploadOption(opt);
    setDocMenuOpen(false);
    document.getElementById('hidden-kiosk-upload')?.click();
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImgSrc(reader.result?.toString() || '');
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; // reset
    }
  };

  const handleCropAndUpload = async () => {
    if (!imgRef.current || !completedCrop || !completedCrop.width || !completedCrop.height || !activeDoc || !uploadOption) return;
    
    setUploadingDoc(true);
    setCropModalOpen(false);
    try {
      // Format: Md_Shahanawaz_Alam_front_Aadhaar_Card.jpg
      const cleanName = name.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const cleanDoc = activeDoc === 'Generic' ? 'Doc' : activeDoc.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const optStr = uploadOption.toLowerCase();
      const fileName = `${cleanName}_${optStr}_${cleanDoc}.jpg`;

      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, fileName);
      
      const fd = new FormData();
      fd.append('file', croppedFile);
      fd.append('trackingId', ticket);
      const res = await fetch('/api/kiosk/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setUploadedCount(c => c + 1);
      if (activeDoc !== 'Generic') {
        setUploadedParts(prev => ({
          ...prev,
          [activeDoc]: [...(prev[activeDoc] || []), uploadOption]
        }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
      setCropImgSrc('');
      setActiveDoc(null);
      setUploadOption(null);
    }
  };

  // Win95 inset style
  const inset: React.CSSProperties = {
    borderTop: '2px solid #808080',
    borderLeft: '2px solid #808080',
    borderRight: '2px solid #ffffff',
    borderBottom: '2px solid #ffffff',
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
    padding: '4px 14px',
    fontFamily: 'Tahoma, sans-serif',
    fontSize: '13px',
    fontWeight: 'bold',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3"
      style={{ backgroundColor: '#008080', backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}>

      {/* Language Toggle */}
      <div className="flex justify-end mb-2 w-full max-w-sm">
        <button
          onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
          style={{ ...raised, background: '#d4d0c8', padding: '2px 10px', cursor: 'pointer', fontFamily: 'Tahoma', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Globe size={12} /> {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </div>

      {/* Main Window */}
      <div className="w-full max-w-sm" style={{ background: '#d4d0c8', ...raised, boxShadow: '4px 4px 15px rgba(0,0,0,0.5)' }}>

        {/* Title Bar */}
        <div style={{ background: 'linear-gradient(to right, #000080, #1084d0)', padding: '3px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'white', fontFamily: 'Tahoma', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏪</span> {t.title}
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {['_', '□', '✕'].map((c, i) => (
              <button key={i} style={{ background: '#d4d0c8', ...raised, width: '16px', height: '14px', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-3">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #808080', paddingBottom: '8px' }}>
            <div style={{ background: '#000080', ...inset, width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={28} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Tahoma', fontWeight: 'bold', fontSize: '14px' }}>{t.subtitle}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#000080', fontWeight: 'bold', marginTop: '2px' }}>
                🕒 {time.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{ background: '#fff0f0', border: '1px solid #cc0000', padding: '6px 8px', fontFamily: 'Tahoma', fontSize: '12px', color: '#cc0000', display: 'flex', justifyContent: 'space-between' }}>
              <span>⚠ {errorMsg}</span>
              <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (mobile.length === 10) { setStep(2); setErrorMsg(''); } else setErrorMsg(t.mobileError); }}>
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '10px' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '12px', padding: '0 4px' }}>{t.step1}</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'Tahoma', fontSize: '12px' }}>{t.mobile}:</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{ ...inset, flex: 1, padding: '4px 6px', fontFamily: 'Tahoma', fontSize: '14px', outline: 'none', background: 'white' }}
                      placeholder={t.mobilePlaceholder}
                      required
                    />
                    {lookingUp && <Loader2 size={14} className="animate-spin" color="#000080" />}
                  </div>
                  {nameFound && (
                    <div style={{ background: '#e6ffe6', border: '1px solid #008000', padding: '4px 8px', fontFamily: 'Tahoma', fontSize: '11px', color: '#006600' }}>
                      ✓ {t.nameFound} {name}
                    </div>
                  )}
                </div>
              </fieldset>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" style={btn}>{t.next}</button>
              </div>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '10px' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '12px', padding: '0 4px' }}>{t.step2}</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontFamily: 'Tahoma', fontSize: '12px' }}>{t.fullName}:</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ ...inset, padding: '4px 6px', fontFamily: 'Tahoma', fontSize: '13px', outline: 'none', background: 'white' }}
                      placeholder={t.namePlaceholder}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontFamily: 'Tahoma', fontSize: '12px' }}>{t.service}:</label>
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value)}
                      style={{ ...inset, padding: '4px 6px', fontFamily: 'Tahoma', fontSize: '13px', outline: 'none', background: 'white' }}
                    >
                      {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Price Preview */}
                  {prices[serviceType] && (
                    <div style={{ background: '#ffffc8', border: '1px solid #cccc00', padding: '5px 8px', fontFamily: 'Tahoma', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>💰 {t.price}:</span>
                      <strong style={{ color: '#006600' }}>{prices[serviceType]}</strong>
                    </div>
                  )}
                </div>
              </fieldset>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button type="button" onClick={() => setStep(1)} style={btn}>{t.back}</button>
                <button type="submit" disabled={loading} style={{ ...btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  {loading ? t.submitting : t.submit}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 — SUCCESS */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '10px' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '12px', padding: '0 4px', color: '#008000', fontWeight: 'bold' }}>✓ {t.step3}</legend>

                {/* Token Number — Big display */}
                <div style={{ background: 'white', ...inset, padding: '14px', textAlign: 'center', marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>{t.token}</div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: '48px', fontWeight: 'bold', color: '#000080', lineHeight: 1.1 }}>{tokenLabel}</div>
                  <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#888', marginTop: '4px' }}>ID: {ticket}</div>
                </div>

                {/* Queue Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ background: '#e8f0ff', border: '1px solid #aac', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Tahoma', fontSize: '22px', fontWeight: 'bold', color: '#000080' }}>{queuePosition}</div>
                    <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#555' }}>{t.position}</div>
                  </div>
                  <div style={{ background: '#fff8e8', border: '1px solid #cc9', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Tahoma', fontSize: '22px', fontWeight: 'bold', color: '#885500' }}>~{estimatedWait}</div>
                    <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#555' }}>{t.wait} ({t.minutes})</div>
                  </div>
                </div>

                <p style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555', marginTop: '8px', textAlign: 'center' }}>
                  {t.successMsg}
                </p>
              </fieldset>

              {/* Upload Documents Section */}
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '10px' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '12px', padding: '0 4px', color: '#000080', fontWeight: 'bold' }}>📎 {lang === 'en' ? 'Required Documents' : 'आवश्यक दस्तावेज़'}</legend>
                <div style={{ fontSize: '11px', color: '#444', marginBottom: '8px', textAlign: 'center' }}>
                  {lang === 'en' ? 'Save time! Upload these documents from your phone while you wait.' : 'समय बचाएं! अपनी बारी का इंतज़ार करते हुए दस्तावेज़ अपलोड करें।'}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  {/* Hidden File Input used by all documents */}
                  <input type="file" id="hidden-kiosk-upload" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onSelectFile} />

                  {requiredDocsMap[serviceType] ? (
                    requiredDocsMap[serviceType].map((doc, idx) => {
                      const parts = uploadedParts[doc] || [];
                      const isComplete = parts.includes('Single') || (parts.includes('Front') && parts.includes('Back'));
                      
                      let statusText = '';
                      if (parts.length > 0) {
                        statusText = parts.map(p => `✓ ${p}`).join(' ');
                      }

                      return (
                        <div key={idx}>
                          <button type="button" onClick={() => handleDocClick(doc)} disabled={uploadingDoc}
                            style={{ ...btn, background: isComplete ? '#d4edda' : '#0a246a', color: isComplete ? '#155724' : 'white', padding: '8px', fontSize: '13px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{uploadingDoc && activeDoc === doc ? (lang === 'en' ? 'Uploading...' : 'अपलोड हो रहा है...') : `📸 ${doc}`}</span>
                            {statusText && <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{statusText}</span>}
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <>
                      <button type="button" onClick={() => handleDocClick('Generic')} disabled={uploadingDoc}
                        style={{ ...btn, background: '#0a246a', color: 'white', padding: '10px', fontSize: '14px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : '📸'}
                        {uploadingDoc ? (lang === 'en' ? 'Uploading...' : 'अपलोड हो रहा है...') : (lang === 'en' ? 'Take Photo or Upload' : 'फोटो लें या अपलोड करें')}
                      </button>
                    </>
                  )}

                  {uploadedCount > 0 && !requiredDocsMap[serviceType] && (
                    <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '6px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>
                      ✓ {uploadedCount} {lang === 'en' ? 'Document(s) uploaded successfully!' : 'दस्तावेज़ सफलतापूर्वक अपलोड हुए!'}
                    </div>
                  )}
                </div>
              </fieldset>

              <button onClick={resetForm} style={{ ...btn, width: '100%', padding: '8px', fontSize: '14px', textAlign: 'center' }}>
                {t.done}
              </button>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{ borderTop: '2px solid #808080', background: '#d4d0c8', padding: '2px 6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'Tahoma' }}>
          <span style={{ paddingRight: '8px', borderRight: '1px solid #808080' }}>Step {step}/3</span>
          <span style={{ paddingRight: '8px', paddingLeft: '8px', borderRight: '1px solid #808080' }}>{t.systemActive}</span>
          <span style={{ paddingLeft: '8px' }}>{t.version}</span>
        </div>
      </div>

      {/* OVERLAYS: Menus and Modals */}
      
      {/* 1. Document Option Menu */}
      {docMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#d4d0c8', ...raised, padding: '10px', width: '250px' }}>
            <div style={{ background: '#000080', color: 'white', padding: '4px 8px', fontWeight: 'bold', fontSize: '12px', fontFamily: 'Tahoma', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Select Part to Upload</span>
              <button onClick={() => setDocMenuOpen(false)} style={{ background: '#d4d0c8', color: 'black', border: 'none', padding: '0 4px', cursor: 'pointer', ...raised, fontSize: '10px', fontWeight: 'bold' }}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => handleOptionSelect('Front')} style={{ ...btn, padding: '10px' }}>Upload FRONT</button>
              <button onClick={() => handleOptionSelect('Back')} style={{ ...btn, padding: '10px' }}>Upload BACK</button>
              <button onClick={() => handleOptionSelect('Single')} style={{ ...btn, padding: '10px' }}>Single / Full Page</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cropper Modal */}
      {cropModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '10px' }}>
          <div style={{ background: '#d4d0c8', ...raised, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#000080', color: 'white', padding: '6px 8px', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Tahoma', display: 'flex', justifyContent: 'space-between' }}>
              <span>Crop Image</span>
              <button onClick={() => { setCropModalOpen(false); setCropImgSrc(''); }} style={{ background: '#d4d0c8', color: 'black', border: 'none', padding: '2px 6px', cursor: 'pointer', ...raised, fontSize: '12px', fontWeight: 'bold' }}>X</button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
              {cropImgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                >
                  <img
                    ref={imgRef}
                    src={cropImgSrc}
                    style={{ maxHeight: 'calc(100vh - 120px)', maxWidth: '100%', objectFit: 'contain' }}
                    alt="Crop me"
                  />
                </ReactCrop>
              )}
            </div>

            <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button onClick={() => { setCropModalOpen(false); setCropImgSrc(''); }} style={{ ...btn, flex: 1, padding: '10px', background: '#e0e0e0' }}>Cancel</button>
              <button onClick={handleCropAndUpload} style={{ ...btn, flex: 2, padding: '10px', background: '#008000', color: 'white' }}>
                ✓ Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
