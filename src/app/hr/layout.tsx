"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  BarChart3,
  CalendarDays,
  Rocket,
  Bot,
  Shield,
  Sparkles,
  TrendingUp,
  Home,
  Calendar,
} from "lucide-react";
import { LiveClock } from "@/components/ui/live-clock";
import NotificationsPanel from "@/components/notifications-panel";

const navItems = [
  { href: "/hr", label: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-indigo-600" },
  { href: "/hr/employees", label: "Employees", icon: Users, color: "from-violet-500 to-purple-600" },
  { href: "/hr/leaves", label: "Leaves", icon: CalendarCheck, color: "from-amber-500 to-orange-600" },
  { href: "/hr/team-calendar", label: "Team Calendar", icon: Calendar, color: "from-teal-500 to-cyan-600" },
  { href: "/hr/reports", label: "Reports", icon: BarChart3, color: "from-cyan-500 to-blue-600" },
  { href: "/hr/holidays", label: "Holidays", icon: CalendarDays, color: "from-emerald-500 to-teal-600" },
  { href: "/hr/performance", label: "Performance", icon: TrendingUp, color: "from-fuchsia-500 to-pink-600" },
  { href: "/hr/onboarding", label: "Onboarding", icon: Rocket, color: "from-rose-500 to-red-500" },
  { href: "/hr/ai-assistant", label: "AI Assistant", icon: Bot, color: "from-indigo-500 to-violet-600" },
];

// Mobile bottom nav - show only 5 key items for HR
const mobileNavItems = [
  { href: "/hr", label: "Home", icon: Home },
  { href: "/hr/employees", label: "Team", icon: Users },
  { href: "/hr/leaves", label: "Leaves", icon: CalendarCheck },
  { href: "/hr/reports", label: "Reports", icon: BarChart3 },
  { href: "/hr/ai-assistant", label: "AI", icon: Bot },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userData = localStorage.getItem("user");
    if (role !== "hr") {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
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
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-colored-blue ring-2 ring-blue-400/20">
              <span className="text-white font-black text-sm">CO</span>
            </div>
            <div className="flex-1">
              <span className="font-black text-slate-900 text-[15px] tracking-tight">CodeOrigin.AI</span>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">HR Admin</p>
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
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 shadow-sm border border-blue-100/80"
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
                    <motion.div layoutId="hr-active" className="w-1.5 h-1.5 rounded-full bg-blue-600" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Card */}
          <div className="p-3 border-t border-slate-100/60">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-100/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-colored-blue">
                HR
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.username}</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <p className="text-[11px] text-slate-500 font-medium">Administrator</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-2.5 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50/80 hover:bg-red-100 rounded-xl transition-all border border-red-100/80 active:scale-95">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Desktop Top Bar */}
        <header className="sticky top-0 z-30 hidden lg:block px-4 pt-3 pb-1">
          <div className="glass-card rounded-2xl shadow-enterprise px-5 py-3 flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-[15px] font-bold text-slate-900">
                {navItems.find((item) => item.href === pathname)?.label || "HR Portal"}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Manage your workforce efficiently</p>
            </div>
            <LiveClock />
            <NotificationsPanel />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span className="text-[11px] font-semibold text-blue-700">Admin</span>
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
                {navItems.find((item) => item.href === pathname)?.label || "HR Portal"}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg border border-blue-100">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
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
                    ? "bg-blue-50 border border-blue-100"
                    : "active:scale-90"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm" : ""
                }`}>
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                </div>
                <span className={`text-[9px] font-semibold ${isActive ? "text-blue-700" : "text-slate-500"}`}>
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
