"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Star, TrendingUp, MessageSquare, BarChart3,
  Plus, X, Edit2, Trash2, Users, Search, CheckCircle2,
  Clock, Award, UserCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Employee {
  id: number;
  emp_id: string;
  full_name: string;
  department: string;
  designation: string;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: "on_track" | "at_risk" | "completed" | "not_started";
  dueDate: string;
  category: string;
  assignedBy: string;
  assignedAt: string;
  employeeId: string;
}

interface FeedbackItem {
  id: number;
  from: string;
  role: string;
  message: string;
  rating: number;
  date: string;
  type: "praise" | "constructive" | "general";
  employeeId: string;
}

interface SkillRating {
  skill: string;
  rating: number;
  max: number;
  employeeId: string;
}


export default function HRPerformancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [skills, setSkills] = useState<SkillRating[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"goals" | "feedback" | "skills">("goals");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { confirm } = useConfirm();

  const [goalForm, setGoalForm] = useState({
    title: "", description: "", progress: 0,
    status: "not_started" as Goal["status"],
    dueDate: "", category: "",
  });
  const [feedbackForm, setFeedbackForm] = useState({
    message: "", rating: 5, type: "general" as FeedbackItem["type"],
  });
  const [skillForm, setSkillForm] = useState({ skill: "", rating: 3 });

  const fetchData = useCallback(async () => {
    try {
      const [empRes, perfRes] = await Promise.all([
        fetch("/api/employees?limit=100"),
        fetch("/api/performance"),
      ]);
      const empJson = await empRes.json();
      const perfJson = await perfRes.json();
      if (empJson.success) setEmployees(empJson.data || []);
      if (perfJson.success) {
        setGoals(perfJson.data.goals || []);
        setFeedbacks(perfJson.data.feedback || []);
        setSkills(perfJson.data.skills || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);


  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !goalForm.title || !goalForm.dueDate || !goalForm.category) {
      toast.error("Error", "Fill all required fields and select an employee.");
      return;
    }
    try {
      if (editGoal) {
        const res = await fetch("/api/performance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "goal", id: editGoal.id, data: { ...goalForm, employeeId: selectedEmpId } }),
        });
        const json = await res.json();
        if (json.success) {
          setGoals(goals.map(g => g.id === editGoal.id ? json.data : g));
          toast.success("Updated", "Goal updated successfully.");
        } else { toast.error("Error", json.message); }
      } else {
        const res = await fetch("/api/performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "goal", data: { ...goalForm, employeeId: selectedEmpId } }),
        });
        const json = await res.json();
        if (json.success) {
          setGoals([...goals, json.data]);
          toast.success("Assigned", "Goal assigned to employee.");
        } else { toast.error("Error", json.message); }
      }
    } catch { toast.error("Error", "Network error."); }
    setShowGoalModal(false);
    setEditGoal(null);
    setGoalForm({ title: "", description: "", progress: 0, status: "not_started", dueDate: "", category: "" });
  };

  const handleDeleteGoal = async (id: number) => {
    const ok = await confirm({ title: "Delete Goal", message: "Remove this goal?", confirmText: "Delete", type: "danger" });
    if (!ok) return;
    try {
      const res = await fetch(`/api/performance?type=goal&id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setGoals(goals.filter(g => g.id !== id));
        toast.success("Deleted", "Goal removed.");
      } else { toast.error("Error", json.message); }
    } catch { toast.error("Error", "Network error."); }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !feedbackForm.message) {
      toast.error("Error", "Select employee and write feedback.");
      return;
    }
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "feedback", data: { ...feedbackForm, employeeId: selectedEmpId } }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbacks([...feedbacks, json.data]);
        toast.success("Submitted", "Feedback given to employee.");
      } else { toast.error("Error", json.message); }
    } catch { toast.error("Error", "Network error."); }
    setShowFeedbackModal(false);
    setFeedbackForm({ message: "", rating: 5, type: "general" });
  };

  const handleDeleteFeedback = async (id: number) => {
    const ok = await confirm({ title: "Delete Feedback", message: "Remove?", confirmText: "Delete", type: "danger" });
    if (!ok) return;
    try {
      const res = await fetch(`/api/performance?type=feedback&id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setFeedbacks(feedbacks.filter(f => f.id !== id));
        toast.success("Deleted", "Feedback removed.");
      } else { toast.error("Error", json.message); }
    } catch { toast.error("Error", "Network error."); }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !skillForm.skill) {
      toast.error("Error", "Select employee and enter skill.");
      return;
    }
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "skill", data: { ...skillForm, employeeId: selectedEmpId } }),
      });
      const json = await res.json();
      if (json.success) {
        // Replace existing skill for same employee or add new
        setSkills(prev => {
          const filtered = prev.filter(s => !(s.employeeId === selectedEmpId && s.skill === skillForm.skill));
          return [...filtered, json.data];
        });
        toast.success("Rated", "Skill rating saved.");
      } else { toast.error("Error", json.message); }
    } catch { toast.error("Error", "Network error."); }
    setShowSkillModal(false);
    setSkillForm({ skill: "", rating: 3 });
  };

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_id.toLowerCase().includes(search.toLowerCase())
  );

  const empGoals = goals.filter(g => g.employeeId === selectedEmpId);
  const empFeedbacks = feedbacks.filter(f => f.employeeId === selectedEmpId);
  const empSkills = skills.filter(s => s.employeeId === selectedEmpId);
  const selectedEmployee = employees.find(e => e.emp_id === selectedEmpId);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Management</h2>
          <p className="text-sm text-slate-500 mt-1">Assign goals, give feedback, and rate employee skills</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Goals", value: goals.length, icon: Target, gradient: "from-blue-500 to-indigo-600" },
          { label: "Feedback Given", value: feedbacks.length, icon: MessageSquare, gradient: "from-emerald-500 to-teal-600" },
          { label: "Skills Rated", value: skills.length, icon: BarChart3, gradient: "from-purple-500 to-fuchsia-600" },
          { label: "Employees", value: employees.length, icon: Users, gradient: "from-amber-500 to-orange-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
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
        {/* Employee Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No employees found</p>
              </div>
            ) : (
              filteredEmployees.map(emp => (
                <button key={emp.id} onClick={() => setSelectedEmpId(emp.emp_id)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
                    selectedEmpId === emp.emp_id ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-slate-50"
                  }`}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {emp.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.full_name}</p>
                    <p className="text-xs text-slate-500">{emp.emp_id} &middot; {emp.department}</p>
                  </div>
                  {selectedEmpId === emp.emp_id && <UserCheck className="w-4 h-4 text-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>


        {/* Right Panel */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedEmpId ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Select an Employee</h3>
              <p className="text-sm text-slate-500 mt-1">Choose an employee from the list to manage their performance</p>
            </div>
          ) : (
            <>
              {/* Selected Employee Header */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {selectedEmployee?.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedEmployee?.full_name}</h3>
                  <p className="text-xs text-slate-500">{selectedEmployee?.designation} &middot; {selectedEmployee?.department}</p>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                    {empGoals.length} Goals
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                    {empFeedbacks.length} Feedback
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-slate-100 p-1.5">
                <div className="flex gap-1">
                  {([
                    { id: "goals" as const, label: "Goals", icon: Target },
                    { id: "feedback" as const, label: "Feedback", icon: MessageSquare },
                    { id: "skills" as const, label: "Skills", icon: BarChart3 },
                  ]).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-1 justify-center transition-all ${
                        activeTab === tab.id ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-500 hover:bg-slate-50"
                      }`}>
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              {activeTab === "goals" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button onClick={() => { setEditGoal(null); setGoalForm({ title: "", description: "", progress: 0, status: "not_started", dueDate: "", category: "" }); setShowGoalModal(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20">
                      <Plus className="w-4 h-4" /> Assign Goal
                    </button>
                  </div>
                  {empGoals.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                      <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No goals assigned to this employee yet</p>
                    </div>
                  ) : empGoals.map(goal => (
                    <div key={goal.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{goal.category}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            goal.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                            goal.status === "at_risk" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
                          }`}>{goal.status.replace("_", " ")}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{goal.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-slate-400"><Clock className="w-3 h-3 inline mr-1" />Due: {new Date(goal.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          <div className="flex-1 max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${goal.progress}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">{goal.progress}%</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditGoal(goal); setGoalForm({ title: goal.title, description: goal.description, progress: goal.progress, status: goal.status, dueDate: goal.dueDate, category: goal.category }); setShowGoalModal(true); }}
                          className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}


              {/* Feedback */}
              {activeTab === "feedback" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button onClick={() => { setFeedbackForm({ message: "", rating: 5, type: "general" }); setShowFeedbackModal(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20">
                      <Plus className="w-4 h-4" /> Give Feedback
                    </button>
                  </div>
                  {empFeedbacks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No feedback given yet</p>
                    </div>
                  ) : empFeedbacks.map(fb => (
                    <div key={fb.id} className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              fb.type === "praise" ? "bg-emerald-50 text-emerald-700" : fb.type === "constructive" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                            }`}>{fb.type}</span>
                            <span className="text-xs text-slate-400">{new Date(fb.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          </div>
                          <p className="text-sm text-slate-700 mt-2">{fb.message}</p>
                          <div className="flex items-center gap-0.5 mt-2">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`w-3.5 h-3.5 ${j < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteFeedback(fb.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {activeTab === "skills" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button onClick={() => { setSkillForm({ skill: "", rating: 3 }); setShowSkillModal(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20">
                      <Plus className="w-4 h-4" /> Rate Skill
                    </button>
                  </div>
                  {empSkills.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                      <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No skills rated yet</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                      {empSkills.map((s, i) => (
                        <div key={s.skill}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{s.skill}</span>
                            <span className="text-xs font-bold text-slate-600">{s.rating}/5</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-500"
                              initial={{ width: 0 }} animate={{ width: `${(s.rating / 5) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.08 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* Goal Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">{editGoal ? "Edit Goal" : "Assign Goal"}</h3>
                <button onClick={() => setShowGoalModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddGoal} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input type="text" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Complete React Certification" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                    <select value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })} required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="">Select</option>
                      <option value="Learning">Learning</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Quality">Quality</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Innovation">Innovation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                    <input type="date" value={goalForm.dueDate} onChange={e => setGoalForm({ ...goalForm, dueDate: e.target.value })} required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Progress ({goalForm.progress}%)</label>
                    <input type="range" min={0} max={100} value={goalForm.progress} onChange={e => setGoalForm({ ...goalForm, progress: parseInt(e.target.value) })}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={goalForm.status} onChange={e => setGoalForm({ ...goalForm, status: e.target.value as Goal["status"] })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="not_started">Not Started</option>
                      <option value="on_track">On Track</option>
                      <option value="at_risk">At Risk</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">{editGoal ? "Update" : "Assign"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Give Feedback</h3>
                <button onClick={() => setShowFeedbackModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddFeedback} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={feedbackForm.type} onChange={e => setFeedbackForm({ ...feedbackForm, type: e.target.value as FeedbackItem["type"] })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="praise">Praise</option>
                    <option value="constructive">Constructive</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                  <textarea value={feedbackForm.message} onChange={e => setFeedbackForm({ ...feedbackForm, message: e.target.value })} rows={3} required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" placeholder="Write your feedback..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating ({feedbackForm.rating}/5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} type="button" onClick={() => setFeedbackForm({ ...feedbackForm, rating: r })}>
                        <Star className={`w-6 h-6 ${r <= feedbackForm.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowFeedbackModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">Submit</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Modal */}
      <AnimatePresence>
        {showSkillModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Rate Skill</h3>
                <button onClick={() => setShowSkillModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddSkill} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Skill Name *</label>
                  <input type="text" value={skillForm.skill} onChange={e => setSkillForm({ ...skillForm, skill: e.target.value })} required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Communication" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating ({skillForm.rating}/5)</label>
                  <input type="range" min={1} max={5} step={0.5} value={skillForm.rating} onChange={e => setSkillForm({ ...skillForm, rating: parseFloat(e.target.value) })}
                    className="w-full" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSkillModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-xl">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
