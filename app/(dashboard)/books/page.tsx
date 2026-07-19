"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Search, Plus, Loader2, Save, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, BOOK_CATEGORIES } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

interface Book {
  id: string;
  name: string;
  author?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStock: number;
  barcode?: string;
}

export default function BookStorePage() {
  const toast = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    author: "",
    category: BOOK_CATEGORIES[0] as string,
    purchasePrice: "",
    sellingPrice: "",
    quantity: "",
    minStock: "5",
    barcode: "",
  });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setBooks(data || []);
    } catch {
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.purchasePrice || !form.sellingPrice || !form.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save book");
      toast.success("Book registered successfully!");
      setModalOpen(false);
      setForm({
        name: "",
        author: "",
        category: BOOK_CATEGORIES[0] as string,
        purchasePrice: "",
        sellingPrice: "",
        quantity: "",
        minStock: "5",
        barcode: "",
      });
      fetchBooks();
    } catch {
      toast.error("Failed to add book");
    } finally {
      setSaving(false);
    }
  };

  const lowStockBooks = books.filter((b) => b.quantity <= b.minStock);

  return (
    <div className="page-shell page-shell-list">
      <PageHeader
        title="Book Store"
        subtitle={`${books.length} titles registered in stock`}
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} />
            Add Book
          </button>
        }
      />

      {/* Low Stock Alerts */}
      {lowStockBooks.length > 0 && (
        <div className="p-4 rounded-2xl flex gap-3 items-start bg-amber-500/10 border border-amber-500/20 text-amber-600">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Low Stock Alert</div>
            <p className="text-xs mt-0.5">
              {lowStockBooks.length} book titles are running below minimum stock alert thresholds.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, author, genre or barcode..."
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={56} className="empty-state-icon" />
          <div className="empty-state-title">No books in catalog</div>
          <div className="empty-state-desc">Add your first book title to start selling.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title & Author</th>
                <th>Category</th>
                <th>Purchase (₹)</th>
                <th>Selling (₹)</th>
                <th>In Stock</th>
                <th>Alert Threshold</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{book.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{book.author || "Unknown Author"}</div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{book.category}</span>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatCurrency(book.purchasePrice)}</td>
                  <td className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{formatCurrency(book.sellingPrice)}</td>
                  <td>
                    <span className={`badge ${book.quantity <= book.minStock ? "badge-cancelled" : "badge-approved"}`}>
                      {book.quantity} units
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{book.minStock} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-title mb-0">Register Book</h2>
              <button onClick={() => setModalOpen(false)} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div>
                <label className="label">Book Title *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. CBSE Physics Class 12"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Author</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. HC Verma"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {BOOK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Selling Price (₹) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0.00"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantity in Stock *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Min Stock Threshold</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="5"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Registering..." : "Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
