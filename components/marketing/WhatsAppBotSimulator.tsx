"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2, Sparkles, PhoneCall, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function WhatsAppBotSimulator({ customers }: { customers: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Namaste! 🙏 Welcome to *RA Seva Point AI Customer Support*.\n\nHow can I help you today? You can ask about:\n• *Application Status*\n• *Required Documents*\n• *Pending Dues*\n• *Shop Timings*",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    "Mera application status kya hai?",
    "Aadhaar card update me kya docs chahiye?",
    "Mera bill kitna bacha hai?",
    "Dukaan kab khulti hai?",
  ];

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/whatsapp/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          mobile: selectedCustomer,
        }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Namaste! Thank you for contacting RA Seva Point.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "⚠️ System busy. Please try again later.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "1",
        sender: "bot",
        text: "Namaste! 🙏 Welcome to *RA Seva Point AI Customer Support*.\n\nHow can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="legacy-fieldset bg-white shadow-sm rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-base">
              AI WhatsApp Bot Simulator
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-medium border border-emerald-300">
                Live Preview
              </span>
            </h3>
            <p className="text-xs text-slate-500">Test how the AI assistant handles customer queries</p>
          </div>
        </div>

        <button
          onClick={resetChat}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 border px-2 py-1 rounded bg-slate-50 hover:bg-slate-100"
        >
          <RefreshCw size={12} /> Clear Chat
        </button>
      </div>

      {/* Customer Selector */}
      <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <User size={14} className="text-slate-500" />
          Simulate as Customer:
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="text-xs border rounded p-1.5 bg-white text-slate-800 font-medium flex-1 min-w-[200px]"
        >
          <option value="">-- Guest / Unregistered Customer --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.mobile}>
              {c.name} ({c.mobile})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Prompts */}
      <div className="mb-3">
        <span className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-500" /> Quick Sample Questions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp Window Shell */}
      <div className="border border-emerald-800/30 rounded-xl overflow-hidden shadow-lg bg-[#efeae2] max-w-2xl mx-auto">
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] text-white p-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-white text-sm">
              RA
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="font-bold text-sm leading-none">RA Seva Point Support AI</div>
            <div className="text-[10px] text-emerald-200 mt-0.5">Online • Automated Support</div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="p-3 min-h-[260px] max-h-[360px] overflow-y-auto space-y-3 font-sans">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-sm relative leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-[#dcf8c6] text-slate-900 rounded-tr-none"
                    : "bg-white text-slate-900 rounded-tl-none border border-slate-200"
                }`}
              >
                {msg.text}
                <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-sm flex items-center gap-2 text-slate-600">
                <Loader2 size={14} className="animate-spin text-emerald-600" />
                <span>AI Assistant is typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input Footer */}
        <div className="p-2 bg-[#f0f2f5] border-t border-slate-300 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message (e.g. status check)..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
            className="flex-1 text-xs border-none outline-none bg-white p-2.5 rounded-full shadow-inner text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="w-8 h-8 rounded-full bg-[#128c7e] hover:bg-[#075e54] text-white flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 shadow"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
