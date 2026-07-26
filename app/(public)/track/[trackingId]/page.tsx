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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-blue-50/30 to-indigo-50 p-4 md:p-8 flex justify-center items-start pt-10 font-sans">
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden transition-all">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white text-center overflow-hidden">
          {/* Decorative background circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 translate-y-10"></div>
          
          <h1 className="relative z-10 text-3xl font-extrabold tracking-tight mb-2 drop-shadow-md">Service Tracking</h1>
          <div className="relative z-10 inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <p className="text-white/90 font-mono text-sm tracking-widest">ID: {service.trackingId}</p>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {/* Customer & Service Info */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 mb-10 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Service Requested</p>
                <h2 className="text-xl font-bold text-slate-800">{service.serviceType}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date</p>
                <p className="text-sm font-semibold text-slate-700">{new Date(service.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {service.customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{service.customer.name}</p>
                <p className="text-xs text-slate-500">Applicant</p>
              </div>
            </div>
            
            {service.deadline && (
              <div className="mt-4 flex items-center justify-center text-sm font-bold text-orange-700 bg-orange-50 border border-orange-100 px-4 py-2.5 rounded-lg shadow-inner">
                <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                Expected Completion: {new Date(service.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Timeline */}
          {service.status === "CANCELLED" ? (
            <div className="text-center p-8 bg-gradient-to-b from-red-50 to-white rounded-2xl text-red-600 border border-red-100 shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-extrabold text-xl mb-1">Service Cancelled</h3>
              <p className="text-sm text-red-400 mt-2">This service request has been cancelled. Please contact the store for more information.</p>
            </div>
          ) : (
            <div className="relative pl-2">
              {/* Vertical line background */}
              <div className="absolute left-[27px] top-6 bottom-8 w-1 bg-slate-100 rounded-full"></div>
              
              {/* Animated Progress Line */}
              <div 
                className="absolute left-[27px] top-6 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                style={{ height: currentStepIndex > 0 ? `calc(${(currentStepIndex / (statusSteps.length - 1)) * 100}% - 24px)` : '0%' }}
              ></div>
              
              <div className="space-y-10 relative">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.id} className={`flex items-start transition-all duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                      <div className="relative">
                        {isCurrent && (
                          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20 scale-150"></div>
                        )}
                        <div 
                          className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full shadow-md flex-shrink-0 transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' 
                              : 'bg-white text-slate-300 border-2 border-slate-200'
                          } ${isCurrent ? 'ring-4 ring-blue-100 ring-offset-2 scale-110' : ''}`}
                        >
                          <Icon className={`w-6 h-6 ${isCompleted && !isCurrent ? 'opacity-90' : ''}`} />
                        </div>
                      </div>
                      
                      <div className={`ml-6 pt-3 flex-1 transition-all duration-300 ${isCurrent ? '-translate-y-1' : ''}`}>
                        <h4 className={`text-lg font-bold tracking-tight ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </h4>
                        
                        {/* Custom descriptions based on step and status */}
                        {isCurrent && step.id === "PENDING" && (
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                            Your request has been successfully received by our team and is currently in queue.
                          </p>
                        )}
                        {isCurrent && step.id === "PROCESSING" && (
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                            Our team is actively processing your documents and preparing the application.
                          </p>
                        )}
                        {isCurrent && step.id === "SUBMITTED" && (
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                            Your application has been submitted to the respective authority.
                          </p>
                        )}
                        
                        {/* Missing Docs Alert */}
                        {isCurrent && service.missingDocs && (
                          <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 flex items-start shadow-sm">
                            <div className="bg-white p-1.5 rounded-full shadow-sm mr-3">
                              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            </div>
                            <div className="text-sm text-red-800">
                              <span className="font-bold block text-red-900 mb-1">Action Required</span>
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
          <div className="mt-12 pt-6 border-t border-slate-100 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-slate-500 font-medium">Powered by RA Seva Point</p>
            <p className="text-xs text-slate-400">If you have any questions, please contact our support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
