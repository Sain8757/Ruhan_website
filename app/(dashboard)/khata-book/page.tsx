"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, CalendarDays, Loader2, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity Bill",
  "Internet/WiFi",
  "Tea & Snacks",
  "Stationery & Supplies",
  "Equipment Maintenance",
  "Employee Salary",
  "Marketing/Ads",
  "Travel",
  "Other"
];

export default function KhataBookPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  });

  const toast = useToast();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (query) params.set("q", query);

      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [month, query, toast]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category === "Other" && form.description 
            ? `Other - ${form.description.split(" ")[0]}` 
            : form.category,
          amount: parseFloat(form.amount),
          description: form.description,
          date: form.date,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to add expense");
      toast.success("Expense added successfully");
      
      setForm({
        category: EXPENSE_CATEGORIES[0],
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0]
      });
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="page-shell page-shell-dashboard">
      <PageHeader 
        title="Khata Book" 
        subtitle="Manage shop expenses and daily outgoings" 
      />

      <div className="content-grid content-grid-wide mt-4">
        {/* Expense Form & Summary */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="glass-card p-6 border-l-4 border-rose-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <ArrowDownCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Total Expenses (Selected Month)</p>
                <h3 className="text-3xl font-black mt-1" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(totalExpenses)}
                </h3>
              </div>
            </div>
          </div>

          {/* Add Expense Form */}
          <form onSubmit={handleAddExpense} className="glass-card p-6">
            <h2 className="section-title">Add New Expense</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  className="input-field text-lg font-bold"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  className="input-field"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Description / Notes</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Details about the expense..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full h-11 text-base">
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <><Plus size={16} /> Add Expense</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Expenses List */}
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search expenses..."
                className="input-field pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="month"
                className="input-field pl-9 w-40"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="empty-state py-12">
                <div className="empty-state-title">No expenses found</div>
                <div className="empty-state-desc">You have no expenses recorded for this month.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ borderColor: "var(--border-secondary)" }}>
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
                        <ArrowDownCircle size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{exp.category}</h4>
                        <div className="text-xs flex gap-2" style={{ color: "var(--text-muted)" }}>
                          <span>{formatDate(exp.date)}</span>
                          {exp.description && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate max-w-[150px] sm:max-w-[200px]">{exp.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-rose-500">
                        -{formatCurrency(exp.amount)}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(exp.id)}
                        className="btn-ghost p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 size={14} />
                      </button>
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
