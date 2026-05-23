import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const employeeSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  gender: z.enum(["Male", "Female", "Other"]),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  manager_name: z.string().optional(),
  doj: z.string().min(1, "Date of joining is required"),
  employment_type: z.enum(["Full-Time", "Part-Time", "Contract", "Intern"]).default("Full-Time"),
  probation_period: z.string().optional(),
  confirmation_date: z.string().optional(),
  work_location: z.string().optional(),
  shift_timing: z.string().optional(),
  salary_package: z.string().optional(),
  bank_account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  pan_number: z.string().optional(),
  aadhaar_number: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  status: z.enum(["active", "inactive", "on_probation"]).default("active"),
});

export const leaveApplicationSchema = z.object({
  leave_type: z.literal("CL"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export const leaveActionSchema = z.object({
  leave_id: z.number(),
  action: z.enum(["approved", "rejected"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type LeaveApplicationInput = z.infer<typeof leaveApplicationSchema>;
export type LeaveActionInput = z.infer<typeof leaveActionSchema>;
