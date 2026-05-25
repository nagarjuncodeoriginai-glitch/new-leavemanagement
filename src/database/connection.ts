/**
 * MongoDB Storage Layer - Permanent data persistence
 * Uses MongoDB Atlas with proper connection caching for Vercel serverless.
 */

import { MongoClient, Db } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = "hrmanagement";

// Global connection cache - survives across requests in same instance
let cached: { client: MongoClient; db: Db } | null = null;

async function connectToDatabase(): Promise<Db> {
  if (cached) return cached.db;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db(DB_NAME);
  cached = { client, db };
  return db;
}

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
  // Use fresh hash to guarantee login works
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

export async function getData(): Promise<DBData> {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("app_data");

    const doc = await collection.findOne({ _id: "main" as any });

    if (doc && doc.data) {
      const data = doc.data as DBData;
      if (!data.notifications) data.notifications = [];
      if (!data.performance_goals) data.performance_goals = [];
      if (!data.performance_feedback) data.performance_feedback = [];
      if (!data.performance_skills) data.performance_skills = [];
      if (data.leaves && data.leaves.length > 0) {
        data.leaves = data.leaves.map((l) => ({ ...l, cancelled_at: l.cancelled_at ?? null }));
      }
      return data;
    }

    // First time: seed with fresh data
    const freshData = createDefaultData();
    await collection.updateOne(
      { _id: "main" as any },
      { $set: { data: freshData } },
      { upsert: true }
    );
    return freshData;
  } catch (error) {
    console.error("MongoDB getData error:", error);
    return createDefaultData();
  }
}

export async function saveData(data: DBData): Promise<void> {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("app_data");

    await collection.updateOne(
      { _id: "main" as any },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (error) {
    console.error("MongoDB saveData error:", error);
  }
}

export function getNextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}
