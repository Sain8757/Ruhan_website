"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! Main RA Seva Point ka AI Assistant hoon. Aapko shop details chahiye ya koi naya business idea, puchiye!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

      setMessages([...newMessages, data]);
    } catch (error: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif", fontSize: "12px" }}>
      <div style={{ width: "520px", maxWidth: "95vw", height: "480px", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "#d4d0c8", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", outline: "1px solid #808080" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(90deg, #000080, #1084d0)", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="white" />
            <span style={{ fontWeight: "bold", fontSize: "12px" }}>RA Seva AI</span>
            <span style={{ fontSize: "10px", color: "#c0d8f0", marginLeft: "8px" }}>Powered by Gemini</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: "#d4d0c8", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040", width: "16px", height: "14px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", color: "#000000" }}
          >
            X
          </button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px", background: "#ffffff", borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", margin: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ display: "flex", gap: "8px", maxWidth: "80%", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ padding: "4px 8px", fontSize: "12px", background: msg.role === "user" ? "#000080" : "#d4d0c8", color: msg.role === "user" ? "#ffffff" : "#000000", WebkitTextFillColor: msg.role === "user" ? "#ffffff" : "#000000", borderTop: msg.role === "user" ? "none" : "1px solid #ffffff", borderLeft: msg.role === "user" ? "none" : "1px solid #ffffff", borderRight: msg.role === "user" ? "none" : "1px solid #808080", borderBottom: msg.role === "user" ? "none" : "1px solid #808080", wordBreak: "break-word" }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ display: "flex", gap: "8px", maxWidth: "80%" }}>
                <div style={{ padding: "4px 8px", fontSize: "12px", background: "#d4d0c8", color: "#000000", WebkitTextFillColor: "#000000", borderTop: "1px solid #ffffff", borderLeft: "1px solid #ffffff", borderRight: "1px solid #808080", borderBottom: "1px solid #808080" }}>
                  <Loader2 size={12} className="animate-spin" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: "6px", background: "#d4d0c8", borderTop: "1px solid #808080", display: "flex", gap: "4px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", width: "100%", gap: "4px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Puchiye apna sawaal ya idea..."
              style={{ flex: 1, borderTop: "2px solid #808080", borderLeft: "2px solid #808080", borderRight: "2px solid #ffffff", borderBottom: "2px solid #ffffff", background: "#ffffff", padding: "3px 6px", fontSize: "12px", fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif", outline: "none", color: "#000000", WebkitTextFillColor: "#000000" }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{ background: "#d4d0c8", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040", padding: "3px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", color: "#000000" }}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
