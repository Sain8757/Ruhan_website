"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, User, Phone, Briefcase, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
}

export default function VendorTab() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    openingBalance: ""
  });

  const [txnForm, setTxnForm] = useState({
    type: "PURCHASE", // or PAYMENT
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  });

  const toast = useToast();

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);

      const res = await fetch(`/api/vendors?${params}`);
      const data = await res.json();
      setVendors(data.vendors || []);
      
      // Update selected vendor if exists
      if (selectedVendor) {
        const updated = data.vendors.find((v: Vendor) => v.id === selectedVendor.id);
        if (updated) setSelectedVendor(updated);
      }
    } catch (err) {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [query, selectedVendor, toast]);

  const fetchTransactions = useCallback(async (vendorId: string) => {
    setLoadingTxns(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/transactions`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTxns(false);
    }
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(t);
  }, [query]); // Note: removing fetchVendors from dependency array to avoid infinite loop due to selectedVendor dependency in fetchVendors. Actually it's fine, we will handle selectedVendor manually.

  // Re-fetch transactions when a vendor is selected
  useEffect(() => {
    if (selectedVendor) {
      fetchTransactions(selectedVendor.id);
    }
  }, [selectedVendor, fetchTransactions]);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Vendor name is required");
    
    setSaving(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) throw new Error("Failed to add vendor");
      toast.success("Vendor added successfully");
      
      setForm({ name: "", phone: "", company: "", openingBalance: "" });
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    if (!txnForm.amount || parseFloat(txnForm.amount) <= 0) return toast.error("Valid amount is required");
    
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${selectedVendor.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txnForm),
      });
      
      if (!res.ok) throw new Error("Failed to process transaction");
      toast.success("Transaction recorded");
      
      setTxnForm({
        type: "PURCHASE",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0]
      });
      fetchTransactions(selectedVendor.id);
      fetchVendors(); // Refresh balance in the list
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (selectedVendor) {
    return (
      <div className="mt-4 animate-fade-in">
        <button 
          onClick={() => setSelectedVendor(null)}
          className="text-sm font-semibold text-blue-600 hover:underline mb-4 inline-block"
        >
          &larr; Back to Vendors
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 mx-auto">
                <User size={32} />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900">{selectedVendor.name}</h2>
              {selectedVendor.company && <p className="text-center text-gray-500 text-sm mt-1">{selectedVendor.company}</p>}
              
              <div className="mt-6 border-t pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} /> {selectedVendor.phone || "No phone"}
                </div>
                <div className="p-4 rounded-xl mt-4 bg-gray-50 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-500">Net Balance</p>
                  <p className={`text-2xl font-black mt-1 ${
                    selectedVendor.balance > 0 ? "text-red-500" : 
                    selectedVendor.balance < 0 ? "text-green-500" : "text-gray-900"
                  }`}>
                    {selectedVendor.balance > 0 ? "You Owe: " : selectedVendor.balance < 0 ? "They Owe: " : "Settled: "}
                    {formatCurrency(Math.abs(selectedVendor.balance))}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddTransaction} className="glass-card p-6">
              <h3 className="section-title text-base mb-4">New Transaction</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Type</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTxnForm({ ...txnForm, type: "PURCHASE" })}
                      className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all ${
                        txnForm.type === "PURCHASE" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      New Udhaar
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxnForm({ ...txnForm, type: "PAYMENT" })}
                      className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all ${
                        txnForm.type === "PAYMENT" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Payment Made
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={txnForm.amount}
                    onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={txnForm.date}
                    onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Description (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Paid via UPI"
                    value={txnForm.description}
                    onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full h-11">
                  {saving ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 glass-card p-6 flex flex-col">
            <h3 className="section-title text-base mb-6">Transaction History</h3>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loadingTxns ? (
                 <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
              ) : transactions.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-title">No transactions</div>
                  <div className="empty-state-desc">You haven't recorded any transactions with this vendor yet.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map(txn => (
                    <div key={txn.id} className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          txn.type === "PURCHASE" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                        }`}>
                          {txn.type === "PURCHASE" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {txn.type === "PURCHASE" ? "Purchase / Udhaar Taken" : "Payment Made"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{formatDate(txn.date)}</span>
                            {txn.description && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">{txn.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold self-center ${
                        txn.type === "PURCHASE" ? "text-red-500" : "text-green-500"
                      }`}>
                        {txn.type === "PURCHASE" ? "+" : "-"}{formatCurrency(txn.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-grid content-grid-wide mt-4">
      <div className="space-y-6">
        <form onSubmit={handleAddVendor} className="glass-card p-6">
          <h2 className="section-title">Add Vendor / Supplier</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Vendor Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh Suppliers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Company / Shop Name</label>
              <input
                type="text"
                className="input-field"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="text"
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Opening Balance (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Enter positive amount if you owe them money.</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full h-11">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : <><Plus size={16} className="inline mr-2" /> Add Vendor</>}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card p-6 flex flex-col h-full">
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search vendors..."
            className="input-field pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-title">No vendors found</div>
              <div className="empty-state-desc">You haven't added any vendors yet.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  onClick={() => setSelectedVendor(vendor)}
                  className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{vendor.name}</h4>
                      {vendor.company && <p className="text-sm text-gray-500 mt-0.5"><Briefcase size={12} className="inline mr-1"/>{vendor.company}</p>}
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                      vendor.balance > 0 ? "bg-red-50 text-red-600" :
                      vendor.balance < 0 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                    }`}>
                      {vendor.balance > 0 ? "Owe: " : vendor.balance < 0 ? "Get: " : "Settled"}
                      {formatCurrency(Math.abs(vendor.balance))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
