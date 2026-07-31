"use client";

import { ExternalLink, Copy, Globe, ShieldCheck } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export interface GovtPortal {
  id: string;
  name: string;
  category: string;
  url: string;
  iconBg: string;
  description: string;
}

export const GOVT_PORTALS: GovtPortal[] = [
  {
    id: "uidai",
    name: "UIDAI MyAadhaar",
    category: "Aadhaar",
    url: "https://myaadhaar.uidai.gov.in/",
    iconBg: "from-amber-600 to-red-600",
    description: "Download Aadhaar, Update Address, Order PVC Card",
  },
  {
    id: "incometax",
    name: "Income Tax (e-Filing & PAN)",
    category: "PAN Card",
    url: "https://www.incometax.gov.in/iec/foportal/",
    iconBg: "from-blue-600 to-indigo-700",
    description: "Instant e-PAN, Link Aadhaar-PAN, File ITR",
  },
  {
    id: "nsdl_pan",
    name: "Protean (NSDL) PAN Portal",
    category: "PAN Card",
    url: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
    iconBg: "from-indigo-600 to-purple-700",
    description: "New PAN Card, PAN Correction & Reprint",
  },
  {
    id: "epfo",
    name: "EPFO Member Passbook Portal",
    category: "PF / Pension",
    url: "https://passbook.epfindia.gov.in/MemberPassBook/Login",
    iconBg: "from-emerald-600 to-teal-700",
    description: "Check PF Balance, Claim Status & Passbook",
  },
  {
    id: "serviceplus",
    name: "Bihar RTPS (ServicePlus)",
    category: "Certificates",
    url: "https://serviceonline.bihar.gov.in/",
    iconBg: "from-red-600 to-rose-700",
    description: "Income, Caste, Residence, Non-Creamy Layer Certificates",
  },
  {
    id: "nvsp",
    name: "Voter Service Portal (ECI)",
    category: "Voter ID",
    url: "https://voters.eci.gov.in/",
    iconBg: "from-cyan-600 to-blue-700",
    description: "New Voter Registration, Correction, Download e-EPIC",
  },
  {
    id: "pmkisan",
    name: "PM-Kisan Samman Nidhi",
    category: "Farmer",
    url: "https://pmkisan.gov.in/",
    iconBg: "from-green-600 to-emerald-800",
    description: "Farmer e-KYC, Status Check, New Registration",
  },
  {
    id: "sarathi",
    name: "Parivahan (Sarathi DL & RC)",
    category: "Transport",
    url: "https://parivahan.gov.in/parivahan/",
    iconBg: "from-slate-700 to-slate-900",
    description: "Learner License, Driving License, RC Status",
  },
  {
    id: "passport",
    name: "Passport Seva Portal",
    category: "Passport",
    url: "https://www.passportindia.gov.in/",
    iconBg: "from-blue-800 to-blue-950",
    description: "Fresh Passport Application, Tatkaal, Appointment",
  },
  {
    id: "csc_portal",
    name: "Digital Seva CSC Connect",
    category: "CSC Seva",
    url: "https://digitalseva.csc.gov.in/",
    iconBg: "from-orange-600 to-amber-700",
    description: "VLE Login, CSC Wallet Recharge, All CSC Services",
  },
];

export default function GovtPortalsLauncher() {
  const toast = useToast();

  const handleCopyUrl = async (url: string, name: string) => {
    await navigator.clipboard.writeText(url);
    toast.success(`${name} portal URL copied!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
          <Globe size={18} className="text-blue-600" />
          <span>CSC & Govt Portals Quick Launcher</span>
        </div>
        <span className="text-xs font-bold text-slate-500">{GOVT_PORTALS.length} Direct Portals</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {GOVT_PORTALS.map((portal) => (
          <div
            key={portal.id}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {portal.category}
                </span>
                <button
                  onClick={() => handleCopyUrl(portal.url, portal.name)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Copy Portal URL"
                >
                  <Copy size={13} />
                </button>
              </div>

              <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {portal.name}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-2 leading-snug">
                {portal.description}
              </p>
            </div>

            <a
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2 bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Open Portal</span>
              <ExternalLink size={12} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
