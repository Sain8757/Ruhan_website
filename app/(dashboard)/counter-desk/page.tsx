"use client";

import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { SERVICE_CATALOG, type ServiceCatalogItem } from "@/lib/serviceCatalog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useDownload } from "@/contexts/DownloadContext";

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

export default function CounterDeskPage() {
  const toast = useToast();
  const { downloadWithRename } = useDownload();
  const [activeTab, setActiveTab] = useState<"favorites" | "print" | "credentials" | "cash">("favorites");
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
    // URL will be revoked later or handled by the system
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

        if (Array.isArray(parsed.favorites)) {
          setFavorites(parsed.favorites as string[]);
        }
        if (Array.isArray(parsed.printQueue)) {
          setPrintQueue(parsed.printQueue as PrintJob[]);
        }
        if (typeof parsed.cashClosing === "object" && parsed.cashClosing !== null) {
          setCashClosing(parsed.cashClosing as CashClosing);
        }

        toast.success("Counter data imported!");
      } catch {
        toast.error("Invalid or corrupt JSON file. Import failed.");
      } finally {
        // Reset the input so the same file can be re-imported if needed
        if (importInputRef.current) {
          importInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const hasDeliveredJobs = printQueue.some((job) => job.status === "Delivered");

  return (
    <div className="page-shell page-shell-list">
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={importCounterData}
        aria-hidden="true"
      />

      <PageHeader
        title="Counter Desk"
        subtitle="Rate list, document checklist, WhatsApp templates, print queue and daily cash closing"
        actions={
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => importInputRef.current?.click()}>
              <Upload size={16} />
              Import Data
            </button>
            <button type="button" className="btn-secondary" onClick={exportCounterData}>
              <Download size={16} />
              Export Counter Data
            </button>
          </div>
        }
      />

      <div className="metric-grid">
        <div className="stat-card">
          <span className="label">Services</span>
          <p className="text-2xl font-bold">{SERVICE_CATALOG.length}</p>
        </div>
        <div className="stat-card">
          <span className="label">Print Queue</span>
          <p className="text-2xl font-bold">{printQueue.filter((job) => job.status !== "Delivered").length}</p>
        </div>
        <div className="stat-card">
          <span className="label">Daily Net</span>
          <p className="text-2xl font-bold">{formatCurrency(netTotal)}</p>
        </div>
      </div>

      <div className="content-grid content-grid-wide">
        <section className="glass-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="section-title mb-0">Service Rate List</h2>
            <input
              className="input-field max-w-[280px]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search service..."
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Fee</th>
                  <th>Time</th>
                  <th>Docs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <button
                        type="button"
                        className="font-bold text-left"
                        onClick={() => setSelectedServiceId(service.id)}
                      >
                        {service.name}
                      </button>
                      <div className="text-xs">{service.category}</div>
                    </td>
                    <td className="font-bold">{formatCurrency(service.fee)}</td>
                    <td>{service.estimate}</td>
                    <td>{service.documents.length}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="btn-ghost p-1" onClick={() => toggleFavorite(service.id)} title="Favorite">
                          <Star size={14} fill={favorites.includes(service.id) ? "currentColor" : "none"} />
                        </button>
                        {service.portal && (
                          <a className="btn-ghost p-1" href={service.portal} target="_blank" rel="noreferrer" title="Open portal">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel-stack">
          <section className="glass-card p-4">
            <h2 className="section-title">Required Documents</h2>
            <p className="font-bold text-sm">{selectedService.name}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedService.documents.map((doc) => (
                <span key={doc} className="badge badge-submitted">{doc}</span>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary w-full mt-3"
              onClick={() => copyText(selectedService.documents.join(", "), "Document list")}
            >
              <Copy size={14} />
              Copy Documents
            </button>
          </section>

          <section className="glass-card p-4">
            <h2 className="section-title">WhatsApp Template</h2>
            <input
              className="input-field mb-2"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Customer name"
            />
            <div className="info-tile text-sm leading-relaxed">
              {buildWhatsAppText(selectedService, customerName)}
            </div>
            <button
              type="button"
              className="btn-primary w-full mt-3"
              onClick={() => copyText(buildWhatsAppText(selectedService, customerName), "WhatsApp message")}
            >
              <MessageSquare size={14} />
              Copy Message
            </button>
          </section>
        </aside>
      </div>

      <div className="content-grid content-grid-wide">
        <section className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Print Queue</h2>
            {hasDeliveredJobs && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPrintQueue(printQueue.filter((job) => job.status !== "Delivered"))}
              >
                <Trash2 size={14} />
                Clear All Delivered
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-3">
            <input className="input-field" value={printName} onChange={(event) => setPrintName(event.target.value)} placeholder="Document name" />
            <input className="input-field" value={printCustomer} onChange={(event) => setPrintCustomer(event.target.value)} placeholder="Customer name" />
            <button type="button" className="btn-primary" onClick={addPrintJob}>
              <Plus size={14} />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {printQueue.length === 0 ? (
              <div className="empty-state py-8">No print jobs</div>
            ) : (
              printQueue.map((job) => (
                <div key={job.id} className="file-row">
                  <Printer size={16} />
                  <div>
                    <p className="font-bold text-sm">{job.name}</p>
                    <p className="text-xs">{job.customer}</p>
                  </div>
                  <select className="input-field" value={job.status} onChange={(event) => updatePrintStatus(job.id, event.target.value as PrintJob["status"])}>
                    <option>Pending</option>
                    <option>Printed</option>
                    <option>Delivered</option>
                  </select>
                  <button type="button" className="btn-ghost p-1" onClick={() => setPrintQueue(printQueue.filter((item) => item.id !== job.id))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-card p-4">
          <h2 className="section-title">Daily Cash Closing</h2>
          <div className="form-grid form-grid-2">
            {[
              ["cash", "Cash"],
              ["upi", "UPI"],
              ["card", "Card"],
              ["expense", "Expense"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  className="input-field"
                  type="number"
                  value={cashClosing[key as keyof CashClosing]}
                  onChange={(event) => setCashClosing({ ...cashClosing, [key]: event.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="info-grid mt-3">
            <div className="info-tile">
              <span className="label">Gross</span>
              <p className="font-bold">{formatCurrency(grossTotal)}</p>
            </div>
            <div className="info-tile">
              <span className="label">Net</span>
              <p className="font-bold">{formatCurrency(netTotal)}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Portal Credential Vault</h2>
          <button type="button" className="btn-secondary" onClick={() => setShowPasswords(!showPasswords)}>
            {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPasswords ? "Hide" : "Show"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-3">
          <input className="input-field" value={credentialForm.portal} onChange={(event) => setCredentialForm({ ...credentialForm, portal: event.target.value })} placeholder="Portal" />
          <input className="input-field" value={credentialForm.username} onChange={(event) => setCredentialForm({ ...credentialForm, username: event.target.value })} placeholder="Username" />
          <input className="input-field" value={credentialForm.password} onChange={(event) => setCredentialForm({ ...credentialForm, password: event.target.value })} placeholder="Password" type={showPasswords ? "text" : "password"} />
          <input className="input-field" value={credentialForm.note} onChange={(event) => setCredentialForm({ ...credentialForm, note: event.target.value })} placeholder="Note" />
          <button type="button" className="btn-primary" onClick={addCredential}>
            <Save size={14} />
            Save
          </button>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Portal</th>
                <th>Username</th>
                <th>Password</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((item) => (
                <tr key={item.id}>
                  <td>{item.portal}</td>
                  <td>{item.username}</td>
                  <td>{showPasswords ? item.password : "••••••••"}</td>
                  <td>{item.note}</td>
                  <td>
                    <button type="button" className="btn-ghost p-1" onClick={() => setCredentials(credentials.filter((credential) => credential.id !== item.id))}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {credentials.length === 0 && (
                <tr>
                  <td colSpan={5}>No credentials saved. Data stays in this browser local storage.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Sensitive data yahan browser ke local storage me save hota hai. Shared computer par password save na karein.
        </p>
      </section>
    </div>
  );
}
