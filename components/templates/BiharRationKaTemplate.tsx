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
    <span className="checkbox-group">
      {label} <span className="box flex items-center justify-center font-bold text-[12px] overflow-hidden">{checked ? tick : ''}</span>
    </span>
  );

  return (
    <div className="ration-ka-wrapper bg-white" style={{ width: '210mm', margin: '0 auto', boxSizing: 'border-box' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ration-ka-wrapper {
          font-family: "Noto Sans Devanagari", "Mangal", Arial, sans-serif;
          color: #000;
          line-height: 1.4;
        }
        .ration-ka-wrapper .page {
          width: 210mm;
          height: 297mm;
          padding: 15mm 15mm;
          background: #fff;
          position: relative;
          box-sizing: border-box;
          page-break-after: always;
          overflow: hidden;
        }
        .ration-ka-wrapper .header-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 2px;
          text-align: center;
        }
        .ration-ka-wrapper .header-sub {
          font-size: 14px;
          margin: 1px 0;
          text-align: center;
        }
        .ration-ka-wrapper .top-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-top: 15px;
        }
        .ration-ka-wrapper .top-left { flex: 1; }
        .ration-ka-wrapper .photo-box {
          border: 1px solid #000;
          width: 35mm;
          height: 45mm;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 12px;
          flex-shrink: 0;
          overflow: hidden;
          margin-right: 10px;
        }
        .ration-ka-wrapper .photo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ration-ka-wrapper .field-list {
          list-style: none;
          padding-left: 15px;
          margin-top: 5px;
          margin-bottom: 0;
        }
        .ration-ka-wrapper .field-list li {
          display: flex;
          padding: 4px 0;
          font-size: 14px;
        }
        .ration-ka-wrapper .field-list li .num {
          width: 25px;
          flex-shrink: 0;
        }
        .ration-ka-wrapper .field-list li .label {
          width: 190px;
          flex-shrink: 0;
        }
        .ration-ka-wrapper .field-list li .fill {
          flex: 1;
          font-weight: bold;
          padding-left: 5px;
        }
        .ration-ka-wrapper table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 10px;
          font-size: 13px;
        }
        .ration-ka-wrapper table th, .ration-ka-wrapper table td {
          border: 1px solid #000;
          padding: 2px 4px;
          text-align: center;
          vertical-align: middle;
          height: 28px;
        }
        .ration-ka-wrapper table th { font-weight: normal; }
        .ration-ka-wrapper h3.section-title {
          text-decoration: underline;
          text-align: center;
          font-size: 16px;
          margin: 15px 0;
          font-weight: bold;
        }
        .ration-ka-wrapper ol.qlist {
          padding-left: 20px;
          font-size: 14px;
          margin-top: 10px;
        }
        .ration-ka-wrapper ol.qlist > li {
          margin-bottom: 6px;
        }
        .ration-ka-wrapper ol.qlist ul.sub {
          list-style: none;
          padding-left: 25px;
          margin: 4px 0;
        }
        .ration-ka-wrapper ol.qlist ul.sub > li {
          margin-bottom: 4px;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ration-ka-wrapper .checkbox-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
        }
        .ration-ka-wrapper .box {
          display: inline-flex;
          width: 18px;
          height: 12px;
          border: 1px solid #000;
          margin: 0 4px;
          vertical-align: middle;
          line-height: 12px;
        }
        .ration-ka-wrapper .subfields {
          margin-left: 30px;
          font-size: 14px;
          width: 100%;
        }
        .ration-ka-wrapper .subfields div {
          margin: 2px 0;
          display: flex;
        }
        .ration-ka-wrapper .subfields div .lbl { width: 180px; }
        .ration-ka-wrapper .subfields div .line { flex:1; font-weight: bold; }
        .ration-ka-wrapper .sign-row {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          font-size: 14px;
        }
        .ration-ka-wrapper .sign-row div { width: 45%; }
        .ration-ka-wrapper .line-fill {
          display: inline-block;
          font-weight: bold;
          min-width: 150px;
          margin-left: 6px;
        }
        .ration-ka-wrapper .declaration-title {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          text-decoration: underline;
          margin: 15px 0 10px;
        }
        .ration-ka-wrapper .declaration-text {
          font-size: 14px;
          margin-bottom: 10px;
          text-align: justify;
        }
        .ration-ka-wrapper .office-section {
          font-size: 14px;
          margin-top: 15px;
        }
        .ration-ka-wrapper .office-section .row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .ration-ka-wrapper .office-section .row div { display:flex; align-items:center; gap:10px; }
        .ration-ka-wrapper .general-instructions ol {
          font-size: 14px;
          padding-left: 22px;
        }
        .ration-ka-wrapper .general-instructions ol li { margin-bottom: 12px; }
        .ration-ka-wrapper .annexure-title {
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin: 15px 0 10px;
        }
        .ration-ka-wrapper .annexure-sub {
          text-align: center;
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 15px;
        }
        .ration-ka-wrapper .checklist-table td, .ration-ka-wrapper .checklist-table th {
          text-align: left;
          vertical-align: top;
          font-size: 14px;
          padding: 8px;
        }
        .ration-ka-wrapper .checklist-table td ol, .ration-ka-wrapper .checklist-table td ul {
          margin: 0;
          padding-left: 18px;
        }
        .ration-ka-wrapper .signature-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 15px;
        }
      `}} />

      {/* PAGE 1 */}
      <div className="page">
        <div className="header-title">लोक सेवा के अधिकार अधिनियम के अन्तर्गत नया राशन कार्ड के लिए आवेदन पत्र का प्रपत्र 'क'</div>
        <div className="header-sub">(राष्ट्रीय खाद्य सुरक्षा अधिनियम 2013 (धारा-9) तथा लक्षित सार्वजनिक वितरण प्रणाली (नियंत्रण)</div>
        <div className="header-sub">आदेश 2015 (कंडिका 3 का उपकंडिका 13, 14 तथा कंडिका 4 उपकंडिका 7, 8, 9) द्रष्टव्य)</div>

        <div className="top-flex">
          <div className="top-left">
            <ul className="field-list">
              <li><span className="num">1.</span><span className="label">आवेदक का नाम</span><span className="fill">: {data.applicantName}</span></li>
              <li><span className="num">2.</span><span className="label">आधार / EID no</span><span className="fill">: {data.aadhaarNo}</span></li>
              <li><span className="num">3.</span><span className="label">मोबाईल नं0—</span><span className="fill">: {data.mobileNo}</span></li>
              <li><span className="num">4.</span><span className="label">आवेदक के पति / पिता का नाम</span><span className="fill">: {data.fatherHusbandName}</span></li>
              <li><span className="num">5.</span><span className="label">पूर्ण आवासीय पता</span><span className="fill">: {data.fullAddress}</span></li>
            </ul>
          </div>
          <div className="photo-box">
            {data.photoBase64 ? (
              <img src={data.photoBase64} alt="Applicant" />
            ) : (
              <span>पारिवारिक फोटो</span>
            )}
          </div>
        </div>

        <ul className="field-list">
          <li><span className="num">6.</span><span className="label">बैंक का IFSC Code</span><span className="fill">: {data.bankIfsc}</span></li>
          <li><span className="num">7.</span><span className="label">बैंक खाता नं0</span><span className="fill">: {data.bankAccountNo}</span></li>
          <li><span className="num">8.</span><span className="label">बैंक का नाम</span><span className="fill">: {data.bankName}</span></li>
          <li><span className="num">9.</span><span className="label">राशन कार्ड के लिए परिवार के अन्य सदस्यों का विवरण</span><span className="fill"></span></li>
        </ul>

        <table>
          <thead>
            <tr>
              <th className="w-10">क्र0</th>
              <th>नाम</th>
              <th>पति / पिता का नाम</th>
              <th className="w-12">लिंग</th>
              <th className="w-12">उम्र</th>
              <th className="w-20">वैवाहिक स्थिति</th>
              <th>संबंध</th>
            </tr>
            <tr>
              <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th>
            </tr>
          </thead>
          <tbody>
            {displayMembers.map((m, i) => (
              <tr key={`t1-${i}`}>
                <td>{m.name ? i + 1 : ''}</td>
                <td>{m.name}</td>
                <td>{m.fatherHusbandName}</td>
                <td>{m.gender}</td>
                <td>{m.age}</td>
                <td>{m.maritalStatus}</td>
                <td>{m.relation}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th>आधार / EID no</th>
              <th>मोबाईल नं0</th>
              <th>व्यवसाय / सरकारी सेवक</th>
              <th>आमदनी का स्रोत</th>
              <th>मासिक आय</th>
            </tr>
            <tr>
              <th>8</th><th>9</th><th>10</th><th>11</th><th>12</th>
            </tr>
          </thead>
          <tbody>
            {displayMembers.slice(0, 6).map((m, i) => (
              <tr key={`t2-${i}`}>
                <td>{m.aadhaar}</td>
                <td>{m.mobile}</td>
                <td>{m.occupation}</td>
                <td>{m.incomeSource}</td>
                <td>{m.monthlyIncome}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ol className="qlist" start={10}>
          <li><span className="font-bold underline">ग्रामीण क्षेत्र</span> के आवेदक निम्नलिखित पर हाँ / नहीं, पर टिक लगावे :–
            <ul className="sub">
              <li>(i) मोटर चालित तिपहिया/चार पहिया वाहन है, <CheckBox label="हाँ" checked={data.rural_motorVehicle === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_motorVehicle === 'No'} /></li>
              <li>(ii) मशीन चालित तीन/चार पहियों वाले कृषि उपकरण है, <CheckBox label="हाँ" checked={data.rural_agriMachine === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_agriMachine === 'No'} /></li>
              <li>(iii) सरकार में पंजीकृत गैर-कृषि उद्योग वाले परिवार वाली गृहस्थी है, <CheckBox label="हाँ" checked={data.rural_nonAgriEnterprise === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_nonAgriEnterprise === 'No'} /></li>
              <li>(iv) परिवार के किसी सदस्य की मासिक आय 10,000/- रू0 से अधिक है, <CheckBox label="हाँ" checked={data.rural_incomeAbove10k === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_incomeAbove10k === 'No'} /></li>
              <li>(v) आयकर देते है, <CheckBox label="हाँ" checked={data.rural_incomeTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_incomeTaxPayee === 'No'} /></li>
              <li>(vi) व्यावसायिक कर का भुगतान करते है, <CheckBox label="हाँ" checked={data.rural_commercialTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_commercialTaxPayee === 'No'} /></li>
              <li>(vii) जिस मकान में रहते है, उस मकान में सभी कमरों में पक्की दीवारों और छत के साथ तीन अथवा अधिक कमरा है, <CheckBox label="हाँ" checked={data.rural_puccaHouse3Rooms === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_puccaHouse3Rooms === 'No'} /></li>
            </ul>
          </li>
        </ol>
      </div>

      {/* PAGE 2 */}
      <div className="page">
        <ol className="qlist" start={8} style={{ marginTop: 0 }}>
          <ul className="sub" style={{ marginLeft: '-15px' }}>
            <li>(viii) परिवार में कम से कम एक सिंचाई उपकरण के साथ 2.5 एकड़ अथवा इससे अधिक सिंचित भूमि है, <CheckBox label="हाँ" checked={data.rural_irrigation2_5Acres === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_irrigation2_5Acres === 'No'} /></li>
            <li>(ix) दो अथवा उससे अधिक फसली मौसम के लिए 5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है, <CheckBox label="हाँ" checked={data.rural_irrigation5Acres === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_irrigation5Acres === 'No'} /></li>
            <li>(x) कम से कम एक सिंचाई उपकरण के साथ कम से कम 7.5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है, <CheckBox label="हाँ" checked={data.rural_irrigation7_5Acres === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_irrigation7_5Acres === 'No'} /></li>
            <li>(xi) आवेदक अथवा आवेदक के परिवार का कोई सदस्य सरकारी सेवा में है, <CheckBox label="हाँ" checked={data.rural_govtService === 'Yes'} /> <CheckBox label="नहीं" checked={data.rural_govtService === 'No'} />
              {data.rural_govtService === 'Yes' && (
                <div className="subfields">
                  अगर है तो उसका विवरण –
                  <div><span className="lbl">(क) किस सेवा में है –</span><span className="line">: {data.rural_govtServiceDetails?.serviceName}</span></div>
                  <div><span className="lbl">(ख) कहाँ पदस्थापित है –</span><span className="line">: {data.rural_govtServiceDetails?.postName}</span></div>
                  <div><span className="lbl">(ग) कितना मासिक आमदनी है –</span><span className="line">: {data.rural_govtServiceDetails?.monthlyIncome}</span></div>
                </div>
              )}
            </li>
          </ul>
        </ol>

        <ol className="qlist" start={11}>
          <li><span className="font-bold underline">शहरी क्षेत्र</span> के आवेदक निम्नलिखित पर आवश्यकतानुसार हाँ / नहीं, पर टिक लगायें :–
            <ul className="sub">
              <li>(i) आयकर अदा करते है, <CheckBox label="हाँ" checked={data.urban_incomeTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_incomeTaxPayee === 'No'} /></li>
              <li style={{ display: 'block' }}>
                <div className="flex gap-2">
                  <span>(ii) आवेदक अथवा आवेदक के परिवार का कोई सदस्य वर्ग 1, वर्ग 2, वर्ग 3 एवं वर्ग 4 श्रेणी के सरकारी सेवा (अनु0जाति / अनु0 जनजाति के Group 'D' के कर्मी को छोड़कर) में है,</span>
                  <CheckBox label="हाँ" checked={data.urban_govtService === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_govtService === 'No'} />
                </div>
                {data.urban_govtService === 'Yes' && (
                  <div className="subfields mt-2">
                    अगर है तो उसका विवरण –
                    <div><span className="lbl">(क) किस सेवा में है –</span><span className="line">: {data.urban_govtServiceDetails?.serviceName}</span></div>
                    <div><span className="lbl">(ख) कहाँ पदस्थापित है –</span><span className="line">: {data.urban_govtServiceDetails?.postName}</span></div>
                    <div><span className="lbl">(ग) कितना मासिक आमदनी है –</span><span className="line">: {data.urban_govtServiceDetails?.monthlyIncome}</span></div>
                  </div>
                )}
              </li>
              <li>(iii) व्यवसायिक कर अदा करते है, <CheckBox label="हाँ" checked={data.urban_commercialTaxPayee === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_commercialTaxPayee === 'No'} /></li>
              <li>(iv) तीन कमरे या उससे अधिक (पक्का) कंक्रीट छतयुक्त मकान वाली गृहस्थी जो स्वयं की स्वामित्व में है, <CheckBox label="हाँ" checked={data.urban_puccaHouse3Rooms === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_puccaHouse3Rooms === 'No'} /></li>
              <li>(v) परिवार के किसी सदस्य का मासिक आय 20,000/- रू0 से अधिक है, <CheckBox label="हाँ" checked={data.urban_incomeAbove20k === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_incomeAbove20k === 'No'} /></li>
              <li>(vi) दो पहिया वाहन, रेफ्रीजरेटर तथा वाशिंग मशीन तीनों उपकरण है, <CheckBox label="हाँ" checked={data.urban_twoWheelerAndFridgeAndWash === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_twoWheelerAndFridgeAndWash === 'No'} /></li>
              <li>(vii) गृहस्थी में चार पहिया वाहन है, <CheckBox label="हाँ" checked={data.urban_fourWheeler === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_fourWheeler === 'No'} /></li>
              <li>(viii) गृहस्थी में वाशिंग मशीन है, <CheckBox label="हाँ" checked={data.urban_washingMachine === 'Yes'} /> <CheckBox label="नहीं" checked={data.urban_washingMachine === 'No'} /></li>
            </ul>
          </li>
        </ol>

        <div className="sign-row mt-6">
          <div>दिनांक <span className="line-fill">: {data.date}</span></div>
          <div className="text-right flex flex-col items-end">
            <div className="border border-black w-32 h-10 mb-1 flex items-center justify-center">
              {data.signatureBase64 && <img src={data.signatureBase64} alt="Signature" className="max-h-full max-w-full" />}
            </div>
            आवेदक का हस्ताक्षर / अंगूठे का निशान<br/>
            नाम <span className="font-bold ml-2">{data.applicantName}</span>
          </div>
        </div>
        <div className="sign-row mt-2">
          <div>स्थान <span className="line-fill">: {data.place}</span></div>
        </div>

        <div className="declaration-title">घोषणा</div>
        <div className="declaration-text text-justify">
          महोदया / महोदय<br/><br/>
          मैं परिवार सहित यह घोषणा करता हूँ की आवेदन पत्र में लिखी गई सभी प्रविष्टियाँ सही है । मैं इसके पूर्व राशन कार्ड के लिए कोई आवेदन पत्र नहीं दिया हूँ । अगर आवेदन पत्र में लिखी गई कोई तथ्य गलत पाया जाता है तो मैं दंडात्मक / कानूनी कार्यवाई का भागी होऊँगा ।
        </div>

        <div className="sign-row mt-6">
          <div>दिनांक <span className="line-fill">: {data.date}</span></div>
          <div className="text-right flex flex-col items-end">
            <div className="border border-black w-32 h-10 mb-1 flex items-center justify-center">
              {data.signatureBase64 && <img src={data.signatureBase64} alt="Signature" className="max-h-full max-w-full" />}
            </div>
            आवेदक का हस्ताक्षर / अंगूठे का निशान<br/>
            नाम <span className="font-bold ml-2">{data.applicantName}</span>
          </div>
        </div>
        <div className="sign-row mt-2">
          <div>स्थान <span className="line-fill">: {data.place}</span></div>
        </div>

        <div className="office-section p-4 border border-black mt-8">
          <p className="font-bold underline mb-4">पूर्विकताप्राप्त गृहस्थी के अन्तर्गत :–</p>
          <div className="row mb-4">
            <div>आवेदन पत्र – स्वीकृत <span className="box"></span> &nbsp;&nbsp; अस्वीकृत <span className="box"></span></div>
          </div>
          <p className="mb-8">अस्वीकृत का कारण – <span className="line-fill w-full inline-block mt-2"></span></p>
          <div className="row mt-10 flex justify-between">
            <div className="flex-col items-center">
              <div className="w-48 border-b border-black mb-1"></div>
              <span>जांच करने वाले पदाधिकारी का नाम एवं हस्ताक्षर</span>
            </div>
            <div className="flex-col items-center">
              <div className="w-48 border-b border-black mb-1"></div>
              <span>प्रखंड विकास पदाधिकारी का नाम एवं हस्ताक्षर</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3: Annexure II */}
      <div className="page">
        <p className="mb-2 text-[14px]">2. उपर्युक्त अधिसूचना के परिशिष्ट-I. के बाद निम्नलिखित परिशिष्ट-II जोड़ा जाएगाः–</p>
        <div className="annexure-title">"परिशिष्ट–II"</div>
        <div className="annexure-sub underline">सेवा प्राप्त करने हेतु आवेदन के साथ जमा किए जाने वाले आवश्यक कागजात<br/>(चेक लिस्ट)</div>

        <table className="checklist-table w-full">
          <thead>
            <tr>
              <th style={{ width: '30%', border: '1px solid black', padding: '6px', textAlign: 'center' }}>सेवा का नाम</th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>चेक लिस्ट</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px' }}>1. नये राशन कार्ड का निर्माण</td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                <ol className="list-decimal pl-5 space-y-1">
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
              <td style={{ border: '1px solid black', padding: '6px' }}>2. राशन कार्ड में संशोधन (नाम में संशोधन, नाम जोड़ना, नाम हटाना)</td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>आवेदन पत्र विभागीय प्रपत्र 'ख' में ।</li>
                  <li>व्यक्ति, जिसका नाम जोड़ा जाना है, के आधार कार्ड की छाया प्रति।</li>
                  <li>विभागीय आवेदन प्रपत्र 'ख' के क्रमांक 8 एवं 9 के संबंध में लागू कारण के प्रमाण-पत्र की छायाप्रति, यथा :–
                    <ul className="list-[lower-roman] pl-5 space-y-1 mt-1">
                      <li>निवास में परिवर्तन हेतु आवासीय प्रमाण-पत्र</li>
                      <li>जन्म / मृत्यु का प्रमाण-पत्र</li>
                      <li>राशन कार्ड में वर्णित अशुद्धियाँ जिनको शुद्ध किया जाना है, के लिए सरकारी प्रमाण-पत्र (सरकारी विद्यालय का प्रमाण-पत्र, आधार कार्ड, वोटर आई0कार्ड, ड्राईविंग लाईसेंस, पैन कार्ड आदि)।</li>
                    </ul>
                  </li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px' }}>3. राशन कार्ड का प्रत्यर्पण (Surrender) / रद्दीकरण</td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>आवेदन पत्र विभागीय प्रपत्र 'ख' में ।</li>
                  <li>विद्यमान राशन कार्ड का प्रत्यर्पण / रद्द करने के लिए आवेदन पत्र के क्रमांक 10 के संबंध में लागू कारण की छायाप्रति ।</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 4: General Instructions */}
      <div className="page" style={{ borderBottom: 'none' }}>
        <h3 className="section-title" style={{ fontSize: '18px' }}>सामान्य निर्देश</h3>
        <div className="general-instructions text-justify mt-6">
          <ol>
            <li>आवेदन पत्र केवल एक ही प्रति आवेदक द्वारा भरी जायेगी ।</li>
            <li>किसी व्यक्ति, संगठन या राजनीतिक पार्टी द्वारा तादाद में प्रस्तुत किये गये आवेदन पत्र स्वीकार नहीं किये जाऐंगे ।</li>
            <li>अपूर्ण आवेदन पत्र को रद्द कर दिया जायेगा ।</li>
            <li>आवेदक द्वारा बिना सही हस्ताक्षर किये हुए या बिना अंगूठे के निशान के आवेदन पत्र को रद्द कर दिया जायेगा ।</li>
            <li>हस्तलिखित, टाईप किये गये, फोटो कॉपी किये गये या एन.आई.सी. की वेबसाईट से डाउनलोड किये गये प्रपत्र भी स्वीकार किये जायेंगे, बशर्ते कि इस प्रकार के प्रपत्र निर्धारित उपरोक्त प्रपत्र से समरूप होने चाहिए ।</li>
            <li>सभी आवेदन पत्र RTPS के माध्यम से लिया जायेगा ।</li>
            <li>सरकारी सेवा से तात्पर्य है केन्द्र एवं राज्य सरकार, लोक उपक्रम, स्थानीय निकाय एवं स्वशासी में नियमित वेतनमान में कार्यरत कर्मी की सेवा ।</li>
            <li>RTPS के तहत पात्र गृहस्थी द्वारा राशन कार्ड का आवेदन पत्र संबंधित क्षेत्र के अनुमंडल पदाधिकारी के कार्यालय में जमा किया जायेगा ।</li>
            <li>अनुमंडल पदाधिकारी द्वारा RTPS के तहत राशन कार्ड हेतु प्राप्त आवेदन पत्र को एक सप्ताह के अन्दर संबंधित क्षेत्र के प्रखंड विकास पदाधिकारी को भेजा जायेगा । प्रखंड विकास पदाधिकारी द्वारा प्राप्त आवेदन पत्र को जांच कराकर 15 दिनों के अन्दर अनुमंडल पदाधिकारी को वापस किया जायेगा ।</li>
            <li>अनुमंडल पदाधिकारी द्वारा आवेदन पत्र को स्वीकृत किया जाता है तो राशन कार्ड निर्गत किया जायेगा ।</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

