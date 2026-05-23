"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
} from "lucide-react";

interface CalendarEntry {
  employee_id: number;
  emp_id: string;
  employee_name: string;
  department: string;
  leave_type: "CL";
  start_date: string;
  end_date: string;
  status: "approved" | "pending";
}

export default function TeamCalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (selectedDept) params.set("department", selectedDept);
      const res = await fetch(`/api/team-calendar?${params}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data);
        setDepartments(json.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch team calendar", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCalendar(); }, [month, year, selectedDept]);


  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Group entries by employee
  const employeeMap = new Map<string, CalendarEntry[]>();
  entries.forEach((entry) => {
    const key = entry.employee_name;
    if (!employeeMap.has(key)) employeeMap.set(key, []);
    employeeMap.get(key)!.push(entry);
  });

  const isOnLeave = (entry: CalendarEntry, day: number) => {
    const date = new Date(year, month - 1, day);
    const start = new Date(entry.start_date);
    const end = new Date(entry.end_date);
    return date >= start && date <= end;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Team Calendar</h1>
            <p className="text-sm text-slate-500">See who&apos;s on leave</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-2 min-w-[120px] text-center">
              {monthName} {year}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>


          {departments.length > 0 && (
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100" />
          <span className="text-xs text-slate-600">On Leave (Approved)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-100 border border-dashed border-slate-300" />
          <span className="text-xs text-slate-600">Pending Approval</span>
        </div>
      </div>


      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : employeeMap.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No leaves scheduled this month</p>
            <p className="text-xs mt-1">Everyone is available!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 sticky left-0 bg-white z-10 min-w-[160px]">
                    Employee
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const date = new Date(year, month - 1, day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                      <th
                        key={day}
                        className={`px-1 py-3 font-medium text-center min-w-[28px] ${
                          isWeekend ? "bg-slate-50 text-slate-400" : "text-slate-600"
                        } ${isToday ? "!bg-indigo-50 !text-indigo-700" : ""}`}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from(employeeMap.entries()).map(([name, leaves]) => (
                  <tr key={name} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                      <div className="font-medium text-slate-800">{name}</div>
                      <div className="text-[10px] text-slate-400">{leaves[0]?.department}</div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const date = new Date(year, month - 1, day);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const activeLeave = leaves.find((l) => isOnLeave(l, day));
                      return (
                        <td key={day} className={`px-0.5 py-2.5 text-center ${isWeekend ? "bg-slate-50" : ""}`}>
                          {activeLeave ? (
                            <div
                              className={`w-5 h-5 mx-auto rounded-sm ${
                                activeLeave.status === "pending"
                                  ? "border border-dashed border-slate-300 bg-slate-50"
                                  : "bg-blue-100"
                              }`}
                              title={`CL (${activeLeave.status})`}
                            />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
