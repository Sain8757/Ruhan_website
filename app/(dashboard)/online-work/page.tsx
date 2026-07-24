"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, ExternalLink, Link as LinkIcon, Loader2, X, Copy, Check, Sparkles, Globe } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function OnlineWorkPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category Modal Popup State
  const [activeCategoryModal, setActiveCategoryModal] = useState<any | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    fetch("/api/online-services")
      .then((res) => res.json())
      .then((data) => {
        setServicesData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const serviceGroups = useMemo(() => {
    return servicesData.map((service) => {
      // Remove leading numbers like "1. ", "2. " from title for clean display
      const cleanTitle = service.title.replace(/^\d+\.\s*/, "");
      return {
        id: service.id,
        title: cleanTitle,
        subtitle: service.description || "Official portal links & online services",
        links: service.links || [],
        raw: service,
      };
    });
  }, [servicesData]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return serviceGroups;

    return serviceGroups.filter((group) => {
      const haystack = [
        group.title,
        group.subtitle,
        ...(group.links || []).map((l: any) => l.title + " " + (l.href || "")),
      ].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, serviceGroups]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="page-shell page-shell-list" id="service-list">
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="border-b border-blue-600/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3.5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Globe size={19} className="text-blue-200" />
            <h1 className="text-sm font-bold tracking-wide uppercase">Quick Online Work & Govt Portals Hub</h1>
          </div>
          <span className="text-xs bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full font-bold">
            {serviceGroups.length} Portals Available
          </span>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={17} className="text-blue-600" />
                Select Portal Category
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any category to view official portal links and direct access
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: Aadhaar, PAN, Voter, RTPS..."
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Clean Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => setActiveCategoryModal(group)}
                className="group p-4 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80">
                      {group.links.length} Links
                    </span>
                    <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {group.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {group.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                    Click for Direct Links
                  </span>
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-xs font-bold">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="font-bold text-slate-700">No portal category matching "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for Aadhaar, PAN, Voter, or RTPS</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Clean Category Popup Modal ── */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base text-white leading-tight">
                  {activeCategoryModal.title}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {activeCategoryModal.links.length} Official Direct Links
                </p>
              </div>
              <button
                onClick={() => setActiveCategoryModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Description */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0 text-xs text-slate-600 flex items-center gap-2">
              <LinkIcon size={14} className="text-blue-600 shrink-0" />
              <span>{activeCategoryModal.subtitle}</span>
            </div>

            {/* Modal Content Links */}
            <div className="p-5 overflow-y-auto space-y-2.5 grow">
              {activeCategoryModal.links && activeCategoryModal.links.length > 0 ? (
                activeCategoryModal.links.map((link: any, idx: number) => (
                  <div
                    key={link.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                        {link.href}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleCopyLink(link.href, link.id || `${idx}`)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                        title="Copy Link URL"
                      >
                        {copiedLinkId === (link.id || `${idx}`) ? (
                          <>
                            <Check size={13} className="text-green-600" />
                            <span className="text-green-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            Copy
                          </>
                        )}
                      </button>

                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        Open Portal
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                  No links added for this category yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
              <span>⚠️ Verify URL before submitting applicant details.</span>
              <button
                onClick={() => setActiveCategoryModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
