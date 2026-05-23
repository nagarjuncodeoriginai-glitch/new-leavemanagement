"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

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
  updated_at: string;
}

const typeColors: Record<string, string> = {
  CL: "from-blue-500 to-blue-600",
  SL: "from-red-500 to-red-600",
  EL: "from-purple-500 to-purple-600",
  WFH: "from-emerald-500 to-emerald-600",
};

export default function HRSettingsPage() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/leave-policies");
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data);
      }
    } catch {
      setError("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (policy: LeavePolicy) => {
    setError("");
    setSuccess("");
    setSaving(policy.id);

    try {
      const res = await fetch("/api/leave-policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: policy.id,
          leave_type: policy.leave_type,
          label: policy.label,
          monthly_quota: policy.monthly_quota,
          carry_forward: policy.carry_forward,
          requires_approval: policy.requires_approval,
          min_days_advance: policy.min_days_advance,
          max_consecutive_days: policy.max_consecutive_days,
          is_active: policy.is_active,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(`${policy.label} policy updated successfully. All employees have been notified.`);
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.message || "Failed to update policy");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleFieldChange = (id: number, field: keyof LeavePolicy, value: unknown) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Policy Settings</h1>
          <p className="text-sm text-slate-500">Configure leave types, quotas, and rules for all employees</p>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-emerald-700">{success}</span>
        </div>
      )}

      <div className="grid gap-4">
        {policies.map((policy, index) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${typeColors[policy.leave_type] || "from-slate-500 to-slate-600"} flex items-center justify-center`}>
                <span className="text-white font-bold text-xs">{policy.leave_type}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{policy.label}</h3>
                <p className="text-xs text-slate-400">Last updated: {new Date(policy.updated_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleFieldChange(policy.id, "is_active", !policy.is_active)}
                className="flex items-center gap-1.5"
                title={policy.is_active ? "Click to disable" : "Click to enable"}
              >
                {policy.is_active ? (
                  <ToggleRight className="w-8 h-8 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
                <span className={`text-xs font-medium ${policy.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                  {policy.is_active ? "Active" : "Disabled"}
                </span>
              </button>
            </div>

            {/* Settings Grid */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Monthly Quota
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={policy.monthly_quota}
                  onChange={(e) => handleFieldChange(policy.id, "monthly_quota", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">Days per month</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Min. Advance Notice
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={policy.min_days_advance}
                  onChange={(e) => handleFieldChange(policy.id, "min_days_advance", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">Days in advance</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Max Consecutive
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={policy.max_consecutive_days}
                  onChange={(e) => handleFieldChange(policy.id, "max_consecutive_days", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">Max days at once</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.carry_forward}
                    onChange={(e) => handleFieldChange(policy.id, "carry_forward", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span className="text-xs text-slate-700">Carry Forward</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.requires_approval}
                    onChange={(e) => handleFieldChange(policy.id, "requires_approval", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span className="text-xs text-slate-700">Requires Approval</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="px-5 pb-4">
              <button
                onClick={() => updatePolicy(policy)}
                disabled={saving === policy.id}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
              >
                {saving === policy.id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
