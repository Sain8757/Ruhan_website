"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Trash2, QrCode as QrCodeIcon, Lock, IndianRupee, ChevronDown, Check } from "lucide-react";

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
  // Format: upi://pay?pa={upi_id}&pn={name}&am={amount}&cu=INR
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
    <div className="mx-auto max-w-lg p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment QR</h1>
          <p className="text-sm text-slate-500">Generate fixed-amount UPI QR codes</p>
        </div>
      </div>

      {/* Main QR Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6e68e4] to-[#804fca] p-8 shadow-xl">
        <div className="text-center text-white">
          <h2 className="mb-2 text-2xl font-extrabold tracking-wide text-white">Receive Payment</h2>
          <div className="mb-8 flex justify-center">
            {accounts.length > 0 ? (
              <div className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/30">
                {selectedAccount ? selectedAccount.name : "Select Account"}
                <ChevronDown size={14} />
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
                No Accounts
              </div>
            )}
          </div>

          {/* QR Container */}
          <div className="mx-auto mb-8 flex aspect-square w-64 max-w-full items-center justify-center rounded-2xl bg-white p-6 shadow-lg">
            {selectedAccount ? (
              <QRCodeSVG 
                value={upiUrl} 
                size={220}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/icon.png",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300">
                <QrCodeIcon size={64} className="mb-2 opacity-50" />
                <span className="text-sm font-bold uppercase tracking-wider">Select Account</span>
              </div>
            )}
          </div>

          {/* App Icons (Visual flair) */}
          <div className="flex justify-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-[#5f259f] shadow-sm">Pe</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-blue-500 shadow-sm">G</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#00baf2] shadow-sm">Paytm</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#f27429] shadow-sm">BHIM</div>
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Accounts</h3>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {accounts.map(acc => (
            <div 
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 transition-all ${
                selectedAccountId === acc.id 
                  ? "border-[#6e68e4] bg-[#6e68e4]/10 text-[#6e68e4]" 
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {selectedAccountId === acc.id && <Check size={16} />}
              <div className="flex flex-col">
                <span className="text-sm font-bold">{acc.name}</span>
              </div>
              <button 
                onClick={(e) => handleDeleteAccount(acc.id, e)}
                className="ml-2 rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => setIsAddingAccount(!isAddingAccount)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-slate-700"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Add Account Form */}
        {isAddingAccount && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-slate-600">Add New Account</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Shop Name / Your Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-lg border-slate-200 px-4 py-3 text-sm focus:border-[#6e68e4] focus:ring-[#6e68e4]"
              />
              <input
                type="text"
                placeholder="UPI ID (e.g. 9876543210@ybl)"
                value={newUpiId}
                onChange={e => setNewUpiId(e.target.value)}
                className="w-full rounded-lg border-slate-200 px-4 py-3 text-sm focus:border-[#6e68e4] focus:ring-[#6e68e4]"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleAddAccount}
                  disabled={!newName.trim() || !newUpiId.trim()}
                  className="flex-1 rounded-lg bg-[#a23efc] py-3 text-sm font-bold text-white transition-colors hover:bg-[#8f2ce5] disabled:opacity-50"
                >
                  Save Account
                </button>
                <button
                  onClick={() => setIsAddingAccount(false)}
                  className="flex-1 rounded-lg bg-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input Section */}
        {selectedAccount && (
          <div className="mt-8">
            <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-slate-500">Enter Amount (Fixed)</h3>
            <div className="relative mx-auto max-w-[200px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <IndianRupee size={24} className="text-slate-400" />
              </div>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border-none bg-transparent py-4 pl-12 pr-4 text-center text-5xl font-black text-slate-800 placeholder-slate-200 focus:outline-none focus:ring-0"
              />
            </div>
            
            <div className="mb-6 flex justify-center text-green-600 mt-2">
              <div className="flex items-center gap-1 text-sm font-bold">
                <Lock size={14} />
                <span>Amount {amount ? "locked" : "unlocked"} in QR</span>
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="flex justify-center gap-3">
              {[10, 50, 100, 500].map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(amount ? (Number(amount) + val).toString() : val.toString())}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition-all hover:border-[#6e68e4] hover:text-[#6e68e4] active:scale-95"
                >
                  +{val}
                </button>
              ))}
              <button
                onClick={() => setAmount("")}
                className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 active:scale-95"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
