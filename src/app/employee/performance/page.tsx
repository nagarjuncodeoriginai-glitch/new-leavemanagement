"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target, Star, TrendingUp, Award, CheckCircle2, Circle,
  Clock, MessageSquare, BarChart3, Sparkles,
} from "lucide-react";

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

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<"goals" | "feedback" | "skills">("goals");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [skillRatings, setSkillRatings] = useState<SkillRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const userData = localStorage.getItem("user");
      const empId = userData ? JSON.parse(userData).emp_id || "" : "";

      const res = await fetch("/api/performance");
      const json = await res.json();

      if (json.success) {
        const allGoals: Goal[] = json.data.goals || [];
        const allFeedback: FeedbackItem[] = json.data.feedback || [];
        const allSkills: SkillRating[] = json.data.skills || [];

        setGoals(allGoals.filter(g => g.employeeId === empId));
        setFeedbacks(allFeedback.filter(f => f.employeeId === empId));
        setSkillRatings(allSkills.filter(s => s.employeeId === empId));
      }
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const completedGoals = goals.filter(g => g.status === "completed").length;
  const overallProgress = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;
  const overallRating = feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : "—";

  const getStatusStyles = (status: Goal["status"]) => {
    switch (status) {
      case "completed": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: CheckCircle2 };
      case "on_track": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: TrendingUp };
      case "at_risk": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: Clock };
      default: return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: Circle };
    }
  };

  const hasAnyData = goals.length > 0 || feedbacks.length > 0 || skillRatings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Performance</h2>
          <p className="text-sm text-slate-500 mt-1">Track goals, view feedback, and monitor your growth (managed by HR)</p>
        </div>
      </div>

      {!hasAnyData ? (
        /* Empty State */
        <motion.div className="bg-white rounded-2xl border border-slate-100 p-16 text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Performance Data Yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Your performance goals, feedback, and skill assessments will appear here once HR assigns them to you.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Goals: 0</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Feedback: 0</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Skills: 0</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Performance Score */}
          <motion.div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border-b border-purple-100/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={264} initial={{ strokeDashoffset: 264 }}
                        animate={{ strokeDashoffset: 264 - (overallProgress / 100) * 264 }}
                        transition={{ duration: 1.2, ease: "easeOut" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">{overallProgress}%</span>
                      <span className="text-[10px] text-slate-500">Overall</span>
                    </div>
                  </div>
                </div>
                {[
                  { label: "Goals Completed", value: `${completedGoals}/${goals.length}`, icon: Target, color: "text-emerald-600" },
                  { label: "Avg. Rating", value: `${overallRating}/5`, icon: Star, color: "text-amber-500" },
                  { label: "Feedback Received", value: feedbacks.length.toString(), icon: MessageSquare, color: "text-blue-600" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} className="flex items-center gap-4 p-4 rounded-xl bg-white/60 border border-white/80"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-1.5">
            <div className="flex items-center gap-1">
              {([
                { id: "goals" as const, label: "Goals & OKRs", icon: Target },
                { id: "feedback" as const, label: "Feedback", icon: MessageSquare },
                { id: "skills" as const, label: "Skill Matrix", icon: BarChart3 },
              ]).map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
                    activeTab === tab.id ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goals Tab */}
          {activeTab === "goals" && (
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {goals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No goals assigned yet</p>
                  <p className="text-xs text-slate-400 mt-1">HR will assign goals during your review cycle</p>
                </div>
              ) : (
                goals.map((goal, i) => {
                  const styles = getStatusStyles(goal.status);
                  return (
                    <motion.div key={goal.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}>
                              {goal.category}
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}>
                              <styles.icon className="w-3 h-3" />
                              {goal.status === "on_track" ? "On Track" : goal.status === "at_risk" ? "At Risk" : goal.status === "completed" ? "Completed" : "Not Started"}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900">{goal.title}</h4>
                          <p className="text-sm text-slate-500 mt-0.5">{goal.description}</p>
                          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due: {new Date(goal.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="w-full lg:w-48 flex-shrink-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-slate-600">{goal.progress}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div className={`h-full rounded-full ${
                              goal.status === "completed" ? "bg-emerald-500" : goal.status === "at_risk" ? "bg-amber-500" : "bg-blue-500"
                            }`} initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} transition={{ duration: 0.8, delay: i * 0.08 }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {feedbacks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No feedback received yet</p>
                  <p className="text-xs text-slate-400 mt-1">Feedback from HR and managers will appear here</p>
                </div>
              ) : (
                feedbacks.map((fb, i) => (
                  <motion.div key={fb.id} className="bg-white rounded-2xl border border-slate-100 p-5"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        fb.type === "praise" ? "bg-emerald-50 border border-emerald-100" :
                        fb.type === "constructive" ? "bg-amber-50 border border-amber-100" :
                        "bg-blue-50 border border-blue-100"
                      }`}>
                        <Star className={`w-5 h-5 ${
                          fb.type === "praise" ? "text-emerald-600" : fb.type === "constructive" ? "text-amber-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{fb.from}</span>
                          <span className="text-xs text-slate-400">&middot;</span>
                          <span className="text-xs text-slate-500">{fb.role}</span>
                          <span className="text-xs text-slate-400 ml-auto">{new Date(fb.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{fb.message}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-4 h-4 ${j < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                          ))}
                          <span className="text-xs text-slate-500 ml-2">{fb.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <motion.div className="bg-white rounded-2xl border border-slate-100 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {skillRatings.length === 0 ? (
                <div className="p-8 text-center">
                  <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No skill assessments yet</p>
                  <p className="text-xs text-slate-400 mt-1">HR will rate your skills during performance reviews</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-slate-900">Skill Assessment Matrix</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Based on HR and manager evaluation</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {skillRatings.map((skill, i) => (
                      <motion.div key={skill.skill} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-700">{skill.skill}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star key={j} className={`w-3.5 h-3.5 ${j < Math.floor(skill.rating) ? "text-amber-400 fill-amber-400" : j < skill.rating ? "text-amber-400 fill-amber-200" : "text-slate-200"}`} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-slate-600 min-w-[32px] text-right">{skill.rating}</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(skill.rating / skill.max) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
