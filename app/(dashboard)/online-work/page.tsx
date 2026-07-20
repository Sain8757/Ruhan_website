"use client";

import { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { allServicesData } from "./data";

export default function OnlineWorkPage() {
  const [query, setQuery] = useState("");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();

  // Create 44 groups from the 44 services
  const serviceGroups = useMemo(() => {
    return allServicesData.map(service => ({
      title: service.title,
      subtitle: service.description,
      services: [service]
    }));
  }, []);

  const totalServices = serviceGroups.length;

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return serviceGroups;

    return serviceGroups
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => {
          const haystack = [
            service.title,
            service.description,
            service.tag,
          ].join(" ").toLowerCase();

          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.services.length > 0);
  }, [normalizedQuery, serviceGroups]);

  const visibleServices = filteredGroups.reduce((count, group) => count + group.services.length, 0);
  const displayedGroups = normalizedQuery ? filteredGroups : [serviceGroups[activeGroupIndex]];
  const activeGroup = serviceGroups[activeGroupIndex] || serviceGroups[0];

  return (
    <div className="page-shell page-shell-list" id="service-list">
      <div className="border border-[#c7c7c7] bg-white">
        <div className="border-b border-[#c7c7c7] bg-[#5f97c8] px-3 py-2 text-[13px] font-bold text-white">
          Quick Online Services
        </div>

        <div className="p-3 md:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px] lg:items-start" id="service-search">
            <div>
              <h2 className="text-[20px] font-bold leading-tight text-[#003580]">
                {normalizedQuery ? "Search Results" : "Select Category"}
              </h2>
              <p className="mt-1 text-[12px] leading-tight text-[#00428c]">
                {normalizedQuery ? `${visibleServices} service found from ${totalServices}` : "Tap on any category below to view its links"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex min-h-[32px] w-full items-center gap-2 border border-[#9a9a9a] bg-white px-2">
                <Search size={14} className="text-[#00428c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-[12px] text-[#001a78] outline-none placeholder:text-[#55759d]"
                  placeholder="Search: GST, Aadhaar, PAN..."
                />
              </div>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="h-[32px] border border-[#8a8a8a] bg-[#e8e8e8] px-3 text-[12px] font-bold text-[#001a78]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {!normalizedQuery && (
            <nav className="mt-4 grid grid-cols-1 gap-[3px] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {serviceGroups.map((group, index) => (
                <button
                  key={group.title}
                  type="button"
                  onClick={() => {
                    setActiveGroupIndex(index);
                    setQuery("");
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-left text-[12px] font-bold truncate ${
                    !normalizedQuery && activeGroupIndex === index
                      ? "bg-[#b9d4eb] text-[#001a78] shadow-[inset_4px_0_0_#00428c]"
                      : "bg-[#d5d5d5] text-[#001a78] hover:bg-[#c3d8ec]"
                  }`}
                  title={group.title}
                >
                  <span className="truncate pr-2">{group.title}</span>
                </button>
              ))}
            </nav>
          )}

          <section className="mt-4 border border-[#c0c0c0] bg-[#f8f8f8] p-2 md:p-3">
            {displayedGroups.map((group) => (
              <div key={group.title} className="mb-5 last:mb-0">
                {normalizedQuery && (
                  <h3 className="mb-3 border-b border-[#d1d1d1] pb-2 text-[14px] font-bold text-[#003580]">
                    {group.title}
                  </h3>
                )}

                <div className="space-y-3">
                  {group.services.map((service) => {
                    const Icon = service.icon;

                    return (
                      <div
                        key={service.title}
                        className="border border-[#d2d2d2] bg-white px-3 py-3 text-[#003580]"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[#9bbfe0] bg-[#dcecf9] text-[#00428c]">
                              <Icon size={17} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[15px] font-bold text-[#001a78]">
                                  {service.title}
                                </span>
                              </div>
                              <p className="mt-1 max-w-[660px] text-[13px] leading-[1.35] text-[#00428c]">
                                {service.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {service.subLinks && service.subLinks.length > 0 && (
                          <div className="mt-4 border-t border-[#e0e0e0] pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {service.subLinks.map((subLink, i) => (
                                <a
                                  key={i}
                                  href={subLink.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 rounded-lg border border-[#d2d2d2] bg-[#f9fbff] p-2 hover:border-[#5f97c8] hover:bg-[#eaf3fc] transition-colors group"
                                >
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ExternalLink size={12} />
                                  </div>
                                  <span className="text-[12px] font-bold text-[#003580] leading-tight">
                                    {subLink.title}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {displayedGroups.length === 0 && (
              <div className="bg-white p-8 text-center text-[#003580]">
                <p className="text-[15px] font-bold">No service found</p>
                <p className="mt-1 text-[12px]">Try a different keyword.</p>
              </div>
            )}
          </section>

          <div className="mt-3 border border-[#c7c7c7] bg-[#eef6ff] px-3 py-2 text-[12px] leading-tight text-[#00428c]">
            <p>Note:- Links official portals par open hote hain. Form submit karne se pehle URL aur applicant details verify karein.</p>
            <p className="mt-1 font-bold text-[#001a78]">Click on any sub-link above to access the service directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
