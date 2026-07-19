"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Baby,
  Banknote,
  Building2,
  Calculator,
  Car,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Search,
  ShieldCheck,
  Sprout,
  Store,
  Utensils,
  Vote,
  Zap,
  Flame,
} from "lucide-react";

type SubLink = {
  title: string;
  href: string;
};

type OnlineService = {
  title: string;
  description: string;
  href?: string;
  subLinks?: SubLink[];
  tag: string;
  popular?: boolean;
  aliases?: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type ServiceGroup = {
  title: string;
  subtitle: string;
  services: OnlineService[];
};

const serviceGroups: ServiceGroup[] = [
  {
    title: "Business, GST & Food Licence",
    subtitle: "GST registration/filing, FSSAI licence aur business compliance portals.",
    services: [
      {
        title: "GST Registration",
        description: "New GSTIN registration, ARN status aur taxpayer registration work.",
        href: "https://reg.gst.gov.in/registration/",
        tag: "GST",
        popular: true,
        aliases: ["gst number", "gstin", "business registration"],
        icon: Store,
      },
      {
        title: "GST Filing / Login",
        description: "GST return filing, payment, notices aur taxpayer dashboard.",
        href: "https://services.gst.gov.in/services/login",
        tag: "GST",
        popular: true,
        aliases: ["gst return", "gstr", "gst login", "filing"],
        icon: Calculator,
      },
      {
        title: "GST Helpdesk",
        description: "GST portal issue, ticket/complaint aur technical support.",
        href: "https://selfservice.gstsystem.in/",
        tag: "GST Help",
        aliases: ["gst complaint", "gst ticket", "gst problem"],
        icon: ClipboardCheck,
      },
      {
        title: "FSSAI Registration",
        description: "Food business basic registration, state/central licence apply.",
        href: "https://foscos.fssai.gov.in/apply-for-lic-and-reg",
        tag: "FSSAI",
        popular: true,
        aliases: ["food licence", "foscos", "fssai license"],
        icon: Utensils,
      },
      {
        title: "FSSAI Login / Renewal",
        description: "FSSAI FoSCoS login, renewal, modification aur annual return.",
        href: "https://foscos.fssai.gov.in/",
        tag: "FoSCoS",
        aliases: ["food licence renewal", "fssai return"],
        icon: FileCheck2,
      },
      {
        title: "NSDL/Protean Fast PAN",
        description: "New PAN, correction, reprint aur e-PAN download after processing.",
        href: "https://tinpan.proteantech.in/services/pan/pan-index.html",
        tag: "Protean",
        popular: true,
        aliases: ["nsdl pan", "1hr pan", "one hour pan", "epan", "pan card"],
        icon: CreditCard,
      },
      {
        title: "Protean e-PAN Download",
        description: "Protean processed PAN ka e-PAN email/download request.",
        href: "https://onlineservices.proteantech.in/paam/requestAndDownloadEPAN.html",
        tag: "e-PAN",
        aliases: ["nsdl epan", "pan download", "epan download"],
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Bihar RTPS Certificates",
    subtitle: "Residence, caste, income, EWS, NCL aur character certificate services.",
    services: [
      {
        title: "Residence / Domicile",
        description: "Bihar आवासीय प्रमाण-पत्र apply, status aur certificate download.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "RTPS Bihar",
        popular: true,
        aliases: ["niwas", "residential", "domicile"],
        icon: Home,
      },
      {
        title: "Caste Certificate",
        description: "जाति प्रमाण-पत्र circle, subdivision ya district level se apply.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "RTPS Bihar",
        popular: true,
        aliases: ["jati", "category"],
        icon: FileCheck2,
      },
      {
        title: "Income Certificate",
        description: "आय प्रमाण-पत्र ke online application aur download options.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "RTPS Bihar",
        popular: true,
        aliases: ["aay", "income"],
        icon: BadgeCheck,
      },
      {
        title: "EWS / NCL Certificate",
        description: "EWS, OBC NCL aur Bihar NCL certificate services.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "RTPS Bihar",
        aliases: ["ews", "obc", "non creamy layer"],
        icon: ShieldCheck,
      },
      {
        title: "Character Certificate",
        description: "Bihar Home Department ka आचरण प्रमाण-पत्र application.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "Home Dept.",
        aliases: ["police", "pcc", "character"],
        icon: FileText,
      },
      {
        title: "RTPS Status / Download",
        description: "Application status, acknowledgement aur certificate download.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "Track",
        aliases: ["download certificate", "application status"],
        icon: Search,
      },
      {
        title: "Birth / Death Certificate",
        description: "CRS aur ServicePlus se birth/death registration certificate work.",
        href: "https://dc.crsorgi.gov.in/crs/home",
        tag: "CRS",
        aliases: ["janam", "mrityu", "birth", "death"],
        icon: Baby,
      },
      {
        title: "RTPS Appeal",
        description: "Delayed/rejected RTPS application ke appeal related service.",
        href: "https://serviceonline.bihar.gov.in/",
        tag: "Appeal",
        aliases: ["appeal", "complaint"],
        icon: FileCheck2,
      },
    ],
  },
  {
    title: "ID & Central Services",
    subtitle: "Aadhaar, PAN, voter ID aur passport ke official portals.",
    services: [
      {
        title: "Passport Apply / Status",
        description: "Fresh passport, re-issue, appointment aur application tracking.",
        href: "https://www.passportindia.gov.in/psp/",
        tag: "MEA",
        popular: true,
        aliases: ["passport seva", "pcc"],
        icon: FileText,
      },
      {
        title: "Voter ID / e-EPIC",
        description: "Voter registration, correction, status aur e-EPIC download.",
        href: "https://voters.eci.gov.in/",
        tag: "ECI",
        popular: true,
        aliases: ["voter id", "epic", "e-epic", "election card"],
        icon: Vote,
      },
      {
        title: "Voter Search",
        description: "EPIC number, details ya mobile se electoral roll search.",
        href: "https://electoralsearch.eci.gov.in/",
        tag: "ECI",
        aliases: ["electoral search", "epic search"],
        icon: Search,
      },
      {
        title: "Aadhaar Download",
        description: "UIDAI MyAadhaar se e-Aadhaar download aur Aadhaar services.",
        href: "https://myaadhaar.uidai.gov.in/genricDownloadAadhaar/en",
        tag: "UIDAI",
        popular: true,
        aliases: ["uidai", "e aadhaar", "adhar"],
        icon: CreditCard,
      },
      {
        title: "Instant e-PAN",
        description: "Income Tax portal se Aadhaar based instant e-PAN service.",
        href: "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/instant-e-pan",
        tag: "Income Tax",
        aliases: ["pan download", "epan", "pan card"],
        icon: CreditCard,
      },
      {
        title: "PAN Apply / Correction",
        description: "Protean/NSDL PAN application, correction aur status services.",
        href: "https://tinpan.proteantech.in/services/pan/pan-index.html",
        tag: "Protean",
        popular: true,
        aliases: ["nsdl", "pan card", "pan correction"],
        icon: FileCheck2,
      },
      {
        title: "UTIITSL PAN",
        description: "UTIITSL PAN apply, correction, reprint aur e-PAN options.",
        href: "https://www.pan.utiitsl.com/",
        tag: "UTIITSL",
        aliases: ["pan", "uti", "pan correction"],
        icon: CreditCard,
      },
      {
        title: "e-Shram Card",
        description: "Unorganised worker registration, UAN card aur e-Shram services.",
        href: "https://eshram.gov.in/",
        tag: "MoLE",
        aliases: ["labour", "uan", "shram card"],
        icon: BadgeCheck,
      },
      {
        title: "Ayushman Card",
        description: "PM-JAY beneficiary portal/card related official information.",
        href: "https://beneficiary.nha.gov.in/",
        tag: "NHA",
        aliases: ["pmjay", "ayushman bharat", "health card"],
        icon: HeartPulse,
      },
    ],
  },
  {
    title: "Board & University Results",
    subtitle: "10th, 12th aur Bihar ke major university result portals.",
    services: [
      {
        title: "Bihar Board 10th Result",
        description: "BSEB Matric result roll code/roll number se check.",
        href: "https://results.biharboardonline.com/",
        tag: "BSEB",
        popular: true,
        aliases: ["10th result", "matric", "bihar board"],
        icon: GraduationCap,
      },
      {
        title: "Bihar Board 12th Result",
        description: "BSEB Inter result arts, science, commerce stream ke liye.",
        href: "https://results.biharboardonline.com/",
        tag: "BSEB",
        popular: true,
        aliases: ["12th result", "inter", "intermediate"],
        icon: GraduationCap,
      },
      {
        title: "BSEB Official Website",
        description: "Bihar Board notices, exam updates, results aur certificates.",
        href: "https://biharboardonline.bihar.gov.in/",
        tag: "BSEB",
        aliases: ["bihar board", "secondary", "senior secondary"],
        icon: FileText,
      },
      {
        title: "Patna University Result",
        description: "Patna University UG/PG examination result notices.",
        href: "https://pup.ac.in/Examinationresults.aspx",
        tag: "Patna Univ.",
        aliases: ["pu result", "patna university"],
        icon: GraduationCap,
      },
      {
        title: "Patliputra University Result",
        description: "PPU Patna result portal for UG, PG, vocational and paramedical.",
        href: "https://ppup.ac.in/result-portal",
        tag: "PPU",
        popular: true,
        aliases: ["ppu result", "patliputra"],
        icon: GraduationCap,
      },
      {
        title: "Magadh University Result",
        description: "Magadh University marksheet/result and student services.",
        href: "https://www.magadhuniversity.ac.in/",
        tag: "Magadh",
        popular: true,
        aliases: ["magadh result", "bodh gaya"],
        icon: GraduationCap,
      },
      {
        title: "LNMU Result",
        description: "Lalit Narayan Mithila University result/examination portal.",
        href: "https://lnmuexam.ucanapply.com/",
        tag: "LNMU",
        popular: true,
        aliases: ["mithila university", "darbhanga"],
        icon: GraduationCap,
      },
      {
        title: "TMBU Result",
        description: "Tilka Manjhi Bhagalpur University result and exam updates.",
        href: "https://www.tmbuniv.ac.in/",
        tag: "TMBU",
        aliases: ["bhagalpur university", "tilka manjhi"],
        icon: GraduationCap,
      },
      {
        title: "BRABU Result",
        description: "B.R.A. Bihar University Muzaffarpur UG/PG result portal.",
        href: "https://result.brabu.ac.in/",
        tag: "BRABU",
        popular: true,
        aliases: ["brabu", "bihar university", "muzaffarpur"],
        icon: GraduationCap,
      },
      {
        title: "VKSU Result",
        description: "Veer Kunwar Singh University Ara result portal.",
        href: "https://vksuexams.com/results.aspx",
        tag: "VKSU",
        aliases: ["ara university", "veer kunwar singh"],
        icon: GraduationCap,
      },
      {
        title: "BNMU Result",
        description: "Bhupendra Narayan Mandal University result and notices.",
        href: "https://bnmu.ac.in/",
        tag: "BNMU",
        aliases: ["mandal university", "madhepura"],
        icon: GraduationCap,
      },
      {
        title: "Purnea University Result",
        description: "Purnea University examination result notices and PDFs.",
        href: "https://purneau.ac.in/pages/results",
        tag: "Purnea",
        aliases: ["purnea result", "purnia"],
        icon: GraduationCap,
      },
      {
        title: "Munger University Result",
        description: "Munger University UG, PG and professional course result pages.",
        href: "https://application.mungeruniversity.ac.in/Result/PageB",
        tag: "Munger",
        aliases: ["munger result", "muniv"],
        icon: GraduationCap,
      },
      {
        title: "JPU Chapra Result",
        description: "Jai Prakash University Chapra result/examination portal.",
        href: "https://www.jpv.ac.in/",
        tag: "JPU",
        aliases: ["jai prakash university", "chapra"],
        icon: GraduationCap,
      },
    ],
  },
  {
    title: "Bihar Utility & Land Work",
    subtitle: "Ration, land record, mutation, lagan, transport aur registration portals.",
    services: [
      {
        title: "Ration Card Apply",
        description: "Food & Consumer Protection Department ration card application.",
        href: "https://rconline.bihar.gov.in/",
        tag: "Bihar",
        popular: true,
        aliases: ["ration", "food"],
        icon: Utensils,
      },
      {
        title: "Ration Card Details",
        description: "Bihar ration card details verification and lookup.",
        href: "https://epds.bihar.gov.in/",
        tag: "EPDS",
        aliases: ["ration status", "ration list"],
        icon: Search,
      },
      {
        title: "Bihar Bhumi",
        description: "Mutation, LPC, Jamabandi, lagan aur land records services.",
        href: "https://biharbhumi.bihar.gov.in/",
        tag: "Land",
        popular: true,
        aliases: ["mutation", "jamabandi", "lagan", "lpc", "land"],
        icon: Landmark,
      },
      {
        title: "Parimarjan Plus",
        description: "Jamabandi correction aur Bihar land record correction status.",
        href: "https://parimarjanplus.bihar.gov.in/",
        tag: "Land",
        aliases: ["jamabandi correction", "parimarjan"],
        icon: FileCheck2,
      },
      {
        title: "e-Nibandhan Bihar",
        description: "Property registration, certified copy, deed aur marriage registration.",
        href: "https://enibandhan.bihar.gov.in/",
        tag: "Registry",
        aliases: ["registry", "deed", "marriage", "nibandhan"],
        icon: Building2,
      },
      {
        title: "Bhu-Jankari",
        description: "Registered property document details aur land document lookup.",
        href: "https://bhumijankari.bihar.gov.in/",
        tag: "Registry",
        aliases: ["bhu jankari", "property", "deed"],
        icon: Landmark,
      },
      {
        title: "Driving Licence",
        description: "Learner licence, DL renew/correction/status through Sarathi.",
        href: "https://sarathi.parivahan.gov.in/",
        tag: "Transport",
        aliases: ["dl", "ll", "licence"],
        icon: Car,
      },
      {
        title: "Vehicle Services",
        description: "RC, tax, permit, transfer aur vehicle related Vahan services.",
        href: "https://vahan.parivahan.gov.in/",
        tag: "Transport",
        aliases: ["rc", "vehicle", "permit", "tax"],
        icon: Car,
      },
    ],
  },
  {
    title: "Bills, Scholarship & Welfare",
    subtitle: "Bijli bill, scholarship, labour aur agriculture related common portals.",
    services: [
      {
        title: "North Bihar Bijli Bill",
        description: "NBPDCL quick bill payment, receipt aur consumer services.",
        href: "https://nbpdcl.co.in/frmquickbillpaymentall.aspx",
        tag: "NBPDCL",
        popular: true,
        aliases: ["electricity", "bijli", "north bihar"],
        icon: Zap,
      },
      {
        title: "South Bihar Bijli Bill",
        description: "SBPDCL quick bill payment, receipt aur smart meter recharge.",
        href: "https://www.sbpdcl.co.in/frmQuickBillPaymentAll.aspx",
        tag: "SBPDCL",
        popular: true,
        aliases: ["electricity", "bijli", "south bihar"],
        icon: Zap,
      },
      {
        title: "Bihar Labour Card",
        description: "Bihar Labour Resources Department worker registration/login.",
        href: "https://blrd.skillmissionbihar.org/",
        tag: "Labour",
        aliases: ["labour card", "shramik", "majdur"],
        icon: BadgeCheck,
      },
      {
        title: "Post Matric Scholarship",
        description: "Bihar PMS portal for SC/ST/BC/EBC post matric scholarship.",
        href: "https://pmsonline.bihar.gov.in/",
        tag: "Bihar PMS",
        aliases: ["pms", "scholarship", "student"],
        icon: GraduationCap,
      },
      {
        title: "National Scholarship",
        description: "NSP central/state scholarship application and tracking.",
        href: "https://scholarships.gov.in/",
        tag: "NSP",
        aliases: ["nsp", "student", "scholarship"],
        icon: GraduationCap,
      },
      {
        title: "PM Kisan",
        description: "Farmer registration, beneficiary status aur e-KYC services.",
        href: "https://pmkisan.gov.in/",
        tag: "Agriculture",
        aliases: ["kisan", "farmer", "ekyc"],
        icon: Sprout,
      },
      {
        title: "DBT Agriculture Bihar",
        description: "Bihar agriculture DBT, farmer registration aur scheme services.",
        href: "https://dbtagriculture.bihar.gov.in/",
        tag: "Bihar DBT",
        aliases: ["farmer", "kisan", "agriculture"],
        icon: Sprout,
      },
      {
        title: "Income Tax e-Filing",
        description: "ITR, PAN-Aadhaar link, refund status aur tax services.",
        href: "https://www.incometax.gov.in/iec/foportal/",
        tag: "Income Tax",
        aliases: ["itr", "tax", "pan aadhaar link"],
        icon: Banknote,
      },
    ],
  },
  {
    title: "Govt. & Utility Portals",
    subtitle: "Sanchar Saathi, Udyam, Surya Ghar, APAAR aur anya jaruri portals.",
    services: [
      {
        title: "Lost/Found Mobile & Internet",
        description: "Mobile block/unblock, IMEI check aur Sanchar Saathi services.",
        subLinks: [
          { title: "IMEI Verification", href: "https://ceir.sancharsaathi.gov.in/DeviceDetails/DeviceDetails.jsp" },
          { title: "Blocking Lost/Stolen Mobile", href: "https://ceir.sancharsaathi.gov.in/Request/CeirUserBlockRequestDirect.jsp" },
          { title: "Un-Blocking Recovered Mobile", href: "https://ceir.sancharsaathi.gov.in/Request/CeirUserUnblockRequestDirect.jsp" },
          { title: "Check Request Status", href: "https://ceir.sancharsaathi.gov.in/Request/CeirRequestStatus.jsp" },
          { title: "Know Mobile Connections in Your Name", href: "https://tafcop.sancharsaathi.gov.in/telecomUser/" },
        ],
        tag: "CEIR",
        popular: true,
        aliases: ["stolen mobile", "lost phone", "sanchar saathi", "imei"],
        icon: ShieldCheck,
      },
      {
        title: "Udyam Aadhaar Service (MSME)",
        description: "New MSME registration, print certificate aur Udyam update.",
        subLinks: [
          { title: "UDYAM REGISTRATION (For New)", href: "https://udyamregistration.gov.in/Udyam_Registration.aspx" },
          { title: "Print Udyam Certificate", href: "https://udyamregistration.gov.in/PrintUdyamCertificate.aspx" },
          { title: "Verify Udyam Registration Number", href: "https://udyamregistration.gov.in/Udyam_Verify.aspx" },
          { title: "Update/Cancel Udyam Registration", href: "https://udyamregistration.gov.in/Udyam_Login1.aspx" },
        ],
        tag: "MSME",
        popular: true,
        aliases: ["msme", "udyam", "business registration"],
        icon: Store,
      },
      {
        title: "PM Surya Ghar Yojana (Muft Bijli Yojana)",
        description: "Muft Bijli Yojana apply, vendor registration aur benefits check.",
        subLinks: [
          { title: "Apply/Login", href: "https://pmsuryaghar.gov.in/consumerLogin" },
          { title: "Benefits Details", href: "https://pmsuryaghar.gov.in/scheme_details" },
          { title: "Consumer Financing Options", href: "https://pmsuryaghar.gov.in/Consumer_financing" },
          { title: "Find Registered Vendors", href: "https://pmsuryaghar.gov.in/vendor_listing" },
          { title: "Vendor Registration", href: "https://pmsuryaghar.gov.in/vendorLogin" },
        ],
        tag: "Surya Ghar",
        aliases: ["muft bijli", "solar", "rooftop solar"],
        icon: Zap,
      },
      {
        title: "APAAR ID Card",
        description: "Students ke liye One Nation One Student ID (APAAR/ABC) portal.",
        subLinks: [
          { title: "New Apply / ABC Portal", href: "https://abc.gov.in/" },
          { title: "APAAR Login", href: "https://apaar.education.gov.in/" },
        ],
        tag: "APAAR",
        popular: true,
        aliases: ["student id", "abc portal", "education"],
        icon: GraduationCap,
      },
      {
        title: "ABHA Card (Ayushman)",
        description: "Health ID (ABHA) creation, login aur health record management.",
        href: "https://abha.abdm.gov.in/",
        tag: "ABHA",
        popular: true,
        aliases: ["health card", "ayushman bharat account"],
        icon: HeartPulse,
      },
      {
        title: "Railway Service",
        description: "Train check, PNR status, seat availability aur fare enquiry.",
        subLinks: [
          { title: "PNR Check", href: "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en" },
          { title: "Train Check", href: "https://www.indianrail.gov.in/enquiry/TBIS/TrainBetweenImportantStations.html?locale=en" },
          { title: "Train Seat Check", href: "https://www.indianrail.gov.in/enquiry/SEAT/SeatAvailability.html?locale=en" },
          { title: "Fare Enquiry", href: "https://www.indianrail.gov.in/enquiry/FARE/FareEnquiry.html?locale=en" },
          { title: "Train Number Track", href: "https://www.indianrail.gov.in/enquiry/SCHEDULE/TrainSchedule.html?locale=en" }
        ],
        tag: "IRCTC",
        aliases: ["train", "pnr", "railway", "ticket"],
        icon: ExternalLink,
      },
      {
        title: "e-Challan Parivahan",
        description: "Traffic challan check, payment aur status via Parivahan.",
        href: "https://echallan.parivahan.gov.in/",
        tag: "Transport",
        aliases: ["challan", "fine", "traffic police"],
        icon: Car,
      },
      {
        title: "Soil Health Card",
        description: "Kisan portal for soil testing and health card print.",
        href: "https://soilhealth.dac.gov.in/",
        tag: "Agriculture",
        aliases: ["soil test", "mitti janch", "kisan"],
        icon: Sprout,
      },
      {
        title: "MKisan Portal",
        description: "Agriculture advisory, services and farmer portal.",
        href: "https://mkisan.gov.in/",
        tag: "Agriculture",
        aliases: ["mkisan", "kisan advisory"],
        icon: Sprout,
      },
    ],
  },
  {
    title: "LPG Gas & Helplines",
    subtitle: "Bharat, HP, Indane Gas, NCS, Consumer Helpline, UDID aur CIBIL.",
    services: [
      {
        title: "National Consumer Helpline (NCH)",
        description: "National Consumer Helpline services and grievances.",
        subLinks: [
          { title: "Register Grievance (NCH)", href: "https://consumerhelpline.gov.in/user/signup.php" },
          { title: "Track Your Grievance (NCH)", href: "https://consumerhelpline.gov.in/user/track-complaint.php" },
          { title: "Upload Documents (NCH)", href: "https://consumerhelpline.gov.in/user/login.php" },
        ],
        tag: "Helpline",
        aliases: ["nch", "consumer forum", "shikayat"],
        icon: Building2,
      },
      {
        title: "National Career Service (NCS)",
        description: "Job seeker registration, login aur career services.",
        subLinks: [
          { title: "Register All Type (NCS)", href: "https://www.ncs.gov.in/_layouts/15/NCSP/Registration.aspx" },
          { title: "Login (NCS)", href: "https://www.ncs.gov.in/_layouts/15/NCSP/Login.aspx" },
          { title: "Main Website (NCS)", href: "https://www.ncs.gov.in/" },
        ],
        tag: "NCS",
        popular: true,
        aliases: ["jobs", "career", "employment", "ncs"],
        icon: Building2,
      },
      {
        title: "Check Free CIBIL Score",
        description: "Check your CIBIL score for free online.",
        href: "https://www.cibil.com/freecibilscore",
        tag: "Finance",
        popular: true,
        aliases: ["cibil", "credit score", "loan"],
        icon: Banknote,
      },
      {
        title: "INDANE GAS",
        description: "Indane Gas booking, subsidy, Ujjwala aur KYC services.",
        subLinks: [
          { title: "Check Gas Subsidy", href: "https://cx.indianoil.in/" },
          { title: "Give up Subsidy", href: "https://cx.indianoil.in/" },
          { title: "Online Application Ujjwala", href: "https://cx.indianoil.in/" },
          { title: "Find Your LPG ID", href: "https://cx.indianoil.in/" },
          { title: "User Login", href: "https://cx.indianoil.in/" },
          { title: "User Register", href: "https://cx.indianoil.in/" },
          { title: "INDANE GAS Official Website", href: "https://cx.indianoil.in/" },
          { title: "PMUY Official Website", href: "https://cx.indianoil.in/" },
          { title: "KYC APP For Android", href: "https://cx.indianoil.in/" },
          { title: "Face RD App", href: "https://cx.indianoil.in/" },
          { title: "KYC Video Hindi", href: "https://cx.indianoil.in/" },
          { title: "New KYC Form", href: "https://cx.indianoil.in/" },
          { title: "DBTL Form", href: "https://cx.indianoil.in/" },
        ],
        tag: "LPG Gas",
        popular: true,
        aliases: ["indane", "gas booking", "ujjwala"],
        icon: Flame,
      },
      {
        title: "HP GAS",
        description: "HP Gas booking, new connection, KYC and Subsidy check.",
        subLinks: [
          { title: "Book Cylinder", href: "https://myhpgas.in/myHPGas/HPGas/BookCylinder.aspx" },
          { title: "Book & Pay Online", href: "https://myhpgas.in/myHPGas/HPGas/BookCylinder.aspx" },
          { title: "Check Gas Subsidy", href: "https://myhpgas.in/myHPGas/HPGas/CheckSubsidy.aspx" },
          { title: "Locate Distributor", href: "https://myhpgas.in/myHPGas/HPGas/LocateDistributor.aspx" },
          { title: "Find Your LPG ID", href: "https://myhpgas.in/myHPGas/HPGas/FindLpgId.aspx" },
          { title: "Online Application Ujjwala", href: "https://myhpgas.in/myHPGas/NewConnectionHome/Ujjwala.aspx" },
          { title: "New User SignUp", href: "https://myhpgas.in/myHPGas/User/Register.aspx" },
          { title: "User Login", href: "https://myhpgas.in/myHPGas/User/Login.aspx" },
          { title: "HP GAS Official Website", href: "https://myhpgas.in/" },
          { title: "PMUY Official Website", href: "https://www.pmuy.gov.in/" },
          { title: "KYC APP For Android", href: "https://myhpgas.in/" },
          { title: "Face RD App", href: "https://myhpgas.in/" },
          { title: "KYC Video Hindi", href: "https://myhpgas.in/" },
          { title: "DBTL Form", href: "https://myhpgas.in/" },
          { title: "New KYC Form", href: "https://myhpgas.in/" },
        ],
        tag: "LPG Gas",
        popular: true,
        aliases: ["hp gas", "gas booking", "ujjwala"],
        icon: Flame,
      },
      {
        title: "BHARAT GAS",
        description: "Bharat Gas booking, subsidy, Ujjwala connection aur KYC.",
        subLinks: [
          { title: "BOOK CYLINDER", href: "https://my.ebharatgas.com/bharatgas/QuickBookPay/Index" },
          { title: "Book & Pay Online", href: "https://my.ebharatgas.com/bharatgas/QuickBookPay/Index" },
          { title: "Check Gas Subsidy", href: "https://my.ebharatgas.com/bharatgas/LPGServices/CheckSubsidy" },
          { title: "Online Application Ujjwala", href: "https://my.ebharatgas.com/" },
          { title: "Find Your LPG ID", href: "https://my.ebharatgas.com/bharatgas/LPGServices/FindLpgId" },
          { title: "Bharat Gas Official Website", href: "https://my.ebharatgas.com/" },
          { title: "PMUY Official Website", href: "https://www.pmuy.gov.in/" },
          { title: "KYC APP For Android", href: "https://my.ebharatgas.com/" },
          { title: "Face RD App", href: "https://my.ebharatgas.com/" },
          { title: "KYC Video Hindi", href: "https://my.ebharatgas.com/" },
          { title: "New KYC Form", href: "https://my.ebharatgas.com/" },
          { title: "DBTL Form", href: "https://my.ebharatgas.com/" },
        ],
        tag: "LPG Gas",
        popular: true,
        aliases: ["bharat gas", "gas booking", "ujjwala"],
        icon: Flame,
      },
      {
        title: "Unique Disability ID Card (UDID)",
        description: "Apply for UDID card, track status and download e-UDID.",
        href: "https://www.swavlambancard.gov.in/",
        tag: "Social Welfare",
        popular: true,
        aliases: ["udid", "disability", "viklang", "swavlamban"],
        icon: HeartPulse,
      },
    ],
  },
];

export default function OnlineWorkPage() {
  const [query, setQuery] = useState("");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();
  const totalServices = serviceGroups.reduce((count, group) => count + group.services.length, 0);
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return serviceGroups;

    return serviceGroups
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => {
          const haystack = [
            service.title,
            service.description,
            service.tag,
            group.title,
            ...(service.aliases || []),
          ].join(" ").toLowerCase();

          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.services.length > 0);
  }, [normalizedQuery]);
  const visibleServices = filteredGroups.reduce((count, group) => count + group.services.length, 0);
  const displayedGroups = normalizedQuery ? filteredGroups : [serviceGroups[activeGroupIndex]];
  const activeGroup = serviceGroups[activeGroupIndex];

  return (
    <div className="page-shell page-shell-list" id="service-list">
      <div className="border border-[#c7c7c7] bg-white">
        <div className="border-b border-[#c7c7c7] bg-[#5f97c8] px-3 py-2 text-[13px] font-bold text-white">
          Quick Online Services
        </div>

        <div className="p-3 md:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px] lg:items-start" id="service-search">
            <div>
              <h2 className="text-[20px] font-bold leading-tight text-[#003580]">
                {normalizedQuery ? "Search Results" : activeGroup.title}
              </h2>
              <p className="mt-1 text-[12px] leading-tight text-[#00428c]">
                {normalizedQuery ? `${visibleServices} service found from ${totalServices}` : activeGroup.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex min-h-[32px] w-full items-center gap-2 border border-[#9a9a9a] bg-white px-2">
                <Search size={14} className="text-[#00428c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-[12px] text-[#001a78] outline-none placeholder:text-[#55759d]"
                  placeholder="Search: GST, FSSAI, PAN, 10th, PPU..."
                />
              </div>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="h-[32px] border border-[#8a8a8a] bg-[#e8e8e8] px-3 text-[12px] font-bold text-[#001a78]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-1 gap-[3px] sm:grid-cols-2 lg:grid-cols-3">
            {serviceGroups.map((group, index) => (
                <button
                  key={group.title}
                  type="button"
                  onClick={() => {
                    setActiveGroupIndex(index);
                    setQuery("");
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-left text-[12px] font-bold ${
                    !normalizedQuery && activeGroupIndex === index
                      ? "bg-[#b9d4eb] text-[#001a78] shadow-[inset_4px_0_0_#00428c]"
                      : "bg-[#d5d5d5] text-[#001a78] hover:bg-[#c3d8ec]"
                  }`}
                >
                  {group.title}
                  <span className="text-[10px] text-[#666]">{group.services.length}</span>
                </button>
              ))}
          </nav>

          <section className="mt-4 border border-[#c0c0c0] bg-[#f8f8f8] p-2 md:p-3">
              {displayedGroups.map((group) => (
                <div key={group.title} className="mb-5 last:mb-0">
                  {normalizedQuery && (
                    <h3 className="mb-3 border-b border-[#d1d1d1] pb-2 text-[14px] font-bold text-[#003580]">
                      {group.title}
                    </h3>
                  )}

                  <div className="space-y-3">
                    {group.services.map((service) => {
                      const Icon = service.icon;

                      return (
                        <div
                          key={service.title}
                          className="border border-[#d2d2d2] bg-white px-3 py-3 text-[#003580]"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[#9bbfe0] bg-[#dcecf9] text-[#00428c]">
                                <Icon size={17} />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {service.href ? (
                                    <a
                                      href={service.href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[14px] font-bold text-[#001a78] hover:underline"
                                    >
                                      {service.title}
                                    </a>
                                  ) : (
                                    <span className="text-[14px] font-bold text-[#001a78]">
                                      {service.title}
                                    </span>
                                  )}
                                  {service.popular && (
                                    <span className="bg-[#fff5bf] px-1.5 py-0.5 text-[10px] font-bold text-[#7b5200]">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 max-w-[660px] text-[12px] leading-[1.35] text-[#00428c]">
                                  {service.description}
                                </p>
                                <p className="mt-1 text-[11px] font-bold text-[#001a78]">{service.tag}</p>
                              </div>
                            </div>

                            {service.href && (
                              <a
                                href={service.href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-[28px] items-center justify-center gap-1 border border-[#777] bg-[#eeeeee] px-3 text-[12px] font-normal text-black hover:bg-white"
                              >
                                Click Here
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          
                          {service.subLinks && service.subLinks.length > 0 && (
                            <div className="mt-4 border-t border-[#e0e0e0] pt-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {service.subLinks.map((subLink, i) => (
                                  <a
                                    key={i}
                                    href={subLink.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-[#d2d2d2] bg-[#f9fbff] p-2 hover:border-[#5f97c8] hover:bg-[#eaf3fc] transition-colors group"
                                  >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                      <ExternalLink size={12} />
                                    </div>
                                    <span className="text-[12px] font-bold text-[#003580] leading-tight">
                                      {subLink.title}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {displayedGroups.length === 0 && (
                <div className="bg-white p-8 text-center text-[#003580]">
                  <p className="text-[15px] font-bold">No service found</p>
                  <p className="mt-1 text-[12px]">Dusra keyword try karein: GST, Aadhaar, PAN, RTPS, result.</p>
                </div>
              )}
          </section>

          <div className="mt-3 border border-[#c7c7c7] bg-[#eef6ff] px-3 py-2 text-[12px] leading-tight text-[#00428c]">
            <p>Note:- Links official portals par open hote hain. Form submit karne se pehle URL aur applicant details verify karein.</p>
            <p className="mt-1 font-bold text-[#001a78]">Click Here button se direct portal open hoga.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
