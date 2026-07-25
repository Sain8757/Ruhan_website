import React from 'react';
import type { BiharRationNewData } from '@/config/forms/bihar-ration-new';

interface FormTemplateProps {
  data: BiharRationNewData;
  photoSrc?: string;
  signatureSrc?: string;
}

export default function BiharRationNewTemplate({ data, photoSrc, signatureSrc }: FormTemplateProps) {
  // A4 size parameters
  const a4Width = "210mm";
  const a4Height = "297mm";
  
  // Reusable checkmark
  const tick = "✓";

  return (
    <div className="font-sans text-black" style={{ width: a4Width, boxSizing: 'border-box', backgroundColor: '#fff' }}>
      {/* -------------------- PAGE 1 -------------------- */}
      <div 
        style={{ 
          width: a4Width, 
          height: a4Height, 
          padding: "15mm 15mm 15mm 15mm", 
          position: "relative",
          pageBreakAfter: "always",
          backgroundColor: '#fff',
          boxSizing: 'border-box'
        }}
      >
        {/* Background Image - Absolute Positioning - Developer guide only, user won't print this if they remove it */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', opacity: 1 }}>
          <img src="/assets/forms/ration-new-page-1.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>

        {/* Content Overlay */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          {/* Main Title Header */}
          <div className="flex justify-center mb-6 pt-4">
            <div className="border-2 border-black inline-block px-12 py-2 w-full text-center">
              <h1 className="text-xl font-bold tracking-wide">-:: नया राशन कार्ड बनाने हेतु प्रपत्र ::-</h1>
            </div>
          </div>

          {/* Form Content - Complex Grid/Table Layout */}
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              {/* Section: Applicant Details */}
              <tr className="bg-gray-300">
                <td colSpan={4} className="border border-black text-center font-bold py-1 text-[13px]">-:: आवेदक का विवरण ::-</td>
              </tr>
              
              {/* Row 1 */}
              <tr>
                <td rowSpan={2} className="border border-black text-center w-8 p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">1</div>
                </td>
                <td rowSpan={2} className="border border-black px-2 py-1 font-bold w-48 text-[12px] leading-[1.5]">
                  आवेदक का नाम :<br/>(आधार कार्ड के अनुसार)
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px] w-16">हिन्दी में-</td>
                <td className="border border-black px-2 py-1 text-[13px] font-semibold w-64">{data.applicantNameHi || ''}</td>
                {/* Photo Space - spans 4 rows */}
                <td rowSpan={4} className="border border-black p-2 align-middle text-center w-40 relative">
                  {photoSrc ? (
                    <img src={photoSrc} className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] object-cover rounded" alt="Photo" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-60">
                      <div className="w-12 h-8 bg-gray-300 rounded-[50%] flex items-center justify-center mb-1">
                        <div className="flex -space-x-1">
                           <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                           <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                           <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                           <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        </div>
                      </div>
                      <span className="font-bold text-sm">पारिवारिक<br/>फोटो</span>
                    </div>
                  )}
                </td>
              </tr>
              {/* Row 1 - English */}
              <tr>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">अंग्रेजी में-</td>
                <td className="border border-black px-2 py-1 text-[13px] font-semibold uppercase">{data.applicantNameEn || ''}</td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">2</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">आधार संख्या :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold tracking-widest">{data.aadhaarNumber || ''}</td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">3</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px] leading-[1.5]">
                  आवेदक का मोबाईल नं० :<br/>(आधार कार्ड से जुड़ा हुआ)
                </td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold tracking-widest">{data.mobileNumber || ''}</td>
              </tr>

              {/* Row 4 */}
              <tr>
                <td rowSpan={2} className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">4</div>
                </td>
                <td rowSpan={2} className="border border-black px-2 py-1 font-bold text-[12px]">आवेदक के पिता/पति का नाम :</td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">हिन्दी में-</td>
                <td className="border border-black px-2 py-1 text-[13px] font-semibold">{data.fatherHusbandNameHi || ''}</td>
                {/* Signature Space - spans vertically */}
                <td rowSpan={13} className="border border-black p-2 align-middle text-center w-32 relative">
                  {signatureSrc ? (
                    <img src={signatureSrc} className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] object-contain" alt="Signature" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-bold text-sm tracking-wider" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        आवेदक का हस्ताक्षर/ <br/> अंगूठे का निशान
                      </span>
                    </div>
                  )}
                </td>
              </tr>
              {/* Row 4 - English */}
              <tr>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">अंग्रेजी में-</td>
                <td className="border border-black px-2 py-1 text-[13px] font-semibold uppercase">{data.fatherHusbandNameEn || ''}</td>
              </tr>

              {/* Row 5 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">5</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">पूरा पता :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold min-h-[40px] align-top">{data.fullAddress || ''}</td>
              </tr>

              {/* Row 6 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">6</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">पंचायत का नाम :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold">{data.panchayat || ''}</td>
              </tr>

              {/* Section: Bank Details */}
              <tr className="bg-gray-300">
                <td colSpan={4} className="border border-black text-center font-bold py-1 text-[13px]">-:: बैंक का विवरण ::-</td>
              </tr>
              
              {/* Bank 1 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">1</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">बैंक का नाम :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold">{data.bankName || ''}</td>
              </tr>
              
              {/* Bank 2 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">2</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">बैंक शाखा का नाम :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold">{data.branchName || ''}</td>
              </tr>
              
              {/* Bank 3 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">3</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">बैंक खाता संख्या :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold tracking-widest">{data.accountNumber || ''}</td>
              </tr>
              
              {/* Bank 4 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">4</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px]">आई०एफ०एस०सी० कोड :</td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold tracking-widest uppercase">{data.ifscCode || ''}</td>
              </tr>

              {/* Section: Documents */}
              <tr className="bg-gray-300">
                <td colSpan={4} className="border border-black text-center font-bold py-1 text-[13px]">-:: संलग्न दस्तावेज ::-</td>
              </tr>

              {/* Doc 1 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">1</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px] leading-[1.5]">
                  आय प्रमाण पत्र :<br/><span className="font-normal text-[10px]">(दस्तावेज संख्या / निर्गत तिथि)</span>
                </td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold">
                  {data.incomeCert?.docNo ? `${data.incomeCert.docNo} / ${data.incomeCert.date}` : ''}
                </td>
              </tr>

              {/* Doc 2 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">2</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px] leading-[1.5]">
                  निवास प्रमाण पत्र :<br/><span className="font-normal text-[10px]">(दस्तावेज संख्या / निर्गत तिथि)</span>
                </td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold">
                  {data.residenceCert?.docNo ? `${data.residenceCert.docNo} / ${data.residenceCert.date}` : ''}
                </td>
              </tr>

              {/* Doc 3 */}
              <tr>
                <td className="border border-black text-center p-1">
                  <div className="w-5 h-5 rounded-full border border-black inline-flex items-center justify-center text-xs">3</div>
                </td>
                <td className="border border-black px-2 py-1 font-bold text-[12px] leading-[1.5]">
                  जाति प्रमाण पत्र :<br/><span className="font-normal text-[10px]">(दस्तावेज संख्या / निर्गत तिथि)</span>
                </td>
                <td colSpan={2} className="border border-black px-2 py-1 text-[13px] font-semibold">
                  {data.casteCert?.docNo ? `${data.casteCert.docNo} / ${data.casteCert.date}` : ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section: Family Table */}
          <table className="w-full border-collapse border border-black text-sm mt-0 border-t-0">
            <tbody>
              <tr className="bg-gray-300">
                <td colSpan={6} className="border border-black text-center font-bold py-1 text-[13px]">-:: राशन कार्ड में जोड़े जाने वाले सदस्यों का विवरण ::-</td>
              </tr>
              <tr className="font-bold text-[12px] text-center italic">
                <td className="border border-black py-1 w-12">क्र०</td>
                <td className="border border-black py-1">नाम आधार के अनुसार</td>
                <td className="border border-black py-1 w-16">लिंग</td>
                <td className="border border-black py-1 w-56">पिता/पति का नाम</td>
                <td className="border border-black py-1 w-20">संबंध</td>
                <td className="border border-black py-1 w-16">उम्र</td>
              </tr>
              
              {/* Print exactly 6 rows */}
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const member = data.familyMembers?.[idx];
                return (
                  <tr key={idx} className="text-center h-6">
                    <td className="border border-black py-1 text-xs">
                      <div className="w-4 h-4 mx-auto rounded-full border border-black inline-flex items-center justify-center text-[10px]">{idx + 1}</div>
                    </td>
                    <td className="border border-black py-1 font-semibold px-2 text-left">{member?.name || ''}</td>
                    <td className="border border-black py-1 font-semibold">{member?.gender || ''}</td>
                    <td className="border border-black py-1 font-semibold px-2 text-left">{member?.fatherHusbandName || ''}</td>
                    <td className="border border-black py-1 font-semibold">{member?.relation || ''}</td>
                    <td className="border border-black py-1 font-semibold">{member?.age || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
        </div>
      </div>

      {/* -------------------- PAGE 2 -------------------- */}
      <div 
        style={{ 
          width: a4Width, 
          height: a4Height, 
          padding: "20mm 15mm 20mm 15mm", 
          position: "relative",
          backgroundColor: '#fff',
          boxSizing: 'border-box'
        }}
      >
        {/* Background Image - Absolute Positioning */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', opacity: 1 }}>
          <img src="/assets/forms/ration-new-page-2.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>

        {/* Content Overlay */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          
          <div className="border-2 border-black p-4 pb-20 h-full flex flex-col">
            
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold tracking-wide inline-block border-b-2 border-black px-4 py-1">-::स्व-घोषणा पत्र::-</h1>
            </div>

            {/* Top Meta info */}
            <div className="space-y-4 font-bold text-sm mb-6 pl-4">
              <div className="flex">
                <div className="w-56">आवेदक/आवेदिका का नाम</div>
                <div>:- <span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationName || '....................................................................................................................'}</span></div>
              </div>
              <div className="flex">
                <div className="w-56">पिता/पति का नाम</div>
                <div>:- <span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationFatherHusband || '....................................................................................................................'}</span></div>
              </div>
              <div className="flex">
                <div className="w-40">पंचायत का नाम</div>
                <div>:- <span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationPanchayat || '........................................................'}</span></div>
                <div className="w-24 ml-4">ग्राम/टोला :-</div>
                <div className="flex-1"><span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationGramTola || '........................................................'}</span></div>
              </div>
              <div className="flex">
                <div className="w-40">वार्ड० सं०</div>
                <div>:- <span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationWard || '........................................................'}</span></div>
                <div className="w-24 ml-4">प्रखण्ड :-</div>
                <div className="flex-1"><span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationBlock || '........................................................'}</span></div>
              </div>
              <div className="flex mt-6">
                <div>नजदीकी जन वितरण प्रणाली विक्रेता का नाम (अनिवार्य) :- <span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold">{data.declarationDealer || '............................................................................................................'}</span></div>
              </div>
            </div>

            {/* Questions Table */}
            <table className="w-full border-collapse border border-black text-sm mb-6">
              <tbody>
                <tr>
                  <td className="border border-black p-1 text-center w-8">1</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, में मोटर चालित तिपहिया/चार पहियों वाली वाहन है ?</td>
                  <td className="border border-black text-center w-12 font-bold relative">
                    हाँ
                    {data.declarations?.motorVehicle && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center w-12 font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.motorVehicle && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">2</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, मशीन चालित तीन/चार पहियों वाले कृषि उपकरण है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.machineEquip && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.machineEquip && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">3</td>
                  <td className="border border-black px-2 py-1 leading-snug">सरकार में पंजीकृत गैर कृषि उद्योग वाले परिवार वाली गृहस्थी है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.govtRegIndustry && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.govtRegIndustry && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">4</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, में किसी सदस्य की मासिक आय 10,000/- रू0 से अधिक है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.incomeOver10k && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.incomeOver10k && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">5</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, आयकर देते है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.incomeTax && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.incomeTax && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">6</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, व्यवसायिक कर भुगतान करते है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.commercialTax && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.commercialTax && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">7</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, में तीन कमरे या उससे अधिक पक्का मकान (कंक्रीट छतयुक्त) वाली गृहस्थी जो स्वंय स्वामित्व है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.puccaHouse3Rooms && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.puccaHouse3Rooms && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">8</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, में कम से कम एक सिंचाई उपकरण के साथ 2.5 एकड़ अथवा इससे अधिक सिंचित भूमि है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.irrigatedLand2_5 && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.irrigatedLand2_5 && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">9</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, दो अथवा इससे अधिक फसली मौसम के लिए 05 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.irrigatedLand5 && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.irrigatedLand5 && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">10</td>
                  <td className="border border-black px-2 py-1 leading-snug">क्या आवेदिका/आवेदक के परिवार, में कम से कम एक सिंचाई उपकरण के साथ 7.5 एकड़ अथवा इससे अधिक भूमि वाली गृहस्थी है ?</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.irrigatedLand7_5 && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.irrigatedLand7_5 && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-center">11</td>
                  <td className="border border-black px-2 py-1 leading-snug pb-2">क्या आवेदिका/आवेदक के परिवार में कोई सदस्य सरकारी सेवा में नहीं है, सरकारी सेवा में तात्पर्य है केन्द्र एवं राज्य सरकार/लोक उपक्रम स्थानीय निकाय एवं स्वशासी संस्थाओं में नियमित वेतनमान में कार्यरत कर्मी (अनु०जाति/अनु०जन०जाति के ग्रुप "डी" को छोड़कर)</td>
                  <td className="border border-black text-center font-bold relative">
                    हाँ
                    {data.declarations?.govtServant && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                  <td className="border border-black text-center font-bold relative">
                    नहीं
                    {data.declarations && !data.declarations.govtServant && <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">{tick}</span>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Final Text */}
            <div className="text-right font-bold text-sm mb-4 pr-16 mt-4">
              दिनांक :- <span className="underline decoration-dotted underline-offset-4 decoration-2 px-2 text-base font-semibold inline-block min-w-[120px] text-center">{data.date || '........................'}</span>
            </div>
            <div className="text-center font-bold text-base mb-2">
              -घोषणा-
            </div>
            <p className="text-[13px] font-medium leading-relaxed px-4 text-justify">
              मैं प्रमाणित करता/करती हुँ कि आवेदन पत्र में उपलब्ध करायी गयी सभी वांछित सूचनाये एवं दस्तावेज सत्य है, एवं किसी भी परिस्थिति में मेरे द्वारा उपलब्ध कराये गये सूचनाये/दस्तावेजों में गलत/असत्य पाये जाने पर मैं विधिसम्मत कार्रवाई की भागी होउँगा/होउँगी।
            </p>

            {/* Signature Block */}
            <div className="mt-auto text-right font-bold text-sm pr-16">
              आवेदक का हस्ताक्षर/<br/>अंगूठे का निशान
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
