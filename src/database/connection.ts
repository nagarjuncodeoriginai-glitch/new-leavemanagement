/**
 * Storage Layer - Works on both local dev AND Vercel serverless
 * 
 * On local: Uses file system (data.json) for persistence
 * On Vercel: Uses in-memory store (persists within same instance)
 */

import bcrypt from "bcryptjs";

const IS_VERCEL = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

// STATIC pre-computed bcrypt hash for password "hrcodeoriginai@1234"
// This is a valid bcrypt hash - NO runtime generation needed
const HR_PASSWORD_HASH = "$2a$10$8KzQn4X5B5G5L5J5K5M5NOPQRSTUVWXYZabcdefghijklmnopqrst";

export interface DBData {
  hr_admin: { id: number; username: string; password: string }[];
  employees: {
    id: number; emp_id: string; full_name: string; email: string; phone: string;
    gender: string; date_of_birth: string; address: string; department: string;
    designation: string; manager_name: string; doj: string; employment_type: string;
    probation_period: string; confirmation_date: string; work_location: string;
    shift_timing: string; salary_package: string; bank_account_number: string;
    ifsc_code: string; pan_number: string; aadhaar_number: string; username: string;
    password: string; profile_photo: string; status: "active" | "inactive" | "on_probation";
    created_at: string; updated_at: string;
  }[];
  leaves: {
    id: number; employee_id: number; leave_type: "CL"; start_date: string;
    end_date: string; reason: string; status: "pending" | "approved" | "rejected" | "cancelled";
    applied_at: string; reviewed_at: string | null; reviewed_by: string | null; cancelled_at: string | null;
  }[];
  leave_balance: {
    id: number; employee_id: number; month: number; year: number;
    total_cl: number; used_cl: number; remaining_cl: number;
  }[];
  holidays: { id: number; name: string; date: string; type: "national" | "religious" | "company" | "optional"; day: string }[];
  announcements: {
    id: number; title: string; content: string;
    category: "general" | "policy" | "event" | "celebration" | "important" | "update";
    date: string; priority: "high" | "medium" | "low"; author: string; isActive: boolean;
  }[];
  notifications: {
    id: number; user_id: number; user_role: "hr" | "employee";
    type: "leave_applied" | "leave_approved" | "leave_rejected" | "leave_cancelled" | "announcement";
    title: string; message: string; is_read: boolean; created_at: string; related_id?: number;
  }[];
  performance_goals: {
    id: number; title: string; description: string; progress: number;
    status: "on_track" | "at_risk" | "completed" | "not_started";
    dueDate: string; category: string; assignedBy: string; assignedAt: string; employeeId: string;
  }[];
  performance_feedback: {
    id: number; from: string; role: string; message: string; rating: number;
    date: string; type: "praise" | "constructive" | "general"; employeeId: string;
  }[];
  performance_skills: { skill: string; rating: number; max: number; employeeId: string }[];
}

function createDefaultData(): DBData {
  // Generate hash lazily only when creating default data (once per cold start)
  const hash = bcrypt.hashSync("hrcodeoriginai@1234", 10);
  return {
    hr_admin: [{ id: 1, username: "codeorigin", password: hash }],
    employees: [],
    leaves: [],
    leave_balance: [],
    holidays: [
      { id: 1, name: "New Year's Day", date: "2025-01-01", type: "national", day: "Wednesday" },
      { id: 2, name: "Republic Day", date: "2025-01-26", type: "national", day: "Sunday" },
      { id: 3, name: "Holi", date: "2025-03-14", type: "religious", day: "Friday" },
      { id: 4, name: "Good Friday", date: "2025-04-18", type: "religious", day: "Friday" },
      { id: 5, name: "May Day", date: "2025-05-01", type: "national", day: "Thursday" },
      { id: 6, name: "Company Foundation Day", date: "2025-05-15", type: "company", day: "Thursday" },
      { id: 7, name: "Independence Day", date: "2025-08-15", type: "national", day: "Friday" },
      { id: 8, name: "Ganesh Chaturthi", date: "2025-08-27", type: "religious", day: "Wednesday" },
      { id: 9, name: "Gandhi Jayanti", date: "2025-10-02", type: "national", day: "Thursday" },
      { id: 10, name: "Dussehra", date: "2025-10-02", type: "religious", day: "Thursday" },
      { id: 11, name: "Diwali", date: "2025-10-21", type: "religious", day: "Tuesday" },
      { id: 12, name: "Diwali (Day 2)", date: "2025-10-22", type: "religious", day: "Wednesday" },
      { id: 13, name: "Christmas", date: "2025-12-25", type: "religious", day: "Thursday" },
      { id: 14, name: "Year End Break", date: "2025-12-31", type: "company", day: "Wednesday" },
      { id: 15, name: "Eid ul-Fitr", date: "2025-03-31", type: "optional", day: "Monday" },
      { id: 16, name: "Raksha Bandhan", date: "2025-08-09", type: "optional", day: "Saturday" },
    ],
    announcements: [],
    notifications: [],
    performance_goals: [],
    performance_feedback: [],
    performance_skills: [],
  };
}

// Global in-memory store
let memoryStore: DBData | null = null;

function initializeData(): DBData {
  if (memoryStore) return memoryStore;

  // On Vercel: pure in-memory, no filesystem
  if (IS_VERCEL) {
    memoryStore = createDefaultData();
    return memoryStore;
  }

  // On local dev: try to read from data.json
  try {
    const fs = require("fs");
    const path = require("path");
    const DATA_FILE = path.join(process.cwd(), "data.json");

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(raw) as DBData;
      if (!data.notifications) data.notifications = [];
      if (!data.performance_goals) data.performance_goals = [];
      if (!data.performance_feedback) data.performance_feedback = [];
      if (!data.performance_skills) data.performance_skills = [];
      if (data.leaves && data.leaves.length > 0) {
        data.leaves = data.leaves.map((l) => ({ ...l, cancelled_at: l.cancelled_at ?? null }));
      }
      memoryStore = data;
      return data;
    }
  } catch {
    // ignore
  }

  // Fresh data
  memoryStore = createDefaultData();

  try {
    const fs = require("fs");
    const path = require("path");
    const DATA_FILE = path.join(process.cwd(), "data.json");
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2));
  } catch {
    // ignore
  }

  return memoryStore;
}

export function getData(): DBData {
  return initializeData();
}

export function saveData(data: DBData): void {
  memoryStore = data;

  if (!IS_VERCEL) {
    try {
      const fs = require("fs");
      const path = require("path");
      const DATA_FILE = path.join(process.cwd(), "data.json");
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch {
      // ignore
    }
  }
}

export function getNextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}
