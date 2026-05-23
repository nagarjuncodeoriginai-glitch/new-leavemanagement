"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Sparkles, Bot, User, Clock, Zap,
  Users, CalendarCheck, TrendingUp, FileText, Shield,
  Lightbulb, BarChart3, RefreshCw, Copy, ThumbsUp,
  ThumbsDown, ChevronRight, Mic, Paperclip,
} from "lucide-react";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const quickPrompts = [
  { icon: Users, label: "Who is on leave today?", category: "Leave" },
  { icon: TrendingUp, label: "Show me workforce analytics", category: "Analytics" },
  { icon: CalendarCheck, label: "Pending leave approvals summary", category: "Leave" },
  { icon: FileText, label: "Generate attendance report", category: "Reports" },
  { icon: Shield, label: "Policy compliance status", category: "Compliance" },
  { icon: BarChart3, label: "Department headcount breakdown", category: "Analytics" },
];

// Fetches real data from API and generates responses
async function getAIResponse(query: string): Promise<{ content: string; suggestions: string[] }> {
  const lower = query.toLowerCase();

  try {
    if (lower.includes("leave") && (lower.includes("today") || lower.includes("who"))) {
      const res = await fetch("/api/leaves?status=approved&limit=50");
      const json = await res.json();
      const today = new Date().toISOString().split("T")[0];
      const onLeaveToday = (json.data || []).filter((l: any) => l.start_date <= today && l.end_date >= today);
      if (onLeaveToday.length === 0) {
        return { content: "No employees are on approved leave today. All team members are available.", suggestions: ["Pending approvals", "Workforce analytics", "Leave policy"] };
      }
      const list = onLeaveToday.map((l: any, i: number) => `${i + 1}. **${l.employee_name}** (${l.emp_id}) - CL (${new Date(l.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${new Date(l.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`).join("\n");
      return { content: `**${onLeaveToday.length} employee(s)** on approved leave today:\n\n${list}`, suggestions: ["Pending approvals", "Workforce analytics", "Department breakdown"] };
    }

    if (lower.includes("pending") || lower.includes("approval")) {
      const res = await fetch("/api/leaves?status=pending&limit=50");
      const json = await res.json();
      const pending = json.data || [];
      if (pending.length === 0) {
        return { content: "No pending leave requests! All leave applications have been reviewed.", suggestions: ["Who is on leave today?", "Workforce analytics", "Generate report"] };
      }
      const list = pending.map((l: any) => `• **${l.employee_name}** (${l.emp_id}) - ${new Date(l.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to ${new Date(l.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}\n  Reason: ${l.reason}`).join("\n\n");
      return { content: `You have **${pending.length} pending leave request(s)**:\n\n${list}\n\nGo to Leave Management to approve or reject them.`, suggestions: ["Go to Leave Management", "Workforce analytics", "Who is on leave today?"] };
    }

    if (lower.includes("analytics") || lower.includes("workforce") || lower.includes("headcount")) {
      const res = await fetch("/api/dashboard/hr");
      const json = await res.json();
      const d = json.data;
      if (!d) return { content: "Unable to fetch workforce data. Please try again.", suggestions: ["Try again", "Pending approvals"] };
      const depts = (d.departmentWise || []).map((dept: any) => `- ${dept.department}: ${dept.count} employee(s)`).join("\n");
      return {
        content: `**Workforce Analytics Summary:**\n\n• Total Employees: **${d.totalEmployees}**\n• Active: **${d.activeEmployees}**\n• Pending Leaves: **${d.pendingLeaves}**\n• Approved This Month: **${d.approvedLeavesThisMonth}**\n\n**Department Distribution:**\n${depts || "No departments yet - add employees to see distribution."}`,
        suggestions: ["Pending approvals", "Who is on leave today?", "Department breakdown"],
      };
    }

    if (lower.includes("department")) {
      const res = await fetch("/api/employees/departments");
      const json = await res.json();
      const depts = json.data || [];
      if (depts.length === 0) return { content: "No departments found. Add employees to see department distribution.", suggestions: ["Add employee", "Workforce analytics"] };
      const list = depts.map((d: any) => `• **${d.department}**: ${d.count} employee(s)`).join("\n");
      return { content: `**Department Breakdown:**\n\n${list}\n\nTotal: ${depts.reduce((s: number, d: any) => s + d.count, 0)} employees across ${depts.length} departments.`, suggestions: ["Workforce analytics", "Pending approvals"] };
    }

    if (lower.includes("add") && lower.includes("employee")) {
      return { content: "To add a new employee:\n\n1. Go to **Employees** page\n2. Click **Add Employee** button\n3. Fill in details (ID, name, department, credentials)\n4. Submit the form\n\nThe employee can then login with those credentials.", suggestions: ["Go to Employees", "Workforce analytics", "Leave policy"] };
    }

    if (lower.includes("policy") || lower.includes("rules")) {
      return { content: "**Leave Policy:**\n\n• 2 Casual Leaves (CL) per month per employee\n• Leaves do NOT carry forward - they expire at month end\n• Employees must apply at least 1 day in advance\n• HR can approve/reject from Leave Management page\n• Minimum 10 character reason required\n• Cannot apply for past dates", suggestions: ["Pending approvals", "Who is on leave today?", "Workforce analytics"] };
    }

    // Default - fetch live stats
    const res = await fetch("/api/dashboard/hr");
    const json = await res.json();
    const d = json.data;
    const statsText = d ? `\n\nCurrent stats: ${d.totalEmployees} employees, ${d.pendingLeaves} pending leaves, ${d.approvedLeavesThisMonth} approved this month.` : "";
    return {
      content: `I can help you with real-time HR data:${statsText}\n\n• **Leave Management** - Track, approve, and analyze leave requests\n• **Workforce Analytics** - Headcount, department distribution\n• **Employee Info** - How to add/manage employees\n• **Policy Info** - Leave rules and guidelines\n\nWhat would you like to know?`,
      suggestions: ["Who is on leave today?", "Pending approvals", "Workforce analytics"],
    };
  } catch (error) {
    return { content: "I encountered an error fetching data. Please try again or check your connection.", suggestions: ["Try again", "Leave policy", "How to add employee"] };
  }
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your **AI HR Assistant** powered by intelligent analytics. I can help you with leave management, workforce insights, compliance checks, and generating reports.\n\nWhat would you like to know?",
      timestamp: new Date(),
      suggestions: ["Who is on leave today?", "Workforce analytics", "Pending approvals"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const response = await getAIResponse(text);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
      timestamp: new Date(),
      suggestions: response.suggestions,
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };


  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI HR Assistant</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500">Online &middot; Powered by HRMS AI</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> New Chat
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Messages */}
        <div className="flex-1 card-enterprise overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => (
              <motion.div key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.role === "user" ? "order-first" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md"
                      : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md"
                  }`}>
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={`${i > 0 ? "mt-1.5" : ""} ${line.startsWith("**") ? "font-semibold" : ""}`}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </div>
                  {/* Suggestions */}
                  {msg.suggestions && msg.role === "assistant" && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s) => (
                        <button key={s} onClick={() => sendMessage(s)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Actions for AI messages */}
                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <div className="flex items-center gap-2 mt-2">
                      <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>


          {/* Input Area */}
          <div className="p-4 border-t border-slate-100">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about HR..."
                  className="w-full px-4 py-3 pr-20 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  disabled={isTyping}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:shadow-none hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-2">AI responses are generated from your HR data. Always verify critical decisions.</p>
          </div>
        </div>

        {/* Quick Prompts Sidebar */}
        <div className="hidden xl:block w-72 space-y-4">
          <div className="card-enterprise p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800">Quick Prompts</h3>
            </div>
            <div className="space-y-2">
              {quickPrompts.map((prompt) => (
                <button key={prompt.label} onClick={() => sendMessage(prompt.label)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group">
                  <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center flex-shrink-0 transition-colors">
                    <prompt.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{prompt.label}</p>
                    <p className="text-[10px] text-slate-400">{prompt.category}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="card-enterprise p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-slate-800">Capabilities</h3>
            </div>
            <div className="space-y-2">
              {["Leave analytics & approvals", "Workforce insights", "Policy Q&A", "Report generation", "Attendance patterns", "Hiring suggestions"].map((cap) => (
                <div key={cap} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
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
