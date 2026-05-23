"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, Users, MapPin,
  Calendar, Timer, AlertCircle, Search, Download,
  LogIn, LogOut, BarChart3, Trash2,
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  employee_id: number;
  emp_id: string;
  full_name: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  status: "present" | "late" | "absent";
  hours: number;
  is_auto: boolean;
}

export default function HRAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set("date", dateFilter);
      const res = await fetch(`/api/attendance?${params}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredRecords = records.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.emp_id.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = filteredRecords.filter(r => r.status === "present").length;
  const lateCount = filteredRecords.filter(r => r.status === "late").length;
  const totalHours = filteredRecords.reduce((sum, r) => sum + r.hours, 0);
  const checkedOutCount = filteredRecords.filter(r => r.check_out).length;

  const handleExport = () => {
    if (filteredRecords.length === 0) return;
    const rows = [
      ["Employee", "Emp ID", "Date", "Check In", "Check Out", "Status", "Hours", "Location"],
      ...filteredRecords.map(r => [
        r.full_name, r.emp_id, r.date,
        r.check_in || "-", r.check_out || "-",
        r.status, String(r.hours),
        r.check_in_location || "-",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${dateFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return;
    try {
      const res = await fetch(`/api/attendance?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchAttendance();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">Track daily check-in and check-out times of all employees</p>
        </div>
        <button onClick={handleExport} disabled={filteredRecords.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Present Today", value: presentCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", gradient: "from-emerald-500 to-teal-600" },
          { label: "Late Arrivals", value: lateCount, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-500 to-orange-600" },
          { label: "Checked Out", value: checkedOutCount, icon: LogOut, color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-500 to-indigo-600" },
          { label: "Total Hours", value: totalHours.toFixed(1), icon: Timer, color: "text-violet-600", bg: "bg-violet-50", gradient: "from-violet-500 to-purple-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or employee ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <button onClick={() => setDateFilter(new Date().toISOString().split("T")[0])}
          className="px-4 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-xl text-sm border border-blue-100 hover:bg-blue-100 transition-all active:scale-95">
          Today
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No attendance records for this date</p>
            <p className="text-xs mt-1">Employees will appear here after they check in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Check In</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Check Out</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Hours</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <motion.tr key={record.id} className="hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {record.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{record.full_name}</p>
                          <p className="text-xs text-slate-500">{record.emp_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-900">{record.check_in || "—"}</span>
                        {record.is_auto && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">AUTO</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-sm text-slate-700">{record.check_out || <span className="text-amber-600 font-medium">Active</span>}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {record.hours > 0 ? `${record.hours}h` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        record.status === "present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        record.status === "late" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 max-w-[200px]">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-500 truncate">{record.check_in_location || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(record.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete record">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        {filteredRecords.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-700">
                {filteredRecords.length} record(s) for {new Date(dateFilter).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Avg: {filteredRecords.length > 0 ? (totalHours / filteredRecords.filter(r => r.hours > 0).length || 0).toFixed(1) : "0"}h/employee
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
