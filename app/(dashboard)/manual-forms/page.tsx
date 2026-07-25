"use client";

import Link from "next/link";
import { FileText, FilePlus2, ChevronRight } from "lucide-react";

export default function ManualFormsDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manual Form Filling</h1>
          <p className="text-slate-500 mt-2 font-medium">Select a category and form type to start filling.</p>
        </div>
      </div>

      {/* Category: Ration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bihar Ration Card (बिहार राशन कार्ड)</h2>
            <p className="text-sm text-slate-500">Official government forms for Bihar Ration Card</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50/50">
          
          {/* Sub-category: New Apply */}
          <Link href="/manual-forms/ration-card/new" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition-all h-full flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 group-hover:scale-110 transition-transform">
                <FilePlus2 size={24} className="stroke-[2]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">नया राशन कार्ड (New Apply)</h3>
                <p className="text-xs text-slate-500 mt-1">Application for generating a completely new ration card.</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Sub-category: Form Kha */}
          <Link href="/manual-forms/ration-card/kha" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition-all h-full flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-110 transition-transform">
                <FileText size={24} className="stroke-[2]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">प्रपत्र ख (Form Kha)</h3>
                <p className="text-xs text-slate-500 mt-1">Application for modification, name addition, or surrender.</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
