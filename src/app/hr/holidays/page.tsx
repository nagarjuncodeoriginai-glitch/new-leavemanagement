"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, Edit2, Trash2, X, CheckCircle2,
  Sun, Star, Heart, Flag, Gift, Palmtree,
  ChevronLeft, ChevronRight, Search, Download,
  AlertCircle, Sparkles,
} from "lucide-react";

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: "national" | "religious" | "company" | "optional";
  day: string;
}

const defaultHolidays: Holiday[] = [
  { id: 1, name: "New Year's Day", date: "2025-01-01", type: "national", day: "Wednesday" },
  { id: 2, name: "Republic Day", date: "2025-01-26", type: "national", day: "Sunday" },
  { id: 3, name: "Holi", date: "2025-03-14", type: "religious", day: "Friday" },
  { id: 4, name: "Good Friday", date: "2025-04-18", type: "religious", day: "Friday" },
  { id: 5, name: "May Day", date: "2025-05-01", type: "national", day: "Thursday" },
  { id: 6, name: "Company Foundation Day", date: "2025-05-15", type: "company", day: "Thursday" },
  { id: 7, name: "Independence Day", date: "2025-08-15", type: "national", day: "Friday" },
  { id: 8, name: "Ganesh Chaturthi", date: "2025-08-27", type: "religious", day: "Wednesday" },
  { id: 9, name: "Gandhi Jayanti", date: "2025-10-02", type: "national", day: "Thursday" },
  { id: 10, name: "Dussehra", date: "2025-10-02", type: "religious", day: "Thursday" },
  { id: 11, name: "Diwali", date: "2025-10-21", type: "religious", day: "Tuesday" },
  { id: 12, name: "Diwali (Day 2)", date: "2025-10-22", type: "religious", day: "Wednesday" },
  { id: 13, name: "Christmas", date: "2025-12-25", type: "religious", day: "Thursday" },
  { id: 14, name: "Year End Break", date: "2025-12-31", type: "company", day: "Wednesday" },
  { id: 15, name: "Eid ul-Fitr", date: "2025-03-31", type: "optional", day: "Monday" },
  { id: 16, name: "Raksha Bandhan", date: "2025-08-09", type: "optional", day: "Saturday" },
];

const typeConfig = {
  national: { icon: Flag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "National" },
  religious: { icon: Star, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", label: "Religious" },
  company: { icon: Heart, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Company" },
  optional: { icon: Gift, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "Optional" },
};

export default function HRHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(defaultHolidays);
  const [showModal, setShowModal] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [form, setForm] = useState({ name: "", date: "", type: "national" as Holiday["type"] });
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const filteredHolidays = holidays
    .filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || h.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAdd = () => {
    setEditHoliday(null);
    setForm({ name: "", date: "", type: "national" });
    setShowModal(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditHoliday(holiday);
    setForm({ name: holiday.name, date: holiday.date, type: holiday.type });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date) return;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = dayNames[new Date(form.date).getDay()];

    if (editHoliday) {
      setHolidays(prev => prev.map(h =>
        h.id === editHoliday.id ? { ...h, name: form.name, date: form.date, type: form.type, day } : h
      ));
    } else {
      const newHoliday: Holiday = {
        id: Math.max(...holidays.map(h => h.id), 0) + 1,
        name: form.name,
        date: form.date,
        type: form.type,
        day,
      };
      setHolidays(prev => [...prev, newHoliday]);
    }
    setShowModal(false);
  };

  // Calendar helpers
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const getHolidaysOnDate = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.filter(h => h.date === dateStr);
  };

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Holiday Calendar</h2>
          <p className="text-sm text-slate-500 mt-1">Manage company holidays and observances for {calendarYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Holidays", value: holidays.length, icon: Calendar, gradient: "from-blue-500 to-indigo-600" },
          { label: "National", value: holidays.filter(h => h.type === "national").length, icon: Flag, gradient: "from-emerald-500 to-teal-600" },
          { label: "Company", value: holidays.filter(h => h.type === "company").length, icon: Heart, gradient: "from-purple-500 to-fuchsia-600" },
          { label: "Upcoming", value: upcomingHolidays.length, icon: Sun, gradient: "from-amber-500 to-orange-600" },
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

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Calendar View */}
        <motion.div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">{monthNames[calendarMonth]} {calendarYear}</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
              <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else setCalendarMonth(m => m + 1); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
              const day = i + 1;
              const holidaysOnDay = getHolidaysOnDate(day);
              const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
              const hasHoliday = holidaysOnDay.length > 0;
              return (
                <div key={day} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium relative transition-all ${
                  isToday ? "ring-2 ring-indigo-500 ring-offset-1 bg-indigo-50" :
                  hasHoliday ? "bg-red-50 border border-red-100" : "hover:bg-slate-50"
                }`} title={holidaysOnDay.map(h => h.name).join(", ")}>
                  <span className={`${isToday ? "text-indigo-700 font-bold" : hasHoliday ? "text-red-700 font-bold" : "text-slate-700"}`}>{day}</span>
                  {hasHoliday && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5" />}
                </div>
              );
            })}
          </div>

          {/* Upcoming Holidays */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Upcoming</h4>
            </div>
            <div className="space-y-2">
              {upcomingHolidays.slice(0, 3).map((h) => {
                const config = typeConfig[h.type];
                return (
                  <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center`}>
                      <config.icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{h.name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} &middot; {h.day}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Holiday List */}
        <motion.div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Search & Filter */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search holidays..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="all">All Types</option>
                <option value="national">National</option>
                <option value="religious">Religious</option>
                <option value="company">Company</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-50 max-h-[550px] overflow-y-auto">
            {filteredHolidays.map((holiday, i) => {
              const config = typeConfig[holiday.type];
              const isPast = new Date(holiday.date) < new Date();
              return (
                <motion.div key={holiday.id}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors ${isPast ? "opacity-60" : ""}`}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{holiday.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(holiday.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} &middot; {holiday.day}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.bg} ${config.color} border ${config.border} hidden sm:inline`}>
                    {config.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(holiday)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(holiday.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filteredHolidays.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Calendar className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No holidays found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editHoliday ? "Edit Holiday" : "Add New Holiday"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Holiday Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required placeholder="e.g., Diwali"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Holiday["type"] })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300">
                    <option value="national">National Holiday</option>
                    <option value="religious">Religious Holiday</option>
                    <option value="company">Company Holiday</option>
                    <option value="optional">Optional Holiday</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20">
                    {editHoliday ? "Update" : "Add Holiday"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
