import React, { useState } from 'react';
import LegacyDialog from '@/components/layout/LegacyDialog';
import { useToast } from '@/contexts/ToastContext';

interface AddCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer?: any) => void;
  zIndex?: number;
  initialSearch?: string;
}

export default function AddCustomerDialog({ isOpen, onClose, onSuccess, zIndex, initialSearch }: AddCustomerDialogProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', address: '',
    aadhaarNumber: '', panNumber: '',
    dob: '', anniversary: '', tags: '', rating: '5'
  });

  // Pre-fill initial input if provided when opened
  React.useEffect(() => {
    if (isOpen) {
      const search = initialSearch?.trim() || '';
      const isMobile = /^[0-9]{1,10}$/.test(search);
      setFormData({
        name: isMobile ? '' : search,
        mobile: isMobile ? search : '',
        email: '', address: '', aadhaarNumber: '', panNumber: '',
        dob: '', anniversary: '', tags: '', rating: '0'
      });
    }
  }, [isOpen, initialSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dob: formData.dob || undefined,
        anniversary: formData.anniversary || undefined,
        rating: formData.rating ? parseInt(formData.rating) : undefined
      };
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to create customer';
        try {
          const json = JSON.parse(errorText);
          if (json.error) errorMsg = json.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const createdCustomer = await response.json();
      toast.success('Customer created successfully');
      setFormData({ name: '', mobile: '', email: '', address: '', aadhaarNumber: '', panNumber: '', dob: '', anniversary: '', tags: '', rating: '5' });
      if (onSuccess) onSuccess(createdCustomer);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    toast.info('AI is reading the document...');
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('AI OCR Failed');
      
      const result = await response.json();
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          name: result.data.name || prev.name,
          mobile: result.data.mobile || prev.mobile,
          address: result.data.address || prev.address,
          aadhaarNumber: result.data.aadhaarNumber || prev.aadhaarNumber,
          panNumber: result.data.panNumber || prev.panNumber,
        }));
        toast.success('Auto-filled via AI!');
      }
    } catch (error: any) {
      toast.error('Failed to parse document');
    } finally {
      setIsSubmitting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <LegacyDialog isOpen={isOpen} onClose={onClose} title="Add New Customer" width="450px" zIndex={zIndex}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* AI Magic Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-4px' }}>
          <label className="legacy-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: '#000080', color: 'white' }}>
            <span>🤖</span> AI Auto-Fill
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isSubmitting} />
          </label>
        </div>

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

        {/* CRM Details */}
        <div className="legacy-fieldset" style={{ marginTop: '4px' }}>
          <div className="legacy-legend">CRM Details</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Date of Birth:</label>
              <input type="date" className="legacy-input" style={{ flex: 1 }}
                value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Anniversary:</label>
              <input type="date" className="legacy-input" style={{ flex: 1 }}
                value={formData.anniversary} onChange={(e) => setFormData({...formData, anniversary: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px' }}>Tags (comma-separated):</label>
              <input type="text" placeholder="e.g. VIP, Regular" className="legacy-input" style={{ flex: 1 }}
                value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginTop: '8px' }}>
          <button type="submit" className="legacy-button" disabled={isSubmitting} style={{ width: '80px' }}>
            <span style={{ color: 'green' }}>✓</span> {isSubmitting ? 'Wait...' : 'OK'}
          </button>
          <button type="button" className="legacy-button" onClick={() => setFormData({name: '', mobile: '', email: '', address: '', aadhaarNumber: '', panNumber: '', dob: '', anniversary: '', tags: '', rating: '5'})} style={{ width: '80px' }}>
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
