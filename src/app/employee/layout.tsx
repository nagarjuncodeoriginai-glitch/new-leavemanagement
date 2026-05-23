"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock,
  TrendingUp,
  Bot,
  CalendarDays,
  Bell,
} from "lucide-react";
import { LiveClock } from "@/components/ui/live-clock";

const navItems = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard, color: "from-emerald-500 to-teal-500" },
  { href: "/employee/apply-leave", label: "Apply Leave", icon: CalendarPlus, color: "from-blue-500 to-indigo-500" },
  { href: "/employee/leaves", label: "Leave History", icon: CalendarCheck, color: "from-violet-500 to-purple-500" },
  { href: "/employee/attendance", label: "Attendance", icon: Clock, color: "from-amber-500 to-orange-500" },
  { href: "/employee/performance", label: "Performance", icon: TrendingUp, color: "from-rose-500 to-pink-500" },
  { href: "/employee/holidays", label: "Holiday Calendar", icon: CalendarDays, color: "from-cyan-500 to-blue-500" },
  { href: "/employee/announcements", label: "Announcements", icon: Bell, color: "from-fuchsia-500 to-purple-500" },
  { href: "/employee/ai-assistant", label: "AI Assistant", icon: Bot, color: "from-indigo-500 to-violet-500" },
  { href: "/employee/profile", label: "My Profile", icon: User, color: "from-slate-500 to-slate-700" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; name?: string; emp_id?: string } | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userData = localStorage.getItem("user");
    if (role !== "employee") {
      router.push("/login");
      return;
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.clear();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - 2026 Glassmorphism Design */}
      <aside className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-all duration-500 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 shadow-xl shadow-slate-200/20">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100/80">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20">
              <span className="text-white font-black text-sm">CO</span>
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight">CodeOrigin.AI</span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Employee Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-sm border border-emerald-100/80"
                      : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-md`
                      : "bg-slate-100 group-hover:bg-slate-200"
                  }`}>
                    <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="employee-nav-indicator" className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Card */}
          <div className="p-4 border-t border-slate-100/80">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/30 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
                {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name || user.username}</p>
                <p className="text-[11px] text-slate-500 font-medium">{user.emp_id || "Employee"}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar - Floating Glass Header */}
        <header className="sticky top-0 z-30 mx-4 mt-4 mb-2">
          <div className="bg-white/70 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/20 px-5 py-3.5 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-bold text-slate-900">
                {navItems.find((item) => item.href === pathname)?.label || "Employee Portal"}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Welcome back, {user.name?.split(" ")[0] || user.username}</p>
            </div>
            <div className="flex items-center gap-3">
              <LiveClock />
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-700">Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
