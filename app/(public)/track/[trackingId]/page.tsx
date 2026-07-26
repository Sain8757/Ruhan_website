import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Truck, FileText, AlertCircle, Calendar } from "lucide-react";

const statusSteps = [
  { id: "PENDING", label: "Received", icon: FileText },
  { id: "PROCESSING", label: "Processing", icon: Clock },
  { id: "SUBMITTED", label: "Submitted", icon: Truck },
  { id: "APPROVED", label: "Approved", icon: CheckCircle2 },
  { id: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

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

  // Determine current step index
  let currentStepIndex = statusSteps.findIndex(s => s.id === service.status);
  if (currentStepIndex === -1 && service.status === "CANCELLED") {
    currentStepIndex = -1; // Cancelled state
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center items-start pt-10">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-1">Service Tracking</h1>
          <p className="text-blue-100 font-mono">ID: {service.trackingId}</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Customer & Service Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{service.serviceType}</h2>
            <p className="text-gray-600 text-sm">Customer: {service.customer.name}</p>
            <p className="text-gray-600 text-sm">Date: {new Date(service.createdAt).toLocaleDateString()}</p>
            
            {service.deadline && (
              <div className="mt-3 flex items-center text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                <Calendar className="w-4 h-4 mr-2" />
                Expected by: {new Date(service.deadline).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Timeline */}
          {service.status === "CANCELLED" ? (
            <div className="text-center p-6 bg-red-50 rounded-lg text-red-600 border border-red-100">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <h3 className="font-bold text-lg">Service Cancelled</h3>
              <p className="text-sm mt-1">Please contact the store for more information.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-gray-200 rounded-full"></div>
              
              <div className="space-y-8 relative">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.id} className="flex items-start">
                      <div 
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm flex-shrink-0 ${
                          isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="ml-4 pt-3 flex-1">
                        <h4 className={`text-base font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </h4>
                        
                        {/* Custom descriptions based on step and status */}
                        {isCurrent && step.id === "PENDING" && (
                          <p className="text-sm text-gray-500 mt-1">Your request has been received and is waiting to be processed.</p>
                        )}
                        {isCurrent && step.id === "PROCESSING" && (
                          <p className="text-sm text-gray-500 mt-1">We are actively working on your request.</p>
                        )}
                        
                        {/* Missing Docs Alert */}
                        {isCurrent && service.missingDocs && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
                              <span className="font-semibold block">Action Required:</span>
                              {service.missingDocs}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            <p>If you have any questions, please contact RSA Seva Point.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
