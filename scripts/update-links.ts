import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updates = [
  {
    order: 9,
    title: "9. Vehicle Service",
    links: [
      { title: "Owner Details", href: "https://vahan.parivahan.gov.in/nrservices/faces/user/citizen/citizenlogin.xhtml" },
      { title: "CNG VAHAN/Apply", href: "https://vahan.parivahan.gov.in/cngmaker/vahan/welcome.xhtml#" },
      { title: "CNG Track Application Status", href: "https://vahan.parivahan.gov.in/cngmaker/vahan/user/trackrecord/trackapplicationstatus.xhtml" },
      { title: "Vehicle Fitness Testing Booking", href: "https://services.parivahan.gov.in/AFMS/#/" },
      { title: "Fancy Number Search", href: "https://fancy.parivahan.gov.in/fancy/faces/public/login.xhtml" },
      { title: "Online Payment of National Permit", href: "https://vahan.parivahan.gov.in/npermit/faces/np/jsp/nationalpermit.jsp" },
      { title: "National Permit Check Transaction Chack", href: "https://vahan.parivahan.gov.in/npermit/faces/welcome.jsp" },
      { title: "Check Failed Transactions National Permit", href: "https://vahan.parivahan.gov.in/npermit/faces/welcome.jsp" },
      { title: "Print Permit Receipt", href: "https://vahan.parivahan.gov.in/npermit/faces/np/jsp/printpermitreceipt.jsp" },
      { title: "Dispose Pending Transactions", href: "https://vahan.parivahan.gov.in/npermit/faces/np/jsp/disposependingtransactions.jsp" },
      { title: "Show all Payment Details", href: "https://vahan.parivahan.gov.in/npermit/faces/np/jsp/userpaymenthistory.jsp" },
      { title: "ALL INDIA TOURIST PERMIT", href: "https://vahan.parivahan.gov.in/aitp/faces/state.xhtml" },
      { title: "FASTag Status", href: "https://www.npci.org.in/netcfastag-status" },
    ]
  },
  {
    order: 10,
    title: "10. Birth & Death Certificate",
    links: [
      { title: "All Forms", href: "https://dc.crsorgi.gov.in/assets/download/all_forms_CRS_2019_new.pdf" },
      { title: "MCCD Form", href: "https://dc.crsorgi.gov.in/assets/download/MCCD_Form.pdf" },
      { title: "Public Login", href: "https://dc.crsorgi.gov.in/crs/Auth/general-public" },
      { title: "Official Website", href: "https://dc.crsorgi.gov.in/crs/home" }
    ]
  },
  {
    order: 11,
    title: "11. E-Challan",
    links: [
      { title: "Virtual Court Challan Pay", href: "https://vcourts.gov.in/virtualcourt//index.php" },
      { title: "E-Challan Chack", href: "https://echallan.parivahan.gov.in/index/accused-challan" },
      { title: "E-Challan Pay Status (eTransPgi)", href: "https://vahan.parivahan.gov.in/eTransPgi/transactionStatus" },
      { title: "Vahan PGI", href: "https://vahan.parivahan.gov.in/vahanpgi/faces/ui/transactionStatus.xhtml" }
    ]
  },
  {
    order: 12,
    title: "12. E-Shram Card",
    links: [
      { title: "Eshram Card Apply (Platform Worker)", href: "https://register.eshram.gov.in/#/user/platform-worker-registration" },
      { title: "Eshram Card Apply", href: "https://register.eshram.gov.in/#/user/self" },
      { title: "Eshram Card Download", href: "https://register.eshram.gov.in/#/user/aadhaar-login" },
      { title: "Eshram Card Download(UAN)", href: "https://register.eshram.gov.in/#/user/uan-login" },
      { title: "Eshram Card Number Find", href: "https://register.eshram.gov.in/#/know-your-uan" },
      { title: "Eshram Card CSC Login", href: "https://connect.csc.gov.in/account/authorize?response_type=code&client_id=5896c41e-1fa0-4cf8-be1c-8fb6782053ed&redirect_uri=https://registerapi.eshram.gov.in/csc-service/csclogin&state=531612" }
    ]
  },
  {
    order: 13,
    title: "13. APAAR ID Card",
    links: [
      { title: "New Apply", href: "https://digilocker.meripehchaan.gov.in/signup" },
      { title: "Apaar Login", href: "https://digilocker.meripehchaan.gov.in/" },
      { title: "ABC Portal", href: "https://www.abc.gov.in/" }
    ]
  },
  {
    order: 14,
    title: "14. ABHA Card (Ayushman Bharat Health Account)",
    links: [
      { title: "Abha Card Apply By Aadhaar", href: "https://abha.abdm.gov.in/abha/v3/register/aadhaar" },
      { title: "Abha Card Apply By Driving Licence", href: "https://abha.abdm.gov.in/abha/v3/register/driving-licence" },
      { title: "Abha Card Download", href: "https://abha.abdm.gov.in/abha/v3/login" },
      { title: "Abha Card E-KYC", href: "https://abha.abdm.gov.in/abha/v3/login" },
      { title: "Abha Card Number Find", href: "https://abha.abdm.gov.in/abha/v3/login/recover" },
      { title: "Abha Card Track/Enrolment Number", href: "https://abha.abdm.gov.in/abha/v3/login/track" },
      { title: "Abha Card Login", href: "https://abha.abdm.gov.in/abha/v3/login" }
    ]
  },
  {
    order: 15,
    title: "15. Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    links: [
      { title: "New Farmer Registration", href: "https://pmfby.gov.in/farmerRegistrationForm" },
      { title: "Self Registration", href: "https://pmfby.gov.in/selfRegistration" },
      { title: "Farmer Login", href: "https://pmfby.gov.in/farmerLogin" },
      { title: "Official Website/Self Login", href: "https://pmfby.gov.in/" },
      { title: "Chack Application Status", href: "https://kisansuvidha.gov.in/crop-insurance/application-status" }
    ]
  },
  {
    order: 16,
    title: "16. PMAY-Gramin (Pradhan Mantri Awas Yojana - Rural)",
    links: [
      { title: "Payment/Kist Chack", href: "https://awaassoft.pmayg.dord.gov.in/netiay/Benificiary.aspx" },
      { title: "New List Chack", href: "https://report.pmayg.dord.gov.in//netiay/SocialAuditReport/BeneficiaryDetailForSocialAuditReport.aspx" },
      { title: "Registration No Find", href: "https://report.pmayg.dord.gov.in//netiay/EFMSReport/BenAccountFrozenReport.aspx" },
      { title: "Registration Number List", href: "https://report.pmayg.dord.gov.in//netiay/GISReport/MobileInspectionmultiplemarker.aspx" },
      { title: "New Rural Housing Report", href: "https://rhreporting.nic.in/netiay/SocialAuditReport/BeneficiaryDetailForSocialAuditReport.aspx" },
      { title: "Search Beneficiary Details", href: "https://awaassoft.pmayg.dord.gov.in/netiay/Benificiary.aspx" },
      { title: "FTO Tracking Rural", href: "https://awaassoft.pmayg.dord.gov.in/netiay/fto_transaction_details.aspx" }
    ]
  },
  {
    order: 17,
    title: "17. PMAY-Urban/Sehri (Pradhan Mantri Awas Yojana - Urban)",
    links: [
      { title: "PMAY New Apply-Urban", href: "https://pmaymis.gov.in/pmaymis2_2024/PMAY_SURVEY/EligiblityCheck.aspx" },
      { title: "Track Assessment Status-Urban", href: "https://pmaymis.gov.in/track_application_status.aspx" },
      { title: "Track SURVEY-Urban", href: "https://pmaymis.gov.in/pmaymis2_2024/PMAY_SURVEY/TrackApplication.aspx" },
      { title: "PMAY Check-Eligibility-Urban", href: "https://rules.myscheme.gov.in/check-eligibility/pmay-u?source=umang" },
      { title: "Scheme Guidelines Hindi/English", href: "https://pmaymis.gov.in/PMAYMIS2_2024/scheme-guidelines.html" }
    ]
  },
  {
    order: 18,
    title: "18. EPFO (Employee' Provident Fund)",
    links: [
      { title: "UAN Login Employees (EPFO)", href: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/" },
      { title: "EPF Passbook (EPFO)", href: "https://passbook.epfindia.gov.in/MemberPassBook/login" },
      { title: "Find UAN (EPFO)", href: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/error.jsp" }
    ]
  },
  {
    order: 19,
    title: "19. LIC Service (Life Insurance Corporation)",
    links: [
      { title: "Premium Payment (LIC)", href: "https://ebiz.licindia.in/D2CPM/?_ga=2.190531880.282316276.1769363433-1306570652.1768914394#DirectPay" },
      { title: "Buy Insurance Policies Online (LIC)", href: "https://licindia.in/buy-online" },
      { title: "Customer Portal Login (LIC)", href: "https://ebiz.licindia.in/D2CPM/?&_ga=2.144269494.282316276.1769363433-1306570652.1768914394#Login" }
    ]
  },
  {
    order: 20,
    title: "20. E-NAM (National Agriculture Market)",
    links: [
      { title: "E-NAM Registration", href: "https://enam.gov.in/web/Enam_ctrl/enam_registration" },
      { title: "Login (E-Nam)", href: "https://enam.gov.in/NAMV2/faces/infrastructure/SLogin.jsf;jsessionid=zkIY3nbN9U11EStw3bJ1QNJq.undefined" },
      { title: "Price Details (E-Nam)", href: "https://enam.gov.in/web/dashboard/trade-data" },
      { title: "Beta E-NAM Registration", href: "https://beta.enam.gov.in/register" },
      { title: "Beta E-NAM Login", href: "https://beta.enam.gov.in/login" }
    ]
  },
  {
    order: 21,
    title: "21. PM SVANidhi Yojana",
    links: [
      { title: "Apply Loan", href: "https://www.pmsvanidhi.mohua.gov.in/LoginLoRCumLoan" },
      { title: "Apply For 15,000 Loan", href: "https://www.pmsvanidhi.mohua.gov.in/Login" },
      { title: "Apply For 25,000 Loan", href: "https://www.pmsvanidhi.mohua.gov.in/LoginSecondLoanTerm" },
      { title: "Apply For 50,000 Loan", href: "https://www.pmsvanidhi.mohua.gov.in/LoginThirdLoanTerm" },
      { title: "Apply Credit Card", href: "https://www.pmsvanidhi.mohua.gov.in/Login?flag=ApplicantLogin" },
      { title: "Application Status", href: "https://www.pmsvanidhi.mohua.gov.in/Home/Search" },
      { title: "Applicant Login", href: "https://www.pmsvanidhi.mohua.gov.in/Login?flag=ApplicantLogin" },
      { title: "ULB Transfer Request", href: "https://www.pmsvanidhi.mohua.gov.in/Login/UlbTransferIndex" },
      { title: "Update Mobile", href: "https://www.pmsvanidhi.mohua.gov.in/Home/MobileUpdate" }
    ]
  },
  {
    order: 22,
    title: "22. Soil Health Card",
    links: [
      { title: "User Registration", href: "https://soilhealth.dac.gov.in/admin/app/userRegistration" },
      { title: "User Login", href: "https://soilhealth.dac.gov.in/admin/" },
      { title: "Account Registration For Ticket", href: "https://support.soilhealth.dac.gov.in/account.php?do=create" },
      { title: "Check Ticket Status", href: "https://support.soilhealth.dac.gov.in/view.php" },
      { title: "Find Soil Testing Labs", href: "https://soilhealth.dac.gov.in/soilTestingLabs" }
    ]
  },
  {
    order: 23,
    title: "23. MKisan Portal",
    links: [
      { title: "Registration for KSEWA (mKisan)", href: "https://mkisan.gov.in/Home/RegisterForKsewa" },
      { title: "KSewa Login (mKisan)", href: "https://mkisan.gov.in/Home/LoginForKSewa" },
      { title: "Farmer Registration (mKisan)", href: "https://mkisan.gov.in/Home/FarmerRegistration" },
      { title: "Login Registration (mKisan)", href: "https://mkisan.gov.in/Home/Login" }
    ]
  },
  {
    order: 24,
    title: "24. PM Surya Ghar Yojana (Muft Bijli Yojana)",
    links: [
      { title: "Apply", href: "https://pmsuryaghar.gov.in/#/consumer-how-to-apply" },
      { title: "Benefits Details", href: "https://pmsuryaghar.gov.in/#/benefits" },
      { title: "Consumer Financing Options", href: "https://pmsuryaghar.gov.in/#/consumer-financing-options" },
      { title: "Find Registered Vendors", href: "https://pmsuryaghar.gov.in/#/registered-vendors" },
      { title: "Apply/Login", href: "https://consumer.pmsuryaghar.gov.in/consumer/#/login" },
      { title: "Vendor Registration", href: "https://vendor.pmsuryaghar.gov.in/vendor/#/vendor-register" },
      { title: "Vendor Financing Options", href: "https://pmsuryaghar.gov.in/#/vendor-financing-options" }
    ]
  },
  {
    order: 25,
    title: "25. Udyam Aadhaar Service (MSME)",
    links: [
      { title: "UDYAM REGISTRATION (MSME)", href: "https://udyamregistration.gov.in/UdyamRegistration.aspx" },
      { title: "Print UAM Certificate", href: "https://udyamregistration.gov.in/UA/PrintAcknowledgement_Pub.aspx" },
      { title: "Print Udyam Certificate (MSME)", href: "https://udyamregistration.gov.in/Udyam_Login.aspx" },
      { title: "Verify Udyog Aadhaar", href: "https://udyamregistration.gov.in/UA/UA_VerifyUAM.aspx" },
      { title: "Print UAM Application", href: "https://udyamregistration.gov.in/UA/PrintApplication_Pub.aspx" },
      { title: "Verify Udyam Registration Number (MSME)", href: "https://udyamregistration.gov.in/Default.aspx" },
      { title: "FIND UAM/UDYAM REGISTRATION NUMBER", href: "https://udyamregistration.gov.in/UAM-convert-udyam-msme-free-registration.htm" },
      { title: "Update/Cancel Udyam Registration", href: "https://udyamregistration.gov.in/Udyam_Login.aspx" },
      { title: "UDYAM REGISTRATION-Already having...", href: "https://udyamregistration.gov.in/UdyamRegistrationExist.aspx" },
      { title: "UDYAM REGISTRATION-For those already...", href: "https://udyamregistration.gov.in/Udyam_AssistedMigration.aspx" }
    ]
  },
  {
    order: 26,
    title: "26. National Scholarship Portal (NSP)",
    links: [
      { title: "Self Registration (NSP)", href: "https://scholarships.gov.in/otrapplication/#/" },
      { title: "Find Your OTR (NSP)", href: "https://akprinthub.com/en/#" },
      { title: "Portal Login (NSP)", href: "https://scholarships.gov.in/otrapplication/#/login-page" },
      { title: "Change Mobile Number (NSP)", href: "https://scholarships.gov.in/otrapplication/#/changemobile" },
      { title: "Track Your Payment (NSP)", href: "https://pfms.nic.in/SitePages/KnowYourPayment_Dw_NewNew.aspx" },
      { title: "Check UDID Details", href: "https://swavlambancard.gov.in/login" },
      { title: "CSC Login Manger (NSP)", href: "https://connect.csc.gov.in/account/authorize?response_type=code&client_id=3cf34d84-3802-4695-e800-4bbe9e5fd908&redirect_uri=https%3A%2F%2Fscholarships.gov.in%2Fotrprod%2Floginprocess&state=1769168581168" },
      { title: "Schemes Details (NSP)", href: "https://scholarships.gov.in/All-Scholarships" }
    ]
  },
  {
    order: 27,
    title: "27. Lost/Found Mobile & Internet",
    links: [
      { title: "IMEI Verification", href: "https://ceir.sancharsaathi.gov.in/Device/CeirImeiVerification.jsp" },
      { title: "Blocking Lost/Stolen Mobile", href: "https://ceir.sancharsaathi.gov.in/Request/CeirUserBlockRequestDirect.jsp" },
      { title: "Un-Blocking Recovered/Found Mobile", href: "https://ceir.sancharsaathi.gov.in/Request/CeirUserUnblockRequestDirect.jsp" },
      { title: "Find Request ID", href: "https://ceir.sancharsaathi.gov.in/Request/CeirRequestRecover.jsp" },
      { title: "Know Mobile Connections in Your Name", href: "https://tafcop.sancharsaathi.gov.in/telecomUser/" },
      { title: "Check lost/stolen Mobile Status", href: "https://ceir.sancharsaathi.gov.in/Request/CeirUserBlockRequestDirect.jsp" },
      { title: "Find Duplicate Mobile & Stolen Phone", href: "https://ceir.sancharsaathi.gov.in/Device/SancharSaathiKym.jsp" },
      { title: "Find Wireline Internet Service Providers", href: "https://sancharsaathi.gov.in/KnowYourIsp/display-isps.jsp" },
      { title: "Report Incoming International Call With India...", href: "https://sancharsaathi.gov.in/InternationalCall/ReportIntCall.jsp" },
      { title: "Trusted Contact Details", href: "https://sancharsaathi.gov.in/FinancialInstitutions/fiHome.jsp" }
    ]
  },
  {
    order: 28,
    title: "28. Railway Service",
    links: [
      { title: "PNR Check", href: "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en" },
      { title: "Train Check", href: "https://www.indianrail.gov.in/enquiry/TBIS/TrainBetweenImportantStations.html?locale=en" },
      { title: "Train Seat Check", href: "https://www.indianrail.gov.in/enquiry/SEAT/SeatAvailability.html?locale=en" },
      { title: "Fare Enquiry", href: "https://www.indianrail.gov.in/enquiry/FARE/FareEnquiry.html?locale=en" },
      { title: "Train Number Track", href: "https://www.indianrail.gov.in/enquiry/SCHEDULE/TrainSchedule.html?locale=en" }
    ]
  },
  {
    order: 29,
    title: "29. Passport Seva Service",
    links: [
      { title: "Passport Login", href: "https://services2.passportindia.gov.in/forms/PreLogin?_gl=1%2A11j4v5y%2A_ga%2AMTA0NTExMTA5Ni4xNzY5MDkwOTI5%2A_ga_B4255W3J9F%2AczE3NjkwOTA5MjgkbzEkZzEkdDE3NjkwOTE1NDQkajU2JGwwJGgw%2A_ga_JTJJBP5DNH%2AczE3NjkwOTA5MjgkbzEkZzEkdDE3NjkwOTE1NDQkajU2JGwwJGgw" },
      { title: "User Registration", href: "https://services2.passportindia.gov.in/forms/registration?_gl=1%2A1f6hnzg%2A_ga%2AMTA0NTExMTA5Ni4xNzY5MDkwOTI5%2A_ga_B4255W3J9F%2AczE3NjkwOTA5MjgkbzEkZzEkdDE3NjkwOTEyNjEkajI2JGwwJGgw%2A_ga_JTJJBP5DNH%2AczE3NjkwOTA5MjgkbzEkZzEkdDE3NjkwOTEyNjEkajI2JGwwJGgw" },
      { title: "Apply Passport", href: "https://www.passportindia.gov.in/psp/ApplyPassport" },
      { title: "Check Passport Appointment Availability", href: "https://www.passportindia.gov.in/psp/checkAppointmentAvailibility" },
      { title: "Track Passport Application Status", href: "https://www.passportindia.gov.in/psp/trackApplicationService" },
      { title: "Passport Police Clearance Certificate", href: "https://www.passportindia.gov.in/psp/ApplyPCC" },
      { title: "Annexures/Affidavits Forms", href: "https://www.passportindia.gov.in/psp/Annexures" }
    ]
  },
  {
    order: 30,
    title: "30. PM Kisan (Kisan Samman Nidhi Yojana)",
    links: [
      { title: "PM Kisan Status Chack", href: "https://pmkisan.gov.in/BeneficiaryStatus_New.aspx" },
      { title: "Find Registration Number (PM kisan)", href: "https://pmkisan.gov.in/KnowYour_Registration.aspx" },
      { title: "PM Kisan New Farm Apply", href: "https://pmkisan.gov.in/RegistrationFormupdated.aspx" },
      { title: "Update Farm (PM Kisan)", href: "https://pmkisan.gov.in/SearchSelfRegisterfarmerDetailsnewUpdated.aspx" },
      { title: "PM Kisan Status Chack (CSC)", href: "https://pmkisan.gov.in/FarmerStatus.aspx" },
      { title: "Update of Missing Beneficiary Information (PM Kisan)", href: "https://pmkisan.gov.in/SearchBeneficiaryInformationUpdate.aspx" },
      { title: "Update Mobile Number (PM Kisan)", href: "https://pmkisan.gov.in/ErrorPage.aspx?status=404" },
      { title: "Recovery Form Ineligible Farmer (PM Kisan)", href: "https://pmkisan.gov.in/Recovery_Public.aspx" },
      { title: "PM Kisan KYC", href: "https://play.google.com/store/apps/details?id=com.nic.project.pmkisan" }
    ]
  },
  {
    order: 31,
    title: "31. GST Verification",
    links: [
      { title: "Find GST Number", href: "https://services.gst.gov.in/services/searchtpbypan" },
      { title: "Search by PAN", href: "https://services.gst.gov.in/services/searchtpbypan" },
      { title: "Search by GSTIN/UIN", href: "https://services.gst.gov.in/services/searchtp" },
      { title: "Search Taxpayer", href: "https://services.gst.gov.in/services/listoftaxpayer" },
      { title: "New GST Apply", href: "https://reg.gst.gov.in/registration/" },
      { title: "Track GST Application Status", href: "https://services.gst.gov.in/services/arnstatus" },
      { title: "Create Challan Payment", href: "https://payment.gst.gov.in/payment/" },
      { title: "Track Challan Payment Status", href: "https://payment.gst.gov.in/payment/trackpayment" },
      { title: "Track Refund Application Status", href: "https://services.gst.gov.in/services/trackstatus" }
    ]
  },
  {
    order: 32,
    title: "32. Checkpost Tax/Road Tax",
    links: [
      { title: "Checkpost Tax/Road Tax", href: "https://parivahan.gov.in/en/node/579" }
    ]
  },
  {
    order: 33,
    title: "33. Vahan Green Sewa",
    links: [
      { title: "Vahan Green Sewa Apply", href: "https://vahan.parivahan.gov.in/vahangreensewa/vahan/application.xhtml" },
      { title: "Vahan Green Sewa Track Application Status", href: "https://vahan.parivahan.gov.in/vahangreensewa/vahan/user/trackrecord/trackapplicationstatus.xhtml" }
    ]
  },
  {
    order: 34,
    title: "34. PUC Service (Pollution Under Control)",
    links: [
      { title: "PUC Certificate Download", href: "https://puc.parivahan.gov.in/puc/views/PucCertificate.xhtml" },
      { title: "Register PUC Center", href: "https://puc.parivahan.gov.in/puc/views/RegisterUser.xhtml" },
      { title: "PUC Center Documents Upload", href: "https://puc.parivahan.gov.in/puc/views/UploadDocuments.xhtml" },
      { title: "PUC Application Slip Download", href: "https://puc.parivahan.gov.in/puc/views/ApplicationSlip.xhtml" },
      { title: "Active PUC Center List", href: "https://puc.parivahan.gov.in/puc/views/PUCCenterList.xhtml" }
    ]
  },
  {
    order: 35,
    title: "35. National Payments Corporation of India (NPCI)",
    links: [
      { title: "Bank To Aadhaar Link", href: "https://www.npci.org.in/" },
      { title: "UPI Complaint Online", href: "https://www.npci.org.in/upi-complaint" },
      { title: "Other Product Complaint", href: "https://www.npci.org.in/complaint-register" },
      { title: "Find an ATM", href: "https://www.npci.org.in/find-atm" },
      { title: "UPI AutoPay block", href: "https://www.upihelp.npci.org.in/" }
    ]
  },
  {
    order: 36,
    title: "36. National Consumer Helpline (NCH)",
    links: [
      { title: "Register Grievance (NCH)", href: "https://consumerhelpline.gov.in/user/signup.php" },
      { title: "Track Your Grievance (NCH)", href: "https://consumerhelpline.gov.in/user/track-complaint.php" },
      { title: "Upload Documents (NCH)", href: "https://consumerhelpline.gov.in/user/upload-docs.php" }
    ]
  },
  {
    order: 37,
    title: "37. National Career Service (NCS)",
    links: [
      { title: "Register All Type (NCS)", href: "https://www.ncs.gov.in/_layouts/15/NCSP/Registration.aspx" },
      { title: "Login (NCS)", href: "https://www.ncs.gov.in/_layouts/15/ncsp/user-management/login.aspx" },
      { title: "Main Website (NCS)", href: "https://betacloud.ncs.gov.in/" }
    ]
  },
  {
    order: 38,
    title: "38. Check Free CIBIL Score",
    links: [
      { title: "Check Free CIBIL Score", href: "https://creditreport.paisabazaar.com/credit-report/apply?utm_source=google_brand_PB&utm_medium=ppc0paisabazaar&utm_term=%2Bpaisa%20%2Bbazaar%20%2Bcredit%20%2Breport&utm_campaign=Brand_Paisabazaar_CS00Credit_Report_BMM&Campaign=771973089&Adgroupid=42157700802&Loc_Phys=9145435&Matchtype=b&Network=g&Device=c&Gclid=Cj0KCQiAm9fLBhCQARIsAJoNOcs8Zb0keWDrT4YdgNI-aWBTPxZaDojfVFcT4I31MRTWhRoqexszdn8aAj99EALw_wcB&Keyword=%2Bpaisa%20%2Bbazaar%20%2Bcredit%20%2Breport&gad_source=1&gad_campaignid=771973089&gbraid=0AAAAAD6Afaa3C9U_vmff6TyMZjI221O6r&gclid=Cj0KCQiAm9fLBhCQARIsAJoNOcs8Zb0keWDrT4YdgNI-aWBTPxZaDojfVFcT4I31MRTWhRoqexszdn8aAj99EALw_wcB" }
    ]
  },
  {
    order: 39,
    title: "39. INDANE GAS",
    links: [
      { title: "Check Gas Subsidy", href: "https://cx.indianoil.in/EPICIOCL/faces/GrievanceMainPage.jspx;jsessionid=h3t-a1ebwk35G8_YgcgC_Njh2Nwn0brj00fFnlzeCy-0NYfWOYRR!565756962" },
      { title: "Give up Subsidy", href: "https://cx.indianoil.in/webcenter/portal/LPG/pages_giveupsubsidyvoluntarilylpgservice" },
      { title: "Online Application Ujjwala", href: "https://cx.indianoil.in/webcenter/portal/LPG/pages_lpgservicenewconnection" },
      { title: "Find Your LPG ID", href: "https://cx.indianoil.in/webcenter/portal/LPG/pages_findyourlpgid" },
      { title: "User Login", href: "https://access.ex.indianoil.in/oam/server/obrareq.cgi?encquery%3D9sFgx6dEnp9qPU73sCNqKXlTGxXNCEsEXhNW3rz2YxmymG3gkuI8a5AjedKud6RX1UcIsyWzC0%2FRiKpzuYL67NMmMiWTZ1avUkeAUZVnt1GXhL8Y%2F0RkK3Va5uRE1cCXP68VCqhs3P5kDJCsY9%2BwT%2BE8%2BYi6%2FBt9Rn02AasNyVUfxch0qnYw2pEvzqhckAeYuqPcFdqSuL4LOwgnggPMBVfk7q6aAMEY0etPNclg1OuLF3Km7QyEMIy250gRhAfvt0K%2BJ%2FHwc8Nzwx9XusjpQpiP%2BfiI%2FjgnYP1uKnb2byz%2FA5oEhVrQUJGC90BJJf140guYMUhhkJU%2Bg1JsVenfog%3D%3D%20agentid%3DWebcenter_CX%20ver%3D1%20crmethod%3D2&ECID-Context=1.006KMBe9FviBx0o5oVT4iY002sfH015R78%3BkXjE" },
      { title: "User Register", href: "https://cx.indianoil.in/webcenter/portal/Customer/pages_cxregistration" },
      { title: "INDANE GAS Official Website", href: "https://cx.indianoil.in/webcenter/portal/LPG/pages_lpgservices" },
      { title: "PMUY Official Website", href: "https://pmuy.gov.in/mylpg.html" },
      { title: "KYC APP For Android", href: "https://play.google.com/store/apps/details?id=cx.indianoil.in" },
      { title: "Face RD App", href: "https://play.google.com/store/apps/details?id=in.gov.uidai.facerd" },
      { title: "KYC Video Hindi", href: "https://www.pmuy.gov.in//videos/IOCL_Hindi.mp4" },
      { title: "New KYC Form", href: "https://pmuy.gov.in/docs/KYC.pdf" },
      { title: "DBTL Form", href: "https://pmuy.gov.in/docs/unified_form-DBTL.pdf" }
    ]
  },
  {
    order: 40,
    title: "40. HP GAS",
    links: [
      { title: "Book Cylinder", href: "https://myhpgas.in/myHPGas/HPGas/BookRefill.aspx" },
      { title: "Book & Pay Online", href: "https://myhpgas.in/myHPGas/QuickPay.aspx" },
      { title: "Check Gas Subsidy", href: "https://myhpgas.in/myHPGas/HPGas/OptOutSubsidy.aspx" },
      { title: "Locate Distributor", href: "https://myhpgas.in/myHPGas/HPGas/LocateDistributor.aspx" },
      { title: "Find Your LPG ID", href: "https://myhpgas.in/myHPGas/HPGas/FindYourLPGID.aspx" },
      { title: "Online Application Ujjwala", href: "https://myhpgas.in/myHPGas/NewConsumerRegistration.aspx" },
      { title: "New User SignUp", href: "https://myhpgas.in/myHPGas/HPGas/SignUp.aspx" },
      { title: "User Login", href: "https://myhpgas.in/myHPGas/PortalLogin.aspx" },
      { title: "HP GAS Official Website", href: "https://myhpgas.in/myHPGas/HPGas/LPGservices.aspx" },
      { title: "PMUY Official Website", href: "https://pmuy.gov.in/mylpg.html" },
      { title: "KYC APP For Android", href: "https://play.google.com/store/apps/details?id=com.drivetrackplusrefuel" },
      { title: "Face RD App", href: "https://play.google.com/store/apps/details?id=in.gov.uidai.facerd" },
      { title: "KYC Video Hindi", href: "https://www.pmuy.gov.in/videos/hpcl_hindi.mp4" },
      { title: "DBTL Form", href: "https://pmuy.gov.in/docs/unified_form-DBTL.pdf" },
      { title: "New KYC Form", href: "https://pmuy.gov.in/docs/KYC.pdf" }
    ]
  },
  {
    order: 41,
    title: "41. BHARAT GAS",
    links: [
      { title: "BOOK CYLINDER", href: "https://my.ebharatgas.com/Downtime/Index" },
      { title: "Book & Pay Online", href: "https://my.ebharatgas.com/QuickBook/BookAndPay?source=MB" },
      { title: "Check Gas Subsidy", href: "https://my.ebharatgas.com/GiveUpSubsidy/Index" },
      { title: "Online Application Ujjwala", href: "https://my.ebharatgas.com/bharatgas/LPGServices/ApplyUjjwala2Connection" },
      { title: "Find Your LPG ID", href: "https://my.ebharatgas.com/Downtime/Index" },
      { title: "Bharat Gas Official Website", href: "https://my.ebharatgas.com/LPGservices/index" },
      { title: "PMUY Official Website", href: "https://pmuy.gov.in/mylpg.html" },
      { title: "KYC APP For Android", href: "https://play.google.com/store/apps/details?id=com.cgt.bharatgas" },
      { title: "Face RD App", href: "https://play.google.com/store/apps/details?id=in.gov.uidai.facerd" },
      { title: "KYC Video Hindi", href: "https://www.pmuy.gov.in/videos/bharat_gas_hindi.mp4" },
      { title: "New KYC Form", href: "https://pmuy.gov.in/docs/KYC.pdf" },
      { title: "DBTL Form", href: "https://pmuy.gov.in/docs/unified_form-DBTL.pdf" }
    ]
  },
  {
    order: 42,
    title: "42. Unique Disability ID Card",
    links: [
      { title: "Apply Online", href: "https://swavlambancard.gov.in/Applyforudid" },
      { title: "Track Application", href: "https://swavlambancard.gov.in/track-your-application" },
      { title: "Login", href: "https://swavlambancard.gov.in/login" },
      { title: "Official Website", href: "https://swavlambancard.gov.in/" }
    ]
  },
  {
    order: 43,
    title: "43. Swachh Bharat Mission (शौचालय योजना)",
    links: [
      { title: "Apply Online", href: "https://sbm.gov.in/SBM_DBT/Secure/DBT/DBT_Registration.aspx" },
      { title: "Login", href: "https://sbm.gov.in/sbm_dbt/secure/login.aspx" },
      { title: "Track Application Status", href: "https://sbm.gov.in/sbm_dbt/secure/login.aspx" }
    ]
  },
  {
    order: 44,
    title: "44. Fancy Mobile Number",
    links: [
      { title: "Jio Fancy/VIP Mobile Number", href: "https://www.jio.com/selfcare/choice-number/" },
      { title: "Airtel Fancy/VIP Mobile Number", href: "https://www.airtel.in/blog/postpaid/fancy-phone-number-with-postpaid-sim-connection/" },
      { title: "Vi Fancy/VIP Mobile Number", href: "https://www.myvi.in/new-connection/choose-your-fancy-mobile-numbers-online" }
    ]
  }
];

async function updateLinks() {
  for (const update of updates) {
    let category = await prisma.onlineServiceCategory.findFirst({
      where: { order: update.order }
    });

    if (category) {
      await prisma.onlineServiceCategory.update({
        where: { id: category.id },
        data: { title: update.title }
      });

      await prisma.onlineServiceLink.deleteMany({
        where: { categoryId: category.id }
      });

      let linkOrder = 1;
      for (const link of update.links) {
        await prisma.onlineServiceLink.create({
          data: {
            categoryId: category.id,
            title: link.title,
            href: link.href,
            order: linkOrder
          }
        });
        linkOrder++;
      }
      console.log(`Updated category ${update.order} - ${update.title} with ${update.links.length} links.`);
    } else {
      console.log(`Category order ${update.order} not found! Skipping.`);
    }
  }
  console.log("All updates completed.");
}

updateLinks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
