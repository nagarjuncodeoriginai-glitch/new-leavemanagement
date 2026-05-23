import { NextRequest, NextResponse } from "next/server";
import { getData } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// GET team calendar - shows who is on leave for a given month
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const department = searchParams.get("department") || "";

    const db = getData();

    // Get approved and pending leaves that overlap with the requested month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Last day of month

    const relevantLeaves = db.leaves.filter((l) => {
      if (l.status !== "approved" && l.status !== "pending") return false;
      const leaveStart = new Date(l.start_date);
      const leaveEnd = new Date(l.end_date);
      // Check if leave overlaps with the month
      return leaveStart <= monthEnd && leaveEnd >= monthStart;
    });

    // Build calendar entries with employee info
    const entries = relevantLeaves.map((leave) => {
      const emp = db.employees.find((e) => e.id === leave.employee_id);
      return {
        employee_id: leave.employee_id,
        emp_id: emp?.emp_id || "",
        employee_name: emp?.full_name || "Unknown",
        department: emp?.department || "",
        leave_type: leave.leave_type,
        start_date: leave.start_date,
        end_date: leave.end_date,
        status: leave.status as "approved" | "pending",
      };
    });

    // Filter by department if specified
    const filtered = department
      ? entries.filter((e) => e.department === department)
      : entries;

    // Get unique departments for filter
    const departments = [...new Set(db.employees.map((e) => e.department))].filter(Boolean).sort();

    return NextResponse.json({
      success: true,
      data: filtered,
      departments,
      month,
      year,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Team calendar error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
