export type WorkspaceIcon =
  | "LayoutDashboard"
  | "Users"
  | "UserPlus"
  | "Briefcase"
  | "FilePlus2"
  | "Receipt"
  | "Camera"
  | "ScanLine"
  | "Layers"
  | "BookOpen"
  | "Package"
  | "MessageSquare"
  | "BarChart3"
  | "Settings"
  | "WalletCards"
  | "Bell"
  | "DatabaseBackup"
  | "QrCode";

export type WorkspaceSection = "Core" | "Tools" | "Inventory" | "Business";

export interface WorkspaceModule {
  id: string;
  label: string;
  href: string;
  icon: WorkspaceIcon;
  section: WorkspaceSection;
  keywords: string[];
}

export interface WorkspaceCommand {
  id: string;
  label: string;
  href: string;
  icon: WorkspaceIcon;
  section: WorkspaceSection | "Action" | "Automation";
  keywords: string[];
  shortcut?: string;
}

export const WORKSPACE_MODULES: WorkspaceModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    section: "Core",
    keywords: ["home", "overview", "today sales", "today", "business"],
  },
  {
    id: "customers",
    label: "Customers",
    href: "/customers",
    icon: "Users",
    section: "Core",
    keywords: ["crm", "mobile", "aadhaar", "pan", "documents"],
  },
  {
    id: "services",
    label: "Services",
    href: "/services",
    icon: "Briefcase",
    section: "Core",
    keywords: ["applications", "pending", "delivery", "forms"],
  },
  {
    id: "billing",
    label: "Billing",
    href: "/billing",
    icon: "Receipt",
    section: "Core",
    keywords: ["invoice", "payment", "cash", "upi", "card"],
  },
  {
    id: "photo-studio",
    label: "Photo Studio",
    href: "/photo-studio",
    icon: "Camera",
    section: "Tools",
    keywords: ["passport photo", "print", "crop", "studio"],
  },
  {
    id: "aadhaar-pan",
    label: "Aadhaar/PAN",
    href: "/aadhaar-pan",
    icon: "ScanLine",
    section: "Tools",
    keywords: ["aadhaar", "pan", "id card"],
  },
  {
    id: "scanner",
    label: "Doc Scanner",
    href: "/scanner",
    icon: "ScanLine",
    section: "Tools",
    keywords: ["scan", "document", "pdf", "camera"],
  },
  {
    id: "pdf-tools",
    label: "PDF Tools",
    href: "/pdf-tools",
    icon: "Layers",
    section: "Tools",
    keywords: ["merge", "image to pdf", "compress", "documents"],
  },
  {
    id: "multi-id-cropper",
    label: "Multi-ID Cropper",
    href: "/multi-id-cropper",
    icon: "ScanLine",
    section: "Tools",
    keywords: ["crop", "id", "aadhaar", "pan", "documents"],
  },
  {
    id: "online-work",
    label: "Online Work",
    href: "/online-work",
    icon: "Briefcase",
    section: "Tools",
    keywords: ["bihar", "rtps", "domicile", "residence", "passport", "voter", "pan", "aadhaar", "ration", "online"],
  },
  {
    id: "counter-desk",
    label: "Counter Desk",
    href: "/counter-desk",
    icon: "WalletCards",
    section: "Tools",
    keywords: ["rate list", "documents", "whatsapp", "print queue", "cash closing", "credentials", "backup"],
  },
  {
    id: "payment-qr",
    label: "Payment QR",
    href: "/payment-qr",
    icon: "QrCode",
    section: "Tools",
    keywords: ["payment", "qr", "upi", "locked", "amount", "receive"],
  },
  {
    id: "inventory",
    label: "Inventory",
    href: "/inventory",
    icon: "Package",
    section: "Inventory",
    keywords: ["stock", "product", "barcode", "purchase", "supplier"],
  },
  {
    id: "service-master",
    label: "Service Master",
    href: "/service-master",
    icon: "Briefcase",
    section: "Inventory",
    keywords: ["services", "aadhaar", "pan", "print", "download", "fees"],
  },
  {
    id: "crm",
    label: "CRM",
    href: "/crm",
    icon: "MessageSquare",
    section: "Business",
    keywords: ["follow up", "customer relationship", "lead"],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
    section: "Business",
    keywords: ["daily closing", "profit", "expense", "export", "today sales", "sales report"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    section: "Business",
    keywords: ["pricing", "backup", "security", "shop"],
  },
];

export const QUICK_ACTIONS: WorkspaceCommand[] = [
  {
    id: "new-customer",
    label: "New Customer",
    href: "/customers/new",
    icon: "UserPlus",
    section: "Action",
    shortcut: "Ctrl+N",
    keywords: ["add customer", "create customer", "mobile", "aadhaar"],
  },
  {
    id: "new-invoice",
    label: "New Invoice",
    href: "/billing/new",
    icon: "Receipt",
    section: "Action",
    shortcut: "Ctrl+B",
    keywords: ["bill", "billing", "payment", "receipt", "create invoice", "new invoice"],
  },
  {
    id: "photo-studio-action",
    label: "Photo Studio",
    href: "/photo-studio",
    icon: "Camera",
    section: "Action",
    shortcut: "Ctrl+P",
    keywords: ["passport photo", "photo print", "studio"],
  },
  {
    id: "new-service",
    label: "New Service",
    href: "/services/new",
    icon: "FilePlus2",
    section: "Action",
    shortcut: "Ctrl+S",
    keywords: ["application", "form", "service request"],
  },
];

export const AUTOMATION_COMMANDS: WorkspaceCommand[] = [
  {
    id: "global-search",
    label: "Global Search",
    href: "#search",
    icon: "LayoutDashboard",
    section: "Automation",
    shortcut: "Ctrl+F",
    keywords: ["find", "customer", "invoice", "service", "barcode"],
  },
  {
    id: "master-pricing",
    label: "Master Pricing",
    href: "/settings",
    icon: "WalletCards",
    section: "Automation",
    keywords: ["service price", "product price", "rate list", "fees"],
  },
  {
    id: "daily-closing",
    label: "Daily Closing",
    href: "/reports",
    icon: "BarChart3",
    section: "Automation",
    keywords: ["cash", "upi", "card", "expenses", "profit", "today sales"],
  },
  {
    id: "notification-center",
    label: "Notification Center",
    href: "/",
    icon: "Bell",
    section: "Automation",
    keywords: ["pending services", "low stock", "payment", "backup"],
  },
  {
    id: "backup-system",
    label: "Backup System",
    href: "/settings",
    icon: "DatabaseBackup",
    section: "Automation",
    keywords: ["manual backup", "restore", "backup history", "cloud"],
  },
];

export const WORKSPACE_COMMANDS: WorkspaceCommand[] = [
  ...QUICK_ACTIONS,
  ...WORKSPACE_MODULES.map((module) => ({
    ...module,
    section: module.section,
  })),
  ...AUTOMATION_COMMANDS,
];

export function getPageTitle(pathname: string): string {
  const direct = WORKSPACE_MODULES.find((module) => module.href === pathname);
  if (direct) return direct.label;

  const nested = WORKSPACE_MODULES.find(
    (module) => module.href !== "/" && pathname.startsWith(module.href)
  );

  return nested?.label || "RA Seva Point";
}

export function matchesCommand(command: WorkspaceCommand, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [command.label, command.href, ...command.keywords]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}
