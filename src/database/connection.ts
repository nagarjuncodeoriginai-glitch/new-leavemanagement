/**
 * JSON File-Based Storage
 * No database required! Data is stored in a local JSON file.
 * This works immediately without any setup.
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_FILE = path.join(process.cwd(), "data.json");

export interface DBData {
  hr_admin: {
    id: number;
    username: string;
    password: string;
  }[];
  employees: {
    id: number;
    emp_id: string;
    full_name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth: string;
    address: string;
    department: string;
    designation: string;
    manager_name: string;
    doj: string;
    employment_type: string;
    probation_period: string;
    confirmation_date: string;
    work_location: string;
    shift_timing: string;
    salary_package: string;
    bank_account_number: string;
    ifsc_code: string;
    pan_number: string;
    aadhaar_number: string;
    username: string;
    password: string;
    profile_photo: string;
    status: "active" | "inactive" | "on_probation";
    created_at: string;
    updated_at: string;
  }[];
  leaves: {
    id: number;
    employee_id: number;
    leave_type: "CL";
    start_date: string;
    end_date: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    applied_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
  }[];
  leave_balance: {
    id: number;
    employee_id: number;
    month: number;
    year: number;
    total_cl: number;
    used_cl: number;
    remaining_cl: number;
  }[];
  holidays: {
    id: number;
    name: string;
    date: string;
    type: "national" | "religious" | "company" | "optional";
    day: string;
  }[];
  announcements: {
    id: number;
    title: string;
    content: string;
    category: "general" | "policy" | "event" | "celebration" | "important" | "update";
    date: string;
    priority: "high" | "medium" | "low";
    author: string;
    isActive: boolean;
  }[];
}

// HR Admin password: hrcodeoriginai@1234 (pre-hashed)
const DEFAULT_DATA: DBData = {
  hr_admin: [
    {
      id: 1,
      username: "codeorigin",
      password: "$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGz2EzfLzG0M8LcHqOqK5F5GqHu5Vqa",
    },
  ],
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
  announcements: [
    { id: 1, title: "Annual Performance Review Cycle Begins", content: "The Q2 2025 performance review cycle starts from June 1st. Please ensure your goals are updated in the system.", category: "important", date: "2025-05-22", priority: "high", author: "HR Team", isActive: true },
    { id: 2, title: "New Work From Home Policy Update", content: "Effective June 1, 2025, employees can avail up to 2 WFH days per week with prior manager approval.", category: "policy", date: "2025-05-20", priority: "high", author: "HR Admin", isActive: true },
    { id: 3, title: "Team Building Event - Adventure Outing", content: "Join us for an exciting team building adventure on June 15th at Eco Park. Register by June 5th.", category: "event", date: "2025-05-18", priority: "medium", author: "People & Culture", isActive: true },
    { id: 4, title: "Employee Wellness Program Launch", content: "We're launching our new Employee Wellness Program with gym membership, counseling, and meditation app subscriptions.", category: "update", date: "2025-05-10", priority: "medium", author: "Wellness Team", isActive: true },
  ],
};

function initializeData(): DBData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // If file is corrupted, recreate it
  }

  // Generate fresh hash for HR admin password
  const hashedPassword = bcrypt.hashSync("hrcodeoriginai@1234", 12);
  DEFAULT_DATA.hr_admin[0].password = hashedPassword;

  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  return DEFAULT_DATA;
}

export function getData(): DBData {
  return initializeData();
}

export function saveData(data: DBData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getNextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}
