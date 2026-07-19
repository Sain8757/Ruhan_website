"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ExpenseTab from "./components/ExpenseTab";
import IncomeTab from "./components/IncomeTab";
import VendorTab from "./components/VendorTab";
import DailyClosingTab from "./components/DailyClosingTab";
import { ArrowDownCircle, ArrowUpCircle, Briefcase, TrendingUp } from "lucide-react";

type Tab = "expenses" | "income" | "vendors" | "daily";

export default function KhataBookPage() {
  const [activeTab, setActiveTab] = useState<Tab>("daily");

  return (
    <div className="page-shell page-shell-dashboard">
      <PageHeader 
        title="Khata Book" 
        subtitle="Complete shop accounts, udhaar, and daily cash tracking" 
      />

      <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("daily")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "daily" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <TrendingUp size={18} /> Daily Closing
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "expenses" ? "bg-rose-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ArrowDownCircle size={18} /> Expenses
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "income" ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ArrowUpCircle size={18} /> Extra Income
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "vendors" ? "bg-indigo-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Briefcase size={18} /> Vendor Udhaar
        </button>
      </div>

      <div className="mt-2">
        {activeTab === "daily" && <DailyClosingTab />}
        {activeTab === "expenses" && <ExpenseTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "vendors" && <VendorTab />}
      </div>
    </div>
  );
}
