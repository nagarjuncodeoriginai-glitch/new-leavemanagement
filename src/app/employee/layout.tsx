"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/apply-leave", label: "Apply Leave", icon: CalendarPlus },
  { href: "/employee/leaves", label: "Leave History", icon: CalendarCheck },
  { href: "/employee/attendance", label: "Attendance", icon: Clock },
  { href: "/employee/performance", label: "Performance", icon: TrendingUp },
  { href: "/employee/holidays", label: "Holiday Calendar", icon: CalendarDays },
  { href: "/employee/announcements", label: "Announcements", icon: Bell },
  { href: "/employee/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/employee/profile", label: "My Profile", icon: User },
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
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CO</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">CodeOrigin.AI</span>
              <p className="text-xs text-slate-500">Employee Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : ""}`} />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name || user.username}</p>
                <p className="text-xs text-slate-500">{user.emp_id || "Employee"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full mt-2 flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-900">
                {navItems.find((item) => item.href === pathname)?.label || "Employee Portal"}
              </h1>
            </div>
            <LiveClock />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
