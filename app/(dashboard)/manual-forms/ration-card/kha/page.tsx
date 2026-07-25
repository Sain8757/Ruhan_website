"use client";

import { useState, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import { Download, Eye, FileText, Plus, Trash2, Upload } from "lucide-react";
import { BiharRationKhaTemplate } from "@/components/templates/BiharRationKhaTemplate";

// Form Schema
const formSchema = z.object({
  applicantName: z.string().min(1, "Name is required"),
  aadhaar: z.string().min(12, "Valid Aadhaar required"),
  mobile: z.string().min(10, "Valid mobile required"),
  fatherName: z.string().min(1, "Father/Husband name is required"),
  address: z.string().min(5, "Full address is required"),
  existingRationCard: z.string().min(1, "Ration card no required"),
  dealerName: z.string().min(1, "Dealer details required"),
  reasonForChange: z.string().min(1, "Select a reason"),
  familyMembers: z.array(
    z.object({
      name: z.string().min(1, "Name required"),
      fatherName: z.string().min(1, "Father name required"),
      gender: z.string().min(1, "Required"),
      age: z.string().min(1, "Required"),
      maritalStatus: z.string().min(1, "Required"),
      relation: z.string().min(1, "Required"),
      aadhaar: z.string().optional(),
      mobile: z.string().optional(),
      occupation: z.string().optional(),
      incomeSource: z.string().optional(),
      monthlyIncome: z.string().optional(),
    })
  ),
  areaType: z.enum(["Rural", "Urban"]),
  ruralDeclarations: z.object({
    motorVehicle: z.boolean().optional(),
    machineEquip: z.boolean().optional(),
    govtRegIndustry: z.boolean().optional(),
    incomeOver10k: z.boolean().optional(),
    incomeTax: z.boolean().optional(),
    commercialTax: z.boolean().optional(),
    puccaHouse3Rooms: z.boolean().optional(),
    irrigatedLand2_5: z.boolean().optional(),
    irrigatedLand5: z.boolean().optional(),
    irrigatedLand7_5: z.boolean().optional(),
    govtServant: z.boolean().optional(),
    govtServantDetails: z.object({
      serviceName: z.string().optional(),
      postingPlace: z.string().optional(),
      monthlyIncome: z.string().optional(),
    }).optional(),
  }).optional(),
  urbanDeclarations: z.object({
    incomeTax: z.boolean().optional(),
    govtServant: z.boolean().optional(),
    govtServantDetails: z.object({
      serviceName: z.string().optional(),
      postingPlace: z.string().optional(),
      monthlyIncome: z.string().optional(),
    }).optional(),
    commercialTax: z.boolean().optional(),
    puccaHouse3Rooms: z.boolean().optional(),
    incomeOver20k: z.boolean().optional(),
    threeAppliances: z.boolean().optional(),
    fourWheeler: z.boolean().optional(),
    washingMachine: z.boolean().optional(),
  }).optional(),
  date: z.string().optional(),
  place: z.string().optional(),
  photoBase64: z.string().optional(),
  signatureBase64: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export default function RationCardFormPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      familyMembers: [{ name: "", fatherName: "", gender: "", age: "", maritalStatus: "", relation: "", aadhaar: "", mobile: "", occupation: "", incomeSource: "", monthlyIncome: "" }],
      areaType: "Rural",
      ruralDeclarations: {},
      urbanDeclarations: {},
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "familyMembers",
  });

  const areaType = watch("areaType");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "photoBase64" | "signatureBase64") => {
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

  const photoPreview = watch("photoBase64");
  const sigPreview = watch("signatureBase64");

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    try {
      const container = document.getElementById('form-engine-container');
      if (!container) throw new Error("Preview container not found");
      
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const templateWrapper = container.firstChild as HTMLElement;
      if (!templateWrapper) throw new Error("Template not found");
      
      const pages = Array.from(templateWrapper.children) as HTMLElement[];
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i];
        
        const canvas = await html2canvas(pageElement, {
          scale: 2, // High resolution
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save("Ration_Card_Form_Bihar.pdf");

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF. Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FileText size={24} className="text-blue-600" />
            Manual Form Filling
          </h1>
          <p className="text-sm mt-1 font-semibold" style={{ color: "var(--brand-primary)" }}>
            Bihar Ration Card Form (Kha) - Full 3 Pages
          </p>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download="Ration_Card_Form_Bihar.pdf"
            className="btn-primary flex items-center gap-2"
          >
            <Download size={16} />
            Download Generated PDF
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: FORM */}
        <div className="glass-card p-6 rounded-2xl h-[800px] flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            
            {/* Base Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Applicant Name</label>
                <Controller
                  control={control}
                  name="applicantName"
                  render={({ field: { onChange, value } }) => (
                    <ReactTransliterate
                      value={value || ""}
                      onChangeText={(text) => onChange(text)}
                      lang="hi"
                      className="form-input w-full"
                      placeholder="आवेदक का नाम"
                    />
                  )}
                />
                {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Aadhaar / EID</label>
                <input {...register("aadhaar")} className="form-input w-full" placeholder="आधार सं०" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Mobile No</label>
                <input {...register("mobile")} className="form-input w-full" placeholder="मोबाईल नं०" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Father/Husband Name</label>
                <Controller
                  control={control}
                  name="fatherName"
                  render={({ field: { onChange, value } }) => (
                    <ReactTransliterate
                      value={value || ""}
                      onChangeText={(text) => onChange(text)}
                      lang="hi"
                      className="form-input w-full"
                      placeholder="पति/पिता का नाम"
                    />
                  )}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold mb-1">Full Address</label>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, value } }) => (
                    <ReactTransliterate
                      renderComponent={(props) => <textarea {...props} className="form-input w-full h-16" />}
                      value={value || ""}
                      onChangeText={(text) => onChange(text)}
                      lang="hi"
                      placeholder="पूर्ण आवासीय पता"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Existing Ration Card No.</label>
                <input {...register("existingRationCard")} className="form-input w-full" placeholder="विद्यमान राशन कार्ड सं०" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Dealer Name</label>
                <Controller
                  control={control}
                  name="dealerName"
                  render={({ field: { onChange, value } }) => (
                    <ReactTransliterate
                      value={value || ""}
                      onChangeText={(text) => onChange(text)}
                      lang="hi"
                      className="form-input w-full"
                      placeholder="विक्रेता का नाम"
                    />
                  )}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold mb-1">Reason for Change</label>
                <select {...register("reasonForChange")} className="form-input w-full">
                  <option value="">Select Reason</option>
                  <option value="Nivas">निवास में परिवर्तन (Change in residence)</option>
                  <option value="JanmMrityu">जन्म या मृत्यु (Birth or death)</option>
                  <option value="Ashuddhiya">कार्ड में वर्णित ब्योरो में अशुद्धियाँ (Errors)</option>
                  <option value="Anya">अन्य कारण (Other)</option>
                </select>
              </div>
            </div>

            {/* Family Members */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold">Family Details</label>
                <button type="button" onClick={() => append({ name: "", fatherName: "", gender: "", age: "", maritalStatus: "", relation: "", aadhaar: "", mobile: "", occupation: "", incomeSource: "", monthlyIncome: "" })} className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <Plus size={14} /> Add Member
                </button>
              </div>
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="col-span-6 flex justify-between">
                      <span className="text-xs font-bold">Member {index + 1}</span>
                      <button type="button" onClick={() => remove(index)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Name</label>
                      <Controller control={control} name={`familyMembers.${index}.name`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Father Name</label>
                      <Controller control={control} name={`familyMembers.${index}.fatherName`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Gender</label>
                      <Controller control={control} name={`familyMembers.${index}.gender`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Age</label>
                      <input {...register(`familyMembers.${index}.age`)} className="form-input w-full text-xs" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Rel.</label>
                      <Controller control={control} name={`familyMembers.${index}.relation`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Marital Status</label>
                      <Controller control={control} name={`familyMembers.${index}.maritalStatus`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Aadhaar</label>
                      <input {...register(`familyMembers.${index}.aadhaar`)} className="form-input w-full text-xs" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Mobile</label>
                      <input {...register(`familyMembers.${index}.mobile`)} className="form-input w-full text-xs" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Occupation</label>
                      <Controller control={control} name={`familyMembers.${index}.occupation`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Income Source</label>
                      <Controller control={control} name={`familyMembers.${index}.incomeSource`} render={({ field: { onChange, value } }) => ( <ReactTransliterate value={value || ""} onChangeText={onChange} lang="hi" className="form-input w-full text-xs" /> )} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Monthly Inc.</label>
                      <input {...register(`familyMembers.${index}.monthlyIncome`)} className="form-input w-full text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Declarations */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <label className="block text-sm font-bold mb-3">Declarations</label>
              
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">(क) ग्रामीण क्षेत्र (Rural)</h4>
                <div className="space-y-2 pl-2 border-l-2 border-blue-500">
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.motorVehicle")} /> Motor/3-4 wheeler</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.machineEquip")} /> Machine agriculture eq.</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.govtRegIndustry")} /> Govt reg. non-agri industry</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.incomeOver10k")} /> Income over 10k/month</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.incomeTax")} /> Pay Income Tax</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.commercialTax")} /> Pay Commercial Tax</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.puccaHouse3Rooms")} /> Pucca house with 3+ rooms</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.irrigatedLand2_5")} /> 2.5 acre irrigated land</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.irrigatedLand5")} /> 5 acre irrigated land</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.irrigatedLand7_5")} /> 7.5 acre irrigated land</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("ruralDeclarations.govtServant")} /> Govt Servant</label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">(ख) शहरी क्षेत्र (Urban)</h4>
                <div className="space-y-2 pl-2 border-l-2 border-green-500">
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.incomeTax")} /> Pay Income Tax</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.commercialTax")} /> Pay Commercial Tax</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.puccaHouse3Rooms")} /> Pucca house with 3+ rooms</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.incomeOver20k")} /> Income over 20k/month</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.threeAppliances")} /> 2-wheeler, Fridge & Washing Mach.</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.fourWheeler")} /> 4-wheeler</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.washingMachine")} /> Washing Machine</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register("urbanDeclarations.govtServant")} /> Govt Servant (excluding Group D)</label>
                </div>
              </div>
            </div>

            {/* Date and Place */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
               <div>
                 <label className="block text-xs font-bold mb-1">Date</label>
                 <input type="text" {...register("date")} className="form-input w-full" placeholder="DD/MM/YYYY" />
               </div>
               <div>
                 <label className="block text-xs font-bold mb-1">Place (Sthan)</label>
                 <Controller
                    control={control}
                    name="place"
                    render={({ field: { onChange, value } }) => (
                      <ReactTransliterate
                        value={value || ""}
                        onChangeText={onChange}
                        lang="hi"
                        className="form-input w-full"
                        placeholder="स्थान"
                      />
                    )}
                  />
               </div>
            </div>

            {/* Uploads */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2">Passport Photo</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl h-24 flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                     <img src={photoPreview} alt="Preview" className="h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload size={20} className="mx-auto mb-1" />
                      <span className="text-xs">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={photoInputRef} onChange={(e) => handleFileUpload(e, "photoBase64")} />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2">Signature/Thumb</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl h-24 flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden"
                  onClick={() => sigInputRef.current?.click()}
                >
                  {sigPreview ? (
                     <img src={sigPreview} alt="Preview" className="h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload size={20} className="mx-auto mb-1" />
                      <span className="text-xs">Upload Signature</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={sigInputRef} onChange={(e) => handleFileUpload(e, "signatureBase64")} />
              </div>
            </div>

            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); onSubmit(watch()); }} 
              disabled={isGenerating} 
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isGenerating ? "Generating..." : <><Eye size={18} /> Preview Form PDF (3 Pages)</>}
            </button>
          </form>
        </div>

        {/* RIGHT: LIVE PDF PREVIEW */}
        <div className="glass-card p-4 rounded-2xl h-[800px] flex flex-col bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
             Live Preview (Exact Layout)
          </h2>
          <div className="flex-1 bg-gray-300 rounded-xl overflow-y-auto overflow-x-hidden shadow-inner flex justify-center py-4">
            {/* We scale the A4 page container so it fits in the right panel visually, but the raw HTML remains A4 size for Puppeteer */}
            <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', height: 'fit-content' }}>
               <div id="form-engine-container">
                 <BiharRationKhaTemplate data={watch()} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
