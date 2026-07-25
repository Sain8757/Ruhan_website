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
  areaType: z.enum(["RURAL", "URBAN"]),

  // Rural Declarations (Section 10)
  rural_motorVehicle: z.enum(["Yes", "No"]),
  rural_agriMachine: z.enum(["Yes", "No"]),
  rural_nonAgriEnterprise: z.enum(["Yes", "No"]),
  rural_incomeAbove10k: z.enum(["Yes", "No"]),
  rural_incomeTaxPayee: z.enum(["Yes", "No"]),
  rural_commercialTaxPayee: z.enum(["Yes", "No"]),
  rural_puccaHouse3Rooms: z.enum(["Yes", "No"]),
  rural_irrigation2_5Acres: z.enum(["Yes", "No"]),
  rural_irrigation5Acres: z.enum(["Yes", "No"]),
  rural_irrigation7_5Acres: z.enum(["Yes", "No"]),
  rural_govtService: z.enum(["Yes", "No"]),
  // If govt service Yes:
  rural_govtServiceDetails: z.object({
    serviceName: z.string().optional(),
    postName: z.string().optional(),
    monthlyIncome: z.string().optional()
  }).optional(),

  // Urban Declarations (Section 11)
  urban_incomeTaxPayee: z.enum(["Yes", "No"]),
  urban_govtService: z.enum(["Yes", "No"]),
  // If govt service Yes:
  urban_govtServiceDetails: z.object({
    serviceName: z.string().optional(),
    postName: z.string().optional(),
    monthlyIncome: z.string().optional()
  }).optional(),
  urban_commercialTaxPayee: z.enum(["Yes", "No"]),
  urban_puccaHouse3Rooms: z.enum(["Yes", "No"]),
  urban_incomeAbove20k: z.enum(["Yes", "No"]),
  urban_twoWheelerAndFridgeAndWash: z.enum(["Yes", "No"]),
  urban_fourWheeler: z.enum(["Yes", "No"]),
  urban_washingMachine: z.enum(["Yes", "No"]),

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
    familyMembers: Array(10).fill({
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
    }),
    areaType: "RURAL" as const,
    rural_motorVehicle: "No" as const,
    rural_agriMachine: "No" as const,
    rural_nonAgriEnterprise: "No" as const,
    rural_incomeAbove10k: "No" as const,
    rural_incomeTaxPayee: "No" as const,
    rural_commercialTaxPayee: "No" as const,
    rural_puccaHouse3Rooms: "No" as const,
    rural_irrigation2_5Acres: "No" as const,
    rural_irrigation5Acres: "No" as const,
    rural_irrigation7_5Acres: "No" as const,
    rural_govtService: "No" as const,
    rural_govtServiceDetails: { serviceName: "", postName: "", monthlyIncome: "" },
    urban_incomeTaxPayee: "No" as const,
    urban_govtService: "No" as const,
    urban_govtServiceDetails: { serviceName: "", postName: "", monthlyIncome: "" },
    urban_commercialTaxPayee: "No" as const,
    urban_puccaHouse3Rooms: "No" as const,
    urban_incomeAbove20k: "No" as const,
    urban_twoWheelerAndFridgeAndWash: "No" as const,
    urban_fourWheeler: "No" as const,
    urban_washingMachine: "No" as const,
    date: new Date().toLocaleDateString('en-GB'),
    place: ""
  }
};
