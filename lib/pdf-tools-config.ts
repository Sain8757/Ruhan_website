import { 
  Combine, 
  Scissors, 
  FileDown, 
  Image as ImageIcon, 
  FileText, 
  Lock, 
  Unlock, 
  Minimize, 
  RefreshCw, 
  Trash2, 
  Download, 
  ListOrdered 
} from "lucide-react";

export type PdfToolId = 
  | "merge" 
  | "split" 
  | "compress" 
  | "pdf-to-jpg" 
  | "jpg-to-pdf" 
  | "word-to-pdf" 
  | "protect" 
  | "unlock" 
  | "rotate" 
  | "delete-pages" 
  | "extract-pages" 
  | "reorder-pages";

export interface PdfToolDefinition {
  id: PdfToolId;
  title: string;
  description: string;
  icon: any; // Lucide icon
  color: string;
  category: "Organize" | "Convert" | "Security" | "Optimize";
}

export const PDF_TOOLS: PdfToolDefinition[] = [
  {
    id: "merge",
    title: "Merge PDF",
    description: "Combine multiple PDFs into one unified document.",
    icon: Combine,
    color: "bg-blue-500",
    category: "Organize"
  },
  {
    id: "split",
    title: "Split PDF",
    description: "Extract pages or split a PDF into multiple files.",
    icon: Scissors,
    color: "bg-orange-500",
    category: "Organize"
  },
  {
    id: "delete-pages",
    title: "Delete PDF Pages",
    description: "Remove unnecessary pages from your PDF.",
    icon: Trash2,
    color: "bg-red-500",
    category: "Organize"
  },
  {
    id: "extract-pages",
    title: "Extract PDF Pages",
    description: "Pull out specific pages to create a new PDF.",
    icon: Download,
    color: "bg-green-600",
    category: "Organize"
  },
  {
    id: "reorder-pages",
    title: "Organize PDF",
    description: "Rearrange pages within your PDF document.",
    icon: ListOrdered,
    color: "bg-indigo-500",
    category: "Organize"
  },
  {
    id: "rotate",
    title: "Rotate PDF",
    description: "Rotate your PDF pages 90, 180, or 270 degrees.",
    icon: RefreshCw,
    color: "bg-purple-500",
    category: "Organize"
  },
  {
    id: "compress",
    title: "Compress PDF",
    description: "Reduce PDF file size for easier sharing.",
    icon: Minimize,
    color: "bg-teal-500",
    category: "Optimize"
  },
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Convert PDF pages into high-quality JPG/PNG images.",
    icon: ImageIcon,
    color: "bg-amber-500",
    category: "Convert"
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Convert images into a single PDF document.",
    icon: FileDown,
    color: "bg-yellow-500",
    category: "Convert"
  },
  {
    id: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert DOCX files into PDF format.",
    icon: FileText,
    color: "bg-blue-600",
    category: "Convert"
  },
  {
    id: "protect",
    title: "Protect PDF",
    description: "Secure your PDF files with a password.",
    icon: Lock,
    color: "bg-slate-700",
    category: "Security"
  },
  {
    id: "unlock",
    title: "Unlock PDF",
    description: "Remove passwords from your PDF files.",
    icon: Unlock,
    color: "bg-emerald-500",
    category: "Security"
  }
];
