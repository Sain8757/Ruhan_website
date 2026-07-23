import React, { useState, useEffect } from "react";
import LegacyDialog from "@/components/layout/LegacyDialog";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ServiceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string | null;
  onSuccess?: () => void;
}

export default function ServiceDetailsDialog({ isOpen, onClose, serviceId, onSuccess }: ServiceDetailsDialogProps) {
  const toast = useToast();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState("PENDING");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && serviceId) {
      setLoading(true);
      fetch(`/api/services/${serviceId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Service not found");
          return res.json();
        })
        .then((data) => {
          setService(data);
          setStatus(data.status);
          setPaymentStatus(data.paymentStatus);
          setPaymentMode(data.paymentMode);
          setNotes(data.notes || "");
          setLoading(false);
        })
        .catch((err) => {
          toast.error(err.message);
          onClose();
        });
    } else {
      setService(null);
    }
  }, [isOpen, serviceId, toast, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          paymentMode,
          notes,
          fees: service.fees,
          requiredDocs: service.requiredDocs,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!service || !service.customer.mobile) return;
    const msg = encodeURIComponent(`Hi ${service.customer.name},\n\nYour service request for *${service.serviceType}* is currently marked as *${status}*.\n\nThank you,\nRA Seva Point`);
    window.open(`https://wa.me/91${service.customer.mobile}?text=${msg}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <LegacyDialog isOpen={isOpen} onClose={onClose} title="Service Properties" width="550px">
      {loading || !service ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <form onSubmit={handleSave} style={{ padding: '8px' }}>
          
          <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
            <legend>Customer Information</legend>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{service.customer.name}</strong><br/>
                Mobile: {service.customer.mobile}<br/>
                {service.customer.email && `Email: ${service.customer.email}`}
              </div>
              <button type="button" onClick={handleSendWhatsApp}>WhatsApp</button>
            </div>
          </fieldset>

          <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
            <legend>Service Information</legend>
            <table style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <tbody>
                <tr>
                  <td style={{ border: 'none', padding: '2px' }}><strong>Service Type:</strong></td>
                  <td style={{ border: 'none', padding: '2px' }}>{service.serviceType}</td>
                  <td style={{ border: 'none', padding: '2px' }}><strong>Fees:</strong></td>
                  <td style={{ border: 'none', padding: '2px' }}>{formatCurrency(service.fees)}</td>
                </tr>
                <tr>
                  <td style={{ border: 'none', padding: '2px' }}><strong>Created At:</strong></td>
                  <td style={{ border: 'none', padding: '2px' }}>{formatDate(service.createdAt)}</td>
                  <td style={{ border: 'none', padding: '2px' }}><strong>Assigned:</strong></td>
                  <td style={{ border: 'none', padding: '2px' }}>{service.assignedTo?.name || "None"}</td>
                </tr>
              </tbody>
            </table>
          </fieldset>

          <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
            <legend>Status Updates</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label>Workflow Status:</label>
                <select style={{ width: '100%' }} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label>Payment Status:</label>
                <select style={{ width: '100%' }} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="legacy-fieldset" style={{ marginBottom: '8px' }}>
            <legend>Notes</legend>
            <textarea
              style={{ width: '100%' }}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </fieldset>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Apply'}</button>
          </div>
        </form>
      )}
    </LegacyDialog>
  );
}
