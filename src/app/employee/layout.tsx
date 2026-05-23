"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  User,
  LogOut,
  Menu,
  X,
  Clock,
  TrendingUp,
  Bot,
  CalendarDays,
  Bell,
  Sparkles,
  Home,
  Calendar,
} from "lucide-react";
import { LiveClock } from "@/components/ui/live-clock";
import NotificationsPanel from "@/components/notifications-panel";

const navItems = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard, color: "from-emerald-500 to-teal-500" },
  { href: "/employee/apply-leave", label: "Apply Leave", icon: CalendarPlus, color: "from-blue-500 to-indigo-500" },
  { href: "/employee/leaves", label: "Leave History", icon: CalendarCheck, color: "from-violet-500 to-purple-500" },
  { href: "/employee/team-calendar", label: "Team Calendar", icon: Calendar, color: "from-teal-500 to-cyan-500" },
  { href: "/employee/attendance", label: "Attendance", icon: Clock, color: "from-amber-500 to-orange-500" },
  { href: "/employee/performance", label: "Performance", icon: TrendingUp, color: "from-rose-500 to-pink-500" },
  { href: "/employee/holidays", label: "Holidays", icon: CalendarDays, color: "from-cyan-500 to-blue-500" },
  { href: "/employee/announcements", label: "Announcements", icon: Bell, color: "from-fuchsia-500 to-purple-500" },
  { href: "/employee/ai-assistant", label: "AI Assistant", icon: Bot, color: "from-indigo-500 to-violet-500" },
  { href: "/employee/profile", label: "My Profile", icon: User, color: "from-slate-500 to-slate-700" },
];

// Mobile bottom nav - show only 5 key items
const mobileNavItems = [
  { href: "/employee", label: "Home", icon: Home },
  { href: "/employee/apply-leave", label: "Apply", icon: CalendarPlus },
  { href: "/employee/attendance", label: "Attend", icon: Clock },
  { href: "/employee/announcements", label: "News", icon: Bell },
  { href: "/employee/profile", label: "Profile", icon: User },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] z-50 transform transition-all duration-500 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full glass-sidebar shadow-3d-deep">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100/60">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-colored-emerald ring-2 ring-emerald-400/20">
              <span className="text-white font-black text-sm">CO</span>
            </div>
            <div className="flex-1">
              <span className="font-black text-slate-900 text-[15px] tracking-tight">CodeOrigin.AI</span>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Employee</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 active:scale-90 transition-all">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-sm border border-emerald-100/80"
                      : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 active:scale-[0.98]"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : "bg-slate-100/80 group-hover:bg-slate-200/80"
                  }`}>
                    <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="emp-active" className="w-1.5 h-1.5 rounded-full bg-emerald-500" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Card */}
          <div className="p-3 border-t border-slate-100/60">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-100/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-colored-emerald">
                {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name || user.username}</p>
                <p className="text-[11px] text-slate-500">{user.emp_id || "Employee"}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-2.5 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50/80 hover:bg-red-100 rounded-xl transition-all border border-red-100/80 active:scale-95">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-[280px]">
        {/* Desktop Top Bar */}
        <header className="sticky top-0 z-30 hidden lg:block px-4 pt-3 pb-1">
          <div className="glass-card rounded-2xl shadow-enterprise px-5 py-3 flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-[15px] font-bold text-slate-900">
                {navItems.find((item) => item.href === pathname)?.label || "Employee Portal"}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Welcome, {user.name?.split(" ")[0] || user.username}</p>
            </div>
            <LiveClock />
            <NotificationsPanel />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="status-dot-online" />
              <span className="text-[11px] font-semibold text-emerald-700">Online</span>
            </div>
          </div>
        </header>

        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 lg:hidden px-3 pt-2 pb-1">
          <div className="glass-card rounded-2xl shadow-enterprise px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 active:scale-90 transition-all">
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate">
                {navItems.find((item) => item.href === pathname)?.label || "Employee"}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700">Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden mobile-bottom-nav">
        <div className="mx-2 mb-2 glass-card rounded-2xl shadow-3d-deep border border-slate-200/50 px-2 py-1.5 flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] ${
                  isActive
                    ? "bg-emerald-50 border border-emerald-100"
                    : "active:scale-90"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm" : ""
                }`}>
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                </div>
                <span className={`text-[9px] font-semibold ${isActive ? "text-emerald-700" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
