import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Search, Clock, CreditCard, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default async function TrackServicePage({ params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params;

  const service = await prisma.service.findUnique({
    where: { trackingId },
    include: {
      customer: { select: { name: true, mobile: true } }
    }
  });

  if (!service) {
    return notFound();
  }

  // Win95 Styles
  const inset: React.CSSProperties = {
    borderTop: '2px solid #808080',
    borderLeft: '2px solid #808080',
    borderRight: '2px solid #ffffff',
    borderBottom: '2px solid #ffffff',
    background: '#ffffff',
  };
  
  const raised: React.CSSProperties = {
    borderTop: '2px solid #ffffff',
    borderLeft: '2px solid #ffffff',
    borderRight: '2px solid #404040',
    borderBottom: '2px solid #404040',
  };

  const formatCurrency = (amt: number) => `₹${amt.toFixed(2)}`;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-10 pb-20"
      style={{ backgroundColor: '#008080', backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}>
      
      <div style={{ ...raised, background: '#d4d0c8', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Title Bar */}
        <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: 'white', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            RA Seva Point Tracker
          </div>
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Header Info */}
            <div style={{ background: 'white', ...inset, padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Hello, {service.customer.name}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '18px', fontWeight: 'bold', color: '#000080', margin: '4px 0', lineHeight: '1.2' }}>{service.serviceType}</div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {format(new Date(service.createdAt), "dd MMM yyyy")}
              </div>
              <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#888', marginTop: '4px' }}>Tracking ID: {service.trackingId}</div>
            </div>

            {/* Status and Payment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              
              {/* Application Status */}
              <div style={{ background: '#e8f0ff', border: '1px solid #aac', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555' }}>App Status</div>
                <div style={{ fontFamily: 'Tahoma', fontSize: '14px', fontWeight: 'bold', color: '#000080', marginTop: '2px' }}>{service.status}</div>
              </div>

              {/* Payment Status */}
              <div style={{ background: service.paymentStatus === 'PAID' ? '#d4edda' : '#fff8e8', border: service.paymentStatus === 'PAID' ? '1px solid #c3e6cb' : '1px solid #cc9', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> Payment</div>
                
                <div style={{ fontFamily: 'Tahoma', fontSize: '13px', fontWeight: 'bold', color: service.paymentStatus === 'PAID' ? '#155724' : '#885500', marginTop: '2px' }}>
                  {service.paymentStatus}
                </div>
                
                <div style={{ fontFamily: 'Tahoma', fontSize: '10px', color: '#333', marginTop: '2px' }}>
                  {service.paymentStatus === 'UNPAID' ? `Due: ${formatCurrency(service.fees)}` : 
                   service.paymentStatus === 'PARTIAL' ? `Partial Paid (Total: ${formatCurrency(service.fees)})` : 
                   `Paid: ${formatCurrency(service.fees)}`}
                </div>
              </div>
            </div>

            {/* Admin Comments (Notes) */}
            {service.notes && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#f5f5f5' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={12} /> Remarks
                </legend>
                <div style={{ fontFamily: 'Tahoma', fontSize: '12px', color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {service.notes}
                </div>
              </fieldset>
            )}

            {/* ACTION REQUIRED: Missing Documents */}
            {service.missingDocs && (
              <fieldset style={{ border: '2px groove #c0c0c0', padding: '8px', background: '#ffebeb' }}>
                <legend style={{ fontFamily: 'Tahoma', fontSize: '11px', padding: '0 4px', color: '#cc0000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> Action Required
                </legend>
                
                <div style={{ fontSize: '12px', color: '#880000', marginBottom: '10px', fontFamily: 'Tahoma', background: 'white', padding: '6px', border: '1px solid #ffcccc' }}>
                  <strong>Required Document:</strong><br/>
                  {service.missingDocs}
                </div>
                
                <p style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#444', textAlign: 'center' }}>
                  Please go to the manual tracker (status portal) to upload your missing documents, or send them via WhatsApp.
                </p>
              </fieldset>
            )}
            
            <p style={{ fontFamily: 'Tahoma', fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '10px' }}>
              Want to upload documents? Go to <strong>/status</strong>
            </p>

          </div>
        </div>

        {/* Status Bar */}
        <div style={{ borderTop: '2px solid #808080', background: '#d4d0c8', padding: '2px 6px', fontSize: '11px', fontFamily: 'Tahoma', color: '#444' }}>
          Universal Tracker Portal v1.0
        </div>
      </div>
    </div>
  );
}
