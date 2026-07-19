"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Search, Plus, Loader2, Save, X, AlertTriangle, Edit } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, INVENTORY_CATEGORIES } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStock: number;
  unit: string;
}

export default function ServiceMasterPage() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Track editing state
  const [editItemId, setEditItemId] = useState<string | null>(null);

  // Default initial form
  const defaultForm = {
    name: "",
    category: "Service",
    purchasePrice: "0",
    sellingPrice: "",
    quantity: "99999",
    minStock: "0",
    unit: "service",
  };
  const [form, setForm] = useState(defaultForm);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?q=${encodeURIComponent(query)}&type=service`);
      const data = await res.json();
      setItems(data || []);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.purchasePrice || !form.sellingPrice || !form.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const url = editItemId ? `/api/inventory/${editItemId}` : "/api/inventory";
      const method = editItemId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save inventory item");
      
      toast.success(editItemId ? "Inventory item updated!" : "Inventory item added successfully!");
      setModalOpen(false);
      setEditItemId(null);
      setForm({
        name: "",
        category: INVENTORY_CATEGORIES[0] as string,
        purchasePrice: "",
        sellingPrice: "",
        quantity: "",
        minStock: "10",
        unit: "piece",
      });
      fetchItems();
    } catch {
      toast.error("Failed to save inventory item");
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditItemId(null);
    setForm({
      name: "",
      category: INVENTORY_CATEGORIES[0] as string,
      purchasePrice: "",
      sellingPrice: "",
      quantity: "",
      minStock: "10",
      unit: "piece",
    });
    setModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditItemId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      purchasePrice: item.purchasePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      quantity: item.quantity.toString(),
      minStock: item.minStock.toString(),
      unit: item.unit,
    });
    setModalOpen(true);
  };

  const lowStockItems = items.filter((item) => item.quantity <= item.minStock);

  return (
    <div className="page-shell page-shell-list">
      <PageHeader
        title="Service Master"
        subtitle="Manage services and standard fees"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditItemId(null);
              setForm(defaultForm);
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Service
          </button>
        }
      />

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl flex gap-3 items-start bg-amber-500/10 border border-amber-500/20 text-amber-600">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Low Stock Alert</div>
            <p className="text-xs mt-0.5">
              {lowStockItems.length} inventory products are running below minimum stock alert thresholds.
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
            placeholder="Search inventory by item name or category..."
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={56} className="empty-state-icon" />
          <div className="empty-state-title">No items in stock</div>
          <div className="empty-state-desc">Add your first stationery item to start tracking.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Selling (₹)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</td>
                  <td>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{item.category}</span>
                  </td>
                  <td className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{formatCurrency(item.sellingPrice)}</td>
                  <td className="text-right">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                      title="Edit Item"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-title mb-0">
                {editItemId ? "Edit Service" : "Add Service"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div>
                <label className="label">Service Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Aadhaar Download"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Fees (₹) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions pt-4">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}    </div>
  );
}
