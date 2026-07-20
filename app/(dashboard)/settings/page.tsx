"use client";

import { useState, useEffect } from "react";
import { Database, Download, Loader2, Printer, RotateCcw, Save, Store } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";

const DEFAULT_SETTINGS = {
  shopName: "RA Seva Point",
  tagline: "One Stop for Books, Print & Digital Services",
  upiId: "rasevapoint@upi",
  gstEnabled: "false",
  shopAddress: "",
  shopPhone: "",
  shopEmail: "",
};

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const [shopName, setShopName] = useState(DEFAULT_SETTINGS.shopName);
  const [tagline, setTagline] = useState(DEFAULT_SETTINGS.tagline);
  const [upiId, setUpiId] = useState(DEFAULT_SETTINGS.upiId);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [shopAddress, setShopAddress] = useState(DEFAULT_SETTINGS.shopAddress);
  const [shopPhone, setShopPhone] = useState(DEFAULT_SETTINGS.shopPhone);
  const [shopEmail, setShopEmail] = useState(DEFAULT_SETTINGS.shopEmail);

  // Load settings from database
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setShopName(data.shopName || DEFAULT_SETTINGS.shopName);
        setTagline(data.tagline || DEFAULT_SETTINGS.tagline);
        setUpiId(data.upiId || DEFAULT_SETTINGS.upiId);
        setGstEnabled(data.gstEnabled === "true");
        setShopAddress(data.shopAddress || "");
        setShopPhone(data.shopPhone || "");
        setShopEmail(data.shopEmail || "");
      })
      .catch(() => {
        toast.error("Could not load settings — using defaults");
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          tagline,
          upiId,
          gstEnabled: String(gstEnabled),
          shopAddress,
          shopPhone,
          shopEmail,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShopName(DEFAULT_SETTINGS.shopName);
    setTagline(DEFAULT_SETTINGS.tagline);
    setUpiId(DEFAULT_SETTINGS.upiId);
    setGstEnabled(false);
    setShopAddress("");
    setShopPhone("");
    setShopEmail("");
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("Backup failed");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RA_Seva_Backup_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Database backup downloaded successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  return (
    <div className="page-shell page-shell-settings">
      <PageHeader
        title="Settings"
        subtitle="Configure shop profile, billing preferences, and database backups"
      />

      <div className="settings-layout">
        <aside className="glass-card settings-nav-card">
          <h2 className="section-title mb-4">Configuration</h2>
          <nav className="settings-nav-list" aria-label="Settings sections">
            <a href="#shop-profile" className="settings-nav-item active">
              <Store size={16} />
              Shop Profile
            </a>
            <a href="#billing-settings" className="settings-nav-item">
              <Printer size={16} />
              Billing Settings
            </a>
            <a href="#backup-recovery" className="settings-nav-item">
              <Database size={16} />
              Backup & Database
            </a>
            <a href="/settings/online-services" className="settings-nav-item">
              <Store size={16} />
              Online Services Admin
            </a>
          </nav>
        </aside>

        <div className="space-y-6">
          <form id="shop-profile" onSubmit={handleSave} className="form-card space-y-6 scroll-mt-24">
            <div className="flex items-start gap-3">
              <span className="icon-badge">
                <Store size={20} />
              </span>
              <div>
                <h2 className="section-title mb-1">Shop Metadata</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Manage your business identity and billing preferences.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="form-grid form-grid-2">
                <div>
                  <label className="label" htmlFor="shop-name">Shop Name</label>
                  <input
                    id="shop-name"
                    type="text"
                    className="input-field"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="shop-phone">Shop Phone</label>
                  <input
                    id="shop-phone"
                    type="tel"
                    className="input-field"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="shop-tagline">Tagline</label>
                <input
                  id="shop-tagline"
                  type="text"
                  className="input-field"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="shop-address">Shop Address</label>
                <textarea
                  id="shop-address"
                  className="input-field"
                  rows={2}
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Full shop address (will appear on invoices)"
                />
              </div>

              <div>
                <label className="label" htmlFor="shop-email">Email (Optional)</label>
                <input
                  id="shop-email"
                  type="email"
                  className="input-field"
                  value={shopEmail}
                  onChange={(e) => setShopEmail(e.target.value)}
                  placeholder="e.g. shop@example.com"
                />
              </div>

              <div id="billing-settings" className="scroll-mt-24 pt-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <Printer size={16} />
                  Billing Settings
                </h3>
                <div className="form-grid form-grid-2">
                  <div>
                    <label className="label" htmlFor="default-upi">Default UPI ID</label>
                    <input
                      id="default-upi"
                      type="text"
                      className="input-field"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. rasevapoint@upi"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="gst-calculation">GST Calculation</label>
                    <select
                      id="gst-calculation"
                      className="input-field"
                      value={gstEnabled ? "yes" : "no"}
                      onChange={(e) => setGstEnabled(e.target.value === "yes")}
                    >
                      <option value="no">Disabled (Standard Invoicing)</option>
                      <option value="yes">Enabled (GST Percentages)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions border-t pt-5" style={{ borderColor: "var(--border-primary)" }}>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} />
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

          <section id="backup-recovery" className="form-card space-y-6 scroll-mt-24">
            <div className="flex items-start gap-3">
              <span className="icon-badge">
                <Database size={20} />
              </span>
              <div>
                <h2 className="section-title mb-1">Backup & Recovery</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Download a complete backup of customer records, billing data and application settings.
                </p>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-tile">
                <span className="label mb-1">Backup Format</span>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  JSON
                </p>
              </div>
              <div className="info-tile">
                <span className="label mb-1">Includes</span>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Customers, Invoices, Services, Inventory
                </p>
              </div>
            </div>

            <div className="form-actions justify-start border-t pt-5" style={{ borderColor: "var(--border-primary)" }}>
              <button
                type="button"
                onClick={handleBackup}
                disabled={backupLoading}
                className="btn-secondary"
              >
                {backupLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Backup...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export Full Database Backup
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
