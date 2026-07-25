import { z } from "zod";

export const biharRationNewConfig = {
  id: "bihar-ration-new",
  name: "Bihar Ration Card - New Apply",
  description: "Form for applying for a new Bihar Ration Card",
};

export const biharRationNewSchema = z.object({
  // Applicant Details
  applicantNameHi: z.string().optional(),
  applicantNameEn: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  fatherHusbandNameHi: z.string().optional(),
  fatherHusbandNameEn: z.string().optional(),
  fullAddress: z.string().optional(),
  panchayat: z.string().optional(),

  // Bank Details
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),

  // Attached Documents
  incomeCert: z.object({
    docNo: z.string().optional(),
    date: z.string().optional(),
  }).optional(),
  residenceCert: z.object({
    docNo: z.string().optional(),
    date: z.string().optional(),
  }).optional(),
  casteCert: z.object({
    docNo: z.string().optional(),
    date: z.string().optional(),
  }).optional(),

  // Family Members (up to 6)
  familyMembers: z.array(
    z.object({
      name: z.string().optional(),
      gender: z.string().optional(),
      fatherHusbandName: z.string().optional(),
      relation: z.string().optional(),
      age: z.string().optional(),
    })
  ).max(6).optional(),

  // Declarations Header
  declarationName: z.string().optional(),
  declarationFatherHusband: z.string().optional(),
  declarationPanchayat: z.string().optional(),
  declarationGramTola: z.string().optional(),
  declarationWard: z.string().optional(),
  declarationBlock: z.string().optional(),
  declarationDealer: z.string().optional(),

  // Declarations Checkboxes (11 items)
  declarations: z.object({
    motorVehicle: z.boolean().optional(),
    machineEquip: z.boolean().optional(),
    govtRegIndustry: z.boolean().optional(),
    incomeOver10k: z.boolean().optional(),
    incomeTax: z.boolean().optional(),
    commercialTax: z.boolean().optional(),
    puccaHouse3Rooms: z.boolean().optional(),
    irrigatedLand2_5: z.boolean().optional(),
    irrigatedLand5: z.boolean().optional(),
    irrigatedLand7_5: z.boolean().optional(),
    govtServant: z.boolean().optional(),
  }).optional(),
  
  // Signature Date
  date: z.string().optional(),
});

export type BiharRationNewData = z.infer<typeof biharRationNewSchema>;
