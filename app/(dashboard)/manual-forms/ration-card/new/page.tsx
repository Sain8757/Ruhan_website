"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Upload, Trash2, Eye } from "lucide-react";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import { biharRationNewConfig, biharRationNewSchema, type BiharRationNewData } from "@/config/forms/bihar-ration-new";
import BiharRationNewTemplate from "@/components/templates/BiharRationNewTemplate";

export default function RationCardNewApplyForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Ref to the unscaled engine container
  const engineRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BiharRationNewData>({
    resolver: zodResolver(biharRationNewSchema),
    defaultValues: {
      familyMembers: Array(6).fill({}),
    }
  });

  const formData = watch();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = type === 'signature' ? 400 : 300;
          const MAX_HEIGHT = type === 'signature' ? 150 : 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          if (type === 'photo') setPhotoPreview(compressedBase64);
          else setSignaturePreview(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BiharRationNewData) => {
    if (!engineRef.current) return;
    
    setIsGenerating(true);
    try {
      // Get the raw HTML of the unscaled container
      const fullHtml = engineRef.current.innerHTML;

      const response = await fetch('/api/generate-form-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: fullHtml
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generation failed (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bihar_Ration_Card_${data.applicantNameEn || 'Application'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF. Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* LEFT SIDE: Data Entry Form */}
      <div className="w-1/3 min-w-[400px] border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-slate-800">{biharRationNewConfig.name}</h1>
            <p className="text-xs text-slate-500">Manual Data Entry</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onSubmit(watch()); }}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Download PDF
          </button>
        </div>

        <div className="p-6">
          <form className="space-y-8">
            
            {/* Applicant Details */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Applicant Details (आवेदक का विवरण)</label>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">आवेदक का नाम (Hindi) *</label>
                <ReactTransliterate
                  renderComponent={(props) => <input {...props} className="form-input w-full text-sm" placeholder="राम कुमार" />}
                  value={formData.applicantNameHi || ""}
                  onChangeText={(text) => setValue("applicantNameHi", text)}
                  lang="hi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Applicant Name (English) *</label>
                <input type="text" {...register("applicantNameEn")} className="form-input w-full text-sm uppercase" placeholder="RAM KUMAR" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Aadhaar No</label>
                  <input type="text" {...register("aadhaarNumber")} maxLength={12} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile No</label>
                  <input type="text" {...register("mobileNumber")} maxLength={10} className="form-input w-full text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">पिता/पति का नाम (Hindi)</label>
                <ReactTransliterate
                  renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />}
                  value={formData.fatherHusbandNameHi || ""}
                  onChangeText={(text) => setValue("fatherHusbandNameHi", text)}
                  lang="hi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Father/Husband Name (English)</label>
                <input type="text" {...register("fatherHusbandNameEn")} className="form-input w-full text-sm uppercase" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">पूरा पता (Full Address)</label>
                <ReactTransliterate
                  renderComponent={(props) => <textarea {...props} className="form-input w-full text-sm h-16 resize-none" />}
                  value={formData.fullAddress || ""}
                  onChangeText={(text) => setValue("fullAddress", text)}
                  lang="hi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">पंचायत का नाम</label>
                <ReactTransliterate
                  renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />}
                  value={formData.panchayat || ""}
                  onChangeText={(text) => setValue("panchayat", text)}
                  lang="hi"
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Bank Details (बैंक का विवरण)</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">बैंक का नाम</label>
                  <ReactTransliterate
                    renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />}
                    value={formData.bankName || ""}
                    onChangeText={(text) => setValue("bankName", text)}
                    lang="hi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">बैंक शाखा का नाम</label>
                  <ReactTransliterate
                    renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />}
                    value={formData.branchName || ""}
                    onChangeText={(text) => setValue("branchName", text)}
                    lang="hi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">बैंक खाता संख्या</label>
                  <input type="text" {...register("accountNumber")} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC कोड</label>
                  <input type="text" {...register("ifscCode")} className="form-input w-full text-sm uppercase" />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Attached Documents (दस्तावेज संख्या / निर्गत तिथि)</label>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <label className="block text-xs font-semibold text-gray-700 col-span-2">आय प्रमाण पत्र</label>
                <input type="text" {...register("incomeCert.docNo")} className="form-input text-sm" placeholder="Doc No" />
                <input type="text" {...register("incomeCert.date")} className="form-input text-sm" placeholder="Date" />
                
                <label className="block text-xs font-semibold text-gray-700 col-span-2 mt-2">निवास प्रमाण पत्र</label>
                <input type="text" {...register("residenceCert.docNo")} className="form-input text-sm" placeholder="Doc No" />
                <input type="text" {...register("residenceCert.date")} className="form-input text-sm" placeholder="Date" />
                
                <label className="block text-xs font-semibold text-gray-700 col-span-2 mt-2">जाति प्रमाण पत्र</label>
                <input type="text" {...register("casteCert.docNo")} className="form-input text-sm" placeholder="Doc No" />
                <input type="text" {...register("casteCert.date")} className="form-input text-sm" placeholder="Date" />
              </div>
            </div>

            {/* Family Members */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Family Members (राशन कार्ड में जोड़े जाने वाले सदस्य)</label>
              <div className="space-y-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="p-3 border rounded-lg bg-slate-50 space-y-3">
                    <p className="text-xs font-bold text-blue-600 border-b pb-1">Member {index + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Name (Hindi)</label>
                        <ReactTransliterate
                          renderComponent={(props) => <input {...props} className="form-input w-full text-xs" />}
                          value={formData.familyMembers?.[index]?.name || ""}
                          onChangeText={(text) => setValue(`familyMembers.${index}.name`, text)}
                          lang="hi"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Gender (लिंग)</label>
                        <ReactTransliterate
                          renderComponent={(props) => <input {...props} className="form-input w-full text-xs" />}
                          value={formData.familyMembers?.[index]?.gender || ""}
                          onChangeText={(text) => setValue(`familyMembers.${index}.gender`, text)}
                          lang="hi"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Father/Husband</label>
                        <ReactTransliterate
                          renderComponent={(props) => <input {...props} className="form-input w-full text-xs" />}
                          value={formData.familyMembers?.[index]?.fatherHusbandName || ""}
                          onChangeText={(text) => setValue(`familyMembers.${index}.fatherHusbandName`, text)}
                          lang="hi"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase text-gray-500 font-bold">Relation</label>
                          <ReactTransliterate
                            renderComponent={(props) => <input {...props} className="form-input w-full text-xs" />}
                            value={formData.familyMembers?.[index]?.relation || ""}
                            onChangeText={(text) => setValue(`familyMembers.${index}.relation`, text)}
                            lang="hi"
                          />
                        </div>
                        <div className="w-12">
                          <label className="text-[10px] uppercase text-gray-500 font-bold">Age</label>
                          <input type="text" {...register(`familyMembers.${index}.age`)} className="form-input w-full text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Declarations Meta */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Declaration Details (स्व-घोषणा पत्र)</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">आवेदक का नाम</label>
                  <ReactTransliterate renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />} value={formData.declarationName || ""} onChangeText={(text) => setValue("declarationName", text)} lang="hi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">पिता/पति का नाम</label>
                  <ReactTransliterate renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />} value={formData.declarationFatherHusband || ""} onChangeText={(text) => setValue("declarationFatherHusband", text)} lang="hi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">पंचायत का नाम</label>
                  <ReactTransliterate renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />} value={formData.declarationPanchayat || ""} onChangeText={(text) => setValue("declarationPanchayat", text)} lang="hi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ग्राम/टोला</label>
                  <ReactTransliterate renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />} value={formData.declarationGramTola || ""} onChangeText={(text) => setValue("declarationGramTola", text)} lang="hi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">वार्ड सं०</label>
                  <input type="text" {...register("declarationWard")} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">प्रखण्ड</label>
                  <ReactTransliterate renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />} value={formData.declarationBlock || ""} onChangeText={(text) => setValue("declarationBlock", text)} lang="hi" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">नजदीकी जन वितरण प्रणाली विक्रेता का नाम</label>
                  <ReactTransliterate renderComponent={(props) => <input {...props} className="form-input w-full text-sm" />} value={formData.declarationDealer || ""} onChangeText={(text) => setValue("declarationDealer", text)} lang="hi" />
                </div>
              </div>
            </div>

            {/* Declarations Checkboxes */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Declaration Questions</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.motorVehicle")} /> Motor/3-4 wheeler</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.machineEquip")} /> Machine agriculture eq.</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.govtRegIndustry")} /> Govt reg. non-agri industry</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.incomeOver10k")} /> Income over 10k/month</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.incomeTax")} /> Pay Income Tax</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.commercialTax")} /> Pay Commercial Tax</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.puccaHouse3Rooms")} /> Pucca house with 3+ rooms</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.irrigatedLand2_5")} /> 2.5 acre irrigated land</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.irrigatedLand5")} /> 5 acre irrigated land</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.irrigatedLand7_5")} /> 7.5 acre irrigated land</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("declarations.govtServant")} /> Govt Servant</label>
              </div>
            </div>

            {/* Sign and Date */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-800 border-b pb-2">Date</label>
              <input type="text" {...register("date")} className="form-input text-sm" placeholder="DD/MM/YYYY" />
            </div>

            {/* Images Upload */}
            <div className="space-y-4 pt-4 border-t">
              <label className="block text-sm font-bold text-slate-800">Photos & Signatures</label>
              <div className="flex gap-4">
                {/* Photo */}
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'photo')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {photoPreview ? (
                      <div className="relative aspect-[3/4] w-24 mx-auto">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded" />
                        <button 
                          onClick={(e) => { e.preventDefault(); setPhotoPreview(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload size={20} />
                        <span className="text-xs font-medium">Family Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature */}
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'signature')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {signaturePreview ? (
                      <div className="relative h-12 w-full mx-auto">
                        <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain rounded bg-white" />
                        <button 
                          onClick={(e) => { e.preventDefault(); setSignaturePreview(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload size={20} />
                        <span className="text-xs font-medium">Signature</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Live Print Preview */}
      <div className="flex-1 bg-slate-200 overflow-y-auto flex justify-center p-8">
        <div className="sticky top-0 w-full max-w-[800px]">
          <div className="flex items-center justify-between mb-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-300">
            <div className="flex items-center gap-2 text-slate-700">
              <Eye size={18} />
              <span className="font-semibold text-sm">Live Print Preview</span>
            </div>
            <div className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded">
              A4 Vector Generation Active
            </div>
          </div>
          
          <div className="bg-white shadow-xl shadow-slate-400/20 border border-slate-300 overflow-hidden relative group rounded flex justify-center">
            {/* The scaled visual preview container */}
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', paddingBottom: '50px' }}>
              <BiharRationNewTemplate 
                data={formData} 
                photoSrc={photoPreview || undefined}
                signatureSrc={signaturePreview || undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Engine for Puppeteer PDF parsing (100% exact scale) */}
      <div style={{ display: 'none' }}>
        <div id="form-engine-container" ref={engineRef}>
          <BiharRationNewTemplate 
            data={formData} 
            photoSrc={photoPreview || undefined}
            signatureSrc={signaturePreview || undefined}
          />
        </div>
      </div>
    </div>
  );
}
