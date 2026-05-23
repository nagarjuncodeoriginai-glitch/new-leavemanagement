"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Download,
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

export default function HRTeamCalendarPage() {
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

  const employeeMap = new Map<string, CalendarEntry[]>();
  entries.forEach((entry) => {
    const key = `${entry.employee_name}|${entry.emp_id}`;
    if (!employeeMap.has(key)) employeeMap.set(key, []);
    employeeMap.get(key)!.push(entry);
  });

  const isOnLeave = (entry: CalendarEntry, day: number) => {
    const date = new Date(year, month - 1, day);
    const start = new Date(entry.start_date);
    const end = new Date(entry.end_date);
    return date >= start && date <= end;
  };

  const approvedCount = entries.filter((e) => e.status === "approved").length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const uniqueEmployees = new Set(entries.map((e) => e.employee_id)).size;

  const exportCSV = () => {
    const rows = [["Employee", "Emp ID", "Department", "Start Date", "End Date", "Status"]];
    entries.forEach((e) => {
      rows.push([e.employee_name, e.emp_id, e.department, e.start_date, e.end_date, e.status]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-calendar-${monthName}-${year}.csv`;
    a.click();
  };


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Team Calendar</h1>
            <p className="text-sm text-slate-500">
              {uniqueEmployees} employee(s) on leave &bull; {approvedCount} approved &bull; {pendingCount} pending
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
                className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>


      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-slate-600">On Leave (Approved)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-slate-400" />
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
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : employeeMap.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No leaves scheduled this month</p>
            <p className="text-xs mt-1">All employees are available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                    Employee
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const date = new Date(year, month - 1, day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                      <th
                        key={day}
                        className={`px-1 py-3 font-medium text-center min-w-[30px] ${
                          isWeekend ? "bg-slate-100/80 text-slate-400" : "text-slate-600"
                        } ${isToday ? "!bg-violet-100 !text-violet-700 font-bold" : ""}`}
                      >
                        <div>{day}</div>
                        <div className="text-[9px] font-normal mt-0.5">
                          {date.toLocaleDateString("en", { weekday: "narrow" })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>


              <tbody>
                {Array.from(employeeMap.entries()).map(([key, leaves]) => {
                  const [name, empId] = key.split("|");
                  return (
                    <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 sticky left-0 bg-white z-10">
                        <div className="font-medium text-slate-800">{name}</div>
                        <div className="text-[10px] text-slate-400">{empId} &bull; {leaves[0]?.department}</div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const date = new Date(year, month - 1, day);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const activeLeave = leaves.find((l) => isOnLeave(l, day));
                        return (
                          <td key={day} className={`px-0.5 py-3 text-center ${isWeekend ? "bg-slate-100/50" : ""}`}>
                            {activeLeave ? (
                              <div
                                className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[9px] font-bold ${
                                  activeLeave.status === "pending"
                                    ? "border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                                title={`${name}: CL (${activeLeave.status})`}
                              >
                                CL
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
