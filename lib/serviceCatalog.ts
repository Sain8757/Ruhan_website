export type ServiceCatalogItem = {
  id: string;
  name: string;
  category: string;
  fee: number;
  estimate: string;
  portal?: string;
  documents: string[];
  message: string;
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: "rtps-residence",
    name: "Residence / Domicile Certificate",
    category: "RTPS Bihar",
    fee: 80,
    estimate: "7-14 days",
    portal: "https://serviceonline.bihar.gov.in/",
    documents: ["Aadhaar card", "Mobile number", "Photo", "Address proof"],
    message: "Namaste {name}, residence/domicile certificate ke liye Aadhaar, mobile OTP aur address proof bhej dijiye.",
  },
  {
    id: "rtps-caste",
    name: "Caste Certificate",
    category: "RTPS Bihar",
    fee: 100,
    estimate: "7-14 days",
    portal: "https://serviceonline.bihar.gov.in/",
    documents: ["Aadhaar card", "Mobile number", "Photo", "Family caste proof", "Address proof"],
    message: "Namaste {name}, caste certificate ke liye Aadhaar, photo, mobile OTP aur caste proof required hai.",
  },
  {
    id: "rtps-income",
    name: "Income Certificate",
    category: "RTPS Bihar",
    fee: 80,
    estimate: "7-14 days",
    portal: "https://serviceonline.bihar.gov.in/",
    documents: ["Aadhaar card", "Mobile number", "Photo", "Income details"],
    message: "Namaste {name}, income certificate ke liye Aadhaar, photo, mobile OTP aur income details bhej dijiye.",
  },
  {
    id: "pan-fast",
    name: "NSDL/Protean Fast PAN",
    category: "PAN",
    fee: 250,
    estimate: "1-24 hours after verification",
    portal: "https://tinpan.proteantech.in/services/pan/pan-index.html",
    documents: ["Aadhaar card", "Aadhaar linked mobile OTP", "Photo", "Signature"],
    message: "Namaste {name}, fast PAN ke liye Aadhaar, Aadhaar linked OTP, photo aur signature required hai.",
  },
  {
    id: "pan-correction",
    name: "PAN Correction",
    category: "PAN",
    fee: 200,
    estimate: "7-15 days",
    portal: "https://tinpan.proteantech.in/services/pan/pan-index.html",
    documents: ["PAN card", "Aadhaar card", "Correction proof", "Mobile number"],
    message: "Namaste {name}, PAN correction ke liye PAN, Aadhaar, correction proof aur OTP required hai.",
  },
  {
    id: "aadhaar-download",
    name: "Aadhaar Download",
    category: "Aadhaar",
    fee: 30,
    estimate: "Instant",
    portal: "https://myaadhaar.uidai.gov.in/genricDownloadAadhaar/en",
    documents: ["Aadhaar number / VID / EID", "Registered mobile OTP"],
    message: "Namaste {name}, Aadhaar download ke liye Aadhaar number aur registered mobile OTP chahiye.",
  },
  {
    id: "voter-id",
    name: "Voter ID / e-EPIC",
    category: "Voter",
    fee: 70,
    estimate: "Instant to 30 days",
    portal: "https://voters.eci.gov.in/",
    documents: ["Aadhaar card", "Photo", "Mobile number", "Age proof", "Address proof"],
    message: "Namaste {name}, voter ID/e-EPIC work ke liye Aadhaar, photo, mobile OTP aur address proof required hai.",
  },
  {
    id: "passport",
    name: "Passport Apply / Status",
    category: "Passport",
    fee: 350,
    estimate: "Appointment based",
    portal: "https://www.passportindia.gov.in/psp/",
    documents: ["Aadhaar card", "PAN card", "Photo", "10th certificate", "Address proof"],
    message: "Namaste {name}, passport work ke liye Aadhaar, PAN, address proof aur education proof ready rakhein.",
  },
  {
    id: "gst-registration",
    name: "GST Registration",
    category: "Business",
    fee: 799,
    estimate: "3-7 days",
    portal: "https://reg.gst.gov.in/registration/",
    documents: ["PAN", "Aadhaar", "Photo", "Business address proof", "Bank details", "Mobile/email OTP"],
    message: "Namaste {name}, GST registration ke liye PAN, Aadhaar, business address proof, bank details aur OTP required hai.",
  },
  {
    id: "gst-filing",
    name: "GST Filing",
    category: "Business",
    fee: 499,
    estimate: "Same day",
    portal: "https://services.gst.gov.in/services/login",
    documents: ["GST login", "Sales/purchase details", "Payment challan if any"],
    message: "Namaste {name}, GST filing ke liye GST login aur sales/purchase details bhej dijiye.",
  },
  {
    id: "fssai",
    name: "FSSAI Registration",
    category: "Business",
    fee: 699,
    estimate: "3-10 days",
    portal: "https://foscos.fssai.gov.in/apply-for-lic-and-reg",
    documents: ["Aadhaar/PAN", "Photo", "Business address", "Food business details"],
    message: "Namaste {name}, FSSAI registration ke liye Aadhaar/PAN, photo, shop address aur business details required hai.",
  },
  {
    id: "scholarship",
    name: "Scholarship Application",
    category: "Education",
    fee: 100,
    estimate: "Portal timeline",
    portal: "https://pmsonline.bihar.gov.in/",
    documents: ["Aadhaar", "Bank passbook", "Caste/income certificate", "Marksheet", "Admission receipt"],
    message: "Namaste {name}, scholarship ke liye Aadhaar, bank passbook, caste/income certificate, marksheet aur admission receipt required hai.",
  },
  {
    id: "result-check",
    name: "10th/12th/University Result Check",
    category: "Education",
    fee: 30,
    estimate: "Instant",
    portal: "https://results.biharboardonline.com/",
    documents: ["Roll code / roll number", "Registration number if required"],
    message: "Namaste {name}, result check ke liye roll code, roll number aur registration number bhej dijiye.",
  },
  {
    id: "ration-card",
    name: "Ration Card",
    category: "Bihar Utility",
    fee: 150,
    estimate: "15-30 days",
    portal: "https://rconline.bihar.gov.in/",
    documents: ["Aadhaar of family members", "Photo", "Address proof", "Mobile number"],
    message: "Namaste {name}, ration card ke liye family Aadhaar, photo, address proof aur mobile OTP required hai.",
  },
  {
    id: "driving-licence",
    name: "Driving Licence",
    category: "Transport",
    fee: 200,
    estimate: "Appointment based",
    portal: "https://sarathi.parivahan.gov.in/",
    documents: ["Aadhaar", "Photo", "Signature", "Mobile number", "Fee payment"],
    message: "Namaste {name}, driving licence work ke liye Aadhaar, photo, signature aur mobile OTP required hai.",
  },
];

export const SERVICE_CATALOG_NAMES = SERVICE_CATALOG.map((item) => item.name);

export function findCatalogItem(serviceName: string) {
  return SERVICE_CATALOG.find((item) => item.name === serviceName);
}
