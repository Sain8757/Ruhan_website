import { FormValues } from '@/app/(dashboard)/manual-forms/ration-card/kha/page';

interface Props {
  data: FormValues;
}

export function RationCardPrintView({ data }: Props) {
  const tick = '✓';

  return (
    <div className="bg-white text-black text-sm" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
      
      {/* PAGE 1 */}
      <div className="w-[210mm] h-[297mm] p-[15mm] mx-auto bg-white overflow-hidden relative" style={{ pageBreakAfter: 'always' }}>
        
        {/* Header */}
        <div className="text-center font-bold mb-4">
          <p className="text-lg">प्रपत्र 'ख'</p>
          <p>लोक सेवा के अधिकार अधिनियम के अन्तर्गत विद्यमान राशन कार्ड में उपांतरणों</p>
          <p>अथवा विद्यमान राशन कार्ड को प्रत्यर्पण (Surrender)/रद्द करने के लिए</p>
          <p className="mt-2 text-xs font-normal">
            (राष्ट्रीय खाद्य सुरक्षा अधिनियम 2013 (धारा-9) तथा लक्षित सार्वजनिक वितरण प्रणाली (नियंत्रण) आदेश 2015 (कंडिका 3 का
            <br />
            उपकंडिका 13, 14 तथा कंडिका 4 उपकंडिका 7, 8, 9) द्रष्टव्य)
          </p>
        </div>

        {/* Photo Box */}
        <div className="absolute top-[35mm] right-[15mm] w-[35mm] h-[45mm] border border-black flex items-center justify-center text-center overflow-hidden">
          {data.photoBase64 ? (
             <img src={data.photoBase64} alt="Applicant" className="w-full h-full object-cover" />
          ) : (
             <span className="text-xs">पारिवारिक फोटो</span>
          )}
        </div>

        {/* Basic Details List */}
        <div className="space-y-4 mt-12 w-[150mm]">
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>1.</span>
            <div className="flex">
              <span className="w-48">आवेदक का नाम</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.applicantName}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>2.</span>
            <div className="flex">
              <span className="w-48">आधार / EID no</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.aadhaar}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>3.</span>
            <div className="flex">
              <span className="w-48">मोबाईल नं०</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.mobile}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>4.</span>
            <div className="flex">
              <span className="w-48">आवेदक के पति/पिता का नाम</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.fatherName}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>5.</span>
            <div className="flex">
              <span className="w-48">पूर्ण आवासीय पता</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.address}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>6.</span>
            <div className="flex">
              <span className="w-48">विद्यमान राशन कार्ड की सं०</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.existingRationCard}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>7.</span>
            <div className="flex">
              <span className="w-48 leading-tight">सम्बद्ध जन वितरण प्रणाली विक्रेता का नाम एवं अनुज्ञप्ति सं०</span>
              <span className="flex-1">: <span className="ml-2 font-semibold">{data.dealerName}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>8.</span>
            <div className="flex flex-col">
              <span>विद्यमान राशन कार्ड में उपांतरण का कारण-</span>
              <div className="ml-8 mt-2 space-y-2">
                <div className="flex items-center">
                  <span>(क) निवास में परिवर्तन</span>
                  <span className="ml-4 w-6 h-6 inline-flex items-center justify-center text-lg">{data.reasonForChange === 'Nivas' ? tick : ''}</span>
                </div>
                <div className="flex items-center">
                  <span>(ख) जन्म या मृत्यु</span>
                  <span className="ml-4 w-6 h-6 inline-flex items-center justify-center text-lg">{data.reasonForChange === 'JanmMrityu' ? tick : ''}</span>
                </div>
                <div className="flex items-center">
                  <span>(ग) कार्ड में वर्णित ब्योरो में अशुद्धियाँ</span>
                  <span className="ml-4 w-6 h-6 inline-flex items-center justify-center text-lg">{data.reasonForChange === 'Ashuddhiya' ? tick : ''}</span>
                </div>
                <div className="flex items-center">
                  <span>(घ) अन्य कारण</span>
                  <span className="ml-4 w-6 h-6 inline-flex items-center justify-center text-lg">{data.reasonForChange === 'Anya' ? tick : ''}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[30px_1fr] gap-2">
            <span>9.</span>
            <span>विद्यमान राशन कार्ड में उपांतरण हेतु विवरणी -</span>
          </div>
        </div>

        {/* Table 1 (Cols 1-7) */}
        <div className="mt-4">
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr>
                <th className="border border-black p-1 w-10">क्र०</th>
                <th className="border border-black p-1 w-32">नाम</th>
                <th className="border border-black p-1 w-32">पति/पिता का नाम</th>
                <th className="border border-black p-1 w-16">लिंग</th>
                <th className="border border-black p-1 w-12">उम्र</th>
                <th className="border border-black p-1 w-20">वैवाहिक स्थिति</th>
                <th className="border border-black p-1 w-20">संबंध</th>
              </tr>
              <tr>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">1</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">2</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">3</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">4</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">5</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">6</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">7</td>
              </tr>
            </thead>
            <tbody>
              {/* Show 5 rows for aesthetics */}
              {[...Array(5)].map((_, i) => {
                const member = data.familyMembers[i] || {};
                return (
                  <tr key={i} className="h-8">
                    <td className="border border-black p-1">{member.name ? i + 1 : ''}</td>
                    <td className="border border-black p-1">{member.name || ''}</td>
                    <td className="border border-black p-1">{member.fatherName || ''}</td>
                    <td className="border border-black p-1">{member.gender || ''}</td>
                    <td className="border border-black p-1">{member.age || ''}</td>
                    <td className="border border-black p-1">{member.maritalStatus || ''}</td>
                    <td className="border border-black p-1">{member.relation || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="w-[210mm] h-[297mm] p-[15mm] mx-auto bg-white overflow-hidden" style={{ pageBreakAfter: 'always' }}>
        
        {/* Table 2 (Cols 8-12) */}
        <table className="w-full border-collapse border border-black text-center text-xs mt-2">
            <thead>
              <tr>
                <th className="border border-black p-1 w-40">आधार / EID no</th>
                <th className="border border-black p-1 w-24">मोबाईल नं०</th>
                <th className="border border-black p-1 w-24">व्यवसाय / सरकारी सेवक</th>
                <th className="border border-black p-1 w-24">आमदनी का स्रोत</th>
                <th className="border border-black p-1 w-20">मासिक आय</th>
              </tr>
              <tr>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">8</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">9</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">10</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">11</td>
                <td className="border border-black p-0.5 bg-gray-100 font-bold">12</td>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => {
                const member = data.familyMembers[i] || {};
                return (
                  <tr key={i} className="h-8">
                    <td className="border border-black p-1">{member.aadhaar || ''}</td>
                    <td className="border border-black p-1">{member.mobile || ''}</td>
                    <td className="border border-black p-1">{member.occupation || ''}</td>
                    <td className="border border-black p-1">{member.incomeSource || ''}</td>
                    <td className="border border-black p-1">{member.monthlyIncome || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 text-[13px] leading-snug">
            <div className="flex gap-2">
               <span>10.</span>
               <span>विद्यमान राशन कार्ड को प्रत्यर्पण/रद्द करने का कारण -</span>
            </div>
            
            {/* Gramin Kshetra */}
            <div className="mt-2 ml-6">
              <p className="font-bold">
                 (क) ग्रामीण क्षेत्र में प्रवास, जन्म, विवाह, सामाजिक और आर्थिक परिस्थिति में परिवर्तन के कारण आवेदक निम्नलिखित पर हाँ/नहीं, पर टिक लगाये :-
              </p>
              
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1">
                  <span>(i) मोटर चालित तिपहिया/चार पहिया वाहन है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.motorVehicle ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.motorVehicle ? tick : ''}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span>(ii) मशीन चालित तीन/चार पहियों वाले कृषि उपकरण है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.machineEquip ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.machineEquip ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(iii) सरकार में पंजीकृत गैर-कृषि उद्योग वाले परिवार वाली गृहस्थी है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.govtRegIndustry ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.govtRegIndustry ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(iv) परिवार के किसी सदस्य की मासिक आय 10,000/- रू0 से अधिक है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.incomeOver10k ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.incomeOver10k ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(v) आयकर देते है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.incomeTax ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.incomeTax ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(vi) व्यावसायिक कर का भुगतान करते है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.commercialTax ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.commercialTax ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(vii) जिस मकान में रहते है, उस मकान में सभी कमरों में पक्की दीवारों और छत के साथ तीन अथवा अधिक कमरा है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.puccaHouse3Rooms ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.puccaHouse3Rooms ? tick : ''}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span>(viii) परिवार में कम से कम एक सिंचाई उपकरण के साथ 2.5 एकड़ अथवा इससे अधिक सिंचित भूमि है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.irrigatedLand2_5 ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.irrigatedLand2_5 ? tick : ''}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span>(ix) दो अथवा उससे अधिक फसली मौसम के लिए 5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.irrigatedLand5 ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.irrigatedLand5 ? tick : ''}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span>(x) कम से कम एक सिंचाई उपकरण के साथ कम से कम 7.5 एकड़ अथवा इससे अधिक भूमि वाली गृहस्थी है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.irrigatedLand7_5 ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.irrigatedLand7_5 ? tick : ''}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                     <span>(xi) आवेदक अथवा आवेदक के परिवार का कोई सदस्य सरकारी सेवा में है,</span>
                     <span>हाँ</span>
                     <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Rural' && data.ruralDeclarations?.govtServant ? tick : ''}</span>
                     <span>नहीं</span>
                     <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Rural' && data.ruralDeclarations && !data.ruralDeclarations.govtServant ? tick : ''}</span>
                  </div>
                  <div className="ml-8">
                     <p>अगर है तो उसका विवरण -</p>
                     <p>(क) किस सेवा में है - <span className="font-semibold">{data.areaType === 'Rural' ? data.ruralDeclarations?.govtServantDetails?.serviceName : ''}</span></p>
                     <p>(ख) कहाँ पदस्थापित है - <span className="font-semibold">{data.areaType === 'Rural' ? data.ruralDeclarations?.govtServantDetails?.postingPlace : ''}</span></p>
                     <p>(ग) कितना मासिक आमदनी है - <span className="font-semibold">{data.areaType === 'Rural' ? data.ruralDeclarations?.govtServantDetails?.monthlyIncome : ''}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shahari Kshetra (Start on page 2 usually) */}
            <div className="mt-6 ml-6">
              <p className="font-bold">
                 (ख) शहरी क्षेत्र में प्रवास, जन्म, विवाह, सामाजिक और आर्थिक प्रास्थिति में परिवर्तन के कारण आवेदक निम्नलिखित पर हाँ/नहीं, पर टिक लगाये :-
              </p>
              
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1">
                  <span>(i) आयकर अदा करते है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.incomeTax ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.incomeTax ? tick : ''}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1">
                     <span>(ii) आवेदक अथवा आवेदक के परिवार का कोई सदस्य वर्ग 1, वर्ग 2, वर्ग 3 एवं वर्ग 4 श्रेणी के सरकारी सेवा (अनु०जाति/अनु० जनजाति के Group 'D' के कर्मी को छोड़कर) में है,</span>
                     <span>हाँ</span>
                     <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.govtServant ? tick : ''}</span>
                     <span>नहीं</span>
                     <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.govtServant ? tick : ''}</span>
                  </div>
                  <div className="ml-8">
                     <p>अगर हाँ तो उसका विवरण -</p>
                     <p>(क) किस सेवा में है - <span className="font-semibold">{data.areaType === 'Urban' ? data.urbanDeclarations?.govtServantDetails?.serviceName : ''}</span></p>
                     <p>(ख) कहाँ पदस्थापित है - <span className="font-semibold">{data.areaType === 'Urban' ? data.urbanDeclarations?.govtServantDetails?.postingPlace : ''}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* PAGE 3 */}
      <div className="w-[210mm] min-h-[297mm] p-[15mm] mx-auto bg-white overflow-hidden" style={{ pageBreakAfter: 'auto' }}>
          <div className="text-[13px] leading-snug ml-6 mt-4">
             <div className="ml-8 space-y-1">
                <p>(ग) कितनी मासिक आमदनी है - <span className="font-semibold">{data.areaType === 'Urban' ? data.urbanDeclarations?.govtServantDetails?.monthlyIncome : ''}</span></p>
             </div>
             
             <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1">
                  <span>(iii) व्यवसायिक कर अदा करते है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.commercialTax ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.commercialTax ? tick : ''}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span>(iv) तीन कमरे या उससे अधिक (पक्का) कंक्रीट छतयुक्त मकान वाली गृहस्थी जो स्वयं की स्वामित्व में है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.puccaHouse3Rooms ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.puccaHouse3Rooms ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(v) परिवार के किसी सदस्य का मासिक आय 20,000/- रू0 से अधिक है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.incomeOver20k ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.incomeOver20k ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(vi) दो पहिया वाहन, रेफ्रीजरेटर तथा वाशिंग मशीन तीनों उपकरण है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.threeAppliances ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.threeAppliances ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(vii) गृहस्थी में चार पहिया वाहन है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.fourWheeler ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.fourWheeler ? tick : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>(viii) गृहस्थी में वाशिंग मशीन है,</span>
                  <span>हाँ</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center mx-1">{data.areaType === 'Urban' && data.urbanDeclarations?.washingMachine ? tick : ''}</span>
                  <span>नहीं</span>
                  <span className="w-5 h-4 border border-black inline-flex items-center justify-center ml-1">{data.areaType === 'Urban' && data.urbanDeclarations && !data.urbanDeclarations.washingMachine ? tick : ''}</span>
                </div>
             </div>

             <div className="mt-4">
                <p className="font-bold text-center">
                   उपरोक्त कंडिका ........ के अनुसार विद्यमान राशन कार्ड में आवश्यक उपांतरण किया जाय / कंडिका ........ के अनुसार पात्र गृहस्थियों हेतु मानक मानदंड से बाहर हो जाने के कारण विद्यमान राशन कार्ड को रद्द कर दिया जाय (राशन कार्ड संलग्न)
                </p>
             </div>

             <div className="flex justify-between items-end mt-12">
               <div>
                  <p>दिनांक: <span className="font-semibold">{data.date}</span></p>
                  <p className="mt-2">स्थान: <span className="font-semibold">{data.place}</span></p>
               </div>
               <div className="text-center">
                  <div className="h-10 mb-2 flex items-end justify-center">
                    {data.signatureBase64 && <img src={data.signatureBase64} alt="Signature" className="max-h-12 object-contain" />}
                  </div>
                  <p>आवेदक का हस्ताक्षर/अंगूठे का निशान</p>
                  <p className="mt-1">नाम: <span className="font-semibold">{data.applicantName}</span></p>
               </div>
             </div>

             <div className="mt-12 text-center font-bold text-lg underline">
                घोषणा
             </div>
             
             <div className="mt-4">
                <p>महोदया / महोदय</p>
                <p className="indent-8 mt-1">मैं परिवार सहित यह घोषणा करता हूँ की आवेदन-पत्र में लिखी गई सभी प्रविष्टियाँ सही है । अगर आवेदन पत्र में लिखित कोई तथ्य गलत पाया जाता है तो मैं दंडात्मक/कानूनी कार्रवाई का भागी होऊँगा ।</p>
             </div>

             <div className="flex justify-between items-end mt-12">
               <div>
                  <p>दिनांक: <span className="font-semibold">{data.date}</span></p>
                  <p className="mt-2">स्थान: <span className="font-semibold">{data.place}</span></p>
               </div>
               <div className="text-center">
                  <div className="h-10 mb-2 flex items-end justify-center">
                    {data.signatureBase64 && <img src={data.signatureBase64} alt="Signature" className="max-h-12 object-contain" />}
                  </div>
                  <p>आवेदक का हस्ताक्षर/अंगूठे का निशान</p>
                  <p className="mt-1">नाम: <span className="font-semibold">{data.applicantName}</span></p>
               </div>
             </div>
          </div>
      </div>

    </div>
  );
}
