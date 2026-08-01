"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Trash2, QrCode as QrCodeIcon, Lock, IndianRupee, ArrowLeft, Info, Check, Upload, Type, Scan } from "lucide-react";
import Link from "next/link";

type UpiAccount = {
  id: string;
  name: string;
  upiId: string;
};

/* ─── Win95 style helpers ──────────────────────────────────────────────── */
const win95Font: React.CSSProperties = {
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontSize: "12px",
  color: "#000",
};

const win95Btn: React.CSSProperties = {
  ...win95Font,
  background: "#d4d0c8",
  border: "none",
  outline: "none",
  cursor: "pointer",
  padding: "3px 10px",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderRight: "2px solid #808080",
  borderBottom: "2px solid #808080",
  boxShadow: "1px 1px 0 #000",
  minWidth: "24px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
};

const win95BtnActive: React.CSSProperties = {
  ...win95Btn,
  borderTop: "2px solid #808080",
  borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff",
  borderBottom: "2px solid #ffffff",
  background: "#000080",
  color: "#ffffff",
};

const win95Input: React.CSSProperties = {
  ...win95Font,
  background: "#ffffff",
  borderTop: "2px solid #808080",
  borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff",
  borderBottom: "2px solid #ffffff",
  padding: "2px 4px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const win95Fieldset: React.CSSProperties = {
  border: "none",
  borderTop: "2px solid #808080",
  borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff",
  borderBottom: "2px solid #ffffff",
  padding: "8px 10px 10px",
  margin: "0 0 10px 0",
};

const win95Legend: React.CSSProperties = {
  ...win95Font,
  fontWeight: "bold",
  padding: "0 4px",
  background: "#d4d0c8",
};

const win95Inset: React.CSSProperties = {
  borderTop: "2px solid #808080",
  borderLeft: "2px solid #808080",
  borderRight: "2px solid #ffffff",
  borderBottom: "2px solid #ffffff",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function PaymentQrPage() {
  const [accounts, setAccounts] = useState<UpiAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUpiId, setNewUpiId] = useState("");

  // Load accounts on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ra_payment_accounts");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAccounts(parsed);
        if (parsed.length > 0 && !selectedAccountId) {
          setSelectedAccountId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load accounts", e);
    }
  }, []);

  // Save accounts
  const saveAccounts = (newAccounts: UpiAccount[]) => {
    setAccounts(newAccounts);
    localStorage.setItem("ra_payment_accounts", JSON.stringify(newAccounts));
  };

  const handleAddAccount = () => {
    if (!newName.trim() || !newUpiId.trim()) return;

    const newAccount: UpiAccount = {
      id: Date.now().toString(),
      name: newName.trim(),
      upiId: newUpiId.trim(),
    };

    const updated = [...accounts, newAccount];
    saveAccounts(updated);
    setSelectedAccountId(newAccount.id);
    setNewName("");
    setNewUpiId("");
    setIsAddingAccount(false);
  };

  const handleDeleteAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = accounts.filter(a => a.id !== id);
    saveAccounts(updated);
    if (selectedAccountId === id) {
      setSelectedAccountId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Generate UPI string
  const getUpiUrl = () => {
    if (!selectedAccount) return "";
    let url = `upi://pay?pa=${encodeURIComponent(selectedAccount.upiId)}&pn=${encodeURIComponent(selectedAccount.name)}&cu=INR`;
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      url += `&am=${Number(amount)}`;
    }
    return url;
  };

  const upiUrl = getUpiUrl();

  return (
    <div style={{
      minHeight: "calc(100vh - 4rem)",
      background: "#008080",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      ...win95Font,
    }}>

      {/* Win95 Window */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#d4d0c8",
        borderTop: "2px solid #ffffff",
        borderLeft: "2px solid #ffffff",
        borderRight: "2px solid #808080",
        borderBottom: "2px solid #808080",
        boxShadow: "2px 2px 0 #000",
      }}>

        {/* Title Bar */}
        <div style={{
          background: "linear-gradient(90deg, #000080, #1084d0)",
          padding: "4px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none",
        }}>
          <span style={{
            color: "#ffffff",
            fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
            fontSize: "12px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            💳 Receive Payment (UPI)
          </span>
          <div style={{ display: "flex", gap: "2px" }}>
            <Link href="/" style={{
              ...win95Btn,
              textDecoration: "none",
              fontSize: "10px",
              padding: "1px 6px",
              lineHeight: 1,
            }} title="Back">
              <ArrowLeft size={10} />
            </Link>
            <button style={{ ...win95Btn, fontSize: "10px", padding: "1px 6px", lineHeight: 1 }} title="Info">
              <Info size={10} />
            </button>
            <button style={{ ...win95Btn, fontSize: "10px", padding: "1px 6px", lineHeight: 1 }} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "12px", background: "#d4d0c8" }}>

          {/* QR Section */}
          <fieldset style={win95Fieldset}>
            <legend style={win95Legend}>📷 QR Code</legend>

            {/* QR inset box */}
            <div style={{ ...win95Inset, marginBottom: "6px" }}>
              {selectedAccount ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <QRCodeSVG
                    value={upiUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/icon.png",
                      x: undefined,
                      y: undefined,
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                  {/* UPI ID display */}
                  <div style={{
                    ...win95Font,
                    fontSize: "10px",
                    color: "#000080",
                    textAlign: "center",
                    wordBreak: "break-all",
                    maxWidth: "200px",
                  }}>
                    {selectedAccount.upiId}
                  </div>
                </div>
              ) : (
                <div style={{
                  width: "200px",
                  height: "200px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#808080",
                }}>
                  <QrCodeIcon size={48} />
                  <span style={{ ...win95Font, fontSize: "10px", marginTop: "8px" }}>Select an account</span>
                </div>
              )}
            </div>

            {/* Payment App Icons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
              {[
                { label: "PhonePe", color: "#5f259f", abbr: "Pe" },
                { label: "GPay", color: "#4285f4", abbr: "G" },
                { label: "Paytm", color: "#00baf2", abbr: "Ptm" },
                { label: "BHIM", color: "#f27429", abbr: "BHIM" },
              ].map(app => (
                <div key={app.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "#d4d0c8",
                    borderTop: "2px solid #ffffff",
                    borderLeft: "2px solid #ffffff",
                    borderRight: "2px solid #808080",
                    borderBottom: "2px solid #808080",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: app.color,
                    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                  }}>
                    {app.abbr}
                  </div>
                  <span style={{ ...win95Font, fontSize: "9px", color: "#000" }}>{app.label}</span>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Account Selector */}
          <fieldset style={win95Fieldset}>
            <legend style={win95Legend}>👤 Your Accounts</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    ...(selectedAccountId === acc.id ? win95BtnActive : win95Btn),
                    padding: "3px 8px",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedAccountId(acc.id)}
                >
                  {selectedAccountId === acc.id && <Check size={10} />}
                  <span style={{ ...win95Font, color: selectedAccountId === acc.id ? "#ffffff" : "#000" }}>
                    {acc.name}
                  </span>
                  <button
                    onClick={(e) => handleDeleteAccount(acc.id, e)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 2px",
                      color: selectedAccountId === acc.id ? "#ffaaaa" : "#800000",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setIsAddingAccount(!isAddingAccount)}
                style={{ ...win95Btn, padding: "3px 8px" }}
                title="Add Account"
              >
                <Plus size={11} />
                Add
              </button>
            </div>
          </fieldset>

          {/* Add Account Form */}
          {isAddingAccount && (
            <fieldset style={win95Fieldset}>
              <legend style={win95Legend}>➕ Add New Account</legend>

              {/* Mode selector row */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                <button style={{ ...win95BtnActive, flex: 1, flexDirection: "column", gap: "2px", padding: "4px" }}>
                  <Type size={12} />
                  <span style={{ fontSize: "9px", color: "#ffffff" }}>Type</span>
                </button>
                <button style={{ ...win95Btn, flex: 1, flexDirection: "column", gap: "2px", padding: "4px" }}>
                  <Upload size={12} />
                  <span style={{ fontSize: "9px" }}>Upload</span>
                </button>
                <button style={{ ...win95Btn, flex: 1, flexDirection: "column", gap: "2px", padding: "4px" }}>
                  <Scan size={12} />
                  <span style={{ fontSize: "9px" }}>Scan</span>
                </button>
              </div>

              <div style={{ marginBottom: "6px" }}>
                <label style={{ ...win95Font, display: "block", marginBottom: "2px" }}>Name:</label>
                <input
                  type="text"
                  placeholder="Shop Name / Your Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={win95Input}
                />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ ...win95Font, display: "block", marginBottom: "2px" }}>UPI ID:</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210@ybl"
                  value={newUpiId}
                  onChange={e => setNewUpiId(e.target.value)}
                  style={win95Input}
                />
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={handleAddAccount}
                  disabled={!newName.trim() || !newUpiId.trim()}
                  style={{
                    ...win95Btn,
                    flex: 1,
                    opacity: (!newName.trim() || !newUpiId.trim()) ? 0.5 : 1,
                    cursor: (!newName.trim() || !newUpiId.trim()) ? "not-allowed" : "pointer",
                  }}
                >
                  💾 Save Account
                </button>
                <button
                  onClick={() => setIsAddingAccount(false)}
                  style={{ ...win95Btn, flex: 1 }}
                >
                  ✕ Cancel
                </button>
              </div>
            </fieldset>
          )}

          {/* Amount Section */}
          {selectedAccount && !isAddingAccount && (
            <fieldset style={win95Fieldset}>
              <legend style={win95Legend}>₹ Enter Amount (Optional)</legend>

              <div style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ ...win95Font, fontWeight: "bold", fontSize: "14px" }}>₹</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  style={{ ...win95Input, fontSize: "18px", fontWeight: "bold", width: "120px", MozAppearance: "textfield" } as React.CSSProperties}
                />
                <span style={{ ...win95Font, fontSize: "10px", color: "#000080" }}>
                  <Lock size={10} style={{ display: "inline", marginRight: "3px" }} />
                  {amount ? "Locked in QR" : "Unlocked"}
                </span>
              </div>

              {/* Quick amount buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {[10, 50, 100, 500].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(amount ? (Number(amount) + val).toString() : val.toString())}
                    style={{ ...win95Btn, padding: "3px 8px" }}
                  >
                    +{val}
                  </button>
                ))}
                <button
                  onClick={() => setAmount("")}
                  style={{ ...win95Btn, padding: "3px 8px" }}
                >
                  Clear
                </button>
              </div>
            </fieldset>
          )}

          {/* Status Bar */}
          <div style={{
            marginTop: "4px",
            borderTop: "1px solid #808080",
            paddingTop: "4px",
            display: "flex",
            justifyContent: "space-between",
            ...win95Font,
            fontSize: "10px",
            color: "#000080",
          }}>
            <span>{selectedAccount ? `Account: ${selectedAccount.name}` : "No account selected"}</span>
            <span>{amount ? `₹ ${amount}` : "No amount"}</span>
          </div>
        </div>
      </div>

      {/* Hide number input arrows globally for this page */}
      <style dangerouslySetInnerHTML={{__html: `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}} />
    </div>
  );
}
