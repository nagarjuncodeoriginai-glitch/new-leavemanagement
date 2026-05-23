"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Megaphone, Calendar, AlertCircle,
  PartyPopper, Shield, Clock, ChevronRight,
  CheckCircle2, Sparkles, Users, TrendingUp, BookOpen,
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: "general" | "policy" | "event" | "celebration" | "important" | "update";
  date: string;
  priority: "high" | "medium" | "low";
  author: string;
  isActive: boolean;
}

const categoryConfig = {
  general: { icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "General" },
  policy: { icon: Shield, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", label: "Policy" },
  event: { icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Event" },
  celebration: { icon: PartyPopper, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100", label: "Celebration" },
  important: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "Important" },
  update: { icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "Update" },
};

const priorityConfig = {
  high: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  medium: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  low: { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const json = await res.json();
      if (json.success) {
        setAnnouncements(json.data);
      }
    } catch (error) {
      console.error("Fetch announcements error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = filter === "all"
    ? announcements
    : announcements.filter(a => a.category === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
          <p className="text-sm text-slate-500 mt-1">Company news, events, and policy updates from HR</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: announcements.length, icon: Megaphone, gradient: "from-blue-500 to-indigo-600" },
          { label: "Important", value: announcements.filter(a => a.priority === "high").length, icon: AlertCircle, gradient: "from-red-500 to-rose-600" },
          { label: "Events", value: announcements.filter(a => a.category === "event").length, icon: Calendar, gradient: "from-emerald-500 to-teal-600" },
          { label: "Updates", value: announcements.filter(a => a.category === "update").length, icon: TrendingUp, gradient: "from-amber-500 to-orange-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { value: "all", label: "All", icon: Sparkles },
          { value: "important", label: "Important", icon: AlertCircle },
          { value: "policy", label: "Policy", icon: Shield },
          { value: "event", label: "Events", icon: Calendar },
          { value: "update", label: "Updates", icon: TrendingUp },
          { value: "general", label: "General", icon: Megaphone },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.value
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <motion.div className="bg-white rounded-2xl border border-slate-100 p-16 text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Announcements</h3>
          <p className="text-sm text-slate-500 mt-2">HR hasn&apos;t posted any announcements yet. Check back later.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAnnouncements.map((announcement, i) => {
              const catConfig = categoryConfig[announcement.category];
              const prioConfig = priorityConfig[announcement.priority];
              const isExpanded = expandedId === announcement.id;
              const CatIcon = catConfig.icon;

              return (
                <motion.div key={announcement.id} layout
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setExpandedId(isExpanded ? null : announcement.id)}>
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${catConfig.bg} border ${catConfig.border} flex items-center justify-center flex-shrink-0`}>
                        <CatIcon className={`w-5 h-5 ${catConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded-full ${catConfig.bg} ${catConfig.color} text-[10px] font-bold border ${catConfig.border}`}>
                            {catConfig.label}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prioConfig.bg} ${prioConfig.color} border ${prioConfig.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${prioConfig.dot}`} />
                            {announcement.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm">{announcement.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(announcement.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {announcement.author}
                          </span>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-sm text-slate-600 leading-relaxed">{announcement.content}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
