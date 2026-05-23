"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Megaphone, Calendar, Star, AlertCircle,
  Gift, PartyPopper, Shield, Clock, ChevronRight,
  CheckCircle2, Info, Sparkles, Heart, Users,
  BookOpen, TrendingUp, Zap,
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: "general" | "policy" | "event" | "celebration" | "important" | "update";
  date: string;
  isNew: boolean;
  priority: "high" | "medium" | "low";
  author: string;
}

const announcements: Announcement[] = [
  {
    id: 1,
    title: "Annual Performance Review Cycle Begins",
    content: "The Q2 2025 performance review cycle starts from June 1st. Please ensure your goals are updated in the system. Self-assessment forms will be shared by May 28th. Reach out to your manager for any clarifications.",
    category: "important",
    date: "2025-05-22",
    isNew: true,
    priority: "high",
    author: "HR Team",
  },
  {
    id: 2,
    title: "New Work From Home Policy Update",
    content: "Effective June 1, 2025, employees can avail up to 2 WFH days per week with prior manager approval. Please refer to the updated policy document in the HR portal for complete guidelines.",
    category: "policy",
    date: "2025-05-20",
    isNew: true,
    priority: "high",
    author: "HR Admin",
  },
  {
    id: 3,
    title: "Team Building Event - Adventure Outing",
    content: "Join us for an exciting team building adventure on June 15th at Eco Park. Activities include trekking, team challenges, and BBQ dinner. Register by June 5th via the events portal. Transport will be arranged.",
    category: "event",
    date: "2025-05-18",
    isNew: true,
    priority: "medium",
    author: "People & Culture",
  },
  {
    id: 4,
    title: "Happy Birthday Celebrations - May Birthdays",
    content: "Wishing a wonderful birthday to our May stars: Rahul Sharma (May 12), Sneha Patel (May 19), and Vikram Singh (May 25). Join us for cake cutting at 4 PM in the cafeteria on their respective dates!",
    category: "celebration",
    date: "2025-05-15",
    isNew: false,
    priority: "low",
    author: "Fun Committee",
  },
  {
    id: 5,
    title: "IT Security Awareness Training",
    content: "Mandatory IT security training session scheduled for May 30th, 2-3 PM. Topics include phishing prevention, password hygiene, and data protection. Attendance is compulsory for all employees.",
    category: "important",
    date: "2025-05-14",
    isNew: false,
    priority: "high",
    author: "IT Security",
  },
  {
    id: 6,
    title: "Monthly Town Hall - May 2025",
    content: "Our monthly town hall will be held on May 28th at 11 AM in the main conference hall. CEO will share company updates, Q1 results, and roadmap for H2. Submit your questions anonymously via the HR portal.",
    category: "general",
    date: "2025-05-12",
    isNew: false,
    priority: "medium",
    author: "Leadership Team",
  },
  {
    id: 7,
    title: "Employee Wellness Program Launch",
    content: "We're excited to launch our new Employee Wellness Program! Benefits include free gym membership, mental health counseling sessions, and meditation app subscriptions. Enroll through the HR portal by June 10th.",
    category: "update",
    date: "2025-05-10",
    isNew: false,
    priority: "medium",
    author: "Wellness Team",
  },
  {
    id: 8,
    title: "Referral Bonus Increased to Rs 50,000",
    content: "Great news! Our employee referral bonus has been increased from Rs 25,000 to Rs 50,000 for all positions. Refer talented friends and earn rewards. Check open positions on the careers page.",
    category: "update",
    date: "2025-05-08",
    isNew: false,
    priority: "medium",
    author: "Talent Acquisition",
  },
];

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
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredAnnouncements = filter === "all"
    ? announcements
    : announcements.filter(a => a.category === filter);

  const newCount = announcements.filter(a => a.isNew).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
            {newCount > 0 && (
              <motion.span
                className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}>
                {newCount} New
              </motion.span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">Stay updated with company news, events, and policy changes</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Announcements", value: announcements.length, icon: Megaphone, gradient: "from-blue-500 to-indigo-600" },
          { label: "New/Unread", value: newCount, icon: Bell, gradient: "from-red-500 to-rose-600" },
          { label: "Events Coming", value: announcements.filter(a => a.category === "event").length, icon: Calendar, gradient: "from-emerald-500 to-teal-600" },
          { label: "Important", value: announcements.filter(a => a.priority === "high").length, icon: AlertCircle, gradient: "from-amber-500 to-orange-600" },
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { value: "all", label: "All", icon: Sparkles },
          { value: "important", label: "Important", icon: AlertCircle },
          { value: "policy", label: "Policy", icon: Shield },
          { value: "event", label: "Events", icon: Calendar },
          { value: "celebration", label: "Celebrations", icon: PartyPopper },
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
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAnnouncements.map((announcement, i) => {
            const catConfig = categoryConfig[announcement.category];
            const prioConfig = priorityConfig[announcement.priority];
            const isExpanded = expandedId === announcement.id;
            const CatIcon = catConfig.icon;

            return (
              <motion.div key={announcement.id}
                layout
                className={`bg-white rounded-2xl border ${announcement.isNew ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-100"} shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setExpandedId(isExpanded ? null : announcement.id)}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl ${catConfig.bg} border ${catConfig.border} flex items-center justify-center flex-shrink-0`}>
                      <CatIcon className={`w-5 h-5 ${catConfig.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {announcement.isNew && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full ${catConfig.bg} ${catConfig.color} text-[10px] font-bold border ${catConfig.border}`}>
                          {catConfig.label}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prioConfig.bg} ${prioConfig.color} border ${prioConfig.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${prioConfig.dot}`} />
                          {announcement.priority}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">{announcement.title}</h3>
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

                    {/* Expand Arrow */}
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </motion.div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed">{announcement.content}</p>
                          <div className="flex items-center gap-3 mt-4">
                            <button className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100">
                              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
                              Mark as Read
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors border border-slate-200">
                              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
                              Learn More
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAnnouncements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No announcements in this category</p>
            <p className="text-xs mt-1">Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  );
}
