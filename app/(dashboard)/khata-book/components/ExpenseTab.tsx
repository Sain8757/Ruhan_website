"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, CalendarDays, Loader2, ArrowDownCircle, Download } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

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

export default function ExpenseTab() {
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

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      expenses.map(exp => ({
        Date: formatDate(exp.date),
        Category: exp.category,
        Description: exp.description || "",
        Amount: exp.amount
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Expenses_${month}.xlsx`);
  };

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      doc.text(`Expense Report (${month})`, 14, 15);
      
      autoTable(doc, {
        startY: 20,
        head: [["Date", "Category", "Description", "Amount"]],
        body: expenses.map(exp => [
          formatDate(exp.date),
          exp.category,
          exp.description || "-",
          exp.amount.toFixed(2)
        ]),
        foot: [["", "", "Total", totalExpenses.toFixed(2)]],
        theme: 'grid'
      });
      
      doc.save(`Expenses_${month}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
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
          <div className="flex gap-2">
            <button onClick={exportPDF} className="btn-secondary h-11 px-3" title="Export to PDF">
              <Download size={16} /> PDF
            </button>
            <button onClick={exportExcel} className="btn-secondary h-11 px-3" title="Export to Excel">
              <Download size={16} /> Excel
            </button>
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
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <ArrowDownCircle size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{expense.category}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{formatDate(expense.date)}</span>
                        {expense.description && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{expense.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
