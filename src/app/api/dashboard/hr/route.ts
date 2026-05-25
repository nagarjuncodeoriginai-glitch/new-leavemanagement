import { NextResponse } from "next/server";
import { getData } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth("hr");

    const db = await getData();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalEmployees = db.employees.length;
    const activeEmployees = db.employees.filter((e) => e.status === "active").length;
    const pendingLeaves = db.leaves.filter((l) => l.status === "pending").length;
    const approvedLeavesThisMonth = db.leaves.filter(
      (l) =>
        l.status === "approved" &&
        new Date(l.start_date).getMonth() + 1 === currentMonth &&
        new Date(l.start_date).getFullYear() === currentYear
    ).length;

    // Department wise count
    const deptMap: Record<string, number> = {};
    for (const emp of db.employees) {
      deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    }
    const departmentWise = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // Recent leaves with employee names
    const recentLeaves = db.leaves
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, 5)
      .map((leave) => {
        const emp = db.employees.find((e) => e.id === leave.employee_id);
        return {
          ...leave,
          employee_name: emp?.full_name || "Unknown",
          emp_id: emp?.emp_id || "—",
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        approvedLeavesThisMonth,
        departmentWise,
        recentLeaves,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json({ success: false, message: err.message }, { status: 401 });
    }
    console.error("HR Dashboard error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
