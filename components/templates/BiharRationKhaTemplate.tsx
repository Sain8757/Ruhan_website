import React from 'react';
import { FormValues } from '@/app/(dashboard)/manual-forms/ration-card/kha/page';

interface Props {
  data: FormValues;
}

const CheckBox = ({ label, checked }: { label: string, checked: boolean }) => (
  <span className="checkbox-group">
    {label} <span className="box">{checked ? '✓' : ''}</span>
  </span>
);

export function BiharRationKhaTemplate({ data }: Props) {
  const tick = '✓';

  return (
    <div className="ration-kha-wrapper" style={{ fontFamily: '"Noto Sans Devanagari", "Mangal", Arial, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ration-kha-wrapper {
          color: #111;
          line-height: 1.5;
          font-size: 13px;
        }
        .ration-kha-wrapper .page {
          width: 210mm;
          min-height: 297mm;
          padding: 25.4mm;
          background: #fff;
          position: relative;
          box-sizing: border-box;
          page-break-after: always;
        }
        .ration-kha-wrapper .header-title {
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 4px;
          text-align: center;
        }
        .ration-kha-wrapper .header-sub {
          font-size: 13px;
          margin: 2px 0;
          text-align: center;
        }
        .ration-kha-wrapper .photo-box {
          position: absolute;
          top: 35mm;
          right: 15mm;
          border: 1px solid #000;
          width: 25mm;
          height: 30mm;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 11px;
          overflow: hidden;
        }
        .ration-kha-wrapper .photo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ration-kha-wrapper .field-list {
          list-style: none;
          padding-left: 0;
          margin-top: 40px;
          width: 140mm;
        }
        .ration-kha-wrapper .field-list > li {
          display: flex;
          margin-bottom: 6px;
          align-items: flex-start;
        }
        .ration-kha-wrapper .field-list .num {
          width: 25px;
          flex-shrink: 0;
        }
        .ration-kha-wrapper .field-list .label {
          width: 180px;
          flex-shrink: 0;
        }
        .ration-kha-wrapper .field-list .fill {
          flex: 1;
        }
        .ration-kha-wrapper .field-list .fill span.u {
          font-weight: 600;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 4px;
        }
        .ration-kha-wrapper table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 11px;
        }
        .ration-kha-wrapper table th, .ration-kha-wrapper table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          vertical-align: middle;
          height: 36px;
        }
        .ration-kha-wrapper table th {
          font-weight: normal;
        }
        .ration-kha-wrapper table tr.hdr-num td {
          background-color: #f3f4f6;
          font-weight: bold;
          height: auto;
          padding: 2px;
        }
        .ration-kha-wrapper .qlist {
          padding-left: 20px;
          margin-top: 20px;
        }
        .ration-kha-wrapper .qlist > li {
          margin-bottom: 12px;
          font-weight: bold;
        }
        .ration-kha-wrapper .qlist .sub {
          list-style: none;
          padding-left: 15px;
          font-weight: normal;
          margin-top: 8px;
        }
        .ration-kha-wrapper .qlist .sub > li {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .ration-kha-wrapper .checkbox-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
        }
        .ration-kha-wrapper .box {
          display: inline-flex;
          width: 16px;
          height: 16px;
          border: 1px solid #000;
          margin: 0 4px;
          vertical-align: middle;
        }
        .ration-kha-wrapper .sign-box {
          border: 1px solid #000;
          width: 180px;
          height: 60px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ration-kha-wrapper .office-section {
          border: 1px solid #000;
          padding: 15px;
          margin-top: 30px;
        }
      `}} />

      {/* PAGE 1 */}
      <div className="page">
        <div className="header-title">प्रपत्र 'ख'</div>
        <div className="header-sub">लोक सेवा के अधिकार अधिनियम के अन्तर्गत विद्यमान राशन कार्ड में उपांतरणों</div>
        <div className="header-sub">अथवा विद्यमान राशन कार्ड को प्रत्यर्पण (Surrender)/रद्द करने के लिए</div>
        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px', lineHeight: 1.5 }}>
          (राष्ट्रीय खाद्य सुरक्षा अधिनियम 2013 (धारा-9) तथा लक्षित सार्वजनिक वितरण प्रणाली (नियंत्रण) आदेश 2015 (कंडिका 3 का<br/>
          उपकंडिका 13, 14 तथा कंडिका 4 उपकंडिका 7, 8, 9) द्रष्टव्य)
        </div>

        <div className="photo-box">
          {data.photoBase64 ? (
             <img src={data.photoBase64} alt="Applicant" />
          ) : (
             <span>पारिवारिक फोटो</span>
          )}
        </div>

        <ul className="field-list">
          <li><span className="num">1.</span><span className="label">आवेदक का नाम</span><span className="fill">: <span className="u">{data.applicantName}</span></span></li>
          <li><span className="num">2.</span><span className="label">आधार / EID no</span><span className="fill">: <span className="u">{data.aadhaar}</span></span></li>
          <li><span className="num">3.</span><span className="label">मोबाईल नं०</span><span className="fill">: <span className="u">{data.mobile}</span></span></li>
          <li><span className="num">4.</span><span className="label">आवेदक के पति/पिता का नाम</span><span className="fill">: <span className="u">{data.fatherName}</span></span></li>
          <li><span className="num">5.</span><span className="label">पूर्ण आवासीय पता</span><span className="fill">: <span className="u">{data.address}</span></span></li>
          <li><span className="num">6.</span><span className="label">विद्यमान राशन कार्ड की सं०</span><span className="fill">: <span className="u">{data.existingRationCard}</span></span></li>
          <li><span className="num">7.</span><span className="label">सम्बद्ध जन वितरण प्रणाली विक्रेता का नाम एवं अनुज्ञप्ति सं०</span><span className="fill">: <span className="u">{data.dealerName}</span></span></li>
          <li>
            <span className="num">8.</span>
            <div className="fill">
              <div>विद्यमान राशन कार्ड में उपांतरण का कारण-</div>
              <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ width: '220px' }}>(क) निवास में परिवर्तन</span>
                  <span className="box" style={{ width: '24px', height: '24px', fontSize: '16px', justifyContent: 'center' }}>{data.reasonForChange === 'Nivas' ? tick : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ width: '220px' }}>(ख) जन्म या मृत्यु</span>
                  <span className="box" style={{ width: '24px', height: '24px', fontSize: '16px', justifyContent: 'center' }}>{data.reasonForChange === 'JanmMrityu' ? tick : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ width: '220px' }}>(ग) कार्ड में वर्णित ब्योरो में अशुद्धियाँ</span>
                  <span className="box" style={{ width: '24px', height: '24px', fontSize: '16px', justifyContent: 'center' }}>{data.reasonForChange === 'Ashuddhiya' ? tick : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ width: '220px' }}>(घ) अन्य कारण</span>
                  <span className="box" style={{ width: '24px', height: '24px', fontSize: '16px', justifyContent: 'center' }}>{data.reasonForChange === 'Anya' ? tick : ''}</span>
                </div>
              </div>
            </div>
          </li>
          <li style={{ marginTop: '12px' }}><span className="num">9.</span><span className="fill">विद्यमान राशन कार्ड में उपांतरण हेतु विवरणी -</span></li>
        </ul>

        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>क्र०</th>
              <th>नाम</th>
              <th>पति/पिता का नाम</th>
              <th style={{ width: '50px' }}>लिंग</th>
              <th style={{ width: '50px' }}>उम्र</th>
              <th style={{ width: '100px' }}>वैवाहिक स्थिति</th>
              <th style={{ width: '100px' }}>संबंध</th>
            </tr>
            <tr className="hdr-num">
              <td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td>
            </tr>
          </thead>
          <tbody>
            {[...Array(7)].map((_, i) => {
              const member = data.familyMembers[i] || {};
              return (
                <tr key={i}>
                  <td>{member.name ? i + 1 : ''}</td>
                  <td>{member.name || ''}</td>
                  <td>{member.fatherName || ''}</td>
                  <td>{member.gender || ''}</td>
                  <td>{member.age || ''}</td>
                  <td>{member.maritalStatus || ''}</td>
                  <td>{member.relation || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGE 2 */}
      <div className="page">
        <table>
          <thead>
            <tr>
              <th style={{ width: '150px' }}>आधार / EID no</th>
              <th style={{ width: '100px' }}>मोबाईल नं०</th>
              <th>व्यवसाय / सरकारी सेवक</th>
              <th>आमदनी का स्रोत</th>
              <th style={{ width: '100px' }}>मासिक आय</th>
            </tr>
            <tr className="hdr-num">
              <td>8</td><td>9</td><td>10</td><td>11</td><td>12</td>
            </tr>
          </thead>
          <tbody>
            {[...Array(7)].map((_, i) => {
              const member = data.familyMembers[i] || {};
              return (
                <tr key={i}>
                  <td>{member.aadhaar || ''}</td>
                  <td>{member.mobile || ''}</td>
                  <td>{member.occupation || ''}</td>
                  <td>{member.incomeSource || ''}</td>
                  <td>{member.monthlyIncome || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '30px', fontWeight: 'bold' }}>
          10. विद्यमान राशन कार्ड को प्रत्यर्पण/रद्द करने का कारण -
        </div>

        <ol className="qlist" style={{ listStyleType: 'none', marginLeft: '-20px' }}>
          <li>(क) ग्रामीण क्षेत्र में प्रवास, जन्म, विवाह, सामाजिक और आर्थिक परिस्थिति में परिवर्तन के कारण आवेदक निम्नलिखित पर हाँ/नहीं, पर टिक लगाये :-
            <ul className="sub">
              <li>(i) मोटर चालित तिपहिया/चार पहिया वाहन है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.motorVehicle === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.motorVehicle === false} /></div></li>
              <li>(ii) मशीन चालित तीन/चार पहियों वाले कृषि उपकरण है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.machineEquip === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.machineEquip === false} /></div></li>
              <li>(iii) सरकार में पंजीकृत गैर-कृषि उद्योग वाले परिवार वाली गृहस्थी है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.govtRegIndustry === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.govtRegIndustry === false} /></div></li>
              <li>(iv) परिवार के किसी सदस्य की मासिक आय 10,000/- रू0 से अधिक है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.incomeOver10k === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.incomeOver10k === false} /></div></li>
              <li>(v) आयकर देते है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.incomeTax === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.incomeTax === false} /></div></li>
              <li>(vi) व्यावसायिक कर का भुगतान करते है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.commercialTax === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.commercialTax === false} /></div></li>
              <li>(vii) जिस मकान में रहते है, उस मकान में सभी कमरों में पक्की दीवारों और छत के साथ तीन अथवा अधिक कमरा है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.puccaHouse3Rooms === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.puccaHouse3Rooms === false} /></div></li>
              <li>(viii) परिवार में कम से कम एक सिंचाई उपकरण के साथ 2.5 एकड़ अथवा इससे अधिक सिंचित भूमि है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.irrigatedLand2_5 === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.irrigatedLand2_5 === false} /></div></li>
              <li>(ix) दो अथवा उससे अधिक फसली मौसम के लिए 5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.irrigatedLand5 === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.irrigatedLand5 === false} /></div></li>
              <li>(x) कम से कम एक सिंचाई उपकरण के साथ कम से कम 7.5 एकड़ अथवा इससे अधिक सिंचित भूमि वाली गृहस्थी है, <div><CheckBox label="हाँ" checked={data.ruralDeclarations?.irrigatedLand7_5 === true} /> <CheckBox label="नहीं" checked={data.ruralDeclarations?.irrigatedLand7_5 === false} /></div></li>
            </ul>
          </li>
        </ol>
      </div>

      {/* PAGE 3 */}
      <div className="page">
        <ol className="qlist" style={{ listStyleType: 'none', marginLeft: '-20px', marginTop: 0 }}>
          <li>(ख) शहरी क्षेत्र में प्रवास, जन्म, विवाह, सामाजिक और आर्थिक परिस्थिति में परिवर्तन के कारण आवेदक निम्नलिखित पर हाँ/नहीं, पर टिक लगाये :-
            <ul className="sub">
              <li>(i) आयकर देते है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.incomeTax === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.incomeTax === false} /></div></li>
              <li>(ii) परिवार में कोई सदस्य सरकारी सेवा में है (सरकारी सेवा से तात्पर्य है- केन्द्र एवं राज्य सरकार/लोक उपक्रम, स्थानीय निकाय एवं स्वशासी संस्थाओं में नियमित वेतनमान में कार्यरत कर्मी, (अनु०जाति/अनु०जन०जाति के ग्रुप "डी" को छोड़कर)), <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.govtServant === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.govtServant === false} /></div></li>
              <li>(iii) व्यावसायिक कर का भुगतान करते है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.commercialTax === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.commercialTax === false} /></div></li>
              <li>(iv) जिस मकान में रहते है, उस मकान में सभी कमरों में पक्की दीवारों और छत के साथ तीन अथवा अधिक कमरा है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.puccaHouse3Rooms === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.puccaHouse3Rooms === false} /></div></li>
              <li>(v) परिवार के किसी सदस्य का मासिक आय 20,000/- रू0 से अधिक है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.incomeOver20k === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.incomeOver20k === false} /></div></li>
              <li>(vi) दो पहिया वाहन, रेफ्रीजरेटर तथा वाशिंग मशीन तीनों उपकरण है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.threeAppliances === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.threeAppliances === false} /></div></li>
              <li>(vii) गृहस्थी में चार पहिया वाहन है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.fourWheeler === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.fourWheeler === false} /></div></li>
              <li>(viii) गृहस्थी में वाशिंग मशीन है, <div><CheckBox label="हाँ" checked={data.urbanDeclarations?.washingMachine === true} /> <CheckBox label="नहीं" checked={data.urbanDeclarations?.washingMachine === false} /></div></li>
            </ul>
          </li>
        </ol>

        <div className="office-section" style={{ marginTop: '40px' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', marginBottom: '15px' }}>
            विद्यमान राशन कार्ड में उपांतरणों / रद्द करने के लिए घोषणा
          </div>
          <div style={{ textAlign: 'justify', lineHeight: 1.6 }}>
            मैं / हम एतद् द्वारा यह घोषणा करता / करते हूँ / है कि ऊपर दी गई सभी प्रविष्टियाँ मेरे / हमारे ज्ञान और विश्वास के अनुसार सत्य है और कोई तथ्य छिपाया नहीं गया है। मैं / हम इसके भली - भाँति अवगत हूँ / है कि ऊपर दी गई कोई भी सूचना यदि जाँच के बाद झूठी पाई जाती है, तो मैं / हम आवश्यक वस्तु अधिनियम, 1955 (1955 का 10) की धारा-9 के अंतर्गत दाण्डिक कार्रवाई तथा अन्य संबंधित विधिक प्रावधानों के अंतर्गत उत्तरदायी होऊँगा / होंगे।
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', alignItems: 'flex-start' }}>
            <div style={{ lineHeight: 1.6 }}>
              <div>स्थान: <span style={{ fontWeight: 'bold' }}>{data.place || '..........................'}</span></div>
              <div>दिनांक: <span style={{ fontWeight: 'bold' }}>{data.date || '..........................'}</span></div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="sign-box" style={{ position: 'relative' }}>
                {data.signatureBase64 ? (
                  <img src={data.signatureBase64} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ opacity: 0.3 }}>हस्ताक्षर</div>
                )}
              </div>
              <div style={{ marginTop: '5px' }}>आवेदक का हस्ताक्षर/ अंगूठे का निशान</div>
              <div style={{ marginTop: '5px' }}>नाम: <span style={{ fontWeight: 'bold' }}>{data.applicantName}</span></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PAGE 4 */}
      <div className="page">
        <div className="office-section" style={{ marginTop: '40px', border: '1px dashed #000' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px', textDecoration: 'underline' }}>
            कार्यालय उपयोग के लिए
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
             <div>प्रपत्र - ख क्रमांक सं०: ...............................</div>
             <div>दिनांक: ...............................</div>
          </div>
          
          <div style={{ lineHeight: 1.8 }}>
            श्री / श्रीमती .................................................................................................................................................................................. से <br/>
            विद्यमान राशन कार्ड सं० ........................................................................................................................................................ में <br/>
            उपांतरण / प्रत्यर्पण (Surrender) / रद्द करने के लिए आवेदन प्राप्त हुआ।
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
            <div style={{ textAlign: 'center' }}>
               <div>..................................................................</div>
               <div>(प्राप्तकर्ता पदाधिकारी का हस्ताक्षर एवं मुहर)</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
