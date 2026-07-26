import { z } from "zod";

export const biharRationKaSchema = z.object({
  // Basic Details
  applicantName: z.string().min(1, "आवेदक का नाम आवश्यक है"),
  aadhaarNo: z.string().min(12, "आधार नंबर 12 अंकों का होना चाहिए").max(12),
  mobileNo: z.string().min(10, "मोबाइल नंबर 10 अंकों का होना चाहिए").max(10),
  fatherHusbandName: z.string().min(1, "पिता/पति का नाम आवश्यक है"),
  fullAddress: z.string().min(1, "पूर्ण आवासीय पता आवश्यक है"),
  
  // Bank Details
  bankIfsc: z.string().min(1, "IFSC कोड आवश्यक है"),
  bankAccountNo: z.string().min(1, "खाता संख्या आवश्यक है"),
  bankName: z.string().min(1, "बैंक का नाम आवश्यक है"),

  // Family Details
  familyMembers: z.array(z.object({
    name: z.string(),
    fatherHusbandName: z.string(),
    gender: z.string(),
    age: z.string(),
    maritalStatus: z.string(),
    relation: z.string(),
    aadhaar: z.string(),
    mobile: z.string(),
    occupation: z.string(),
    incomeSource: z.string(),
    monthlyIncome: z.string()
  })),

  // Area Type (to determine which section to show/fill)
  areaType: z.enum(["RURAL", "URBAN"]).optional(),

  // Rural Declarations (Section 10)
  rural_motorVehicle: z.enum(["Yes", "No"]).optional(),
  rural_agriMachine: z.enum(["Yes", "No"]).optional(),
  rural_nonAgriEnterprise: z.enum(["Yes", "No"]).optional(),
  rural_incomeAbove10k: z.enum(["Yes", "No"]).optional(),
  rural_incomeTaxPayee: z.enum(["Yes", "No"]).optional(),
  rural_commercialTaxPayee: z.enum(["Yes", "No"]).optional(),
  rural_puccaHouse3Rooms: z.enum(["Yes", "No"]).optional(),
  rural_irrigation2_5Acres: z.enum(["Yes", "No"]).optional(),
  rural_irrigation5Acres: z.enum(["Yes", "No"]).optional(),
  rural_irrigation7_5Acres: z.enum(["Yes", "No"]).optional(),
  rural_govtService: z.enum(["Yes", "No"]).optional(),
  // If govt service Yes:
  rural_govtServiceDetails: z.object({
    serviceName: z.string().optional(),
    postName: z.string().optional(),
    monthlyIncome: z.string().optional()
  }).optional(),

  // Urban Declarations (Section 11)
  urban_incomeTaxPayee: z.enum(["Yes", "No"]).optional(),
  urban_govtService: z.enum(["Yes", "No"]).optional(),
  // If govt service Yes:
  urban_govtServiceDetails: z.object({
    serviceName: z.string().optional(),
    postName: z.string().optional(),
    monthlyIncome: z.string().optional()
  }).optional(),
  urban_commercialTaxPayee: z.enum(["Yes", "No"]).optional(),
  urban_puccaHouse3Rooms: z.enum(["Yes", "No"]).optional(),
  urban_incomeAbove20k: z.enum(["Yes", "No"]).optional(),
  urban_twoWheelerAndFridgeAndWash: z.enum(["Yes", "No"]).optional(),
  urban_fourWheeler: z.enum(["Yes", "No"]).optional(),
  urban_washingMachine: z.enum(["Yes", "No"]).optional(),

  // Miscellaneous
  photoBase64: z.string().optional(), // for applicant photo
  signatureBase64: z.string().optional(), // for applicant signature
  date: z.string().optional(),
  place: z.string().optional()
});

export type BiharRationKaData = z.infer<typeof biharRationKaSchema>;

export const biharRationKaConfig = {
  title: "Prapatra Ka (New Ration Card)",
  description: "Official application form for a new Ration Card in Bihar.",
  defaultValues: {
    applicantName: "",
    aadhaarNo: "",
    mobileNo: "",
    fatherHusbandName: "",
    fullAddress: "",
    bankIfsc: "",
    bankAccountNo: "",
    bankName: "",
    familyMembers: [{
      name: "",
      fatherHusbandName: "",
      gender: "",
      age: "",
      maritalStatus: "",
      relation: "",
      aadhaar: "",
      mobile: "",
      occupation: "",
      incomeSource: "",
      monthlyIncome: ""
    }],
    areaType: "" as any,
    rural_motorVehicle: "" as any,
    rural_agriMachine: "" as any,
    rural_nonAgriEnterprise: "" as any,
    rural_incomeAbove10k: "" as any,
    rural_incomeTaxPayee: "" as any,
    rural_commercialTaxPayee: "" as any,
    rural_puccaHouse3Rooms: "" as any,
    rural_irrigation2_5Acres: "" as any,
    rural_irrigation5Acres: "" as any,
    rural_irrigation7_5Acres: "" as any,
    rural_govtService: "" as any,
    rural_govtServiceDetails: { serviceName: "", postName: "", monthlyIncome: "" },
    urban_incomeTaxPayee: "" as any,
    urban_govtService: "" as any,
    urban_govtServiceDetails: { serviceName: "", postName: "", monthlyIncome: "" },
    urban_commercialTaxPayee: "" as any,
    urban_puccaHouse3Rooms: "" as any,
    urban_incomeAbove20k: "" as any,
    urban_twoWheelerAndFridgeAndWash: "" as any,
    urban_fourWheeler: "" as any,
    urban_washingMachine: "" as any,
    date: new Date().toLocaleDateString('en-GB'),
    place: ""
  }
};
