import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";
import { leaveApplicationSchema } from "@/lib/validations";

// GET leaves
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const leaveType = searchParams.get("leave_type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const db = getData();
    let filtered = [...db.leaves];

    // Employees can only see their own leaves
    if (user.role === "employee") {
      filtered = filtered.filter((l) => l.employee_id === user.id);
    }

    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }

    if (leaveType) {
      filtered = filtered.filter((l) => l.leave_type === leaveType);
    }

    // Sort by applied_at descending
    filtered.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    // Add employee name and emp_id
    const leavesWithNames = paged.map((leave) => {
      const emp = db.employees.find((e) => e.id === leave.employee_id);
      return {
        ...leave,
        employee_name: emp?.full_name || "Unknown",
        emp_id: emp?.emp_id || "—",
      };
    });

    return NextResponse.json({
      success: true,
      data: leavesWithNames,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get leaves error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST apply for leave (Employee only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth("employee");
    const body = await request.json();
    const validation = leaveApplicationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { leave_type, start_date, end_date, reason } = validation.data;

    const db = getData();

    // Check if leave type is active in policy
    const policy = (db.leave_policies || []).find(
      (p) => p.leave_type === leave_type && p.is_active
    );
    if (!policy) {
      return NextResponse.json(
        { success: false, message: `${leave_type} is not available. Contact HR.` },
        { status: 400 }
      );
    }

    // Calculate number of leave days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Validate dates
    if (start > end) {
      return NextResponse.json(
        { success: false, message: "End date must be after start date" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check min days advance (skip for SL - sick leave can be same-day)
    if (leave_type !== "SL") {
      const advanceDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (advanceDays < policy.min_days_advance) {
        return NextResponse.json(
          { success: false, message: `${policy.label} requires at least ${policy.min_days_advance} day(s) advance notice.` },
          { status: 400 }
        );
      }
    }

    if (start < today && leave_type !== "SL") {
      return NextResponse.json(
        { success: false, message: "Cannot apply for past dates" },
        { status: 400 }
      );
    }

    // Check max consecutive days
    if (diffDays > policy.max_consecutive_days) {
      return NextResponse.json(
        { success: false, message: `Maximum ${policy.max_consecutive_days} consecutive day(s) allowed for ${policy.label}.` },
        { status: 400 }
      );
    }

    // Check leave balance for the month
    const month = start.getMonth() + 1;
    const year = start.getFullYear();

    let balance = db.leave_balance.find(
      (lb) => lb.employee_id === user.id && lb.month === month && lb.year === year
    );

    if (!balance) {
      // Create balance for this month using policy quotas
      const clPolicy = (db.leave_policies || []).find((p) => p.leave_type === "CL");
      const slPolicy = (db.leave_policies || []).find((p) => p.leave_type === "SL");
      const elPolicy = (db.leave_policies || []).find((p) => p.leave_type === "EL");
      const wfhPolicy = (db.leave_policies || []).find((p) => p.leave_type === "WFH");

      balance = {
        id: getNextId(db.leave_balance),
        employee_id: user.id,
        month,
        year,
        total_cl: clPolicy?.monthly_quota ?? 2,
        used_cl: 0,
        remaining_cl: clPolicy?.monthly_quota ?? 2,
        total_sl: slPolicy?.monthly_quota ?? 1,
        used_sl: 0,
        remaining_sl: slPolicy?.monthly_quota ?? 1,
        total_el: elPolicy?.monthly_quota ?? 1,
        used_el: 0,
        remaining_el: elPolicy?.monthly_quota ?? 1,
        total_wfh: wfhPolicy?.monthly_quota ?? 4,
        used_wfh: 0,
        remaining_wfh: wfhPolicy?.monthly_quota ?? 4,
      };
      db.leave_balance.push(balance);
    }

    // Get remaining balance for this leave type
    const typeKey = leave_type.toLowerCase() as "cl" | "sl" | "el" | "wfh";
    const remainingKey = `remaining_${typeKey}` as keyof typeof balance;
    const remaining = balance[remainingKey] as number;

    if (remaining < diffDays) {
      return NextResponse.json(
        { success: false, message: `Insufficient ${policy.label} balance. You have ${remaining} day(s) remaining this month.` },
        { status: 400 }
      );
    }

    // Check pending leaves that haven't been approved yet for same type
    const pendingDays = db.leaves
      .filter(
        (l) =>
          l.employee_id === user.id &&
          l.status === "pending" &&
          l.leave_type === leave_type &&
          new Date(l.start_date).getMonth() + 1 === month &&
          new Date(l.start_date).getFullYear() === year
      )
      .reduce((sum, l) => {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        return sum + Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

    if (remaining - pendingDays < diffDays) {
      return NextResponse.json(
        { success: false, message: `Insufficient ${policy.label} balance. You have ${remaining - pendingDays} day(s) available (${pendingDays} day(s) pending approval).` },
        { status: 400 }
      );
    }

    // Create leave application
    const newLeave = {
      id: getNextId(db.leaves),
      employee_id: user.id,
      leave_type: leave_type as "CL" | "SL" | "EL" | "WFH",
      start_date,
      end_date,
      reason,
      status: "pending" as const,
      applied_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      cancelled_at: null,
    };

    db.leaves.push(newLeave);

    // Create notification for HR
    if (!db.notifications) db.notifications = [];
    const emp = db.employees.find((e) => e.id === user.id);
    db.notifications.push({
      id: getNextId(db.notifications),
      user_id: 1, // HR admin
      user_role: "hr",
      type: "leave_applied",
      title: "New Leave Request",
      message: `${emp?.full_name || "Employee"} applied for ${policy.label} (${start_date} to ${end_date})`,
      is_read: false,
      created_at: new Date().toISOString(),
      related_id: newLeave.id,
    });

    saveData(db);

    return NextResponse.json(
      { success: true, message: "Leave application submitted successfully", id: newLeave.id },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Apply leave error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
