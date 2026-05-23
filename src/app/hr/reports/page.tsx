"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, CalendarCheck, Clock,
  Download, Filter,
  PieChart, Activity, Briefcase,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";

interface ReportData {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onProbation: number;
  totalLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  departmentStats: { department: string; employees: number; leaves: number }[];
  monthlyLeaveData: { month: string; approved: number; rejected: number; pending: number }[];
  topLeaveEmployees: { name: string; emp_id: string; total: number }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "leaves" | "departments">("overview");

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [empRes, leaveRes] = await Promise.all([
        fetch("/api/employees?limit=100"),
        fetch("/api/leaves?limit=100"),
      ]);
      const empJson = await empRes.json();
      const leaveJson = await leaveRes.json();

      const employees = empJson.data || [];
      const leaves = leaveJson.data || [];

      // Calculate stats
      const totalEmployees = empJson.total || 0;
      const activeEmployees = employees.filter((e: any) => e.status === "active").length;
      const inactiveEmployees = employees.filter((e: any) => e.status === "inactive").length;
      const onProbation = employees.filter((e: any) => e.status === "on_probation").length;

      const totalLeaves = leaveJson.total || 0;
      const approvedLeaves = leaves.filter((l: any) => l.status === "approved").length;
      const rejectedLeaves = leaves.filter((l: any) => l.status === "rejected").length;
      const pendingLeaves = leaves.filter((l: any) => l.status === "pending").length;

      // Department stats
      const deptMap: Record<string, { employees: number; leaves: number }> = {};
      employees.forEach((emp: any) => {
        if (!deptMap[emp.department]) deptMap[emp.department] = { employees: 0, leaves: 0 };
        deptMap[emp.department].employees++;
      });
      leaves.forEach((leave: any) => {
        const emp = employees.find((e: any) => e.emp_id === leave.emp_id);
        if (emp && deptMap[emp.department]) {
          deptMap[emp.department].leaves++;
        }
      });
      const departmentStats = Object.entries(deptMap).map(([department, stats]) => ({
        department,
        ...stats,
      }));

      // Monthly leave data (last 6 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const monthlyLeaveData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const month = months[d.getMonth()];
        const mLeaves = leaves.filter((l: any) => {
          const ld = new Date(l.applied_at);
          return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
        });
        return {
          month,
          approved: mLeaves.filter((l: any) => l.status === "approved").length,
          rejected: mLeaves.filter((l: any) => l.status === "rejected").length,
          pending: mLeaves.filter((l: any) => l.status === "pending").length,
        };
      });

      // Top leave takers
      const empLeaveCount: Record<string, { name: string; emp_id: string; total: number }> = {};
      leaves.forEach((l: any) => {
        const key = l.emp_id || "unknown";
        if (!empLeaveCount[key]) {
          empLeaveCount[key] = { name: l.employee_name || "Unknown", emp_id: key, total: 0 };
        }
        empLeaveCount[key].total++;
      });
      const topLeaveEmployees = Object.values(empLeaveCount)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setData({
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onProbation,
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
        departmentStats,
        monthlyLeaveData,
        topLeaveEmployees,
      });
    } catch (error) {
      console.error("Report fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Generating reports...</p>
        </motion.div>
      </div>
    );
  }

  const approvalRate = data && data.totalLeaves > 0
    ? Math.round((data.approvedLeaves / data.totalLeaves) * 100)
    : 0;

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Comprehensive workforce insights and leave analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchReportData()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition-all active:scale-95">
            <Filter className="w-4 h-4" /> Refresh Data
          </button>
          <button onClick={() => {
            if (!data) return;
            const rows = [
              ["Metric", "Value"],
              ["Total Employees", String(data.totalEmployees)],
              ["Active Employees", String(data.activeEmployees)],
              ["Inactive Employees", String(data.inactiveEmployees)],
              ["On Probation", String(data.onProbation)],
              ["Total Leaves", String(data.totalLeaves)],
              ["Approved Leaves", String(data.approvedLeaves)],
              ["Rejected Leaves", String(data.rejectedLeaves)],
              ["Pending Leaves", String(data.pendingLeaves)],
              ["Approval Rate", `${approvalRate}%`],
              [""],
              ["Department", "Employees", "Leaves"],
              ...data.departmentStats.map(d => [d.department, String(d.employees), String(d.leaves)]),
              [""],
              ["Month", "Approved", "Rejected", "Pending"],
              ...data.monthlyLeaveData.map(m => [m.month, String(m.approved), String(m.rejected), String(m.pending)]),
            ];
            const csv = rows.map(r => r.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hr-report-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Workforce", value: data?.totalEmployees || 0, icon: Users, gradient: "from-blue-500 to-indigo-600" },
          { label: "Leave Approval Rate", value: `${approvalRate}%`, icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600" },
          { label: "Pending Reviews", value: data?.pendingLeaves || 0, icon: Clock, gradient: "from-amber-500 to-orange-600" },
          { label: "On Probation", value: data?.onProbation || 0, icon: AlertCircle, gradient: "from-violet-500 to-purple-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={cardVariants}
            className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-r ${stat.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-all`} />
            <div className="relative z-10">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100 p-1.5">
        <div className="flex items-center gap-1">
          {([
            { id: "overview" as const, label: "Overview", icon: BarChart3 },
            { id: "leaves" as const, label: "Leave Analytics", icon: CalendarCheck },
            { id: "departments" as const, label: "Departments", icon: Briefcase },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Employee Distribution */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Employee Status</h3>
                <p className="text-xs text-slate-500">Workforce distribution by status</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Active", count: data?.activeEmployees || 0, color: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
                { label: "On Probation", count: data?.onProbation || 0, color: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700" },
                { label: "Inactive", count: data?.inactiveEmployees || 0, color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg ${item.bgColor} ${item.textColor} text-xs font-semibold min-w-[100px]`}>
                    {item.label}
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${data && data.totalEmployees > 0 ? (item.count / data.totalEmployees) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 min-w-[30px] text-right">{item.count}</span>
                </div>
              ))}
            </div>

            {/* Mini donut visualization */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-8">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={251} initial={{ strokeDashoffset: 251 }}
                    animate={{ strokeDashoffset: 251 - (data && data.totalEmployees > 0 ? ((data.activeEmployees || 0) / data.totalEmployees) : 0) * 251 }}
                    transition={{ duration: 1.2 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{data?.totalEmployees || 0}</span>
                  <span className="text-[10px] text-slate-500">Total</span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Active", color: "bg-emerald-500", count: data?.activeEmployees || 0 },
                  { label: "Probation", color: "bg-amber-500", count: data?.onProbation || 0 },
                  { label: "Inactive", color: "bg-red-500", count: data?.inactiveEmployees || 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-slate-600">{item.label}: <span className="font-bold">{item.count}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Leave Summary */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Leave Summary</h3>
                <p className="text-xs text-slate-500">Overall leave request statistics</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Approved", count: data?.approvedLeaves || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Rejected", count: data?.rejectedLeaves || 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                { label: "Pending", count: data?.pendingLeaves || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              ].map((item) => (
                <div key={item.label} className={`p-4 rounded-xl ${item.bg} border ${item.border} text-center`}>
                  <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-1.5`} />
                  <p className={`text-xl font-black ${item.color}`}>{item.count}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly bar chart */}
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Monthly Trend</h4>
            <div className="flex items-end gap-2 h-32">
              {data?.monthlyLeaveData.map((month, i) => {
                const total = month.approved + month.rejected + month.pending;
                const maxTotal = Math.max(...(data?.monthlyLeaveData.map(m => m.approved + m.rejected + m.pending) || [1]));
                const height = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-400 relative group cursor-pointer"
                      style={{ minHeight: "4px" }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 5)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {total} leaves
                      </div>
                    </motion.div>
                    <span className="text-[10px] text-slate-500 font-medium">{month.month}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === "leaves" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Leave Takers */}
          <motion.div variants={cardVariants} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Top Leave Takers</h3>
                <p className="text-xs text-slate-500">Employees with most leave requests</p>
              </div>
            </div>
            {data?.topLeaveEmployees && data.topLeaveEmployees.length > 0 ? (
              <div className="space-y-3">
                {data.topLeaveEmployees.map((emp, i) => (
                  <motion.div key={emp.emp_id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 transition-all"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.emp_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(emp.total * 20, 100)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 min-w-[24px] text-right">{emp.total}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CalendarCheck className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No leave data available</p>
              </div>
            )}
          </motion.div>

          {/* Approval Breakdown */}
          <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Approval Rate</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={264} initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (approvalRate / 100) * 264 }}
                    transition={{ duration: 1.5 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{approvalRate}%</span>
                  <span className="text-[10px] text-slate-500">Approved</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-medium text-emerald-700">Approved</span>
                <span className="text-sm font-bold text-emerald-700">{data?.approvedLeaves || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                <span className="text-xs font-medium text-red-700">Rejected</span>
                <span className="text-sm font-bold text-red-700">{data?.rejectedLeaves || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-xs font-medium text-amber-700">Pending</span>
                <span className="text-sm font-bold text-amber-700">{data?.pendingLeaves || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <motion.div variants={cardVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Department Analytics</h3>
              <p className="text-xs text-slate-500">Employee and leave distribution by department</p>
            </div>
          </div>
          {data?.departmentStats && data.departmentStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.departmentStats.map((dept, i) => {
                const colors = [
                  "from-blue-500 to-indigo-600",
                  "from-emerald-500 to-teal-600",
                  "from-purple-500 to-fuchsia-600",
                  "from-amber-500 to-orange-600",
                  "from-rose-500 to-pink-600",
                  "from-cyan-500 to-blue-600",
                ];
                return (
                  <motion.div key={dept.department}
                    className="p-5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center shadow-lg mb-3`}>
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{dept.department}</h4>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-center">
                        <p className="text-lg font-black text-blue-700">{dept.employees}</p>
                        <p className="text-[10px] text-blue-600 font-medium">Employees</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-center">
                        <p className="text-lg font-black text-amber-700">{dept.leaves}</p>
                        <p className="text-[10px] text-amber-600 font-medium">Leaves</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Briefcase className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No department data available</p>
              <p className="text-xs mt-1">Add employees to see department analytics</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
