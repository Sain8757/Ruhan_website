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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      {/* Phone/Modal Container */}
      <div className="w-full max-w-[400px] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-100">
        
        {/* Top Purple Area */}
        <div className="relative bg-gradient-to-br from-[#6b82ff] to-[#804fca] px-6 pb-12 pt-8 text-center shadow-md">
          {/* Top Bar */}
          <div className="absolute left-6 right-6 top-8 flex items-center justify-between">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30">
              <ArrowLeft size={20} />
            </Link>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30">
              <Info size={20} />
            </button>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-wide text-white">Receive Payment</h2>
          
          <div className="mt-3 flex justify-center">
            {accounts.length > 0 ? (
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white/20 px-5 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30">
                {selectedAccount ? selectedAccount.name : "Select Account"}
              </div>
            ) : (
              <div className="inline-flex items-center justify-center rounded-full bg-white/20 px-5 py-1.5 text-sm font-medium text-white backdrop-blur-md">
                No Accounts
              </div>
            )}
          </div>

          {/* QR White Square */}
          <div className="mx-auto mt-8 flex aspect-square w-64 flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-xl relative z-10">
            {selectedAccount ? (
              <QRCodeSVG 
                value={upiUrl} 
                size={208}
                level="H"
                includeMargin={false}
                style={{ width: "100%", height: "100%" }}
                imageSettings={{
                  src: "/icon.png", // Ensure this exists or omit
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300">
                <QrCodeIcon size={48} className="mb-2 opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Account</span>
              </div>
            )}
          </div>

          {/* Payment Icons */}
          <div className="mt-8 flex justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="font-black text-[#5f259f] text-lg leading-none">Pe</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <div className="flex items-center">
                <span className="font-bold text-blue-500 text-xl leading-none">G</span>
                <span className="text-[10px] font-bold text-slate-600 leading-none ml-0.5">Pay</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="text-xs font-bold text-[#00baf2] leading-none tracking-tighter">Paytm</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="text-[9px] font-bold text-[#f27429] leading-tight text-center">BHIM<br/>UPI</span>
            </div>
          </div>
        </div>

        {/* Bottom Area */}
        <div className="bg-[#f8f9fc] px-6 pb-8 pt-8">
          {/* Your Accounts Section */}
          <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Your Accounts</h3>
            <div className="flex flex-wrap items-center gap-3">
              {accounts.map(acc => (
                <div 
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 transition-all ${
                    selectedAccountId === acc.id 
                      ? "border-[#6b82ff] bg-[#6b82ff]/10 text-[#6b82ff]" 
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {selectedAccountId === acc.id && <Check size={14} className="text-[#6b82ff]" />}
                  <span className="text-sm font-semibold">{acc.name}</span>
                  <button 
                    onClick={(e) => handleDeleteAccount(acc.id, e)}
                    className="ml-1 rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => setIsAddingAccount(!isAddingAccount)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b] text-white shadow transition-transform hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Add Account Modal-like inline form */}
          {isAddingAccount && (
            <div className="mb-8 overflow-hidden rounded-3xl bg-white p-5 shadow-lg ring-1 ring-slate-100">
              <h4 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-slate-600">Add New Account</h4>
              
              <div className="mb-6 flex gap-3">
                <button className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-[#d7b2ff] bg-[#f8f0ff] py-3 text-[#9d4edd]">
                  <Type size={20} className="mb-1" />
                  <span className="text-xs font-bold">Type</span>
                </button>
                <button className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-3 text-slate-400 hover:bg-slate-50">
                  <Upload size={20} className="mb-1" />
                  <span className="text-xs font-bold">Upload</span>
                </button>
                <button className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-3 text-slate-400 hover:bg-slate-50">
                  <Scan size={20} className="mb-1" />
                  <span className="text-xs font-bold">Scan</span>
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Shop Name / Your Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#9d4edd] focus:ring-[#9d4edd]"
                />
                <input
                  type="text"
                  placeholder="UPI ID (e.g. 9876543210@ybl)"
                  value={newUpiId}
                  onChange={e => setNewUpiId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#9d4edd] focus:ring-[#9d4edd]"
                />
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleAddAccount}
                    disabled={!newName.trim() || !newUpiId.trim()}
                    className="flex-1 rounded-xl bg-[#9d4edd] py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#8535cf] disabled:opacity-50"
                  >
                    Save Account
                  </button>
                  <button
                    onClick={() => setIsAddingAccount(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Amount Section */}
          {selectedAccount && !isAddingAccount && (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Enter Amount (Fixed)</h3>
              
              <div className="relative mx-auto mb-2 flex max-w-[200px] items-center justify-center">
                <span className="text-3xl font-medium text-slate-300">₹</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border-none bg-transparent py-2 pl-2 pr-0 text-center text-5xl font-black text-slate-800 placeholder-slate-200 focus:outline-none focus:ring-0"
                  style={{ MozAppearance: 'textfield' }}
                />
              </div>
              
              <div className="mb-6 flex justify-center text-green-500">
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide">
                  <Lock size={12} />
                  <span>Amount {amount ? "locked" : "unlocked"} in QR</span>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="flex justify-center gap-2">
                {[10, 50, 100, 500].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(amount ? (Number(amount) + val).toString() : val.toString())}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-[#6b82ff] hover:text-[#6b82ff] active:scale-95"
                  >
                    +{val}
                  </button>
                ))}
                <button
                  onClick={() => setAmount("")}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 active:scale-95"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
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
