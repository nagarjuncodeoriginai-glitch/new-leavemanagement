"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  CalendarDays,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Calendar,
  Bot,
  Send,
  Zap,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  leaveBalance: {
    total_cl: number;
    used_cl: number;
    remaining_cl: number;
    month: number;
    year: number;
  };
  pendingLeaves: number;
  approvedLeaves: number;
  recentLeaves: {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    applied_at: string;
  }[];
}

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (end === 0) { setCount(0); return; }
    const stepTime = (duration * 1000) / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return <span ref={ref}>{count}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -5 },
  visible: {
    opacity: 1, y: 0, rotateX: 0,
    transition: { type: "spring", stiffness: 80, damping: 20 },
  },
};

export default function EmployeeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [aiChat, setAiChat] = useState<{ role: string; text: string }[]>([
    { role: "ai", text: "Hi! I'm your personal leave assistant. I can help you understand your leave balance, guide you on applying for leave, or answer policy questions." },
  ]);
  const [aiInput, setAiInput] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || user.username || "");
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard/employee");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiChat(prev => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");

    const fetchResponse = async () => {
      try {
        const lower = userMsg.toLowerCase();
        if (lower.includes("balance") || lower.includes("remaining") || lower.includes("how many")) {
          const res = await fetch("/api/dashboard/employee");
          const json = await res.json();
          const d = json.data;
          setAiChat(prev => [...prev, { role: "ai", text: d ? `You have ${d.leaveBalance?.remaining_cl ?? 2} CL remaining out of ${d.leaveBalance?.total_cl || 2} for this month.${d.pendingLeaves ? ` ${d.pendingLeaves} request(s) pending.` : ""}` : "Unable to fetch balance." }]);
        } else if (lower.includes("apply") || lower.includes("request")) {
          setAiChat(prev => [...prev, { role: "ai", text: "To apply: Go to 'Apply Leave' → Select dates → Write reason (min 10 chars) → Submit. HR will review and approve/reject." }]);
        } else if (lower.includes("policy") || lower.includes("rules") || lower.includes("carry")) {
          setAiChat(prev => [...prev, { role: "ai", text: "Leave Policy: 2 CL per month. Unused leaves do NOT carry forward — they expire at month end. Plan wisely!" }]);
        } else if (lower.includes("status") || lower.includes("pending") || lower.includes("approved")) {
          const res = await fetch("/api/dashboard/employee");
          const json = await res.json();
          const d = json.data;
          setAiChat(prev => [...prev, { role: "ai", text: d ? `Status: ${d.pendingLeaves || 0} pending, ${d.approvedLeaves || 0} approved this year.` : "Unable to fetch status." }]);
        } else {
          setAiChat(prev => [...prev, { role: "ai", text: "I can help with: leave balance, how to apply, leave policy, and application status. What would you like to know?" }]);
        }
      } catch {
        setAiChat(prev => [...prev, { role: "ai", text: "Error fetching data. Please try again." }]);
      }
    };
    fetchResponse();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-teal-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading your workspace...</p>
        </motion.div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[(data?.leaveBalance?.month || 1) - 1];
  const remaining = data?.leaveBalance?.remaining_cl ?? 2;
  const total = data?.leaveBalance?.total_cl || 2;
  const used = data?.leaveBalance?.used_cl || 0;
  const percentage = (remaining / total) * 100;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div className="space-y-8 mesh-gradient-2 min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8" variants={containerVariants} initial="hidden" animate="visible">

      {/* Hero Welcome */}
      <motion.div variants={cardVariants} className="relative overflow-hidden rounded-3xl p-8 lg:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-900 rounded-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.3),transparent_60%)]" />
        {/* 3D floating orbs */}
        <motion.div className="absolute top-6 right-16 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 blur-xl" animate={{ y: [0, -12, 0], scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-6 right-48 w-12 h-12 rounded-full bg-gradient-to-r from-teal-400/20 to-emerald-400/20 blur-lg" animate={{ y: [0, 8, 0], x: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <motion.div className="absolute top-16 right-72 w-6 h-6 rounded-full bg-white/10 border border-white/20" animate={{ y: [0, -6, 0], rotate: [0, 180, 360] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <motion.div className="flex items-center gap-2 mb-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-emerald-200 text-sm font-semibold tracking-wide uppercase">{currentMonth} {data?.leaveBalance?.year}</span>
            </motion.div>
            <motion.h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              Hello, <span className="bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent">{userName.split(" ")[0] || "there"}</span>!
            </motion.h1>
            <motion.p className="text-emerald-100/80 mt-3 text-base max-w-lg leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              Track your leaves, apply for time off, and get AI-powered assistance — all in one place.
            </motion.p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring" }}>
            <Link href="/employee/apply-leave" className="inline-flex items-center gap-2 px-7 py-4 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold rounded-2xl hover:bg-white/25 transition-all shadow-xl text-sm group">
              <CalendarDays className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Apply for Leave
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total CL", value: total, icon: CalendarCheck, gradient: "from-blue-500 via-blue-600 to-indigo-600", shadow: "shadow-blue-500/25" },
          { label: "Remaining", value: remaining, icon: CheckCircle, gradient: "from-emerald-500 via-emerald-600 to-teal-600", shadow: "shadow-emerald-500/25" },
          { label: "Pending", value: data?.pendingLeaves || 0, icon: Clock, gradient: "from-amber-500 via-orange-500 to-red-500", shadow: "shadow-amber-500/25" },
          { label: "Used", value: used, icon: Calendar, gradient: "from-violet-500 via-purple-600 to-fuchsia-600", shadow: "shadow-violet-500/25" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={cardVariants} whileHover={{ y: -8, rotateX: -3, rotateY: 2 }} style={{ perspective: 1000 }}
            className="relative bg-white rounded-2xl p-6 shadow-3d hover:shadow-3d-hover transition-all duration-500 overflow-hidden group border border-slate-100/50">
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-r ${stat.gradient} opacity-[0.08] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-500`} />
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={stat.value} />
              </p>
              <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column: Balance + Recent */}
        <div className="lg:col-span-3 space-y-6">
          {/* 3D Circular Progress Balance */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100/50 p-6 shadow-3d">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Leave Balance</h3>
                <p className="text-xs text-slate-500">{currentMonth} {data?.leaveBalance?.year}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* SVG Circular Progress with 3D effect */}
              <div className="relative w-40 h-40 flex-shrink-0">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-200 to-teal-200 opacity-30 blur-md" />
                <svg className="w-40 h-40 transform -rotate-90 relative z-10" viewBox="0 0 120 120">
                  {/* Background track */}
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  {/* Shadow track */}
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeDasharray="4 8" opacity="0.5" />
                  {/* Progress arc */}
                  <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#progressGradient)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: strokeDashoffset }}
                    transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                    filter="drop-shadow(0 4px 6px rgba(16,185,129,0.3))"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <motion.span className="text-3xl font-black text-slate-900" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }}>
                    {remaining}
                  </motion.span>
                  <span className="text-xs text-slate-500 font-medium">of {total} CL</span>
                </div>
              </div>

              {/* Balance breakdown */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <span className="text-sm text-slate-700 font-medium">Available</span>
                  </div>
                  <span className="text-xl font-black text-emerald-700">{remaining}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    <span className="text-sm text-slate-700 font-medium">Used</span>
                  </div>
                  <span className="text-xl font-black text-amber-700">{used}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <span className="text-sm text-slate-700 font-medium">Total Allocated</span>
                  </div>
                  <span className="text-xl font-black text-blue-700">{total}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-100 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold">Policy Reminder:</span> Unused leaves expire at month end and do not carry forward. Plan your time off wisely!
              </p>
            </div>
          </motion.div>

          {/* Recent Applications */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100/50 p-6 shadow-3d">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Recent Applications</h3>
                  <p className="text-xs text-slate-500">Your latest leave requests</p>
                </div>
              </div>
              <Link href="/employee/leaves" className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-semibold hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
                History <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {data?.recentLeaves && data.recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeaves.map((leave, i) => (
                  <motion.div key={leave.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 hover:from-emerald-50/50 hover:to-teal-50/30 border border-slate-100 hover:border-emerald-100 transition-all group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} whileHover={{ x: 6, scale: 1.01 }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${leave.status === "approved" ? "bg-emerald-100" : leave.status === "rejected" ? "bg-red-100" : "bg-amber-100"}`}>
                        {leave.status === "approved" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : leave.status === "rejected" ? <Clock className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {leave.start_date !== leave.end_date && <span className="text-slate-400"> — {new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{leave.reason}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${leave.status === "approved" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : leave.status === "rejected" ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium">No leave applications yet</p>
                <p className="text-xs mt-1">Your requests will appear here</p>
                <Link href="/employee/apply-leave" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100">
                  <CalendarDays className="w-4 h-4" /> Apply Now
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Assistant */}
        <motion.div variants={cardVariants} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100/50 shadow-3d overflow-hidden flex flex-col" style={{ maxHeight: "720px" }}>
          {/* AI Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Leave AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-white/70 text-xs">Ready to help</span>
                </div>
              </div>
              <Zap className="w-5 h-5 text-white/50 ml-auto" />
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: "320px" }}>
            {aiChat.map((msg, i) => (
              <motion.div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md shadow-md"
                  : "bg-slate-100 text-slate-700 rounded-bl-md border border-slate-200"}`}>
                  {msg.role === "ai" && <Bot className="w-4 h-4 text-emerald-600 mb-1 inline-block mr-1" />}
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex gap-2">
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAiSend()}
                placeholder="Ask about leave balance, policy..."
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" />
              <button onClick={handleAiSend} className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md shadow-emerald-500/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["My balance", "How to apply?", "Leave policy"].map(q => (
                <button key={q} onClick={() => setAiInput(q)} className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
