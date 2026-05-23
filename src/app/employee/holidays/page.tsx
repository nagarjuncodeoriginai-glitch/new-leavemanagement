"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Sun, Star, Heart, Flag, Gift, Palmtree,
  ChevronLeft, ChevronRight, Clock, MapPin,
  Sparkles, PartyPopper, CalendarDays,
} from "lucide-react";

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: "national" | "religious" | "company" | "optional";
  day: string;
}

const holidays: Holiday[] = [
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
  national: { icon: Flag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "National", gradient: "from-blue-500 to-indigo-600" },
  religious: { icon: Star, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", label: "Religious", gradient: "from-purple-500 to-fuchsia-600" },
  company: { icon: Heart, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Company", gradient: "from-emerald-500 to-teal-600" },
  optional: { icon: Gift, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "Optional", gradient: "from-amber-500 to-orange-600" },
};

export default function EmployeeHolidaysPage() {
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<string>("all");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const getHolidaysOnDate = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.filter(h => h.date === dateStr);
  };

  const filteredHolidays = (selectedType === "all" ? holidays : holidays.filter(h => h.type === selectedType))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextHoliday = upcomingHolidays[0];
  const daysUntilNext = nextHoliday
    ? Math.ceil((new Date(nextHoliday.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Holiday Calendar</h2>
        <p className="text-sm text-slate-500 mt-1">View company holidays and plan your time off</p>
      </div>

      {/* Next Holiday Hero Card */}
      {nextHoliday && (
        <motion.div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 rounded-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.4),transparent_60%)]" />
          <motion.div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/10 blur-xl"
            animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity }} />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Next Holiday</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-white">{nextHoliday.name}</h3>
              <p className="text-emerald-100 mt-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {new Date(nextHoliday.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                <p className="text-4xl font-black text-white">{daysUntilNext}</p>
                <p className="text-emerald-200 text-xs font-medium mt-0.5">days to go</p>
              </div>
              <div className="hidden lg:block text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <PartyPopper className="w-8 h-8 text-white mx-auto mb-1" />
                <p className="text-emerald-200 text-[10px] font-medium">{typeConfig[nextHoliday.type].label}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: holidays.length, type: "all" },
          { label: "National", value: holidays.filter(h => h.type === "national").length, type: "national" },
          { label: "Religious", value: holidays.filter(h => h.type === "religious").length, type: "religious" },
          { label: "Company", value: holidays.filter(h => h.type === "company").length, type: "company" },
        ].map((stat, i) => (
          <motion.button key={stat.label}
            onClick={() => setSelectedType(stat.type === selectedType ? "all" : stat.type)}
            className={`p-3 rounded-xl text-center transition-all border ${
              selectedType === stat.type
                ? "bg-emerald-50 border-emerald-200 shadow-sm"
                : "bg-white border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30"
            }`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <p className="text-xl font-black text-slate-900">{stat.value}</p>
            <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <motion.div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">{monthNames[calendarMonth]} {calendarYear}</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
              <button onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-[10px] font-semibold text-slate-500 transition-colors">Today</button>
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
              const dateObj = new Date(calendarYear, calendarMonth, day);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              return (
                <div key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium relative transition-all ${
                    isToday ? "ring-2 ring-emerald-500 ring-offset-1 bg-emerald-50" :
                    hasHoliday ? "bg-red-50 border border-red-100" :
                    isWeekend ? "bg-slate-50" : "hover:bg-slate-50"
                  }`}
                  title={holidaysOnDay.map(h => h.name).join(", ")}>
                  <span className={`${
                    isToday ? "text-emerald-700 font-bold" :
                    hasHoliday ? "text-red-700 font-bold" :
                    isWeekend ? "text-slate-400" : "text-slate-700"
                  }`}>{day}</span>
                  {hasHoliday && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5" />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap">
            {[
              { label: "Holiday", color: "bg-red-500" },
              { label: "Today", color: "bg-emerald-500" },
              { label: "Weekend", color: "bg-slate-300" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Holiday List */}
        <motion.div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedType === "all" ? "All Holidays" : `${typeConfig[selectedType as keyof typeof typeConfig]?.label} Holidays`}
              </h3>
            </div>
            <span className="text-xs text-slate-400">{filteredHolidays.length} holidays</span>
          </div>

          <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
            {filteredHolidays.map((holiday, i) => {
              const config = typeConfig[holiday.type];
              const isPast = new Date(holiday.date) < new Date();
              const CatIcon = config.icon;
              return (
                <motion.div key={holiday.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors ${isPast ? "opacity-50" : ""}`}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className={`rounded-xl overflow-hidden border ${config.border}`}>
                      <div className={`bg-gradient-to-r ${config.gradient} text-white text-[9px] font-bold py-0.5 uppercase`}>
                        {new Date(holiday.date).toLocaleDateString("en-IN", { month: "short" })}
                      </div>
                      <div className="bg-white py-1">
                        <span className="text-lg font-black text-slate-900">
                          {new Date(holiday.date).getDate()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{holiday.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {holiday.day}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  {isPast ? (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Passed</span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Upcoming</span>
                  )}
                </motion.div>
              );
            })}

            {filteredHolidays.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Palmtree className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No holidays in this category</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
