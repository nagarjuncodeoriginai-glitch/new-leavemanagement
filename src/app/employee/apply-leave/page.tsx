"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CalendarDays, Send, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface LeavePolicy {
  id: number;
  leave_type: string;
  label: string;
  monthly_quota: number;
  carry_forward: boolean;
  requires_approval: boolean;
  min_days_advance: number;
  max_consecutive_days: number;
  is_active: boolean;
}

interface LeaveBalance {
  remaining_cl: number;
  remaining_sl: number;
  remaining_el: number;
  remaining_wfh: number;
}

const leaveTypeInfo: Record<string, { color: string; description: string }> = {
  CL: { color: "bg-blue-50 border-blue-200 text-blue-700", description: "For personal matters, errands, or short breaks" },
  SL: { color: "bg-red-50 border-red-200 text-red-700", description: "For illness or medical appointments. Can apply on same day." },
  EL: { color: "bg-purple-50 border-purple-200 text-purple-700", description: "Pre-planned leaves. Requires advance notice." },
  WFH: { color: "bg-emerald-50 border-emerald-200 text-emerald-700", description: "Work remotely from home for the day" },
};

export default function ApplyLeavePage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/leaves/balance");
        const json = await res.json();
        if (json.success) {
          setBalance(json.data);
          if (json.policies) setPolicies(json.policies);
        }
      } catch {
        // silently fail
      }
    };
    fetchData();
  }, []);

  const selectedPolicy = policies.find((p) => p.leave_type === leaveType);

  const getRemaining = (type: string): number => {
    if (!balance) return 0;
    const key = `remaining_${type.toLowerCase()}` as keyof LeaveBalance;
    return balance[key] ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccess("Leave application submitted successfully! Redirecting...");
        setTimeout(() => router.push("/employee/leaves"), 2000);
      } else {
        setError(json.message || "Failed to submit leave application");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        className="bg-white rounded-xl border border-slate-200/50 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Apply for Leave</h2>
              <p className="text-sm text-slate-500">Select leave type and fill in the details</p>
            </div>
          </div>
        </div>

        {/* Leave Balance Summary */}
        {balance && (
          <div className="px-6 pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {policies.filter(p => p.is_active).map((p) => {
                const remaining = getRemaining(p.leave_type);
                const isSelected = leaveType === p.leave_type;
                return (
                  <button
                    key={p.leave_type}
                    type="button"
                    onClick={() => setLeaveType(p.leave_type)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-500">{p.label}</div>
                    <div className={`text-lg font-bold mt-0.5 ${remaining > 0 ? "text-slate-900" : "text-red-500"}`}>
                      {remaining}
                    </div>
                    <div className="text-[10px] text-slate-400">of {p.monthly_quota}/month</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-emerald-700">{success}</span>
            </div>
          )}

          {/* Selected Type Info */}
          {selectedPolicy && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${leaveTypeInfo[leaveType]?.color || "bg-slate-50 border-slate-200 text-slate-700"}`}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium">{selectedPolicy.label}:</span>{" "}
                {leaveTypeInfo[leaveType]?.description}
                {selectedPolicy.min_days_advance > 0 && (
                  <span className="block mt-1 text-xs opacity-75">
                    Requires {selectedPolicy.min_days_advance} day(s) advance notice. Max {selectedPolicy.max_consecutive_days} consecutive day(s).
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={leaveType === "SL" ? undefined : new Date().toISOString().split("T")[0]}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            >
              {policies.filter(p => p.is_active).map((p) => (
                <option key={p.leave_type} value={p.leave_type}>
                  {p.label} ({getRemaining(p.leave_type)} remaining)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              minLength={10}
              placeholder="Please provide a reason for your leave request (minimum 10 characters)..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || getRemaining(leaveType) === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Leave Application
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
