import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils";
import LegacyDialog from "@/components/layout/LegacyDialog";

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

// ── Inventory Autocomplete Dropdown (Legacy Style) ──────────────────────────
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

  useEffect(() => {
    if (!value.trim() || value.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/inventory?q=${encodeURIComponent(value)}`);
        const data: InventorySuggestion[] = await res.json();
        setSuggestions(data.slice(0, 8));
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

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
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        type="text"
        className="legacy-input"
        style={{ width: '100%' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        required
      />

      {open && suggestions.length > 0 && (
        <div style={{
            position: 'absolute', zIndex: 50, width: '100%', marginTop: '2px',
            background: '#fff', border: '1px solid black', boxShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            maxHeight: '150px', overflowY: 'auto'
          }}
        >
          {suggestions.map((item, i) => (
            <div
              key={item.id}
              style={{
                padding: '2px 4px',
                background: activeIdx === i ? '#0a246a' : 'transparent',
                color: activeIdx === i ? '#fff' : '#000',
                cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between'
              }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              <span>{item.name}</span>
              <span style={{ fontSize: '9px' }}>₹{item.sellingPrice} ({item.quantity} left)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dialog ────────────────────────────────────────────────────────────────

interface NewBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewBillDialog({ isOpen, onClose, onSuccess }: NewBillDialogProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [items, setItems] = useState<InvoiceItemInput[]>([{ name: "", quantity: 1, price: 0 }]);
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
      const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}&limit=5`);
      const data = await res.json();
      setCustomers(data.customers || []);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal - discount + (subtotal * gst) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return toast.error("Please select a customer");
    if (items.some((item) => !item.name.trim() || item.quantity <= 0 || item.price < 0)) {
      return toast.error("Please fill in all item fields correctly");
    }
    
    setLoading(true);
    let finalAmountPaid = paymentStatus === "PAID" ? total : paymentStatus === "PARTIAL" ? (Number(amountPaid) || 0) : 0;

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items, discount, gst, paymentMode, paymentStatus,
          amountPaid: finalAmountPaid, notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      const invoice = await res.json();
      toast.success("Invoice created successfully!");
      if (onSuccess) onSuccess();
      onClose();
      // Optional: open the newly created invoice page in the background or show a view button.
      // We will just close the modal for now since they wanted to stay on the same page.
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LegacyDialog isOpen={isOpen} onClose={onClose} title="New Invoice / Bill" width="600px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Customer Fieldset */}
        <div className="legacy-fieldset" style={{ marginTop: '12px' }}>
          <div className="legacy-legend">Customer Selection</div>
          
          {selectedCustomer ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{selectedCustomer.name}</strong> - {selectedCustomer.mobile}
              </div>
              <button type="button" className="legacy-button" onClick={() => setSelectedCustomer(null)}>Change</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '60px' }}>Search:</label>
                <input
                  type="text"
                  className="legacy-input"
                  style={{ flex: 1 }}
                  placeholder="Name or Mobile..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {customers.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 10, width: 'calc(100% - 60px)', left: '60px', top: '100%', background: '#fff', border: '1px solid black', maxHeight: '100px', overflowY: 'auto' }}>
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      style={{ padding: '2px 4px', cursor: 'pointer', borderBottom: '1px solid #dfdfdf' }}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomers([]); }}
                    >
                      {c.name} ({c.mobile})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice Items Fieldset */}
        <div className="legacy-fieldset">
          <div className="legacy-legend">Invoice Items</div>
          <table className="legacy-grid">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ width: '15%' }}>Qty</th>
                <th style={{ width: '20%' }}>Price</th>
                <th style={{ width: '10%' }}>Total</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <ItemNameInput
                      index={index}
                      value={item.name}
                      onChange={(val) => {
                        const updated = [...items]; updated[index].name = val; setItems(updated);
                      }}
                      onSelectInventory={(invItem) => {
                        const updated = [...items]; updated[index].name = invItem.name; updated[index].price = invItem.sellingPrice; setItems(updated);
                      }}
                    />
                  </td>
                  <td>
                    <input type="number" className="legacy-input" style={{ width: '100%' }} min="1"
                      value={item.quantity} onChange={(e) => { const updated = [...items]; updated[index].quantity = parseInt(e.target.value)||0; setItems(updated); }} />
                  </td>
                  <td>
                    <input type="number" className="legacy-input" style={{ width: '100%' }} min="0" step="0.01"
                      value={item.price||""} onChange={(e) => { const updated = [...items]; updated[index].price = parseFloat(e.target.value)||0; setItems(updated); }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(item.quantity * item.price).toFixed(2)}
                  </td>
                  <td>
                    <button type="button" className="legacy-button" style={{ padding: '0 4px' }} disabled={items.length === 1}
                      onClick={() => setItems(items.filter((_, i) => i !== index))}>X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="legacy-button" style={{ marginTop: '4px' }} onClick={() => setItems([...items, { name: "", quantity: 1, price: 0 }])}>
            + Add Item
          </button>
        </div>

        {/* Summary & Payment */}
        <div className="legacy-fieldset">
          <div className="legacy-legend">Summary & Payment</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Left side calculations */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Discount:</label>
                <input type="number" className="legacy-input" style={{ width: '60px', textAlign: 'right' }} value={discount||""} onChange={(e) => setDiscount(parseFloat(e.target.value)||0)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>GST (%):</label>
                <input type="number" className="legacy-input" style={{ width: '60px', textAlign: 'right' }} value={gst||""} onChange={(e) => setGst(parseFloat(e.target.value)||0)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #808080', paddingTop: '2px', fontWeight: 'bold' }}>
                <label>Grand Total:</label>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            {/* Right side payment status */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Mode:</label>
                <select className="legacy-input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Status:</label>
                <select className="legacy-input" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); if(e.target.value !== "PARTIAL") setAmountPaid(""); }}>
                  <option value="PAID">Paid</option><option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option>
                </select>
              </div>
              {paymentStatus === "PARTIAL" && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Paid Amt:</label>
                  <input type="number" className="legacy-input" style={{ width: '60px', textAlign: 'right' }} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value===""?"":parseFloat(e.target.value))} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <button type="submit" className="legacy-button" disabled={loading} style={{ width: '100px', fontWeight: 'bold' }}>
            <span style={{ color: 'green', marginRight: '4px' }}>✓</span> {loading ? 'Saving...' : 'OK'}
          </button>
          <button type="button" className="legacy-button" onClick={onClose} style={{ width: '100px' }}>
            <span style={{ color: 'red', marginRight: '4px' }}>⊗</span> Cancel
          </button>
        </div>

      </form>
    </LegacyDialog>
  );
}
