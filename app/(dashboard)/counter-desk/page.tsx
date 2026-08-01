"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquare,
  Plus,
  Printer,
  Save,
  Star,
  Trash2,
  Upload,
  WalletCards,
  Ticket,
  Keyboard,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { SERVICE_CATALOG, type ServiceCatalogItem } from "@/lib/serviceCatalog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";
import TokenTicketModal from "@/components/counter/TokenTicketModal";
import KeyboardShortcutsModal from "@/components/layout/KeyboardShortcutsModal";
import GovtPortalsLauncher from "@/components/counter/GovtPortalsLauncher";

type PrintJob = {
  id: string;
  name: string;
  customer: string;
  status: "Pending" | "Printed" | "Delivered";
};

type Credential = {
  id: string;
  portal: string;
  username: string;
  password: string;
  note: string;
};

type CashClosing = {
  cash: string;
  upi: string;
  card: string;
  expense: string;
};

const useStoredState = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const saved = window.localStorage.getItem(key);
    if (!saved) return initialValue;
    try {
      return JSON.parse(saved) as T;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (next: T) => {
    setValue(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  };

  return [value, setStoredValue] as const;
};

const buildWhatsAppText = (service: ServiceCatalogItem, customerName: string) =>
  service.message.replace("{name}", customerName || "customer");

// Win95 style constants
const w95Panel = {
  background: "#d4d0c8",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderRight: "2px solid #808080",
  borderBottom: "2px solid #808080",
  padding: "8px",
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontSize: "12px",
  marginBottom: "8px",
} as React.CSSProperties;

const w95Button = {
  background: "#d4d0c8",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderRight: "2px solid #404040",
  borderBottom: "2px solid #404040",
  boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080",
  color: "#000",
  padding: "3px 10px",
  fontSize: "12px",
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  cursor: "default",
  display: "inline-flex" as const,
  alignItems: "center" as const,
  gap: "4px",
  whiteSpace: "nowrap" as const,
} as React.CSSProperties;

const w95Input = {
  background: "#ffffff",
  borderTop: "2px solid #808080",
  borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff",
  borderBottom: "2px solid #ffffff",
  boxShadow: "inset 1px 1px #404040",
  color: "#000",
  padding: "2px 4px",
  fontSize: "12px",
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  outline: "none",
  width: "100%",
} as React.CSSProperties;

const w95TitleBar = {
  background: "linear-gradient(90deg, #000080, #1084d0)",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: "12px",
  padding: "3px 6px",
  marginBottom: "6px",
} as React.CSSProperties;

const w95Fieldset = {
  border: "none",
  borderTop: "1px solid #808080",
  borderLeft: "1px solid #808080",
  borderRight: "1px solid #ffffff",
  borderBottom: "1px solid #ffffff",
  padding: "8px 8px 10px 8px",
  marginBottom: "8px",
  position: "relative" as const,
  background: "transparent",
} as React.CSSProperties;

const w95Legend = {
  color: "#000080",
  padding: "0 4px",
  position: "absolute" as const,
  top: "-8px",
  left: "8px",
  background: "#d4d0c8",
  fontSize: "12px",
  fontWeight: "bold",
} as React.CSSProperties;

export default function CounterDeskPage() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(SERVICE_CATALOG[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [printName, setPrintName] = useState("");
  const [printCustomer, setPrintCustomer] = useState("");
  const [cashClosing, setCashClosing] = useStoredState<CashClosing>("ra-counter-cash-closing", {
    cash: "",
    upi: "",
    card: "",
    expense: "",
  });
  const [printQueue, setPrintQueue] = useStoredState<PrintJob[]>("ra-counter-print-queue", []);
  const [favorites, setFavorites] = useStoredState<string[]>("ra-counter-favorites", []);
  const [credentials, setCredentials] = useStoredState<Credential[]>("ra-counter-credentials", []);
  const [credentialForm, setCredentialForm] = useState({ portal: "", username: "", password: "", note: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      if (e.key === "F2") {
        e.preventDefault();
        setIsTokenModalOpen(true);
      } else if (e.key === "F4" && !isTyping) {
        e.preventDefault();
        const searchInput = document.getElementById("counter-search-input");
        if (searchInput) searchInput.focus();
      } else if (e.key === "F8") {
        e.preventDefault();
      } else if (e.key === "F1" || (e.key === "?" && !isTyping)) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SERVICE_CATALOG;
    return SERVICE_CATALOG.filter((service) =>
      [service.name, service.category, service.documents.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query]);

  const selectedService =
    SERVICE_CATALOG.find((service) => service.id === selectedServiceId) || SERVICE_CATALOG[0];

  const totals = {
    cash: Number(cashClosing.cash) || 0,
    upi: Number(cashClosing.upi) || 0,
    card: Number(cashClosing.card) || 0,
    expense: Number(cashClosing.expense) || 0,
  };
  const grossTotal = totals.cash + totals.upi + totals.card;
  const netTotal = grossTotal - totals.expense;

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id]);
  };

  const addPrintJob = () => {
    if (!printName.trim()) {
      toast.error("Print item name required");
      return;
    }
    setPrintQueue([
      {
        id: `${Date.now()}`,
        name: printName.trim(),
        customer: printCustomer.trim() || "Walk-in",
        status: "Pending",
      },
      ...printQueue,
    ]);
    setPrintName("");
    setPrintCustomer("");
  };

  const updatePrintStatus = (id: string, status: PrintJob["status"]) => {
    setPrintQueue(printQueue.map((job) => (job.id === id ? { ...job, status } : job)));
  };

  const addCredential = () => {
    if (!credentialForm.portal.trim() || !credentialForm.username.trim()) {
      toast.error("Portal and username required");
      return;
    }
    setCredentials([{ id: `${Date.now()}`, ...credentialForm }, ...credentials]);
    setCredentialForm({ portal: "", username: "", password: "", note: "" });
  };

  const exportCounterData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      favorites,
      printQueue,
      cashClosing,
      credentials: credentials.map((item) => ({ ...item, password: item.password ? "Saved locally" : "" })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadWithRename(url, `RA_Counter_Backup_${Date.now()}.json`);
  };

  const importCounterData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") throw new Error("Unreadable file");
        const parsed = JSON.parse(text);

        if (
          typeof parsed !== "object" ||
          parsed === null ||
          !("favorites" in parsed) ||
          !("printQueue" in parsed) ||
          !("cashClosing" in parsed)
        ) {
          throw new Error("Missing required fields");
        }

        if (Array.isArray(parsed.favorites)) setFavorites(parsed.favorites as string[]);
        if (Array.isArray(parsed.printQueue)) setPrintQueue(parsed.printQueue as PrintJob[]);
        if (typeof parsed.cashClosing === "object" && parsed.cashClosing !== null) setCashClosing(parsed.cashClosing as CashClosing);

        toast.success("Counter data imported!");
      } catch {
        toast.error("Invalid or corrupt JSON file. Import failed.");
      } finally {
        if (importInputRef.current) importInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const hasDeliveredJobs = printQueue.some((job) => job.status === "Delivered");

  return (
    <div
      className="page-shell page-shell-list"
      style={{ fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif", fontSize: "12px" }}
    >
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={importCounterData}
        aria-hidden="true"
      />

      <PageHeader
        title="Counter Desk"
        subtitle="Rate list, document checklist, WhatsApp templates, print queue and daily cash closing"
        actions={
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
            <button type="button" style={w95Button} onClick={() => setIsTokenModalOpen(true)} title="Issue Counter Token Ticket (F2)">
              <Ticket size={14} /> Issue Token <span style={{ fontSize: "10px", background: "#000080", color: "#fff", padding: "0 4px" }}>F2</span>
            </button>
            <button type="button" style={w95Button} onClick={() => setIsShortcutsOpen(true)} title="View Keyboard Shortcuts (F1)">
              <Keyboard size={14} /> Hotkeys <span style={{ fontSize: "10px", background: "#808080", color: "#fff", padding: "0 4px" }}>F1</span>
            </button>
            <button type="button" style={w95Button} onClick={() => importInputRef.current?.click()}>
              <Upload size={14} /> Import
            </button>
            <button type="button" style={w95Button} onClick={exportCounterData}>
              <Download size={14} /> Export
            </button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "8px" }}>
        {[
          { label: "Services", value: SERVICE_CATALOG.length },
          { label: "Print Queue", value: printQueue.filter((job) => job.status !== "Delivered").length },
          { label: "Daily Net", value: formatCurrency(netTotal) },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...w95Panel, textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#000080" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Govt Portals Launcher */}
      <div style={{ marginBottom: "8px" }}>
        <GovtPortalsLauncher />
      </div>

      {/* Main 2-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "8px", alignItems: "start" }}>

        {/* Left: Service Rate List */}
        <div style={w95Panel}>
          <div style={w95TitleBar}>📋 Service Rate List</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
            <label style={{ fontSize: "12px", whiteSpace: "nowrap" }}>Search:</label>
            <input
              id="counter-search-input"
              style={w95Input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service..."
            />
          </div>
          <div style={{ background: "#ffffff", border: "2px solid #808080", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#d4d0c8" }}>
                  {["Service", "Fee", "Time", "Docs", ""].map((h) => (
                    <th key={h} style={{ borderTop: "1px solid #fff", borderLeft: "1px solid #fff", borderRight: "1px solid #808080", borderBottom: "2px solid #808080", padding: "3px 6px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service, i) => (
                  <tr key={service.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8f8f8" }}>
                    <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#000080", fontWeight: "bold", cursor: "default", padding: 0, fontSize: "12px", fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif", textAlign: "left" }}
                        onClick={() => setSelectedServiceId(service.id)}
                      >
                        {service.name}
                      </button>
                      <div style={{ fontSize: "10px", color: "#555" }}>{service.category}</div>
                    </td>
                    <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>{formatCurrency(service.fee)}</td>
                    <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px", whiteSpace: "nowrap" }}>{service.estimate}</td>
                    <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px", textAlign: "center" }}>{service.documents.length}</td>
                    <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "flex-end" }}>
                        <button type="button" style={{ ...w95Button, padding: "1px 4px" }} onClick={() => toggleFavorite(service.id)} title="Favorite">
                          <Star size={12} fill={favorites.includes(service.id) ? "#d4af37" : "none"} color={favorites.includes(service.id) ? "#d4af37" : "#000"} />
                        </button>
                        {service.portal && (
                          <a style={{ ...w95Button, padding: "1px 4px", textDecoration: "none" }} href={service.portal} target="_blank" rel="noreferrer" title="Open portal">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar: Documents + WhatsApp */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Required Documents */}
          <div style={w95Panel}>
            <div style={w95TitleBar}>📄 Required Documents</div>
            <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#000080" }}>{selectedService.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
              {selectedService.documents.map((doc) => (
                <span key={doc} style={{ border: "1px solid #000080", color: "#000080", padding: "1px 6px", fontSize: "11px" }}>{doc}</span>
              ))}
            </div>
            <button type="button" style={{ ...w95Button, width: "100%", justifyContent: "center" }} onClick={() => copyText(selectedService.documents.join(", "), "Document list")}>
              <Copy size={12} /> Copy Documents
            </button>
          </div>

          {/* WhatsApp Template */}
          <div style={w95Panel}>
            <div style={w95TitleBar}>💬 WhatsApp Template</div>
            <input
              style={{ ...w95Input, marginBottom: "6px" }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
            />
            <div style={{ background: "#ffffff", border: "2px inset #808080", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", padding: "4px 6px", fontSize: "11px", minHeight: "60px", marginBottom: "6px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {buildWhatsAppText(selectedService, customerName)}
            </div>
            <button type="button" style={{ ...w95Button, width: "100%", justifyContent: "center", background: "#d4d0c8" }} onClick={() => copyText(buildWhatsAppText(selectedService, customerName), "WhatsApp message")}>
              <MessageSquare size={12} /> Copy Message
            </button>
          </div>
        </div>
      </div>

      {/* Print Queue + Cash Closing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "8px", alignItems: "start" }}>
        {/* Print Queue */}
        <div style={w95Panel}>
          <div style={{ ...w95TitleBar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🖨️ Print Queue</span>
            {hasDeliveredJobs && (
              <button type="button" style={{ ...w95Button, fontSize: "11px", padding: "1px 6px" }} onClick={() => setPrintQueue(printQueue.filter((job) => job.status !== "Delivered"))}>
                <Trash2 size={11} /> Clear Delivered
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "4px", marginBottom: "6px" }}>
            <input style={w95Input} value={printName} onChange={(e) => setPrintName(e.target.value)} placeholder="Document name" />
            <input style={w95Input} value={printCustomer} onChange={(e) => setPrintCustomer(e.target.value)} placeholder="Customer name" />
            <button type="button" style={w95Button} onClick={addPrintJob}><Plus size={12} /> Add</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {printQueue.length === 0 ? (
              <div style={{ background: "#ffffff", border: "2px solid #808080", padding: "16px", textAlign: "center", color: "#808080" }}>No print jobs</div>
            ) : (
              printQueue.map((job) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "6px", alignItems: "center", background: "#ffffff", border: "1px solid #c0c0c0", padding: "4px 6px" }}>
                  <Printer size={14} color="#000080" />
                  <div>
                    <div style={{ fontWeight: "bold" }}>{job.name}</div>
                    <div style={{ fontSize: "10px", color: "#555" }}>{job.customer}</div>
                  </div>
                  <select style={{ ...w95Input, width: "auto", fontSize: "11px" }} value={job.status} onChange={(e) => updatePrintStatus(job.id, e.target.value as PrintJob["status"])}>
                    <option>Pending</option>
                    <option>Printed</option>
                    <option>Delivered</option>
                  </select>
                  <button type="button" style={{ ...w95Button, padding: "2px 4px" }} onClick={() => setPrintQueue(printQueue.filter((item) => item.id !== job.id))}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cash Closing */}
        <div style={w95Panel}>
          <div style={w95TitleBar}>💰 Daily Cash Closing</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
            {([["cash", "Cash (₹)"], ["upi", "UPI (₹)"], ["card", "Card (₹)"], ["expense", "Expense (₹)"]] as const).map(([key, label]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "11px", marginBottom: "2px" }}>{label}:</label>
                <input
                  style={w95Input}
                  type="number"
                  value={cashClosing[key]}
                  onChange={(e) => setCashClosing({ ...cashClosing, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div style={{ background: "#ffffff", border: "2px solid #808080", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", padding: "6px" }}>
              <div style={{ fontSize: "11px", color: "#555" }}>Gross Total</div>
              <div style={{ fontWeight: "bold", fontSize: "14px", color: "#000080" }}>{formatCurrency(grossTotal)}</div>
            </div>
            <div style={{ background: "#ffffff", border: "2px solid #808080", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", padding: "6px" }}>
              <div style={{ fontSize: "11px", color: "#555" }}>Net Total</div>
              <div style={{ fontWeight: "bold", fontSize: "14px", color: "#006400" }}>{formatCurrency(netTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Credential Vault */}
      <div style={w95Panel}>
        <div style={{ ...w95TitleBar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🔑 Portal Credential Vault</span>
          <button type="button" style={{ ...w95Button, fontSize: "11px", padding: "1px 6px" }} onClick={() => setShowPasswords(!showPasswords)}>
            {showPasswords ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "4px", marginBottom: "6px" }}>
          <input style={w95Input} value={credentialForm.portal} onChange={(e) => setCredentialForm({ ...credentialForm, portal: e.target.value })} placeholder="Portal" />
          <input style={w95Input} value={credentialForm.username} onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })} placeholder="Username" />
          <input style={w95Input} value={credentialForm.password} onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })} placeholder="Password" type={showPasswords ? "text" : "password"} />
          <input style={w95Input} value={credentialForm.note} onChange={(e) => setCredentialForm({ ...credentialForm, note: e.target.value })} placeholder="Note" />
          <button type="button" style={w95Button} onClick={addCredential}><Save size={12} /> Save</button>
        </div>
        <div style={{ background: "#ffffff", border: "2px solid #808080", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#d4d0c8" }}>
                {["Portal", "Username", "Password", "Note", ""].map((h) => (
                  <th key={h} style={{ borderTop: "1px solid #fff", borderLeft: "1px solid #fff", borderRight: "1px solid #808080", borderBottom: "2px solid #808080", padding: "3px 6px", textAlign: "left", fontWeight: "bold" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credentials.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>{item.portal}</td>
                  <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>{item.username}</td>
                  <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>{showPasswords ? item.password : "••••••••"}</td>
                  <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>{item.note}</td>
                  <td style={{ border: "1px solid #c0c0c0", padding: "3px 6px" }}>
                    <button type="button" style={{ ...w95Button, padding: "1px 4px" }} onClick={() => setCredentials(credentials.filter((c) => c.id !== item.id))}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {credentials.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ border: "1px solid #c0c0c0", padding: "8px", textAlign: "center", color: "#808080" }}>
                    No credentials saved. Data stays in browser local storage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "10px", color: "#808080", marginTop: "4px" }}>
          ⚠️ Sensitive data yahan browser ke local storage me save hota hai. Shared computer par password save na karein.
        </p>
      </div>

      {/* Modals */}
      <TokenTicketModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
