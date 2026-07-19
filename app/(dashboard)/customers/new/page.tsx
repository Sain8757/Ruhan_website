"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, Phone, Mail, MapPin, CreditCard, StickyNote } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import PageHeader from "@/components/layout/PageHeader";

export default function NewCustomerPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      toast.error("Name and mobile number are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create customer");
      }
      const customer = await res.json();
      toast.success("Customer created successfully!");
      router.push(`/customers/${customer.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell page-shell-form">
      <PageHeader
        title="New Customer"
        subtitle="Add a new customer profile"
        backHref="/customers"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6">
          <h2 className="section-title flex items-center gap-2">
            <User size={18} style={{ color: "var(--brand-primary)" }} />
            Basic Information
          </h2>
          <div className="form-grid form-grid-2">
            <div>
              <label className="label">Full Name *</label>
              <input
                name="name"
                type="text"
                className="input-field"
                placeholder="Rajesh Kumar"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  name="mobile"
                  type="tel"
                  className="input-field pl-9"
                  placeholder="9876543210"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3" style={{ color: "var(--text-muted)" }} />
                <input
                  name="address"
                  type="text"
                  className="input-field pl-9"
                  placeholder="Village, District, State"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="section-title flex items-center gap-2">
            <StickyNote size={18} style={{ color: "var(--brand-primary)" }} />
            Notes
          </h2>
          <textarea
            name="notes"
            className="input-field resize-none"
            placeholder="Any additional notes about this customer..."
            rows={3}
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/customers" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
