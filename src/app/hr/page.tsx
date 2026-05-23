"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Users,
  UserCheck,
  Clock,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Activity,
  Briefcase,
  Bot,
  Sparkles,
  Zap,
  Shield,
  Send,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  approvedLeavesThisMonth: number;
  departmentWise: { department: string; count: number }[];
  recentLeaves: {
    id: number;
    employee_name: string;
    emp_id: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string;
  }[];
}

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
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

export default function HRDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<{ role: string; text: string }[]>([
    { role: "ai", text: "Hello! I'm your HR AI Assistant. I can help you with employee management, leave policies, and HR best practices. What would you like to know?" },
  ]);
  const [aiInput, setAiInput] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard/hr");
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

    // Fetch real data for AI response
    const lower = userMsg.toLowerCase();
    const fetchResponse = async () => {
      try {
        if (lower.includes("leave") && lower.includes("policy")) {
          setAiChat(prev => [...prev, { role: "ai", text: "Leave Policy: 2 CL per month per employee. Unused leaves do NOT carry forward. HR can approve/reject via Leave Management page. Employees must provide min 10-char reason." }]);
        } else if (lower.includes("add") && lower.includes("employee")) {
          setAiChat(prev => [...prev, { role: "ai", text: "To add a new employee: Go to Employees page → Click 'Add Employee' → Fill in details (ID, name, department, credentials) → Submit. The employee can then login." }]);
        } else if (lower.includes("pending")) {
          const res = await fetch("/api/leaves?status=pending&limit=5");
          const json = await res.json();
          const count = json.total || 0;
          setAiChat(prev => [...prev, { role: "ai", text: `You have ${count} pending leave request(s). Go to Leave Management to approve or reject them.` }]);
        } else if (lower.includes("department")) {
          const res = await fetch("/api/employees/departments");
          const json = await res.json();
          const depts = (json.data || []).map((d: any) => `${d.department}: ${d.count}`).join(", ") || "No data yet";
          setAiChat(prev => [...prev, { role: "ai", text: `Department distribution: ${depts}` }]);
        } else if (lower.includes("how many") || lower.includes("total")) {
          const res = await fetch("/api/dashboard/hr");
          const json = await res.json();
          const d = json.data;
          setAiChat(prev => [...prev, { role: "ai", text: d ? `You have ${d.totalEmployees} total employees, ${d.activeEmployees} active. ${d.pendingLeaves} leave requests pending.` : "Unable to fetch data." }]);
        } else {
          setAiChat(prev => [...prev, { role: "ai", text: "I can help with: leave policies, pending requests, adding employees, department info, and total headcount. Ask me anything!" }]);
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
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-blue-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Preparing your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: "Total Employees", value: data?.totalEmployees || 0, icon: Users, gradient: "from-blue-500 via-blue-600 to-indigo-600", shadow: "shadow-blue-500/25" },
    { label: "Active Employees", value: data?.activeEmployees || 0, icon: UserCheck, gradient: "from-emerald-500 via-emerald-600 to-teal-600", shadow: "shadow-emerald-500/25" },
    { label: "Pending Leaves", value: data?.pendingLeaves || 0, icon: Clock, gradient: "from-amber-500 via-orange-500 to-red-500", shadow: "shadow-amber-500/25" },
    { label: "Approved This Month", value: data?.approvedLeavesThisMonth || 0, icon: CalendarCheck, gradient: "from-violet-500 via-purple-600 to-fuchsia-600", shadow: "shadow-violet-500/25" },
  ];

  const deptColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

  return (
    <motion.div className="space-y-8 mesh-gradient-1 min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8" variants={containerVariants} initial="hidden" animate="visible">

      {/* Hero Welcome */}
      <motion.div variants={cardVariants} className="relative overflow-hidden rounded-3xl p-8 lg:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 rounded-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_60%)]" />
        {/* 3D floating orbs */}
        <motion.div className="absolute top-8 right-12 w-24 h-24 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 blur-xl" animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-8 right-40 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-lg" animate={{ y: [0, 10, 0], x: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <motion.div className="absolute top-20 right-60 w-8 h-8 rounded-full bg-white/10 border border-white/20" animate={{ y: [0, -8, 0], rotate: [0, 180, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <motion.div className="flex items-center gap-2 mb-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center animate-pulse-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-violet-200 text-sm font-semibold tracking-wide uppercase">HR Command Center</span>
            </motion.div>
            <motion.h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              Welcome back, <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Admin</span>
            </motion.h1>
            <motion.p className="text-slate-300 mt-3 text-base max-w-xl leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              Manage your workforce, review leave requests, and get AI-powered insights — all from one powerful dashboard.
            </motion.p>
          </div>
          <motion.div className="flex gap-3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
            <Link href="/hr/employees" className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" /> Employees
            </Link>
            <Link href="/hr/leaves" className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-sm shadow-lg shadow-violet-500/30">
              <Clock className="w-4 h-4" /> Leaves
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats with 3D Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={cardVariants} whileHover={{ y: -8, rotateX: -3, rotateY: 2 }} style={{ perspective: 1000 }}
            className="relative bg-white rounded-2xl p-6 shadow-3d hover:shadow-3d-hover transition-all duration-500 overflow-hidden group border border-slate-100/50"
          >
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
            {/* Shimmer line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Department + Recent Leaves */}
        <div className="lg:col-span-3 space-y-6">
          {/* Recent Leaves */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100/50 p-6 shadow-3d">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Recent Requests</h3>
                  <p className="text-xs text-slate-500">Latest leave applications</p>
                </div>
              </div>
              <Link href="/hr/leaves" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {data?.recentLeaves && data.recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeaves.map((leave, i) => (
                  <motion.div key={leave.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 hover:from-indigo-50/50 hover:to-purple-50/30 border border-slate-100 hover:border-indigo-100 transition-all group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} whileHover={{ x: 6, scale: 1.01 }}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {leave.employee_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{leave.employee_name}</p>
                        <p className="text-xs text-slate-500">{leave.emp_id} &middot; {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${leave.status === "approved" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : leave.status === "rejected" ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <CalendarCheck className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium">No leave requests yet</p>
                <p className="text-xs mt-1">Requests will appear here when employees apply</p>
              </div>
            )}
          </motion.div>

          {/* Departments */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100/50 p-6 shadow-3d">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Department Overview</h3>
                <p className="text-xs text-slate-500">Employee distribution across teams</p>
              </div>
            </div>
            {data?.departmentWise && data.departmentWise.length > 0 ? (
              <div className="space-y-4">
                {data.departmentWise.map((dept, i) => (
                  <motion.div key={dept.department} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ background: deptColors[i % deptColors.length] }} />
                        <span className="text-sm font-semibold text-slate-700">{dept.department}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{dept.count}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${deptColors[i % deptColors.length]}, ${deptColors[(i + 1) % deptColors.length]})` }}
                        initial={{ width: 0 }} animate={{ width: `${(dept.count / (data.totalEmployees || 1)) * 100}%` }} transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: "easeOut" }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <Briefcase className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No departments yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Assistant */}
        <motion.div variants={cardVariants} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100/50 shadow-3d overflow-hidden flex flex-col" style={{ maxHeight: "680px" }}>
          {/* AI Header */}
          <div className="p-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">AI HR Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/70 text-xs">Online &middot; Powered by AI</span>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-white/50 ml-auto" />
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: "300px" }}>
            {aiChat.map((msg, i) => (
              <motion.div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.1 }}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-br-md shadow-md"
                  : "bg-slate-100 text-slate-700 rounded-bl-md border border-slate-200"}`}>
                  {msg.role === "ai" && <Bot className="w-4 h-4 text-indigo-500 mb-1 inline-block mr-1" />}
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Input */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSend()}
                placeholder="Ask about policies, employees..."
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
              <button onClick={handleAiSend} className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-500/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["Leave policy", "Pending requests", "Add employee"].map(q => (
                <button key={q} onClick={() => { setAiInput(q); }} className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { href: "/hr/employees", icon: Users, title: "Manage Team", desc: "Add & manage profiles", gradient: "from-blue-600 to-indigo-700", shadow: "shadow-blue-500/30" },
          { href: "/hr/leaves", icon: Shield, title: "Leave Requests", desc: "Approve or reject", gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/30" },
          { href: "#", icon: TrendingUp, title: "Monthly Reset", desc: "Reset all CL balances", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/30", action: true },
        ].map((item, i) => (
          <motion.div key={item.title} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {item.action ? (
              <div onClick={() => fetch("/api/leaves/reset", { method: "POST" }).then(() => fetchDashboard())} className={`relative overflow-hidden p-7 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-xl ${item.shadow} cursor-pointer group`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
                <item.icon className="w-8 h-8 mb-3 relative z-10" />
                <h4 className="font-bold text-lg relative z-10">{item.title}</h4>
                <p className="text-white/80 text-sm mt-1 relative z-10">{item.desc}</p>
              </div>
            ) : (
              <Link href={item.href} className={`block relative overflow-hidden p-7 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-xl ${item.shadow} group`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
                <item.icon className="w-8 h-8 mb-3 relative z-10" />
                <h4 className="font-bold text-lg relative z-10">{item.title}</h4>
                <p className="text-white/80 text-sm mt-1 relative z-10">{item.desc}</p>
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
