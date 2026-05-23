"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle, XCircle, Ban, X } from "lucide-react";
import { Leave } from "@/types";

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/leaves?${params}`);
      const json = await res.json();
      if (json.success) {
        setLeaves(json.data);
        setTotal(json.total);
      }
    } catch (error) {
      console.error("Fetch leaves error:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const cancelLeave = async (leaveId: number) => {
    setCancellingId(leaveId);
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancelled" }),
      });
      const json = await res.json();
      if (json.success) {
        setLeaves((prev) =>
          prev.map((l) => (l.id === leaveId ? { ...l, status: "cancelled" as const } : l))
        );
      }
    } catch (error) {
      console.error("Cancel leave error:", error);
    } finally {
      setCancellingId(null);
      setCancelConfirm(null);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Leave History</h2>
        <p className="text-sm text-slate-500 mt-1">View all your leave applications and their status</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {/* Leaves List */}
      <div className="bg-white rounded-xl border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CalendarDays className="w-12 h-12 mb-3" />
            <p className="font-medium">No leave applications found</p>
            <p className="text-sm">Apply for leave to see your history here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave, i) => (
              <motion.div
                key={leave.id}
                className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      leave.status === "approved" ? "bg-emerald-50" :
                      leave.status === "rejected" ? "bg-red-50" :
                      leave.status === "cancelled" ? "bg-slate-100" : "bg-amber-50"
                    }`}>
                      {leave.status === "approved" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                       leave.status === "rejected" ? <XCircle className="w-5 h-5 text-red-600" /> :
                       leave.status === "cancelled" ? <Ban className="w-5 h-5 text-slate-400" /> :
                       <Clock className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Casual Leave (CL)</p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        {leave.start_date !== leave.end_date && (
                          <> — {new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{leave.reason}</p>
                    </div>
                  </div>


                  <div className="text-right flex-shrink-0 space-y-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      leave.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                      leave.status === "rejected" ? "bg-red-50 text-red-700" :
                      leave.status === "cancelled" ? "bg-slate-100 text-slate-500" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                    <p className="text-xs text-slate-400">
                      Applied {new Date(leave.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    {/* Cancel Button - only for pending leaves */}
                    {leave.status === "pending" && (
                      <>
                        {cancelConfirm === leave.id ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              onClick={() => cancelLeave(leave.id)}
                              disabled={cancellingId === leave.id}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === leave.id ? "..." : "Yes, Cancel"}
                            </button>
                            <button
                              onClick={() => setCancelConfirm(null)}
                              className="p-1 rounded hover:bg-slate-100"
                            >
                              <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelConfirm(leave.id)}
                            className="mt-1 px-2.5 py-1 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md font-medium hover:bg-red-100 transition-colors"
                          >
                            Cancel Request
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}


        {total > 10 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {page} of {Math.ceil(total / 10)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
