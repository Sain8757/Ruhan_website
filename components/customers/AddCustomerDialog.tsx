import React, { useState } from 'react';
import LegacyDialog from '@/components/layout/LegacyDialog';
import { useToast } from '@/contexts/ToastContext';

interface AddCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddCustomerDialog({ isOpen, onClose, onSuccess }: AddCustomerDialogProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    aadhaarNumber: '',
    panNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create customer');
      }

      showToast('Customer created successfully', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LegacyDialog isOpen={isOpen} onClose={onClose} title="Add New Customer" width="450px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Customer Details Fieldset */}
        <div className="legacy-fieldset" style={{ marginTop: '12px' }}>
          <div className="legacy-legend">Customer Details</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Full Name *:</label>
              <input 
                type="text" 
                required 
                className="legacy-input" 
                style={{ flex: 1 }}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Mobile Number *:</label>
              <input 
                type="text" 
                required 
                pattern="[0-9]{10}"
                title="10 digit mobile number"
                className="legacy-input" 
                style={{ flex: 1 }}
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Email Address:</label>
              <input 
                type="email" 
                className="legacy-input" 
                style={{ flex: 1 }}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <label style={{ width: '120px', marginTop: '2px' }}>Address:</label>
              <textarea 
                className="legacy-input" 
                style={{ flex: 1, height: '40px', resize: 'none' }}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Identity Fieldset */}
        <div className="legacy-fieldset" style={{ marginTop: '4px' }}>
          <div className="legacy-legend">Identity Documents</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Aadhaar Number:</label>
              <input 
                type="text" 
                pattern="[0-9]{12}"
                title="12 digit Aadhaar number"
                className="legacy-input" 
                style={{ flex: 1 }}
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>PAN Number:</label>
              <input 
                type="text" 
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                title="Valid PAN format (e.g. ABCDE1234F)"
                style={{ textTransform: 'uppercase', flex: 1 }}
                className="legacy-input" 
                value={formData.panNumber}
                onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginTop: '8px' }}>
          <button type="submit" className="legacy-button" disabled={isSubmitting} style={{ width: '80px' }}>
            <span style={{ color: 'green' }}>✓</span> {isSubmitting ? 'Wait...' : 'OK'}
          </button>
          <button type="button" className="legacy-button" onClick={() => setFormData({name: '', mobile: '', email: '', address: '', aadhaarNumber: '', panNumber: ''})} style={{ width: '80px' }}>
            <span style={{ color: 'red' }}>⊗</span> Clear
          </button>
          <button type="button" className="legacy-button" onClick={onClose} style={{ marginLeft: 'auto', width: '80px' }}>
            Cancel
          </button>
        </div>

      </form>
    </LegacyDialog>
  );
}
