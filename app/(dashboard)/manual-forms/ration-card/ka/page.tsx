"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Save, ArrowLeft, Printer, Trash2, Plus, Download, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import { biharRationKaConfig, biharRationKaSchema, type BiharRationKaData } from "@/config/forms/bihar-ration-ka";
import { BiharRationKaTemplate } from "@/components/templates/BiharRationKaTemplate";

export default function RationCardKaApplyForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BiharRationKaData>({
    resolver: zodResolver(biharRationKaSchema),
    defaultValues: biharRationKaConfig.defaultValues,
  });

  const { fields: familyMembers, append, remove } = useFieldArray({
    control,
    name: "familyMembers",
  });

  const watchAreaType = watch("areaType");
  const watchPhoto = watch("photoBase64");
  const watchSignature = watch("signatureBase64");
  const watchRuralGovt = watch("rural_govtService");
  const watchUrbanGovt = watch("urban_govtService");

  const handleRadioClick = (fieldName: keyof BiharRationKaData, value: string) => (e: React.MouseEvent<HTMLInputElement>) => {
    if (getValues(fieldName) === value) {
      setValue(fieldName, "" as any, { shouldValidate: true, shouldDirty: true });
      e.preventDefault();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "photoBase64" | "signatureBase64") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = fieldName === 'signatureBase64' ? 400 : 300;
          const MAX_HEIGHT = fieldName === 'signatureBase64' ? 150 : 400;
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
          setValue(fieldName, compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const previewRef = useRef<HTMLDivElement>(null);

  const generatePDF = async (data: BiharRationKaData) => {
    try {
      setIsGenerating(true);
      
      const container = previewRef.current;
      if (!container) throw new Error("Preview container not found");
      
      // Load dynamically so they don't break SSR
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import('jspdf');

      // Create an off-screen container to render at full 100% scale without scroll issues
      const offScreenContainer = document.createElement('div');
      offScreenContainer.style.position = 'absolute';
      offScreenContainer.style.left = '-9999px';
      offScreenContainer.style.top = '0';
      offScreenContainer.style.width = '210mm'; // Force A4 width
      offScreenContainer.style.backgroundColor = 'white';
      offScreenContainer.innerHTML = container.innerHTML;
      document.body.appendChild(offScreenContainer);

      const templateWrapper = offScreenContainer.firstChild as HTMLElement;
      if (!templateWrapper) throw new Error("Template not found");
      
      const pages = Array.from(templateWrapper.children).filter(el => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT') as HTMLElement[];
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Crucial: Wait for fonts to load to prevent text overlapping
      await document.fonts.ready;

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i];
        
        const canvas = await html2canvas(pageElement, {
          scale: 2, // High resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794 // 210mm in pixels at 96dpi
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        let pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let finalWidth = pdfWidth;
        const a4Height = pdf.internal.pageSize.getHeight();

        // If page is taller than A4, scale it down to fit perfectly without cutting
        if (pdfHeight > a4Height) {
          const ratio = a4Height / pdfHeight;
          finalWidth = pdfWidth * ratio;
          pdfHeight = a4Height;
        }

        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', (pdfWidth - finalWidth) / 2, 0, finalWidth, pdfHeight);
      }

      document.body.removeChild(offScreenContainer);
      pdf.save(`Prapatra-Ka-${data.applicantName || 'Applicant'}.pdf`);
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF. Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manual-forms" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">प्रपत्र क (Form Ka)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">नया राशन कार्ड (New)</span>
            </div>
            <p className="text-slate-500 mt-1 font-medium">{biharRationKaConfig.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              <h2 className="font-bold text-slate-800">Fill Application Details</h2>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); generatePDF(watch()); }}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isGenerating ? (
                <>Generating PDF...</>
              ) : (
                <><Download size={16} /> Download PDF</>
              )}
            </button>
          </div>

          <form className="p-6 space-y-8">
            
            {/* Applicant Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">आवेदक का विवरण (Applicant Details)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">आवेदक का नाम (Hindi)*</label>
                  <ReactTransliterate
                    value={watch("applicantName")}
                    onChangeText={(text) => setValue("applicantName", text)}
                    lang="hi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="आवेदक का नाम"
                  />
                  {errors.applicantName && <p className="text-red-500 text-xs">{errors.applicantName.message}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">पिता/पति का नाम (Hindi)*</label>
                  <ReactTransliterate
                    value={watch("fatherHusbandName")}
                    onChangeText={(text) => setValue("fatherHusbandName", text)}
                    lang="hi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="पिता/पति का नाम"
                  />
                  {errors.fatherHusbandName && <p className="text-red-500 text-xs">{errors.fatherHusbandName.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">आधार / EID no*</label>
                  <input
                    {...register("aadhaarNo")}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="12 digit Aadhaar"
                  />
                  {errors.aadhaarNo && <p className="text-red-500 text-xs">{errors.aadhaarNo.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">मोबाईल नं०*</label>
                  <input
                    {...register("mobileNo")}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="10 digit Mobile"
                  />
                  {errors.mobileNo && <p className="text-red-500 text-xs">{errors.mobileNo.message}</p>}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">पूर्ण आवासीय पता (Hindi)*</label>
                  <ReactTransliterate
                    value={watch("fullAddress")}
                    onChangeText={(text) => setValue("fullAddress", text)}
                    lang="hi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="पूरा पता..."
                  />
                  {errors.fullAddress && <p className="text-red-500 text-xs">{errors.fullAddress.message}</p>}
                </div>
              </div>
            </section>

            {/* Bank Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">बैंक का विवरण (Bank Details)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">IFSC Code*</label>
                  <input {...register("bankIfsc")} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg uppercase" placeholder="SBIN0001234" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">खाता नं० (A/c No)*</label>
                  <input {...register("bankAccountNo")} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Account Number" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">बैंक का नाम (Hindi)*</label>
                  <ReactTransliterate
                    value={watch("bankName")}
                    onChangeText={(text) => setValue("bankName", text)}
                    lang="hi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    placeholder="स्टेट बैंक..."
                  />
                </div>
              </div>
            </section>

            {/* Media Uploads */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">तस्वीर और हस्ताक्षर (Photo & Sign)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">पारिवारिक फोटो (Family Photo)</label>
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "photoBase64")} className="text-sm" />
                    {watchPhoto && <img src={watchPhoto} alt="Photo" className="h-16 rounded border" />}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">आवेदक का हस्ताक्षर (Applicant Signature)</label>
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "signatureBase64")} className="text-sm" />
                    {watchSignature && <img src={watchSignature} alt="Signature" className="h-12 border" />}
                  </div>
                </div>
              </div>
            </section>

            {/* Family Members */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-bold text-slate-800">परिवार के अन्य सदस्यों का विवरण (Family Members)</h3>
                <button
                  type="button"
                  onClick={() => append({ name: "", fatherHusbandName: "", gender: "", age: "", maritalStatus: "", relation: "", aadhaar: "", mobile: "", occupation: "", incomeSource: "", monthlyIncome: "" })}
                  className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-semibold transition-colors"
                >
                  <Plus size={16} /> Add Member
                </button>
              </div>

              <div className="space-y-6">
                {familyMembers.map((field, index) => (
                  <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute -top-3 -right-3 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">नाम (Hindi)</label>
                        <ReactTransliterate
                          value={watch(`familyMembers.${index}.name`)}
                          onChangeText={(text) => setValue(`familyMembers.${index}.name`, text)}
                          lang="hi"
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">पिता/पति (Hindi)</label>
                        <ReactTransliterate
                          value={watch(`familyMembers.${index}.fatherHusbandName`)}
                          onChangeText={(text) => setValue(`familyMembers.${index}.fatherHusbandName`, text)}
                          lang="hi"
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">लिंग</label>
                        <select {...register(`familyMembers.${index}.gender`)} className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md">
                          <option value="">Select</option>
                          <option value="पु०">पु० (M)</option>
                          <option value="स्त्री">स्त्री (F)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">उम्र</label>
                        <input {...register(`familyMembers.${index}.age`)} className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">वैवाहिक स्थिति</label>
                        <select {...register(`familyMembers.${index}.maritalStatus`)} className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md">
                          <option value="">Select</option>
                          <option value="विवाहित">विवाहित</option>
                          <option value="अविवाहित">अविवाहित</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">संबंध (Hindi)</label>
                        <ReactTransliterate
                          value={watch(`familyMembers.${index}.relation`)}
                          onChangeText={(text) => setValue(`familyMembers.${index}.relation`, text)}
                          lang="hi"
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">आधार नं०</label>
                        <input {...register(`familyMembers.${index}.aadhaar`)} className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">मोबाईल नं०</label>
                        <input {...register(`familyMembers.${index}.mobile`)} className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">व्यवसाय (Hindi)</label>
                        <ReactTransliterate
                          value={watch(`familyMembers.${index}.occupation`)}
                          onChangeText={(text) => setValue(`familyMembers.${index}.occupation`, text)}
                          lang="hi"
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">आमदनी का स्रोत</label>
                        <ReactTransliterate
                          value={watch(`familyMembers.${index}.incomeSource`)}
                          onChangeText={(text) => setValue(`familyMembers.${index}.incomeSource`, text)}
                          lang="hi"
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">मासिक आय</label>
                        <input {...register(`familyMembers.${index}.monthlyIncome`)} className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Area Type Selection */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">क्षेत्र प्रकार (Area Type)</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="RURAL" {...register("areaType")} onClick={handleRadioClick("areaType", "RURAL")} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700">ग्रामीण (Rural) - Section 10</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="URBAN" {...register("areaType")} onClick={handleRadioClick("areaType", "URBAN")} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700">शहरी (Urban) - Section 11</span>
                </label>
              </div>
            </section>

            {/* Rural Declarations */}
            <section className="space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h3 className="text-lg font-bold text-slate-800 border-b border-orange-200 pb-2">ग्रामीण क्षेत्र (Rural Declarations)</h3>
                
                <div className="space-y-3">
                  {[
                    { id: "rural_motorVehicle", label: "(i) मोटर चालित तिपहिया/चार पहिया वाहन है" },
                    { id: "rural_agriMachine", label: "(ii) मशीन चालित कृषि उपकरण है" },
                    { id: "rural_nonAgriEnterprise", label: "(iii) पंजीकृत गैर-कृषि उद्योग" },
                    { id: "rural_incomeAbove10k", label: "(iv) मासिक आय 10,000/- रू0 से अधिक" },
                    { id: "rural_incomeTaxPayee", label: "(v) आयकर देते है" },
                    { id: "rural_commercialTaxPayee", label: "(vi) व्यावसायिक कर का भुगतान" },
                    { id: "rural_puccaHouse3Rooms", label: "(vii) पक्की दीवारों वाले 3 कमरे" },
                    { id: "rural_irrigation2_5Acres", label: "(viii) सिंचाई उपकरण के साथ 2.5 एकड़ भूमि" },
                    { id: "rural_irrigation5Acres", label: "(ix) 2+ फसली मौसम के लिए 5 एकड़ भूमि" },
                    { id: "rural_irrigation7_5Acres", label: "(x) सिंचाई उपकरण के साथ 7.5 एकड़ भूमि" },
                    { id: "rural_govtService", label: "(xi) कोई सदस्य सरकारी सेवा में है" }
                  ].map((field) => (
                    <div key={field.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      <div className="flex gap-4 bg-white px-3 py-1 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" value="Yes" {...register(field.id as any)} onClick={handleRadioClick(field.id as any, "Yes")} className="w-3.5 h-3.5" /> <span className="text-xs">हाँ</span></label>
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" value="No" {...register(field.id as any)} onClick={handleRadioClick(field.id as any, "No")} className="w-3.5 h-3.5" /> <span className="text-xs">नहीं</span></label>
                      </div>
                    </div>
                  ))}

                  {watchRuralGovt === "Yes" && (
                    <div className="ml-8 p-3 bg-white rounded-lg border border-orange-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input {...register("rural_govtServiceDetails.serviceName")} placeholder="किस सेवा में है" className="p-2 border rounded-md text-sm" />
                      <input {...register("rural_govtServiceDetails.postName")} placeholder="कहाँ पदस्थापित है" className="p-2 border rounded-md text-sm" />
                      <input {...register("rural_govtServiceDetails.monthlyIncome")} placeholder="मासिक आमदनी" className="p-2 border rounded-md text-sm" />
                    </div>
                  )}
                </div>
              </section>

            {/* Urban Declarations */}
            <section className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-slate-800 border-b border-blue-200 pb-2">शहरी क्षेत्र (Urban Declarations)</h3>
                
                <div className="space-y-3">
                  {[
                    { id: "urban_incomeTaxPayee", label: "(i) आयकर अदा करते है" },
                    { id: "urban_govtService", label: "(ii) सरकारी सेवा में है (Group D छोड़कर)" },
                  ].map((field) => (
                    <div key={field.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      <div className="flex gap-4 bg-white px-3 py-1 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" value="Yes" {...register(field.id as any)} onClick={handleRadioClick(field.id as any, "Yes")} className="w-3.5 h-3.5" /> <span className="text-xs">हाँ</span></label>
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" value="No" {...register(field.id as any)} onClick={handleRadioClick(field.id as any, "No")} className="w-3.5 h-3.5" /> <span className="text-xs">नहीं</span></label>
                      </div>
                    </div>
                  ))}

                  {watchUrbanGovt === "Yes" && (
                    <div className="ml-8 p-3 bg-white rounded-lg border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input {...register("urban_govtServiceDetails.serviceName")} placeholder="किस सेवा में है" className="p-2 border rounded-md text-sm" />
                      <input {...register("urban_govtServiceDetails.postName")} placeholder="कहाँ पदस्थापित है" className="p-2 border rounded-md text-sm" />
                      <input {...register("urban_govtServiceDetails.monthlyIncome")} placeholder="मासिक आमदनी" className="p-2 border rounded-md text-sm" />
                    </div>
                  )}

                  {[
                    { id: "urban_commercialTaxPayee", label: "(iii) व्यवसायिक कर अदा करते है" },
                    { id: "urban_puccaHouse3Rooms", label: "(iv) तीन कमरे या उससे अधिक पक्का मकान" },
                    { id: "urban_incomeAbove20k", label: "(v) मासिक आय 20,000/- रू0 से अधिक" },
                    { id: "urban_twoWheelerAndFridgeAndWash", label: "(vi) दो पहिया वाहन, रेफ्रीजरेटर तथा वाशिंग मशीन" },
                    { id: "urban_fourWheeler", label: "(vii) चार पहिया वाहन" },
                    { id: "urban_washingMachine", label: "(viii) वाशिंग मशीन" },
                  ].map((field) => (
                    <div key={field.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      <div className="flex gap-4 bg-white px-3 py-1 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" value="Yes" {...register(field.id as any)} onClick={handleRadioClick(field.id as any, "Yes")} className="w-3.5 h-3.5" /> <span className="text-xs">हाँ</span></label>
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" value="No" {...register(field.id as any)} onClick={handleRadioClick(field.id as any, "No")} className="w-3.5 h-3.5" /> <span className="text-xs">नहीं</span></label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">दिनांक (Date)</label>
                <input {...register("date")} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">स्थान (Place)</label>
                <ReactTransliterate
                  value={watch("place") || ""}
                  onChangeText={(text) => setValue("place", text)}
                  lang="hi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="स्थान..."
                />
              </div>
            </div>

          </form>
        </div>

        {/* Live Preview Section */}
        <div className="bg-slate-300 rounded-2xl shadow-inner border border-slate-400 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2">
              <Printer size={18} />
              <span className="font-semibold text-sm hidden sm:inline">A4 Print Preview (4 Pages)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                <button type="button" onClick={handleZoomOut} className="p-1 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors" title="Zoom Out">
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={handleZoomIn} className="p-1 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors" title="Zoom In">
                  <ZoomIn size={16} />
                </button>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">Live Template Rendering</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="flex justify-center transition-transform duration-200 origin-top" style={{ transform: `scale(${zoom})` }}>
              <div ref={previewRef} className="shadow-2xl ring-1 ring-black/5 bg-white">
                <BiharRationKaTemplate data={watch()} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
