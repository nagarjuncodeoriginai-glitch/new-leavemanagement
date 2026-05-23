"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, CheckCircle2, Circle, Clock,
  FileText, Shield, Laptop, Users, Briefcase,
  Calendar, ChevronDown, ChevronUp, Plus, X, Edit2,
  Trash2, Rocket, GraduationCap, Heart,
  Star, Target, Search,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface OnboardingEmployee {
  id: number;
  name: string;
  emp_id: string;
  department: string;
  designation: string;
  doj: string;
  email: string;
  status: "not_started" | "in_progress" | "completed";
  currentStep: number;
  completedSteps: number[];
  notes: string;
  createdAt: string;
}

const onboardingSteps = [
  { id: 1, title: "Document Verification", description: "ID proof, address proof, education certificates", icon: FileText, duration: "Day 1" },
  { id: 2, title: "IT Setup & Access", description: "Laptop, email, software access, VPN credentials", icon: Laptop, duration: "Day 1-2" },
  { id: 3, title: "Policy Orientation", description: "Company policies, code of conduct, leave policy", icon: Shield, duration: "Day 2" },
  { id: 4, title: "Team Introduction", description: "Meet the team, manager 1:1, buddy assignment", icon: Users, duration: "Day 2-3" },
  { id: 5, title: "Role Training", description: "Job-specific training, tools walkthrough, KPIs", icon: GraduationCap, duration: "Week 1" },
  { id: 6, title: "HR Orientation", description: "Benefits enrollment, emergency contacts, feedback", icon: Heart, duration: "Week 1" },
  { id: 7, title: "30-Day Check-in", description: "Progress review, feedback session, goal setting", icon: Target, duration: "Day 30" },
];

const defaultFormData = {
  name: "",
  emp_id: "",
  department: "",
  designation: "",
  doj: "",
  email: "",
  notes: "",
};

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<OnboardingEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<OnboardingEmployee | null>(null);
  const [form, setForm] = useState(defaultFormData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const toast = useToast();
  const { confirm } = useConfirm();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_employees");
    if (saved) {
      try {
        setEmployees(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("onboarding_employees", JSON.stringify(employees));
  }, [employees]);

  const handleAdd = () => {
    setEditEmployee(null);
    setForm(defaultFormData);
    setShowAddModal(true);
  };

  const handleEdit = (emp: OnboardingEmployee) => {
    setEditEmployee(emp);
    setForm({
      name: emp.name,
      emp_id: emp.emp_id,
      department: emp.department,
      designation: emp.designation,
      doj: emp.doj,
      email: emp.email,
      notes: emp.notes,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Remove Onboarding Entry",
      message: "Are you sure you want to remove this onboarding entry? This action cannot be undone.",
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (selectedEmployee?.id === id) setSelectedEmployee(null);
    toast.success("Removed", "Onboarding entry has been removed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.emp_id || !form.department || !form.designation || !form.doj) {
      toast.error("Validation Error", "Please fill in all required fields.");
      return;
    }

    if (editEmployee) {
      setEmployees(prev => prev.map(emp =>
        emp.id === editEmployee.id
          ? { ...emp, ...form }
          : emp
      ));
      toast.success("Updated", `${form.name}'s onboarding details updated.`);
    } else {
      const newEmp: OnboardingEmployee = {
        id: Date.now(),
        ...form,
        status: "not_started",
        currentStep: 0,
        completedSteps: [],
        createdAt: new Date().toISOString(),
      };
      setEmployees(prev => [newEmp, ...prev]);
      toast.success("Added", `${form.name} has been added to onboarding.`);
    }
    setShowAddModal(false);
    setForm(defaultFormData);
  };

  const toggleStep = (empId: number, stepId: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;
      const isCompleted = emp.completedSteps.includes(stepId);
      let newCompletedSteps: number[];
      if (isCompleted) {
        newCompletedSteps = emp.completedSteps.filter(s => s !== stepId);
      } else {
        newCompletedSteps = [...emp.completedSteps, stepId];
      }
      const allDone = newCompletedSteps.length === onboardingSteps.length;
      const inProgress = newCompletedSteps.length > 0 && !allDone;
      return {
        ...emp,
        completedSteps: newCompletedSteps,
        currentStep: Math.max(...newCompletedSteps, 0) + 1,
        status: allDone ? "completed" : inProgress ? "in_progress" : "not_started",
      };
    }));
  };

  const getProgressPercentage = (emp: OnboardingEmployee) => {
    return Math.round((emp.completedSteps.length / onboardingSteps.length) * 100);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.emp_id.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: employees.length,
    inProgress: employees.filter(e => e.status === "in_progress").length,
    notStarted: employees.filter(e => e.status === "not_started").length,
    completed: employees.filter(e => e.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Onboarding</h2>
          <p className="text-sm text-slate-500 mt-1">Add new hires and track their onboarding progress step by step</p>
        </div>
        <button onClick={handleAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20">
          <UserPlus className="w-4 h-4" />
          Add New Onboarding
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, gradient: "from-slate-600 to-slate-800", shadow: "shadow-slate-500/20" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
          { label: "Not Started", value: stats.notStarted, icon: Circle, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}>
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or department..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Onboarding List */}
      {filteredEmployees.length === 0 ? (
        <motion.div className="bg-white rounded-2xl border border-slate-100 p-16 text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No onboarding entries yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {employees.length === 0
              ? "Click \"Add New Onboarding\" to start tracking a new hire's onboarding journey."
              : "No entries match your current filters."
            }
          </p>
          {employees.length === 0 && (
            <button onClick={handleAdd}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" /> Add First Onboarding
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredEmployees.map((emp, i) => (
            <motion.div key={emp.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Employee Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                      {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900">{emp.name}</h4>
                      <p className="text-sm text-slate-500">{emp.designation} &middot; {emp.department}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {emp.emp_id}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Joining: {new Date(emp.doj).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="w-40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600">{getProgressPercentage(emp)}%</span>
                        <span className="text-xs text-slate-400">{emp.completedSteps.length}/{onboardingSteps.length}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            emp.status === "completed" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                            emp.status === "in_progress" ? "bg-gradient-to-r from-blue-400 to-indigo-500" :
                            "bg-slate-300"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercentage(emp)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      emp.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      emp.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {emp.status === "in_progress" ? "In Progress" : emp.status === "completed" ? "Completed" : "Not Started"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(emp)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        {selectedEmployee?.id === emp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Steps */}
              <AnimatePresence>
                {selectedEmployee?.id === emp.id && (
                  <motion.div className="px-5 pb-5 border-t border-slate-100 pt-4"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <p className="text-xs text-slate-500 mb-4 font-medium">Click on a step to mark it as complete/incomplete:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {onboardingSteps.map((step) => {
                        const isCompleted = emp.completedSteps.includes(step.id);
                        return (
                          <button key={step.id}
                            onClick={() => toggleStep(emp.id, step.id)}
                            className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-sm ${
                              isCompleted
                                ? "bg-emerald-50/80 border-emerald-200 hover:bg-emerald-50"
                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50"
                            }`}>
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isCompleted ? "bg-emerald-100" : "bg-slate-200"
                              }`}>
                                {isCompleted
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  : <Circle className="w-4 h-4 text-slate-400" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${isCompleted ? "text-emerald-700" : "text-slate-600"}`}>
                                  {step.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{step.description}</p>
                                <span className="text-[10px] text-slate-400 font-medium mt-1 block">{step.duration}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {emp.notes && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs text-amber-800"><span className="font-bold">Notes:</span> {emp.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editEmployee ? "Edit Onboarding" : "Start New Onboarding"}
                  </h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee ID *</label>
                    <input type="text" value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })}
                      required placeholder="EMP001"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Department *</label>
                    <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300">
                      <option value="">Select</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation *</label>
                    <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      required placeholder="Software Engineer"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Joining *</label>
                    <input type="date" value={form.doj} onChange={(e) => setForm({ ...form, doj: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2} placeholder="Any special instructions or notes for this onboarding..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20">
                    {editEmployee ? "Update Entry" : "Start Onboarding"}
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
