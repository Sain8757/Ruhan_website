import React from 'react';
import type { BiharRationKaData } from '@/config/forms/bihar-ration-ka';

interface Props {
  data: BiharRationKaData;
}

export function BiharRationKaTemplate({ data }: Props) {
  const tick = '✓';
  
  // Array of 7 members for page 1 table
  const members = [...data.familyMembers];
  while (members.length < 7) {
    members.push({ name: '', fatherHusbandName: '', gender: '', age: '', maritalStatus: '', relation: '', aadhaar: '', mobile: '', occupation: '', incomeSource: '', monthlyIncome: '' });
  }
  const displayMembers = members.slice(0, 7);

  const CheckBox = ({ checked, label }: { checked: boolean; label: string }) => (
    <span className="inline-flex items-center gap-1 mx-2 whitespace-nowrap">
      {label} <span className="inline-block w-6 h-4 border border-black text-center leading-[14px] text-sm overflow-hidden">{checked ? tick : ''}</span>
    </span>
  );

  return (
    <div className="bg-white text-black w-[210mm] mx-auto shadow-sm text-[13px] leading-tight" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
      
      {/* PAGE 1 */}
      <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white relative overflow-hidden" style={{ pageBreakAfter: 'always' }}>
        <div className="text-center font-bold mb-4">
          <p className="text-[14px]">लोक सेवा के अधिकार अधिनियम के अन्तर्गत नया राशन कार्ड के लिए आवेदन पत्र का प्रपत्र 'क'</p>
          <p className="text-[12px] font-normal mt-1 leading-tight">
            (राष्ट्रीय खाद्य सुरक्षा अधिनियम 2013 (धारा-9) तथा लक्षित सार्वजनिक वितरण प्रणाली (नियंत्रण)<br />
            आदेश 2015 (कंडिका 3 का उपकंडिका 13, 14 तथा कंडिका 4 उपकंडिका 7, 8, 9) द्रष्टव्य)
          </p>
        </div>

        <div className="relative mb-6">
          <div className="absolute right-0 top-0 w-[35mm] h-[45mm] border border-black flex flex-col items-center justify-center overflow-hidden">
            {data.photoBase64 ? (
              <img src={data.photoBase64} alt="Applicant" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs">पारिवारिक फोटो</span>
            )}
          </div>
          
          <div className="space-y-3 w-[130mm]">
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>1.</span><div className="flex"><span className="w-48">आवेदक का नाम</span><span>: {data.applicantName}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>2.</span><div className="flex"><span className="w-48">आधार / EID no</span><span>: {data.aadhaarNo}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>3.</span><div className="flex"><span className="w-48">मोबाईल नं०</span><span>: {data.mobileNo}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>4.</span><div className="flex"><span className="w-48">आवेदक के पति/पिता का नाम</span><span>: {data.fatherHusbandName}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>5.</span><div className="flex"><span className="w-48">पूर्ण आवासीय पता</span><span>: {data.fullAddress}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1 mt-2"><span>6.</span><div className="flex"><span className="w-48">बैंक का IFSC Code</span><span>: {data.bankIfsc}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>7.</span><div className="flex"><span className="w-48">बैंक खाता नं०</span><span>: {data.bankAccountNo}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>8.</span><div className="flex"><span className="w-48">बैंक का नाम</span><span>: {data.bankName}</span></div></div>
            <div className="grid grid-cols-[20px_1fr] gap-1"><span>9.</span><div className="flex"><span className="w-[80mm]">राशन कार्ड के लिए परिवार के अन्य सदस्यों का विवरण</span></div></div>
          </div>
        </div>

        {/* Tables */}
        <table className="w-full border-collapse border border-black text-center text-[11px] mb-2">
          <thead>
            <tr>
              <th className="border border-black font-normal p-1 w-6">क्र०</th>
              <th className="border border-black font-normal p-1 w-32">नाम</th>
              <th className="border border-black font-normal p-1 w-32">पति/पिता का नाम</th>
              <th className="border border-black font-normal p-1 w-12">लिंग</th>
              <th className="border border-black font-normal p-1 w-10">उम्र</th>
              <th className="border border-black font-normal p-1 w-16">वैवाहिक<br/>स्थिति</th>
              <th className="border border-black font-normal p-1">संबंध</th>
            </tr>
            <tr>
              <th className="border border-black font-normal p-0.5">1</th>
              <th className="border border-black font-normal p-0.5">2</th>
              <th className="border border-black font-normal p-0.5">3</th>
              <th className="border border-black font-normal p-0.5">4</th>
              <th className="border border-black font-normal p-0.5">5</th>
              <th className="border border-black font-normal p-0.5">6</th>
              <th className="border border-black font-normal p-0.5">7</th>
            </tr>
          </thead>
          <tbody>
            {displayMembers.map((m, i) => (
              <tr key={`t1-${i}`} className="h-5">
                <td className="border border-black">{m.name ? i + 1 : ''}</td>
                <td className="border border-black">{m.name}</td>
                <td className="border border-black">{m.fatherHusbandName}</td>
                <td className="border border-black">{m.gender}</td>
                <td className="border border-black">{m.age}</td>
                <td className="border border-black">{m.maritalStatus}</td>
                <td className="border border-black">{m.relation}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black text-center text-[11px] mb-4">
          <thead>
            <tr>
              <th className="border border-black font-normal p-1 w-32">आधार / EID no</th>
              <th className="border border-black font-normal p-1 w-24">मोबाईल नं०</th>
              <th className="border border-black font-normal p-1 w-24">व्यवसाय<br/>/सरकारी सेवक</th>
              <th className="border border-black font-normal p-1 w-24">आमदनी का<br/>स्रोत</th>
              <th className="border border-black font-normal p-1">मासिक आय</th>
            </tr>
            <tr>
              <th className="border border-black font-normal p-0.5">8</th>
              <th className="border border-black font-normal p-0.5">9</th>
              <th className="border border-black font-normal p-0.5">10</th>
              <th className="border border-black font-normal p-0.5">11</th>
              <th className="border border-black font-normal p-0.5">12</th>
            </tr>
          </thead>
          <tbody>
            {displayMembers.map((m, i) => (
              <tr key={`t2-${i}`} className="h-5">
                <td className="border border-black">{m.aadhaar}</td>
                <td className="border border-black">{m.mobile}</td>
                <td className="border border-black">{m.occupation}</td>
                <td className="border border-black">{m.incomeSource}</td>
                <td className="border border-black">{m.monthlyIncome}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Section 10 */}
        <div className="pl-[20px] text-[13px] leading-relaxed">
          <p className="font-semibold mb-1">10. ग्रामीण क्षेत्र के आवेदक निम्नलिखित पर हाँ/नहीं पर टिक लगावे :-</p>
          <div className="pl-6 space-y-1">
            <p>(i) मोटर चालित तिपहिया/चार पहिया वाहन है, <CheckBox label="हाँ" checked={data.rural_motorVehicle === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_motorVehicle === 'No'} /></p>
            <p>(ii) मशीन चालित तीन/चार पहियों वाले कृषि उपकरण है, <CheckBox label="हाँ" checked={data.rural_agriMachine === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_agriMachine === 'No'} /></p>
            <p>(iii) सरकार में पंजीकृत गैर-कृषि उद्योग वाले परिवार वाली गृहस्थी है, <CheckBox label="हाँ" checked={data.rural_nonAgriEnterprise === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_nonAgriEnterprise === 'No'} /></p>
            <p>(iv) परिवार के किसी सदस्य की मासिक आय 10,000/- रू0 से अधिक है, <CheckBox label="हाँ" checked={data.rural_incomeAbove10k === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_incomeAbove10k === 'No'} /></p>
            <p>(v) आयकर देते है, <CheckBox label="हाँ" checked={data.rural_incomeTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_incomeTaxPayee === 'No'} /></p>
            <p>(vi) व्यावसायिक कर का भुगतान करते है, <CheckBox label="हाँ" checked={data.rural_commercialTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_commercialTaxPayee === 'No'} /></p>
            <p>(vii) जिस मकान में रहते है, उस मकान में सभी कमरों में पक्की दीवारों और छत के साथ तीन अथवा अधिक कमरा है, <CheckBox label="हाँ" checked={data.rural_puccaHouse3Rooms === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_puccaHouse3Rooms === 'No'} /></p>
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white relative overflow-hidden text-[13px] leading-[1.6]" style={{ pageBreakAfter: 'always' }}>
        <div className="pl-[20px] pr-[15mm]">
          <div className="pl-6 space-y-1 mb-4">
            <p>(viii) परिवार में कम से कम एक सिंचाई उपकरण के साथ 2.5 एकड़ अथवा इससे अधिक सिंचित भूमि है, <CheckBox label="हाँ" checked={data.rural_irrigation2_5Acres === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_irrigation2_5Acres === 'No'} /></p>
            <p>(ix) दो अथवा उससे अधिक फसली मौसम के लिए 5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है, <CheckBox label="हाँ" checked={data.rural_irrigation5Acres === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_irrigation5Acres === 'No'} /></p>
            <p>(x) कम से कम एक सिंचाई उपकरण के साथ कम से कम 7.5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है, <CheckBox label="हाँ" checked={data.rural_irrigation7_5Acres === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_irrigation7_5Acres === 'No'} /></p>
            <p>(xi) आवेदक अथवा आवेदक के परिवार का कोई सदस्य सरकारी सेवा में है, <CheckBox label="हाँ" checked={data.rural_govtService === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_govtService === 'No'} /></p>
            <div className="pl-8">
              <p>अगर है तो उसका विवरण -</p>
              <p>(क) किस सेवा में है - {data.rural_govtService === 'Yes' ? data.rural_govtServiceDetails?.serviceName : ''}</p>
              <p>(ख) कहाँ पदस्थापित है - {data.rural_govtService === 'Yes' ? data.rural_govtServiceDetails?.postName : ''}</p>
              <p>(ग) कितना मासिक आमदनी है - {data.rural_govtService === 'Yes' ? data.rural_govtServiceDetails?.monthlyIncome : ''}</p>
            </div>
          </div>
          
          <p className="font-semibold mb-1 -ml-6">11. शहरी क्षेत्र के आवेदक निम्नलिखित पर आवश्यकतानुसार हाँ/नहीं, पर टिक लगावे :-</p>
          <div className="pl-2 space-y-1 mb-8">
            <p>(i) आयकर अदा करते है, <CheckBox label="हाँ" checked={data.urban_incomeTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_incomeTaxPayee === 'No'} /></p>
            <p className="leading-tight mb-1">
              (ii) आवेदक अथवा आवेदक के परिवार का कोई सदस्य वर्ग 1, वर्ग 2, वर्ग 3 एवं वर्ग 4 श्रेणी के सरकारी सेवा (अनु0जाति/अनु0 जनजाति के Group 'D' के कर्मी को छोड़कर) में है, <CheckBox label="हाँ" checked={data.urban_govtService === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_govtService === 'No'} />
            </p>
            <div className="pl-6 mb-1">
              <p>अगर है तो उसका विवरण -</p>
              <p>(क) किस सेवा में है - {data.urban_govtService === 'Yes' ? data.urban_govtServiceDetails?.serviceName : ''}</p>
              <p>(ख) कहाँ पदस्थापित है - {data.urban_govtService === 'Yes' ? data.urban_govtServiceDetails?.postName : ''}</p>
              <p>(ग) कितना मासिक आमदनी है - {data.urban_govtService === 'Yes' ? data.urban_govtServiceDetails?.monthlyIncome : ''}</p>
            </div>
            <p>(iii) व्यवसायिक कर अदा करते है, <CheckBox label="हाँ" checked={data.urban_commercialTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_commercialTaxPayee === 'No'} /></p>
            <p>(iv) तीन कमरे या उससे अधिक (पक्का) कंक्रीट छतयुक्त मकान वाली गृहस्थी जो स्वयं की स्वामित्व में है, <CheckBox label="हाँ" checked={data.urban_puccaHouse3Rooms === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_puccaHouse3Rooms === 'No'} /></p>
            <p>(v) परिवार के किसी सदस्य का मासिक आय 20,000/- रू0 से अधिक है, <CheckBox label="हाँ" checked={data.urban_incomeAbove20k === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_incomeAbove20k === 'No'} /></p>
            <p>(vi) दो पहिया वाहन, रेफ्रीजरेटर तथा वाशिंग मशीन तीनों उपकरण है, <CheckBox label="हाँ" checked={data.urban_twoWheelerAndFridgeAndWash === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_twoWheelerAndFridgeAndWash === 'No'} /></p>
            <p>(vii) गृहस्थी में चार पहिया वाहन है, <CheckBox label="हाँ" checked={data.urban_fourWheeler === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_fourWheeler === 'No'} /></p>
            <p>(viii) गृहस्थी में वाशिंग मशीन है, <CheckBox label="हाँ" checked={data.urban_washingMachine === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_washingMachine === 'No'} /></p>
          </div>

          {/* Signatures & Declaration */}
          <div className="flex justify-between mt-12 mb-6">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2"><span>दिनांक</span> <span className="border-b border-black w-24 px-1">{data.date}</span></div>
              <div className="flex gap-2"><span>स्थान</span> <span className="border-b border-black w-24 px-1">{data.place}</span></div>
            </div>
            <div className="text-center w-64">
              <div className="h-10 border-b border-black mb-1 flex items-end justify-center">
                {data.signatureBase64 && <img src={data.signatureBase64} alt="Signature" className="h-8 max-w-full" />}
              </div>
              <p>आवेदक का हस्ताक्षर/अंगूठे का निशान</p>
              <div className="flex gap-2 justify-center mt-2">
                <span>नाम</span> <span className="border-b border-black w-40 px-1 inline-block text-left">{data.applicantName}</span>
              </div>
            </div>
          </div>

          <p className="text-center font-bold underline mb-4 text-[15px]">घोषणा</p>
          <p className="mb-2">महोदया/महोदय</p>
          <p className="indent-8 text-justify mb-8">
            मैं परिवार सहित यह घोषणा करता हूँ की आवेदन पत्र में लिखी गई सभी प्रविष्टियाँ सही है । मैं इसके पूर्व राशन कार्ड के लिए कोई आवेदन पत्र नहीं दिया हूँ । अगर आवेदन पत्र में लिखी गई कोई तथ्य गलत पाया जाता है तो मैं दंडात्मक/कानूनी कार्रवाई का भागी होऊँगा ।
          </p>

          <div className="flex justify-between mt-12 mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2"><span>दिनांक</span> <span className="border-b border-black w-24 px-1">{data.date}</span></div>
              <div className="flex gap-2"><span>स्थान</span> <span className="border-b border-black w-24 px-1">{data.place}</span></div>
            </div>
            <div className="text-center w-64">
              <div className="h-10 border-b border-black mb-1 flex items-end justify-center">
                {data.signatureBase64 && <img src={data.signatureBase64} alt="Signature" className="h-8 max-w-full" />}
              </div>
              <p>आवेदक का हस्ताक्षर/अंगूठे का निशान</p>
              <div className="flex gap-2 justify-center mt-2">
                <span>नाम</span> <span className="border-b border-black w-40 px-1 inline-block text-left">{data.applicantName}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black pt-4">
            <p className="mb-2 font-semibold">पूर्विकताप्राप्त गृहस्थी के अन्तर्गत :-</p>
            <p className="mb-2">आवेदन पत्र - स्वीकृत <span className="inline-block w-8 h-5 border border-black mx-1"></span> अस्वीकृत <span className="inline-block w-8 h-5 border border-black mx-1"></span></p>
            <p className="mb-8">अस्वीकृत का कारण - <span className="border-b border-black w-[150mm] inline-block"></span></p>
            
            <div className="flex justify-between mt-12">
              <div className="text-center">
                <p>जांच करने वाले पदाधिकारी</p>
                <p>का नाम एवं हस्ताक्षर</p>
              </div>
              <div className="text-center">
                <p>प्रखंड विकास पदाधिकारी</p>
                <p>का नाम एवं हस्ताक्षर</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3 */}
      <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white relative overflow-hidden text-[14px] leading-relaxed" style={{ pageBreakAfter: 'always' }}>
        <p className="text-center font-bold underline mb-8 text-[16px]">सामान्य निर्देश</p>
        <div className="space-y-4 px-4 text-justify">
          <div className="flex gap-3"><span>1.</span><p>आवेदन पत्र केवल एक ही प्रति आवेदक द्वारा भरी जायेगी ।</p></div>
          <div className="flex gap-3"><span>2.</span><p>किसी व्यक्ति, संगठन या राजनीतिक पार्टी द्वारा तादाद में प्रस्तुत किये गये आवेदन पत्र स्वीकार नहीं किये जाएँगे ।</p></div>
          <div className="flex gap-3"><span>3.</span><p>अपूर्ण आवेदन पत्र को रद्द कर दिया जायेगा ।</p></div>
          <div className="flex gap-3"><span>4.</span><p>आवेदक द्वारा बिना सही हस्ताक्षर किये हुए या बिना अंगूठे के निशान के आवेदन पत्र को रद्द कर दिया जायेगा ।</p></div>
          <div className="flex gap-3"><span>5.</span><p>हस्तलिखित, टाईप किये गये, फोटो कॉपी किये गये या एन.आई.सी. की वेबसाईट से डाउनलोड किये गये प्रपत्र भी स्वीकार किये जायेंगे, बशर्ते कि इस प्रकार के प्रपत्र निर्धारित उपरोक्त प्रपत्र के समरूप होने चाहिए ।</p></div>
          <div className="flex gap-3"><span>6.</span><p>सभी आवेदन पत्र RTPS के माध्यम से लिया जायेगा ।</p></div>
          <div className="flex gap-3"><span>7.</span><p>सरकारी सेवा से तात्पर्य है केन्द्र एवं राज्य सरकार, लोक उपक्रम, स्थानीय निकाय एवं स्वशासी में नियमित वेतनमान में कार्यरत कर्मी की सेवा ।</p></div>
          <div className="flex gap-3"><span>8.</span><p>RTPS के तहत पात्र गृहस्थी द्वारा राशन कार्ड का आवेदन पत्र संबंधित क्षेत्र के अनुमंडल पदाधिकारी के कार्यालय में जमा किया जायेगा ।</p></div>
          <div className="flex gap-3"><span>9.</span><p>अनुमंडल पदाधिकारी द्वारा RTPS के तहत राशन कार्ड हेतु प्राप्त आवेदन पत्र को एक सप्ताह के अन्दर संबंधित क्षेत्र के प्रखंड विकास पदाधिकारी को भेजा जायेगा । प्रखंड विकास पदाधिकारी द्वारा प्राप्त आवेदन पत्र को जांच कराकर 15 दिनों के अन्दर अनुमंडल पदाधिकारी को वापस किया जायेगा ।</p></div>
          <div className="flex gap-3"><span>10.</span><p>अनुमंडल पदाधिकारी द्वारा आवेदन पत्र को स्वीकृत किया जाता है तो राशन कार्ड निर्गत किया जायेगा ।</p></div>
        </div>
      </div>

      {/* PAGE 4 */}
      <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white relative overflow-hidden text-[14px] leading-relaxed">
        <p className="mb-6">उपर्युक्त अधिसूचना के परिशिष्ट-I के बाद निम्नलिखित परिशिष्ट-II जोड़ा जाएगा:-</p>
        <p className="text-center font-bold mb-4 text-[16px]">"परिशिष्ट-II"</p>
        <p className="text-center font-bold underline mb-8 text-[16px]">सेवा प्राप्त करने हेतु आवेदन के साथ जमा किए जाने वाले आवश्यक कागजात<br/>(चेक लिस्ट)</p>

        <table className="w-full border-collapse border border-black mb-10 text-sm">
          <thead>
            <tr>
              <th className="border border-black font-semibold p-2 w-[35%] text-center">सेवा का नाम</th>
              <th className="border border-black font-semibold p-2 w-[65%] text-center">चेक लिस्ट</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-3 align-top">1. नये राशन कार्ड का निर्गमन</td>
              <td className="border border-black p-3 align-top">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>आवेदन पत्र विभागीय प्रपत्र 'क' में ।</li>
                  <li>आधार कार्ड का छायाप्रति ।</li>
                  <li>बैंक खाता के प्रथम पृष्ठ की छायाप्रति, जिसपर खाताधारी का नाम, खाता संख्या, बैंक का नाम, बैंक का IFSC Code रहता है ।</li>
                  <li>आवासीय प्रमाण-पत्र</li>
                  <li>विभागीय आवेदन पत्र प्रपत्र 'क' के क्रमांक 10 अथवा 11 जो लागू हो, के संबंध में शपथ-पत्र।</li>
                  <li>सम्पूर्ण परिवार का तीन फोटोग्राफ ।</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-3 align-top">2. राशन कार्ड में संशोधन (नाम में संशोधन, नाम जोड़ना, नाम हटना)</td>
              <td className="border border-black p-3 align-top">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>आवेदन पत्र विभागीय प्रपत्र 'ख' में ।</li>
                  <li>व्यक्ति, जिसका नाम जोड़ा जाना है, के आधार कार्ड की छाया प्रति।</li>
                  <li>विभागीय आवेदन प्रपत्र 'ख' के क्रमांक 8 एवं 9 के संबंध में लागू कारण के प्रमाण-पत्र की छायाप्रति, यथा :-<br/>
                      i. निवास में परिवर्तन हेतु आवासीय प्रमाण-पत्र<br/>
                      ii. जन्म/मृत्यु का प्रमाण पत्र<br/>
                      iii. राशन कार्ड में वर्णित अशुद्धियाँ जिनको शुद्ध किया जाना है, के लिए सरकारी प्रमाण-पत्र (सरकारी विद्यालय का प्रमाण-पत्र, आधार कार्ड, वोटर आई0कार्ड, ड्राईविंग लाईसेंस, पैन कार्ड आदि)।
                  </li>
                </ol>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-3 align-top">3. राशन कार्ड का प्रत्यर्पण (Surrender)/रद्दीकरण</td>
              <td className="border border-black p-3 align-top">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>आवेदन पत्र विभागीय प्रपत्र 'ख' में ।</li>
                  <li>विद्यमान राशन कार्ड का प्रत्यर्पण/रद्द करने के लिए आवेदन पत्र के क्रमांक 10 के संबंध में लागू कारण की छायाप्रति ।</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-center font-bold underline mb-6 text-[15px] mt-10">सामान्य निर्देश</p>
        <div className="space-y-3 px-4 text-justify">
          <div className="flex gap-3"><span>1.</span><p>आवेदन-पत्र केवल एक ही प्रति आवेदक द्वारा भरी जायेगी ।</p></div>
          <div className="flex gap-3"><span>2.</span><p>किसी व्यक्ति, संगठन या राजनीतिक पार्टी द्वारा तादाद में प्रस्तुत किये गये आवेदन-पत्रों को स्वीकार नहीं किये जाएँगे ।</p></div>
          <div className="flex gap-3"><span>3.</span><p>अपूर्ण आवेदन पत्र को रद्द कर दिया जायेगा ।</p></div>
          <div className="flex gap-3"><span>4.</span><p>अहस्ताक्षरित या बिना अंगूठे के निशान के आवेदन-पत्र को रद्द कर दिया जायेगा ।</p></div>
          <div className="flex gap-3"><span>5.</span><p>हस्तलिखित, टाईप किये गये, फोटो कॉपी किये गये या एन.आई.सी. की वेबसाईट से डाउनलोड किये गये प्रपत्र भी स्वीकार किये जायेंगे, बशर्ते कि इस प्रकार के प्रपत्र निर्धारित प्रपत्र के समरूप होने चाहिए ।</p></div>
          <div className="flex gap-3"><span>6.</span><p>सभी आवेदन पत्र RTPS के माध्यम से लिये जायेंगें ।</p></div>
          <div className="flex gap-3"><span>7.</span><p>सरकारी सेवा से तात्पर्य है केन्द्र एवं राज्य सरकार, लोक उपक्रम, स्थानीय निकाय एवं स्वशासी में नियमित वेतनमान में कार्यरत कर्मी की सेवा ।</p></div>
          <div className="flex gap-3"><span>8.</span><p>RTPS के तहत पात्र गृहस्थी द्वारा राशन कार्ड का आवेदन-पत्र संबंधित क्षेत्र के अनुमंडल पदाधिकारी के कार्यालय में जमा किया जायेगा ।</p></div>
          <div className="flex gap-3"><span>9.</span><p>अनुमंडल पदाधिकारी द्वारा RTPS के तहत राशन कार्ड हेतु प्राप्त आवेदन-पत्र को एक सप्ताह के अन्दर संबंधित क्षेत्र के प्रखंड विकास पदाधिकारी को भेजा जायेगा । प्रखंड विकास पदाधिकारी द्वारा प्राप्त आवेदन पत्र को जांच कराकर 15 दिनों के अन्दर अनुमंडल पदाधिकारी को वापस किया जायेगा ।</p></div>
          <div className="flex gap-3"><span>10.</span><p>अनुमंडल पदाधिकारी द्वारा आवेदन-पत्र को स्वीकृत किया जाता है तो राशन कार्ड निर्गत किया जायेगा ।</p></div>
        </div>
      </div>

    </div>
  );
}
