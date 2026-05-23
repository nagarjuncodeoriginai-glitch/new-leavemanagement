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

    const { start_date, end_date, reason } = validation.data;

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
    if (start < today) {
      return NextResponse.json(
        { success: false, message: "Cannot apply for past dates" },
        { status: 400 }
      );
    }

    // Check leave balance for the month
    const month = start.getMonth() + 1;
    const year = start.getFullYear();
    const db = getData();

    let balance = db.leave_balance.find(
      (lb) => lb.employee_id === user.id && lb.month === month && lb.year === year
    );

    if (!balance) {
      // Create balance for this month
      balance = {
        id: getNextId(db.leave_balance),
        employee_id: user.id,
        month,
        year,
        total_cl: 2,
        used_cl: 0,
        remaining_cl: 2,
      };
      db.leave_balance.push(balance);
    }

    if (balance.remaining_cl < diffDays) {
      return NextResponse.json(
        { success: false, message: `Insufficient leave balance. You have ${balance.remaining_cl} CL remaining this month.` },
        { status: 400 }
      );
    }

    // Also check pending leaves that haven't been approved yet
    const pendingDays = db.leaves
      .filter(
        (l) =>
          l.employee_id === user.id &&
          l.status === "pending" &&
          new Date(l.start_date).getMonth() + 1 === month &&
          new Date(l.start_date).getFullYear() === year
      )
      .reduce((sum, l) => {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        return sum + Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

    if (balance.remaining_cl - pendingDays < diffDays) {
      return NextResponse.json(
        { success: false, message: `Insufficient leave balance. You have ${balance.remaining_cl - pendingDays} CL available (${pendingDays} day(s) pending approval).` },
        { status: 400 }
      );
    }

    // Create leave application
    const newLeave = {
      id: getNextId(db.leaves),
      employee_id: user.id,
      leave_type: "CL" as const,
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
      message: `${emp?.full_name || "Employee"} applied for Casual Leave (${start_date} to ${end_date})`,
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
