// ==================== User & Auth Types ====================

export interface HRAdmin {
  id: number;
  username: string;
  password: string;
}

export interface Employee {
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
  password?: string;
  profile_photo: string;
  status: "active" | "inactive" | "on_probation";
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
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
}

// ==================== Leave Types ====================

export interface Leave {
  id: number;
  employee_id: number;
  emp_id?: string;
  employee_name?: string;
  leave_type: "CL";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  cancelled_at?: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  total_cl: number;
  used_cl: number;
  remaining_cl: number;
}

export interface LeaveApplication {
  leave_type: "CL";
  start_date: string;
  end_date: string;
  reason: string;
}

// ==================== Notification Types ====================

export interface Notification {
  id: number;
  user_id: number;
  user_role: "hr" | "employee";
  type: "leave_applied" | "leave_approved" | "leave_rejected" | "leave_cancelled" | "announcement";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

// ==================== Auth Types ====================

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  role?: "hr" | "employee";
  user?: {
    id: number;
    username: string;
    name?: string;
    emp_id?: string;
  };
  message?: string;
}

export interface JWTPayload {
  id: number;
  username: string;
  role: "hr" | "employee";
  emp_id?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

// ==================== Dashboard Types ====================

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  approvedLeavesThisMonth: number;
  departmentWise: { department: string; count: number }[];
  recentLeaves: Leave[];
}

export interface EmployeeStats {
  leaveBalance: LeaveBalance;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
}

// ==================== Team Calendar Types ====================

export interface TeamCalendarEntry {
  employee_id: number;
  emp_id: string;
  employee_name: string;
  department: string;
  leave_type: "CL";
  start_date: string;
  end_date: string;
  status: "approved" | "pending";
}

// ==================== API Response Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Holiday Types ====================

export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: "national" | "religious" | "company" | "optional";
  day: string;
}

// ==================== Announcement Types ====================

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: "general" | "policy" | "event" | "celebration" | "important" | "update";
  date: string;
  priority: "high" | "medium" | "low";
  author: string;
  isActive: boolean;
}
