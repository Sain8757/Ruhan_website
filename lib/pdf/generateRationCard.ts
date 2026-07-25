import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { FormValues } from '@/app/(dashboard)/manual-forms/ration-card/kha/page';

export async function generateRationCardPDF(data: FormValues): Promise<string> {
  // Fetch template and font
  const [templateRes, fontRes] = await Promise.all([
    fetch('/assets/ration-form-template.pdf'),
    fetch('/assets/fonts/NotoSansDevanagari-Regular.ttf')
  ]);

  const templateBytes = await templateRes.arrayBuffer();
  const fontBytes = await fontRes.arrayBuffer();

  // Load PDF and Register FontKit
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  // Embed custom font
  const customFont = await pdfDoc.embedFont(fontBytes);
  
  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages.length > 1 ? pages[1] : pages[0];
  const page3 = pages.length > 2 ? pages[2] : pages[0];

  const fontSize = 11;
  const color = rgb(0.1, 0.1, 0.1);
  const tick = '✓';

  // --- PAGE 1: BASIC DETAILS ---
  
  page1.drawText(data.applicantName || '', { x: 200, y: 605, size: fontSize, font: customFont, color });
  page1.drawText(data.aadhaar || '', { x: 200, y: 575, size: fontSize, font: customFont, color });
  page1.drawText(data.mobile || '', { x: 200, y: 545, size: fontSize, font: customFont, color });
  page1.drawText(data.fatherName || '', { x: 230, y: 515, size: fontSize, font: customFont, color });
  page1.drawText(data.address || '', { x: 200, y: 485, size: fontSize, font: customFont, color });
  page1.drawText(data.existingRationCard || '', { x: 240, y: 455, size: fontSize, font: customFont, color });
  page1.drawText(data.dealerName || '', { x: 360, y: 425, size: fontSize, font: customFont, color });
  
  if (data.reasonForChange === 'Nivas') {
    page1.drawText(tick, { x: 180, y: 365, size: 14, font: customFont, color });
  } else if (data.reasonForChange === 'JanmMrityu') {
    page1.drawText(tick, { x: 180, y: 335, size: 14, font: customFont, color });
  } else if (data.reasonForChange === 'Ashuddhiya') {
    page1.drawText(tick, { x: 230, y: 305, size: 14, font: customFont, color });
  } else if (data.reasonForChange === 'Anya') {
    page1.drawText(tick, { x: 150, y: 275, size: 14, font: customFont, color });
  }

  if (data.photoBase64) {
    try {
      const base64Data = data.photoBase64.split(',')[1] || data.photoBase64;
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      let image = data.photoBase64.includes('image/png') ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
      page1.drawImage(image, { x: 430, y: 540, width: 100, height: 120 });
    } catch (e) {
      console.error("Error embedding photo", e);
    }
  }

  // --- PAGE 1: FAMILY MEMBERS TABLE (Cols 1-7) ---
  const rowHeight = 22;
  data.familyMembers.forEach((member, index) => {
    if (index > 4) return; // limit to 5 rows on page 1 for columns 1-7
    const startY = 195;
    const y = startY - (index * rowHeight);
    
    page1.drawText(String(index + 1), { x: 75, y, size: 10, font: customFont, color });
    page1.drawText(member.name || '', { x: 115, y, size: 10, font: customFont, color });
    page1.drawText(member.fatherName || '', { x: 220, y, size: 10, font: customFont, color });
    page1.drawText(member.gender || '', { x: 340, y, size: 10, font: customFont, color });
    page1.drawText(member.age || '', { x: 395, y, size: 10, font: customFont, color });
    page1.drawText(member.maritalStatus || '', { x: 445, y, size: 10, font: customFont, color });
    page1.drawText(member.relation || '', { x: 510, y, size: 10, font: customFont, color });
  });

  // --- PAGE 2: FAMILY MEMBERS TABLE (Cols 8-12) ---
  data.familyMembers.forEach((member, index) => {
    if (index > 4) return;
    const startY = 720; // estimate for top of page 2 table
    const y = startY - (index * rowHeight);
    
    page2.drawText(member.aadhaar || '', { x: 120, y, size: 10, font: customFont, color });
    page2.drawText(member.mobile || '', { x: 300, y, size: 10, font: customFont, color });
    page2.drawText(member.occupation || '', { x: 400, y, size: 10, font: customFont, color });
    page2.drawText(member.incomeSource || '', { x: 470, y, size: 10, font: customFont, color });
    page2.drawText(member.monthlyIncome || '', { x: 530, y, size: 10, font: customFont, color });
  });

  // --- PAGE 2: RURAL DECLARATIONS (Gramin) ---
  if (data.areaType === 'Rural' && data.ruralDeclarations) {
    const rd = data.ruralDeclarations;
    // Approximated coordinates for Yes checkboxes
    if (rd.motorVehicle) page2.drawText(tick, { x: 320, y: 550, size: 12, font: customFont, color });
    if (rd.machineEquip) page2.drawText(tick, { x: 350, y: 530, size: 12, font: customFont, color });
    if (rd.govtRegIndustry) page2.drawText(tick, { x: 410, y: 510, size: 12, font: customFont, color });
    if (rd.incomeOver10k) page2.drawText(tick, { x: 430, y: 490, size: 12, font: customFont, color });
    if (rd.incomeTax) page2.drawText(tick, { x: 230, y: 470, size: 12, font: customFont, color });
    if (rd.commercialTax) page2.drawText(tick, { x: 300, y: 450, size: 12, font: customFont, color });
    if (rd.puccaHouse3Rooms) page2.drawText(tick, { x: 280, y: 410, size: 12, font: customFont, color });
    if (rd.irrigatedLand2_5) page2.drawText(tick, { x: 180, y: 380, size: 12, font: customFont, color });
    if (rd.irrigatedLand5) page2.drawText(tick, { x: 180, y: 340, size: 12, font: customFont, color });
    if (rd.irrigatedLand7_5) page2.drawText(tick, { x: 240, y: 310, size: 12, font: customFont, color });
    if (rd.govtServant) {
      page2.drawText(tick, { x: 430, y: 280, size: 12, font: customFont, color });
      page2.drawText(rd.govtServantDetails?.serviceName || '', { x: 200, y: 260, size: 10, font: customFont, color });
      page2.drawText(rd.govtServantDetails?.postingPlace || '', { x: 200, y: 240, size: 10, font: customFont, color });
      page2.drawText(rd.govtServantDetails?.monthlyIncome || '', { x: 200, y: 220, size: 10, font: customFont, color });
    }
  }

  // --- PAGE 2 & 3: URBAN DECLARATIONS (Shahari) ---
  if (data.areaType === 'Urban' && data.urbanDeclarations) {
    const ud = data.urbanDeclarations;
    // (i) and (ii) are on page 2 usually, but depending on the exact PDF template, they might be on page 3.
    // Based on the image 2 and 3: 
    // "Kha" Shahari starts at bottom of Page 2 in the image? Actually, let's look at the images again.
    // Image 2 (Page 2) ends with "(Kha) Shahari Kshetra... (i)... (ii)...". 
    // Image 3 (Page 3) starts with "(Ga) Kitni masik aamdani hai...", then "(iii) ... (iv) ..."
    
    if (ud.incomeTax) page2.drawText(tick, { x: 300, y: 150, size: 12, font: customFont, color }); // page 2 bottom
    if (ud.govtServant) {
      page2.drawText(tick, { x: 450, y: 130, size: 12, font: customFont, color });
      page2.drawText(ud.govtServantDetails?.serviceName || '', { x: 200, y: 90, size: 10, font: customFont, color });
      page2.drawText(ud.govtServantDetails?.postingPlace || '', { x: 200, y: 70, size: 10, font: customFont, color });
      page3.drawText(ud.govtServantDetails?.monthlyIncome || '', { x: 200, y: 780, size: 10, font: customFont, color }); // page 3 top
    }
    
    if (ud.commercialTax) page3.drawText(tick, { x: 320, y: 760, size: 12, font: customFont, color });
    if (ud.puccaHouse3Rooms) page3.drawText(tick, { x: 230, y: 720, size: 12, font: customFont, color });
    if (ud.incomeOver20k) page3.drawText(tick, { x: 450, y: 700, size: 12, font: customFont, color });
    if (ud.threeAppliances) page3.drawText(tick, { x: 430, y: 680, size: 12, font: customFont, color });
    if (ud.fourWheeler) page3.drawText(tick, { x: 330, y: 660, size: 12, font: customFont, color });
    if (ud.washingMachine) page3.drawText(tick, { x: 330, y: 640, size: 12, font: customFont, color });
  }

  // --- PAGE 3: DATE, PLACE, SIGNATURE ---
  page3.drawText(data.date || '', { x: 100, y: 550, size: 11, font: customFont, color });
  page3.drawText(data.place || '', { x: 100, y: 530, size: 11, font: customFont, color });
  
  if (data.signatureBase64 && page3) {
    try {
      const base64Data = data.signatureBase64.split(',')[1] || data.signatureBase64;
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      let image = data.signatureBase64.includes('image/png') ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
      page3.drawImage(image, { x: 380, y: 440, width: 120, height: 40 });
      page3.drawImage(image, { x: 380, y: 530, width: 120, height: 40 }); // Two signature slots usually (Declaration & End)
    } catch (e) {
      console.error("Error embedding signature", e);
    }
  }

  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
