import {
  BadgeCheck, Baby, Banknote, Building2, Calculator, Car, ClipboardCheck, CreditCard,
  ExternalLink, FileCheck2, FileText, GraduationCap, HeartPulse, Home, Landmark,
  Search, ShieldCheck, Sprout, Store, Utensils, Vote, Zap, Flame
} from "lucide-react";

export const allServicesData = [
  {
    title: "1. Census of India (भारत की जनगणना)",
    description: "Access Self Enumeration Online, State Timeline and Question documents for Census of India.",
    tag: "Census",
    icon: HeartPulse,
    subLinks: [
      {
            "title": "Self Enumeration Online",
            "href": "https://se.census.gov.in/"
      },
      {
            "title": "State Timeline",
            "href": "https://se.census.gov.in/assets/SE_Timeline-DNw3u9Tb.pdf"
      },
      {
            "title": "Question",
            "href": "https://se.census.gov.in/assets/SE_Question-DMjMTXHg.pdf"
      }
    ]
  },
  {
    title: "2. Aadhaar Beta Service",
    description: "Aadhaar Beta services including Lock/Unlock Aadhaar, Biometrics, and VID.",
    tag: "Aadhaar",
    icon: CreditCard,
    subLinks: [
      {
            "title": "Official Beta Website",
            "href": "https://myaadhaarbeta.uidai.gov.in/"
      },
      {
            "title": "Lock / Unlock Aadhaar Beta",
            "href": "https://myaadhaarbeta.uidai.gov.in/lock-unlock-aadhaar/en"
      },
      {
            "title": "Lock / Unlock Biometrics Beta",
            "href": "https://tathya.uidai.gov.in/access/login?role=resident"
      },
      {
            "title": "Generate / Retrieve VID Beta",
            "href": "https://myaadhaarbeta.uidai.gov.in/genericGenerateOrRetriveVID/en"
      }
    ]
  },
  {
    title: "3. Aadhaar Information Service",
    description: "All standard Aadhaar services, e-Aadhaar download, PVC card, updates and more.",
    tag: "Aadhaar",
    icon: CreditCard,
    subLinks: [
      {
            "title": "Access Official Aadhaar Portal",
            "href": "https://myaadhaar.uidai.gov.in/verifyAadhaar"
      },
      {
            "title": "Download E-Aadhaar (Official)",
            "href": "https://myaadhaar.uidai.gov.in/genricDownloadAadhaar/en"
      },
      {
            "title": "Face Aadhaar Download",
            "href": "https://akprinthub.com/en/service/aadhaar-card-download-by-face-without-otp-2026"
      },
      {
            "title": "Check Aadhaar Mobile Number Link",
            "href": "https://myaadhaar.uidai.gov.in/check-aadhaar-validity"
      },
      {
            "title": "Find Aadhaar Number / SID",
            "href": "https://myaadhaar.uidai.gov.in/retrieve-eid-uid/en"
      },
      {
            "title": "Find / Generate VID Number",
            "href": "https://myaadhaar.uidai.gov.in/genericGenerateOrRetriveVID/en"
      },
      {
            "title": "Aadhaar Correction Name/DOB/Photo/Mobile",
            "href": "https://play.google.com/store/apps/details?id=in.gov.uidai.pehchaan&pcampaignid=web_share"
      },
      {
            "title": "Adhar Verify Email / Mobile",
            "href": "https://myaadhaar.uidai.gov.in/verify-email-mobile/en"
      },
      {
            "title": "Enrolment & Update Status Check",
            "href": "https://myaadhaar.uidai.gov.in/CheckAadhaarStatus/en"
      },
      {
            "title": "Lock/Unlock Aadhaar",
            "href": "https://myaadhaar.uidai.gov.in/lock-unlock-aadhaar/en"
      },
      {
            "title": "Aadhaar PVC Card Order",
            "href": "https://myaadhaar.uidai.gov.in/genricPVC/en"
      },
      {
            "title": "Check Aadhaar PVC Card Order Status",
            "href": "https://myaadhaar.uidai.gov.in/checkStatus/en"
      },
      {
            "title": "Document Update Online",
            "href": "https://myaadhaar.uidai.gov.in/du/en_IN"
      },
      {
            "title": "Report Death of a Family Member Online",
            "href": "https://tathya.uidai.gov.in/access/login?role=resident"
      },
      {
            "title": "Bank Seeding Status",
            "href": "https://tathya.uidai.gov.in/access/login?role=resident"
      },
      {
            "title": "Aadhaar Deactivation Status",
            "href": "https://myaadhaar.uidai.gov.in/CheckDeathReportStatus/en"
      },
      {
            "title": "Aadhaar Update Appointment Online",
            "href": "https://bookappointment.uidai.gov.in/"
      },
      {
            "title": "Aadhaar SMS Services",
            "href": "https://uidai.gov.in/en/my-aadhaar/avail-aadhaar-services/aadhaar-services-on-sms.html"
      }
    ]
  },
  {
    title: "4. PAN Card Service",
    description: "Online services and links for PAN Card Service.",
    tag: "PAN",
    icon: CreditCard,
    subLinks: [
      { "title": "Mobile & Mail Update (NSDL)", "href": "https://onlineservices.proteantech.in/paam/endUserAddressUpdate.html" },
      { "title": "Address Update Free (NSDL)", "href": "https://onlineservices.proteantech.in/paam/endUserAddressUpdate.html" },
      { "title": "Link Aadhaar Status", "href": "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/link-aadhaar-status" },
      { "title": "Aadhaar to PAN link", "href": "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link-aadhaar" },
      { "title": "New Pan Apply (NSDL)", "href": "https://onlineservices.proteantech.in/paam/endUserRegisterContact.html" },
      { "title": "PAN Correction (NSDL)", "href": "https://onlineservices.proteantech.in/paam/endUserRegisterContact.html" },
      { "title": "E-Pan Download (NSDL)", "href": "https://onlineservices.proteantech.in/paam/requestAndDownloadEPAN.html" },
      { "title": "PAN Track (NSDL)", "href": "https://tin.tin.proteantech.in/pantan/StatusTrack.html" },
      { "title": "Pan Card PVC Order (NSDL)", "href": "https://onlineservices.proteantech.in/paam/ReprintEPan.html" },
      { "title": "Mobile & Mail Update (UTI)", "href": "https://www.pan.utiitsl.com/PAN_ONLINE/addresschangeHome.action" },
      { "title": "Address Update Free (UTI)", "href": "https://www.pan.utiitsl.com/PAN_ONLINE/addresschangeHome.action" },
      { "title": "New Pan Apply (UTI)", "href": "https://www.pan.utiitsl.com/newA.html" },
      { "title": "PAN Correction (UTI)", "href": "https://www.pan.utiitsl.com/PAN/csf.html" },
      { "title": "E-Pan Download (UTI)", "href": "https://www.pan.utiitsl.com/PAN_ONLINE/ePANCardHome" },
      { "title": "PAN Track (UTI)", "href": "https://www.trackpan.utiitsl.com/PANONLINE/forms/TrackPan/trackApp#forward" },
      { "title": "Pan Card PVC Order (UTI)", "href": "https://www.pan.utiitsl.com/PAN_ONLINE/reprintHome.action" },
      { "title": "Instant PAN Apply", "href": "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan/getNewEpan" },
      { "title": "Instant PAN Download", "href": "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan/checkStatusDownloadEpan" },
      { "title": "Instant PAN Check Status", "href": "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan/checkStatusDownloadEpan" },
      { "title": "Minor PAN Apply", "href": "https://onlineservices.proteantech.in/paam/endUserRegisterContact.html" },
      { "title": "PVC PAN/Home Delivery Check Status", "href": "https://www.indiapost.gov.in/home" }
    ]
  },
  {
    title: "5. Voter ID Correction & Service",
    description: "Online services and links for Voter ID Correction & Service.",
    tag: "Voter",
    icon: Vote,
    subLinks: [
      {
            "title": "Voter Registration & Correction",
            "href": "https://voters.eci.gov.in/"
      },
      {
            "title": "Search in Electoral Roll",
            "href": "https://electoralsearch.eci.gov.in/"
      },
      {
            "title": "e-EPIC Download",
            "href": "https://voters.eci.gov.in/"
      }
    ]
  },
  {
    title: "6. Ayushman Bharat (PM-JAY)",
    description: "Online services and links for Ayushman Bharat (PM-JAY).",
    tag: "Health",
    icon: HeartPulse,
    subLinks: [
      {
            "title": "PMJAY Beneficiary Portal",
            "href": "https://beneficiary.nha.gov.in/"
      },
      {
            "title": "Official PMJAY Website",
            "href": "https://pmjay.gov.in/"
      }
    ]
  },
  {
    title: "7. Driving Licence Service",
    description: "Online services and links for Driving Licence Service.",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "Sarathi Parivahan (DL)",
            "href": "https://sarathi.parivahan.gov.in/"
      },
      {
            "title": "Apply Learner Licence",
            "href": "https://sarathi.parivahan.gov.in/"
      },
      {
            "title": "Application Status",
            "href": "https://sarathi.parivahan.gov.in/"
      }
    ]
  },
  {
    title: "8. RC Service (Registration Certificate)",
    description: "Online services and links for RC Service (Registration Certificate).",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "Vahan Parivahan (RC Services)",
            "href": "https://vahan.parivahan.gov.in/"
      },
      {
            "title": "RC Status Check",
            "href": "https://vahan.parivahan.gov.in/"
      }
    ]
  },
  {
    title: "9. Vehicle Service",
    description: "Online services and links for Vehicle Service.",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "Know Your Vehicle Details",
            "href": "https://vahan.parivahan.gov.in/nrservices/faces/user/citizen/citizenlogin.xhtml"
      },
      {
            "title": "Pay Vehicle Tax",
            "href": "https://vahan.parivahan.gov.in/"
      }
    ]
  },
  {
    title: "10. Birth & Death Certificate",
    description: "Online services and links for Birth & Death Certificate.",
    tag: "Certificate",
    icon: Baby,
    subLinks: [
      {
            "title": "CRS Portal (Birth & Death)",
            "href": "https://dc.crsorgi.gov.in/crs/home"
      }
    ]
  },
  {
    title: "11. E-Challan",
    description: "Online services and links for E-Challan.",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "Check E-Challan Status & Pay",
            "href": "https://echallan.parivahan.gov.in/"
      }
    ]
  },
  {
    title: "12. E-Shram Card",
    description: "Online services and links for E-Shram Card.",
    tag: "Labour",
    icon: BadgeCheck,
    subLinks: [
      {
            "title": "E-Shram Portal",
            "href": "https://eshram.gov.in/"
      },
      {
            "title": "Self Registration",
            "href": "https://register.eshram.gov.in/#/user/self"
      }
    ]
  },
  {
    title: "13. APAAR ID Card",
    description: "Online services and links for APAAR ID Card.",
    tag: "Education",
    icon: GraduationCap,
    subLinks: [
      {
            "title": "APAAR/ABC Portal",
            "href": "https://abc.gov.in/"
      }
    ]
  },
  {
    title: "14. ABHA Card (Ayushman Bharat Health Account)",
    description: "Online services and links for ABHA Card (Ayushman Bharat Health Account).",
    tag: "Health",
    icon: HeartPulse,
    subLinks: [
      {
            "title": "Create ABHA Number",
            "href": "https://abha.abdm.gov.in/"
      },
      {
            "title": "ABHA Login",
            "href": "https://abha.abdm.gov.in/"
      }
    ]
  },
  {
    title: "15. Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "Online services and links for Pradhan Mantri Fasal Bima Yojana (PMFBY).",
    tag: "Agriculture",
    icon: Sprout,
    subLinks: [
      {
            "title": "PMFBY Official Portal",
            "href": "https://pmfby.gov.in/"
      },
      {
            "title": "Farmer Corner",
            "href": "https://pmfby.gov.in/farmerRegistrationForm"
      }
    ]
  },
  {
    title: "16. PMAY-Gramin (Pradhan Mantri Awas Yojana-Gramin)",
    description: "Online services and links for PMAY-Gramin (Pradhan Mantri Awas Yojana-Gramin).",
    tag: "Housing",
    icon: Home,
    subLinks: [
      {
            "title": "PMAY-G Official Portal",
            "href": "https://pmayg.nic.in/"
      },
      {
            "title": "AwaasSoft - FTO Tracking",
            "href": "https://pmayg.nic.in/"
      }
    ]
  },
  {
    title: "17. PMAY-Urban/Sehri (Pradhan Mantri Awas Yojana-Urban)",
    description: "Online services and links for PMAY-Urban/Sehri (Pradhan Mantri Awas Yojana-Urban).",
    tag: "Housing",
    icon: Building2,
    subLinks: [
      {
            "title": "PMAY-U Official Portal",
            "href": "https://pmaymis.gov.in/"
      },
      {
            "title": "Search Beneficiary",
            "href": "https://pmaymis.gov.in/Open/Find_Beneficiary_Details.aspx"
      }
    ]
  },
  {
    title: "18. EPFO (Employees’ Provident Fund Organisation)",
    description: "Online services and links for EPFO (Employees’ Provident Fund Organisation).",
    tag: "Finance",
    icon: Landmark,
    subLinks: [
      {
            "title": "EPFO Member e-Sewa",
            "href": "https://unifiedportal-mem.epfindia.gov.in/memberinterface/"
      },
      {
            "title": "EPF Passbook",
            "href": "https://passbook.epfindia.gov.in/MemberPassBook/Login"
      }
    ]
  },
  {
    title: "19. LIC Service (Life Insurance Corporation)",
    description: "Online services and links for LIC Service (Life Insurance Corporation).",
    tag: "Insurance",
    icon: ShieldCheck,
    subLinks: [
      {
            "title": "LIC Official Website",
            "href": "https://licindia.in/"
      },
      {
            "title": "Pay Premium Online",
            "href": "https://licindia.in/pay-premium-online"
      }
    ]
  },
  {
    title: "20. E-NAM (National Agriculture Market)",
    description: "Online services and links for E-NAM (National Agriculture Market).",
    tag: "Agriculture",
    icon: Sprout,
    subLinks: [
      {
            "title": "e-NAM Portal",
            "href": "https://www.enam.gov.in/"
      }
    ]
  },
  {
    title: "21. PM SVANidhi Yojana",
    description: "Online services and links for PM SVANidhi Yojana.",
    tag: "Loan",
    icon: Banknote,
    subLinks: [
      {
            "title": "PM SVANidhi Portal",
            "href": "https://pmsvanidhi.mohua.gov.in/"
      }
    ]
  },
  {
    title: "22. Soil Health Card",
    description: "Online services and links for Soil Health Card.",
    tag: "Agriculture",
    icon: Sprout,
    subLinks: [
      {
            "title": "Soil Health Card Portal",
            "href": "https://soilhealth.dac.gov.in/"
      }
    ]
  },
  {
    title: "23. MKisan Portal",
    description: "Online services and links for MKisan Portal.",
    tag: "Agriculture",
    icon: Sprout,
    subLinks: [
      {
            "title": "MKisan Portal",
            "href": "https://mkisan.gov.in/"
      }
    ]
  },
  {
    title: "24. PM Surya Ghar Yojana (Muft Bijli Yojana)",
    description: "Online services and links for PM Surya Ghar Yojana (Muft Bijli Yojana).",
    tag: "Electricity",
    icon: Zap,
    subLinks: [
      {
            "title": "PM Surya Ghar Portal",
            "href": "https://pmsuryaghar.gov.in/"
      },
      {
            "title": "Apply for Rooftop Solar",
            "href": "https://pmsuryaghar.gov.in/consumerLogin"
      }
    ]
  },
  {
    title: "25. Udyam Aadhaar Service (MSME)",
    description: "Online services and links for Udyam Aadhaar Service (MSME).",
    tag: "MSME",
    icon: Store,
    subLinks: [
      {
            "title": "Udyam Registration",
            "href": "https://udyamregistration.gov.in/"
      },
      {
            "title": "Print / Verify Udyam",
            "href": "https://udyamregistration.gov.in/PrintUdyamCertificate.aspx"
      }
    ]
  },
  {
    title: "26. National Scholarship Portal",
    description: "Online services and links for National Scholarship Portal.",
    tag: "Education",
    icon: GraduationCap,
    subLinks: [
      {
            "title": "NSP Official Portal",
            "href": "https://scholarships.gov.in/"
      }
    ]
  },
  {
    title: "27. Lost/Found Mobile & Internet Service",
    description: "Online services and links for Lost/Found Mobile & Internet Service.",
    tag: "Security",
    icon: ShieldCheck,
    subLinks: [
      {
            "title": "CEIR - Block Stolen Mobile",
            "href": "https://ceir.sancharsaathi.gov.in/"
      },
      {
            "title": "TAFCOP - Check Mobile Connections",
            "href": "https://tafcop.sancharsaathi.gov.in/"
      }
    ]
  },
  {
    title: "28. Railway Service",
    description: "Online services and links for Railway Service.",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "IRCTC NextGen Ticket Booking",
            "href": "https://www.irctc.co.in/"
      },
      {
            "title": "NTES (Train Enquiry)",
            "href": "https://enquiry.indianrail.gov.in/"
      }
    ]
  },
  {
    title: "29. Passport Seva Service",
    description: "Online services and links for Passport Seva Service.",
    tag: "Passport",
    icon: FileText,
    subLinks: [
      {
            "title": "Passport Seva Home",
            "href": "https://www.passportindia.gov.in/"
      },
      {
            "title": "Track Application Status",
            "href": "https://portal2.passportindia.gov.in/AppOnlineProject/statusTracker/trackStatusInpNew"
      }
    ]
  },
  {
    title: "30. PM Kisan (Kisan Samman Nidhi)",
    description: "Online services and links for PM Kisan (Kisan Samman Nidhi).",
    tag: "Agriculture",
    icon: Sprout,
    subLinks: [
      {
            "title": "PM Kisan Portal",
            "href": "https://pmkisan.gov.in/"
      },
      {
            "title": "Know Your Status",
            "href": "https://pmkisan.gov.in/BeneficiaryStatus_New.aspx"
      }
    ]
  },
  {
    title: "31. GST Verification",
    description: "Online services and links for GST Verification.",
    tag: "GST",
    icon: Store,
    subLinks: [
      {
            "title": "Search Taxpayer",
            "href": "https://services.gst.gov.in/services/searchtpbypan"
      }
    ]
  },
  {
    title: "32. Checkpost Tax / Road Tax",
    description: "Online services and links for Checkpost Tax / Road Tax.",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "Checkpost Tax Parivahan",
            "href": "https://vahan.parivahan.gov.in/checkpost/"
      }
    ]
  },
  {
    title: "33. Vahan Green Sewa",
    description: "Online services and links for Vahan Green Sewa.",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "Vahan Green Tax Parivahan",
            "href": "https://vahan.parivahan.gov.in/"
      }
    ]
  },
  {
    title: "34. PUC Service (Pollution Under Control)",
    description: "Online services and links for PUC Service (Pollution Under Control).",
    tag: "Transport",
    icon: Car,
    subLinks: [
      {
            "title": "PUC Certificate Parivahan",
            "href": "https://puc.parivahan.gov.in/"
      }
    ]
  },
  {
    title: "35. National Payments Service",
    description: "Online services and links for National Payments Service.",
    tag: "Finance",
    icon: Banknote,
    subLinks: [
      {
            "title": "NPCI Portal",
            "href": "https://www.npci.org.in/"
      },
      {
            "title": "UPI Information",
            "href": "https://www.npci.org.in/what-we-do/upi/product-overview"
      }
    ]
  },
  {
    title: "36. National Consumer Service",
    description: "Online services and links for National Consumer Service.",
    tag: "Consumer",
    icon: Building2,
    subLinks: [
      {
            "title": "National Consumer Helpline",
            "href": "https://consumerhelpline.gov.in/"
      }
    ]
  },
  {
    title: "37. National Career Service (NCS)",
    description: "Online services and links for National Career Service (NCS).",
    tag: "Job",
    icon: Building2,
    subLinks: [
      {
            "title": "NCS Portal",
            "href": "https://www.ncs.gov.in/"
      },
      {
            "title": "Jobseeker Registration",
            "href": "https://www.ncs.gov.in/_layouts/15/NCSP/Registration.aspx"
      }
    ]
  },
  {
    title: "38. Check Free CIBIL",
    description: "Online services and links for Check Free CIBIL.",
    tag: "Finance",
    icon: Banknote,
    subLinks: [
      {
            "title": "Free CIBIL Score Check",
            "href": "https://www.cibil.com/freecibilscore"
      }
    ]
  },
  {
    title: "39. Indane Gas Service",
    description: "Online services and links for Indane Gas Service.",
    tag: "LPG",
    icon: Flame,
    subLinks: [
      {
            "title": "Indane CX Portal",
            "href": "https://cx.indianoil.in/"
      }
    ]
  },
  {
    title: "40. HP Gas Service",
    description: "Online services and links for HP Gas Service.",
    tag: "LPG",
    icon: Flame,
    subLinks: [
      {
            "title": "My HP Gas",
            "href": "https://myhpgas.in/"
      }
    ]
  },
  {
    title: "41. Bharat Gas Service",
    description: "Online services and links for Bharat Gas Service.",
    tag: "LPG",
    icon: Flame,
    subLinks: [
      {
            "title": "E-Bharat Gas",
            "href": "https://my.ebharatgas.com/"
      }
    ]
  },
  {
    title: "42. Unique Disability ID Card (UDID)",
    description: "Online services and links for Unique Disability ID Card (UDID).",
    tag: "Social",
    icon: HeartPulse,
    subLinks: [
      {
            "title": "Swavlamban Card (UDID)",
            "href": "https://www.swavlambancard.gov.in/"
      }
    ]
  },
  {
    title: "43. Swachh Bharat Mission (शौचालय योजना)",
    description: "Online services and links for Swachh Bharat Mission (शौचालय योजना).",
    tag: "Welfare",
    icon: Home,
    subLinks: [
      {
            "title": "SBM Gramin Portal",
            "href": "https://sbm.gov.in/sbmphase2/extchoice.aspx"
      }
    ]
  },
  {
    title: "44. Fancy Mobile Number",
    description: "Online services and links for Fancy Mobile Number.",
    tag: "Mobile",
    icon: ShieldCheck,
    subLinks: [
      {
            "title": "BSNL CYMN (Choose Your Mobile Number)",
            "href": "https://cymn.bsnl.co.in/"
      },
      {
            "title": "Vi Fancy Number",
            "href": "https://www.myvi.in/new-connection/choose-your-fancy-mobile-numbers-online"
      },
      {
            "title": "Jio Choice Number",
            "href": "https://www.jio.com/selfcare/choice-number/"
      }
    ]
  },
];
