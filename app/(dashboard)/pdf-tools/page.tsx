"use client";

import Link from "next/link";
import { PDF_TOOLS } from "@/lib/pdf-tools-config";
import PageHeader from "@/components/layout/PageHeader";

export default function PdfToolsPage() {
  const categories = ["Organize", "Convert", "Security", "Optimize"] as const;

  return (
    <div className="page-shell">
      <PageHeader
        title="PDF Toolkit Suite"
        subtitle="Every tool you need to work with PDFs in one place"
      />

      <div className="space-y-12">
        {categories.map((category) => {
          const tools = PDF_TOOLS.filter((t) => t.category === category);
          if (tools.length === 0) return null;

          return (
            <div key={category} className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-gray-100 pb-2" style={{ color: "var(--text-primary)" }}>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      href={`/pdf-tools/${tool.id}`}
                      className="group flex flex-col items-center text-center bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: "var(--accent)" }} />
                      
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-md transform group-hover:scale-110 transition-transform duration-300 ${tool.color}`}>
                        <Icon size={24} />
                      </div>
                      
                      <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors" style={{ color: "var(--text-primary)" }}>
                        {tool.title}
                      </h3>
                      
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {tool.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
