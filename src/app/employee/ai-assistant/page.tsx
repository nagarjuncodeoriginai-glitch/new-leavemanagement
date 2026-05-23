"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Sparkles, Bot, User, Clock, Zap,
  CalendarCheck, TrendingUp, FileText, Shield, Heart,
  Lightbulb, RefreshCw, Copy, ThumbsUp, ThumbsDown,
  ChevronRight, Mic, Paperclip, Calendar, Coffee,
  Wallet, HelpCircle, BookOpen, Leaf,
} from "lucide-react";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const quickPrompts = [
  { icon: Calendar, label: "How many leaves do I have left?", category: "Leave" },
  { icon: CalendarCheck, label: "Check my leave status", category: "Leave" },
  { icon: Wallet, label: "When is my next salary date?", category: "Payroll" },
  { icon: Shield, label: "What is the leave policy?", category: "Policy" },
  { icon: Coffee, label: "What are office timings?", category: "General" },
  { icon: Heart, label: "Employee wellness benefits", category: "Benefits" },
  { icon: BookOpen, label: "How to apply for leave?", category: "Guide" },
  { icon: HelpCircle, label: "Who is my reporting manager?", category: "Team" },
];

// Fetches real data from API and generates responses for the employee
async function getAIResponse(query: string): Promise<{ content: string; suggestions: string[] }> {
  const lower = query.toLowerCase();

  try {
    if (lower.includes("leave") && (lower.includes("how many") || lower.includes("balance") || lower.includes("left") || lower.includes("remaining"))) {
      const res = await fetch("/api/dashboard/employee");
      const json = await res.json();
      const d = json.data;
      if (!d) return { content: "Unable to fetch leave balance. Please try again.", suggestions: ["Try again", "Leave policy"] };
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = months[(d.leaveBalance?.month || 1) - 1];
      return {
        content: `**Your Leave Balance (${monthName} ${d.leaveBalance?.year || ""}):**\n\n• Remaining CL: **${d.leaveBalance?.remaining_cl ?? 2}**\n• Total CL: **${d.leaveBalance?.total_cl || 2}** days/month\n• Used CL: **${d.leaveBalance?.used_cl || 0}**\n${d.pendingLeaves ? `• Pending Requests: **${d.pendingLeaves}**` : ""}\n\nLeaves reset on the 1st of every month and do NOT carry forward.`,
        suggestions: ["Apply for leave", "Leave history", "Leave policy"],
      };
    }

    if (lower.includes("status") || lower.includes("check my leave") || lower.includes("history")) {
      const res = await fetch("/api/leaves?limit=5");
      const json = await res.json();
      const leaves = json.data || [];
      if (leaves.length === 0) return { content: "You have no leave applications yet. Apply for leave when you need time off.", suggestions: ["Apply for leave", "Leave balance", "Leave policy"] };
      const list = leaves.map((l: any) => {
        const status = l.status === "approved" ? "✅ Approved" : l.status === "rejected" ? "❌ Rejected" : "⏳ Pending";
        return `• ${status} - ${new Date(l.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${l.start_date !== l.end_date ? ` to ${new Date(l.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}\n  Reason: ${l.reason}`;
      }).join("\n\n");
      return { content: `**Your Recent Leave Applications:**\n\n${list}`, suggestions: ["Apply for leave", "Leave balance", "Leave policy"] };
    }

    if (lower.includes("policy") || lower.includes("rules")) {
      return {
        content: "**Leave Policy:**\n\n• 2 Casual Leaves (CL) per month\n• Leaves do NOT carry forward to next month\n• Reset on 1st of every month\n• Minimum 10 character reason required\n• Apply at least 1 day in advance\n• Cannot apply for past dates\n• HR reviews and approves/rejects",
        suggestions: ["Leave balance", "Apply for leave", "Office timings"],
      };
    }

    if (lower.includes("apply") || lower.includes("how to")) {
      return {
        content: "**How to Apply for Leave:**\n\n1. Go to **Apply Leave** from the sidebar\n2. Select start date and end date\n3. Write your reason (min 10 characters)\n4. Click **Submit Application**\n\nHR will review your request. You can check status in Leave History.",
        suggestions: ["Apply now", "Leave balance", "Leave policy"],
      };
    }

    if (lower.includes("timing") || lower.includes("office") || lower.includes("shift") || lower.includes("schedule")) {
      // Fetch profile for shift timing
      const userData = localStorage.getItem("user");
      const userId = userData ? JSON.parse(userData).id : null;
      let shiftInfo = "9:00 AM - 6:00 PM (default)";
      if (userId) {
        const res = await fetch(`/api/employees/${userId}`);
        const json = await res.json();
        if (json.success && json.data?.shift_timing) shiftInfo = json.data.shift_timing;
      }
      return {
        content: `**Office Timings:**\n\n• Your Shift: **${shiftInfo}**\n• Working Days: Monday - Friday\n• Office: Kotla Arcade, CK Pura, Chitradurga, Karnataka 577501\n• Attendance: Auto check-in at 10:30 AM if in office GPS range`,
        suggestions: ["Leave balance", "My profile", "Leave policy"],
      };
    }

    if (lower.includes("manager") || lower.includes("reporting") || lower.includes("team")) {
      const userData = localStorage.getItem("user");
      const userId = userData ? JSON.parse(userData).id : null;
      if (userId) {
        const res = await fetch(`/api/employees/${userId}`);
        const json = await res.json();
        if (json.success) {
          const emp = json.data;
          return {
            content: `**Your Info:**\n\n• Name: **${emp.full_name}**\n• Department: **${emp.department}**\n• Designation: **${emp.designation}**\n• Manager: **${emp.manager_name || "Not assigned"}**\n• Work Location: **${emp.work_location || "Office"}**`,
            suggestions: ["My profile", "Leave balance", "Office timings"],
          };
        }
      }
      return { content: "Unable to fetch your profile info. Check My Profile page for details.", suggestions: ["My profile", "Leave balance"] };
    }

    if (lower.includes("salary") || lower.includes("pay")) {
      return {
        content: "**Salary Information:**\n\n• Pay Date: Last working day of every month\n• Mode: Direct bank transfer\n• View details in My Profile page\n\nFor salary-related queries, contact HR or Finance team.",
        suggestions: ["My profile", "Leave balance", "Office timings"],
      };
    }

    // Default - fetch live balance
    const res = await fetch("/api/dashboard/employee");
    const json = await res.json();
    const d = json.data;
    const balanceText = d ? `\n\nYour balance: ${d.leaveBalance?.remaining_cl ?? 2} CL remaining this month.` : "";
    return {
      content: `I can help you with:${balanceText}\n\n• **Leave** - Balance, apply, status, policy\n• **Profile** - Your info, manager, shift\n• **Office** - Timings, location, attendance\n• **Salary** - Pay dates, bank info\n\nWhat would you like to know?`,
      suggestions: ["Leave balance", "Leave policy", "Office timings"],
    };
  } catch (error) {
    return { content: "I encountered an error. Please try again.", suggestions: ["Try again", "Leave policy", "Office timings"] };
  }
}

export default function EmployeeAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your **Personal HR Assistant**. I can help you with leave balances, policies, and more using your real data.\n\nHow can I help you today?",
      timestamp: new Date(),
      suggestions: ["Leave balance", "Leave policy", "Office timings", "Apply for leave"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const response = await getAIResponse(text);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response.content, timestamp: new Date(), suggestions: response.suggestions };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };


  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">My HR Assistant</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500">Always available &middot; Instant answers</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> New Chat
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Messages Panel */}
        <div className="flex-1 card-enterprise overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => (
              <motion.div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.role === "user" ? "order-first" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md"
                      : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md"
                  }`}>
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={`${i > 0 ? "mt-1.5" : ""} ${line.startsWith("**") ? "font-semibold" : ""}`}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </div>
                  {msg.suggestions && msg.role === "assistant" && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s) => (
                        <button key={s} onClick={() => sendMessage(s)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <div className="flex items-center gap-2 mt-2">
                      <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>


          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..." disabled={isTyping}
                  className="w-full px-4 py-3 pr-20 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Paperclip className="w-4 h-4" /></button>
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Mic className="w-4 h-4" /></button>
                </div>
              </div>
              <motion.button type="submit" disabled={!input.trim() || isTyping}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:shadow-none hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-2">Your personal HR helper. Ask about leaves, policies, benefits & more.</p>
          </div>
        </div>

        {/* Sidebar - Quick Prompts */}
        <div className="hidden xl:block w-72 space-y-4">
          <div className="card-enterprise p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800">Ask Me About</h3>
            </div>
            <div className="space-y-1.5">
              {quickPrompts.map((prompt) => (
                <button key={prompt.label} onClick={() => sendMessage(prompt.label)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group">
                  <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center flex-shrink-0 transition-colors">
                    <prompt.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{prompt.label}</p>
                    <p className="text-[10px] text-slate-400">{prompt.category}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="card-enterprise p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-800">I Can Help With</h3>
            </div>
            <div className="space-y-2">
              {["Leave balance & applications", "Company policies & rules", "Salary & payslip queries", "Benefits & wellness info", "Office timings & holidays", "Manager & team info", "How-to guides & processes"].map((cap) => (
                <div key={cap} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-600">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
