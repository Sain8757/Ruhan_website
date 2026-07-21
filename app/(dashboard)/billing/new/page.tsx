"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Search, Plus, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";

interface InvoiceItemInput {
  name: string;
  quantity: number;
  price: number;
}

interface InventorySuggestion {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
  category: string;
}

// ── Inventory Autocomplete Dropdown (per item row) ──────────────────────────
function ItemNameInput({
  index,
  value,
  onChange,
  onSelectInventory,
}: {
  index: number;
  value: string;
  onChange: (val: string) => void;
  onSelectInventory: (item: InventorySuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<InventorySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search against inventory API
  useEffect(() => {
    if (!value.trim() || value.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/inventory?q=${encodeURIComponent(value)}`
        );
        const data: InventorySuggestion[] = await res.json();
        setSuggestions(data.slice(0, 8)); // max 8 suggestions
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: InventorySuggestion) => {
    onSelectInventory(item);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input
        type="text"
        className="input-field w-full"
        placeholder="e.g. Black Pen, Passport Photo..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        required
      />

      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl border overflow-hidden shadow-xl"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {suggestions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors"
              style={{
                background:
                  activeIdx === i ? "var(--bg-secondary)" : "transparent",
              }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                handleSelect(item);
              }}
            >
              {/* Icon */}
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(79,110,247,0.10)",
                  color: "var(--brand-primary)",
                }}
              >
                <Package size={14} />
              </span>

              {/* Name + Category */}
              <span className="flex-1 min-w-0">
                <span
                  className="block text-sm font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.name}
                </span>
                <span
                  className="block text-xs truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.category}
                </span>
              </span>

              {/* Price + Stock */}
              <span className="text-right shrink-0">
                <span
                  className="block text-sm font-bold"
                  style={{ color: "var(--brand-primary)" }}
                >
                  ₹{item.sellingPrice.toLocaleString("en-IN")}
                </span>
                <span
                  className="block text-[10px] font-semibold"
                  style={{
                    color:
                      item.quantity <= 0
                        ? "#f43f5e"
                        : item.quantity <= 5
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                >
                  {item.quantity <= 0
                    ? "Out of stock"
                    : `${item.quantity} ${item.unit} left`}
                </span>
              </span>
            </button>
          ))}

          {/* Footer hint */}
          <div
            className="px-4 py-2 text-[10px] border-t flex items-center gap-1"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border-secondary)",
              background: "var(--bg-secondary)",
            }}
          >
            <span>↑↓ navigate</span>
            <span className="mx-1">·</span>
            <span>Enter select</span>
            <span className="mx-1">·</span>
            <span>Esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NewInvoicePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { name: "", quantity: 1, price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  // Customer search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/customers?q=${encodeURIComponent(customerSearch)}&limit=5`
      );
      const data = await res.json();
      setCustomers(data.customers || []);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const handleAddItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemNameChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].name = val;
    setItems(updated);
  };

  const handleItemChange = (
    index: number,
    field: "quantity" | "price",
    value: string
  ) => {
    const updated = [...items];
    if (field === "quantity") {
      updated[index].quantity = parseInt(value) || 0;
    } else {
      updated[index].price = parseFloat(value) || 0;
    }
    setItems(updated);
  };

  // When inventory item is selected from dropdown
  const handleSelectInventory = (
    index: number,
    invItem: InventorySuggestion
  ) => {
    const updated = [...items];
    updated[index].name = invItem.name;
    updated[index].price = invItem.sellingPrice;
    setItems(updated);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const total = subtotal - discount + (subtotal * gst) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (
      items.some(
        (item) => !item.name.trim() || item.quantity <= 0 || item.price < 0
      )
    ) {
      toast.error("Please fill in all item fields correctly");
      return;
    }
    setLoading(true);
    let finalAmountPaid = 0;
    if (paymentStatus === "PAID") {
      finalAmountPaid = total;
    } else if (paymentStatus === "PARTIAL") {
      finalAmountPaid = Number(amountPaid) || 0;
    } else {
      finalAmountPaid = 0;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items,
          discount,
          gst,
          paymentMode,
          paymentStatus: paymentStatus,
          amountPaid: finalAmountPaid,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      const invoice = await res.json();
      toast.success("Invoice created successfully!");
      router.push(`/billing/${invoice.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell page-shell-invoice">
      <PageHeader
        title="Create Invoice"
        subtitle="Generate a new billing invoice"
        backHref="/billing"
      />

      <form onSubmit={handleSubmit} className="content-grid-wide">
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="glass-card p-6">
            <h2 className="section-title">Select Customer</h2>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedCustomer.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {selectedCustomer.mobile}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost p-1"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search customer by name or mobile number..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoComplete="off"
                />
                {customers.length > 0 && (
                  <div
                    className="absolute z-10 w-full mt-1 rounded-xl shadow-lg border overflow-hidden"
                    style={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border-primary)",
                    }}
                  >
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch("");
                          setCustomers([]);
                        }}
                      >
                        <div
                          className="font-semibold text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.name}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {c.mobile}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <Link
                    href="/customers/new"
                    className="text-xs"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    + Register new customer
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="glass-card p-6" style={{ overflow: "visible" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title mb-0">Invoice Items</h2>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  {/* Item Name with Autocomplete */}
                  <div className="flex-1">
                    {index === 0 && (
                      <label className="label flex items-center gap-1.5">
                        <Package size={12} />
                        Item Name / Description
                      </label>
                    )}
                    <ItemNameInput
                      index={index}
                      value={item.name}
                      onChange={(val) => handleItemNameChange(index, val)}
                      onSelectInventory={(invItem) =>
                        handleSelectInventory(index, invItem)
                      }
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-20">
                    {index === 0 && <label className="label">Qty</label>}
                    <input
                      type="number"
                      className="input-field"
                      placeholder="1"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="w-28">
                    {index === 0 && <label className="label">Price (₹)</label>}
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={item.price || ""}
                      onChange={(e) =>
                        handleItemChange(index, "price", e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Row Total */}
                  <div className="w-24 shrink-0" style={{ marginBottom: "2px" }}>
                    {index === 0 && (
                      <label className="label">Total</label>
                    )}
                    <div
                      className="input-field text-right font-bold text-sm"
                      style={{
                        color: "var(--brand-primary)",
                        background: "rgba(79,110,247,0.05)",
                        cursor: "default",
                      }}
                    >
                      ₹{(item.quantity * item.price).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="btn-ghost p-2 rounded-xl text-red-500 hover:bg-red-500/10 shrink-0"
                    style={{ marginBottom: "2px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add New Item
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Summary Side Panel */}
        <div className="control-rail">
          <div className="glass-card p-6">
            <h2 className="section-title">Invoice Summary</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="input-field"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
              </div>


              <hr style={{ borderColor: "var(--border-primary)" }} />

              <div>
                <label className="label">Discount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={discount || ""}
                  onChange={(e) =>
                    setDiscount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div>
                <label className="label">GST (%)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={gst || ""}
                  onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
                />
              </div>

              <hr style={{ borderColor: "var(--border-primary)" }} />

              {/* Totals */}
              <div
                className="space-y-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                {gst > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({gst}%)</span>
                    <span>
                      {formatCurrency((subtotal * gst) / 100)}
                    </span>
                  </div>
                )}
                <hr style={{ borderColor: "var(--border-primary)" }} />
                <div
                  className="flex justify-between font-bold text-lg"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span>Grand Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              <hr style={{ borderColor: "var(--border-primary)" }} />
              
              <div>
                <label className="label">Payment Status</label>
                <select
                  className="input-field font-semibold"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    if (e.target.value !== "PARTIAL") {
                      setAmountPaid("");
                    }
                  }}
                >
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partially Paid</option>
                </select>
              </div>

              {paymentStatus === "PARTIAL" && (
                <div>
                  <label className="label text-emerald-600">Amount Paid (₹)</label>
                  <input
                    type="number"
                    className="input-field font-bold text-emerald-600 border-emerald-200 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500/20"
                    placeholder="Enter amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </div>
              )}

              {paymentStatus === "PARTIAL" && Number(amountPaid) < total && (
                <div className="flex justify-between text-red-500 font-semibold text-sm">
                  <span>Balance Due</span>
                  <span>{formatCurrency(total - (Number(amountPaid) || 0))}</span>
                </div>
              )}
              {paymentStatus === "UNPAID" && (
                <div className="flex justify-between text-red-500 font-semibold text-sm mt-2">
                  <span>Balance Due</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save & Print
                </>
              )}
            </button>
          </div>

          <div className="glass-card p-6">
            <h2 className="section-title">Invoice Notes</h2>
            <textarea
              className="input-field resize-none text-xs"
              placeholder="Terms & conditions or other details..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
