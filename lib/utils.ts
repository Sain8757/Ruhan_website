import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { SERVICE_CATALOG_NAMES } from "@/lib/serviceCatalog";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `RA${year}${month}${random}`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function maskAadhaar(aadhaar: string): string {
  return aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, "XXXX XXXX $3");
}

export function maskPAN(pan: string): string {
  return pan.replace(/([A-Z]{5})([0-9]{4})([A-Z]{1})/, "XXXXX$2$3");
}

export const SERVICE_TYPES = [
  ...SERVICE_CATALOG_NAMES,
  "Aadhaar Card",
  "PAN Card",
  "Passport",
  "Voter ID",
  "Residence Certificate",
  "Domicile Certificate",
  "Character Certificate",
  "Ayushman Card",
  "Labour Card",
  "eShram Card",
  "PM Kisan",
  "Online Form Fill-up",
  "Government Application",
  "Birth Certificate",
  "Death Certificate",
  "Marriage Certificate",
  "Other",
] as const;

export const SERVICE_STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-pending",
  SUBMITTED: "badge-submitted",
  PROCESSING: "badge-processing",
  APPROVED: "badge-approved",
  DELIVERED: "badge-delivered",
  CANCELLED: "badge-cancelled",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "badge-unpaid",
  PARTIAL: "badge-partial",
  PAID: "badge-paid",
};

export const INVENTORY_CATEGORIES = [
  "Pens & Pencils",
  "Registers & Notebooks",
  "Files & Folders",
  "Paper & Sheets",
  "PVC Cards",
  "Lamination Sheets",
  "Ink & Cartridge",
  "Accessories",
  "Stamps & Seals",
  "Other",
] as const;

export const BOOK_CATEGORIES = [
  "School Books",
  "College Books",
  "Competitive Exams",
  "Fiction",
  "Non-Fiction",
  "Children Books",
  "Reference Books",
  "Magazines",
  "Other",
] as const;
