"use client";

import { useState, useRef } from "react";
import { Ticket, Printer, X, Check, User, Phone, Briefcase, Volume2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { announceTokenInHindi } from "@/lib/voiceAnnouncement";

export interface TokenData {
  tokenNumber: number;
  customerName: string;
  customerMobile: string;
  serviceName: string;
  createdAt: string;
}

interface TokenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenNumber?: number;
}

export default function TokenTicketModal({ isOpen, onClose, initialTokenNumber = 101 }: TokenTicketModalProps) {
  const toast = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [serviceName, setServiceName] = useState("Online Form / Cyber Service");
  const [currentTokenNumber, setCurrentTokenNumber] = useState(initialTokenNumber);
  const [issuedToken, setIssuedToken] = useState<TokenData | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleIssueToken = () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    const tokenData: TokenData = {
      tokenNumber: currentTokenNumber,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim() || "N/A",
      serviceName: serviceName.trim() || "General Counter Service",
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };

    setIssuedToken(tokenData);
    setCurrentTokenNumber((prev) => prev + 1);
    toast.success(`Token #${tokenData.tokenNumber} issued successfully!`);
  };

  const handlePrint = () => {
    if (!issuedToken) return;
    const printWindow = window.open("", "", "width=400,height=600");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Token #${issuedToken.tokenNumber}</title>
          <style>
            body { font-family: monospace, sans-serif; width: 72mm; margin: 0 auto; padding: 10px; text-align: center; color: #000; }
            .header { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .sub { font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .token-box { border: 2px solid #000; padding: 12px; margin: 10px 0; background: #fafafa; }
            .token-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .token-num { font-size: 42px; font-weight: 900; margin: 4px 0; }
            .details { font-size: 12px; text-align: left; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; line-height: 1.6; }
            .footer { font-size: 10px; margin-top: 15px; border-top: 1px solid #000; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">RA SEVA POINT</div>
          <div class="sub">Cyber Cafe & Digital Seva Counter</div>

          <div class="token-box">
            <div class="token-title">YOUR TOKEN NUMBER</div>
            <div class="token-num">#${issuedToken.tokenNumber}</div>
            <div style="font-size: 11px;">Time: ${issuedToken.createdAt}</div>
          </div>

          <div class="details">
            <div><strong>Customer:</strong> ${issuedToken.customerName}</div>
            <div><strong>Mobile:</strong> ${issuedToken.customerMobile}</div>
            <div><strong>Service:</strong> ${issuedToken.serviceName}</div>
          </div>

          <div class="footer">
            <div>Please wait for your token number.</div>
            <div>Thank you for your patience! 🙏</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Title Bar */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Ticket size={22} className="text-yellow-300" />
            <span>Counter Customer Token Slip</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {!issuedToken ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900">Next Token Available:</span>
                <span className="text-2xl font-black text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-300 shadow-xs">
                  #{currentTokenNumber}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User size={14} className="text-slate-500" /> Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone size={14} className="text-slate-500" /> Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="Enter mobile number..."
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Briefcase size={14} className="text-slate-500" /> Requested Service
                </label>
                <select
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-600"
                >
                  <option value="Online Form / Cyber Service">Online Form / Cyber Service</option>
                  <option value="Aadhaar / PAN Service">Aadhaar / PAN Service</option>
                  <option value="Photo Studio / Print">Photo Studio / Print</option>
                  <option value="PVC Card Printing">PVC Card Printing</option>
                  <option value="Lamination & Scanning">Lamination & Scanning</option>
                  <option value="Billing / Cash Counter">Billing / Cash Counter</option>
                </select>
              </div>

              <button
                onClick={handleIssueToken}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Ticket size={18} /> Issue Token Ticket #{currentTokenNumber}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Issued Token Preview Card */}
              <div
                ref={printAreaRef}
                className="p-5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center space-y-3"
              >
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">RA SEVA POINT COUNTER</p>
                <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-xs inline-block w-full">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">TOKEN NUMBER</p>
                  <p className="text-5xl font-black text-blue-700 my-1">#{issuedToken.tokenNumber}</p>
                  <p className="text-[11px] font-bold text-slate-600">Issued at {issuedToken.createdAt}</p>
                </div>

                <div className="text-left text-xs font-bold text-slate-700 space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <p>👤 <strong>Customer:</strong> {issuedToken.customerName}</p>
                  <p>📞 <strong>Mobile:</strong> {issuedToken.customerMobile}</p>
                  <p>🛠️ <strong>Service:</strong> {issuedToken.serviceName}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => announceTokenInHindi(issuedToken.tokenNumber)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Announce token number in Hindi voice"
                >
                  <Volume2 size={16} /> Announce Token
                </button>

                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Printer size={16} /> Print Token Slip
                </button>

                <button
                  onClick={() => setIssuedToken(null)}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ticket size={14} /> Issue Next Token
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
